/**
 * @file src/services/schedule.service.js
 * @description Handles business logic for visit schedules.
 * @author Siyam
 */

const { getPool } = require("../config/db")
const pool = getPool()

// =====================================================
// Create Visit Schedule
// =====================================================
async function createScheduleService(data) {
    const {
        propertyId,
        tenantId,
        ownerId,
        visitDate,
        timeSlot,
        name,
        email,
        phone,
    } = data

    // Prevent Owner from scheduling a visit to their own property
    if (tenantId === ownerId) {
        throw new Error("Owners cannot schedule visits to their own property.")
    }

    // Check if property exists and is active
    const [[property]] = await pool.query(
        `SELECT visibility_status FROM properties WHERE id = ?`,
        [propertyId]
    )

    if (!property) {
        throw new Error("Property not found.")
    }

    if (property.visibility_status !== "active") {
        throw new Error("Property is not available for scheduling.")
    }

    // Prevent duplicate schedules for the same tenant, property, date, and timeslot
    const [existing] = await pool.query(
        `
        SELECT id
        FROM schedules
        WHERE property_id = ?
        AND tenant_id = ?
        AND visit_date = ?
        AND time_slot = ?
        AND status IN ('pending', 'approved')
        `,
        [propertyId, tenantId, visitDate, timeSlot]
    )

    if (existing.length > 0) {
        throw new Error("You have already scheduled a visit for this date and time slot.")
    }

    // Insert schedule
    const [result] = await pool.query(
        `
        INSERT INTO schedules (
            property_id,
            tenant_id,
            owner_id,
            visit_date,
            time_slot,
            name,
            email,
            phone
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
            propertyId,
            tenantId,
            ownerId,
            visitDate,
            timeSlot,
            name,
            email,
            phone,
        ]
    )

    return {
        success: true,
        insertId: result.insertId,
    }
}

// =====================================================
// Get Tenant Schedules
// =====================================================
async function getMySchedulesService(tenantId) {
    const [schedules] = await pool.query(
        `
        SELECT
            s.*,
            p.title,
            p.monthly_rent,
            p.area,
            p.address,
            (
                SELECT image_url
                FROM property_images
                WHERE property_id = p.id
                LIMIT 1
            ) AS image_url
        FROM schedules s
        JOIN properties p ON s.property_id = p.id
        WHERE s.tenant_id = ?
        ORDER BY s.visit_date DESC, s.created_at DESC
        `,
        [tenantId]
    )

    return schedules
}

// =====================================================
// Get Tenant Unread Schedule Status Count
// =====================================================
async function getUnreadScheduleStatusCountService(tenantId) {
    const [[result]] = await pool.query(
        `
        SELECT COUNT(*) AS unread_count
        FROM schedules
        WHERE tenant_id = ?
        AND tenant_status_read = FALSE
        AND status IN ('approved', 'rejected')
        `,
        [tenantId]
    )

    return Number(result.unread_count || 0)
}

// =====================================================
// Mark Tenant Schedule Status Notifications Read
// =====================================================
async function markScheduleStatusNotificationsReadService(tenantId) {
    await pool.query(
        `
        UPDATE schedules
        SET tenant_status_read = TRUE
        WHERE tenant_id = ?
        AND tenant_status_read = FALSE
        AND status IN ('approved', 'rejected')
        `,
        [tenantId]
    )

    return { success: true }
}

// =====================================================
// Get Owner Incoming Schedules
// =====================================================
async function getOwnerSchedulesService(ownerId) {
    const [schedules] = await pool.query(
        `
        SELECT
            s.*,
            p.title,
            p.monthly_rent,
            p.area,
            p.address,
            (
                SELECT image_url
                FROM property_images
                WHERE property_id = p.id
                LIMIT 1
            ) AS image_url,
            u.name AS tenant_name,
            u.email AS tenant_email
        FROM schedules s
        JOIN properties p ON s.property_id = p.id
        JOIN users u ON s.tenant_id = u.id
        WHERE s.owner_id = ?
        ORDER BY s.visit_date DESC, s.created_at DESC
        `,
        [ownerId]
    )

    return schedules
}

// =====================================================
// Update Schedule Status
// =====================================================
async function updateScheduleStatusService(scheduleId, status, userId) {
    const allowedStatuses = ["approved", "rejected", "cancelled"]

    if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid status.")
    }

    // Get Schedule Info
    const [[schedule]] = await pool.query(
        `SELECT * FROM schedules WHERE id = ?`,
        [scheduleId]
    )

    if (!schedule) {
        throw new Error("Schedule not found.")
    }

    // Validate Authorization
    if (status === "cancelled") {
        // Both tenant and owner can cancel
        if (schedule.tenant_id !== userId && schedule.owner_id !== userId) {
            throw new Error("Unauthorized action.")
        }
    } else {
        // Only owner can approve or reject
        if (schedule.owner_id !== userId) {
            throw new Error("Unauthorized action.")
        }
    }

    // Update Status
    const notifyTenant = status === "approved" || status === "rejected"

    await pool.query(
        `
        UPDATE schedules
        SET status = ?,
            tenant_status_read = CASE WHEN ? THEN FALSE ELSE tenant_status_read END
        WHERE id = ?
        `,
        [status, notifyTenant, scheduleId]
    )

    return {
        success: true,
    }
}

module.exports = {
    createScheduleService,
    getMySchedulesService,
    getUnreadScheduleStatusCountService,
    markScheduleStatusNotificationsReadService,
    getOwnerSchedulesService,
    updateScheduleStatusService,
}
