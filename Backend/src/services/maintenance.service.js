/**
 * @file src/services/maintenance.service.js
 * @description Handles tenant-submitted maintenance requests and owner visibility into them.
 */

const { getPool } = require("../config/db");
const pool = getPool();
const { v4: uuidv4 } = require("uuid");

// =====================================================
// Tenant: Create Maintenance Request
// =====================================================
async function createMaintenanceRequestService({ tenantId, agreementId, category, severity, description }) {
    // 1. Fetch the tenant's active signed agreement to derive property/owner
    const [[agreement]] = await pool.query(
        `SELECT ad.property_id, ad.owner_id
         FROM agreement_drafts ad
         WHERE ad.id = ? AND ad.tenant_id = ? AND ad.status = 'signed'`,
        [agreementId, tenantId]
    );

    if (!agreement) {
        throw new Error("No active signed agreement found for this maintenance request.");
    }

    const requestId = uuidv4();
    await pool.query(
        `INSERT INTO maintenance_requests (id, property_id, tenant_id, owner_id, category, severity, description, status, owner_read)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', FALSE)`,
        [requestId, agreement.property_id, tenantId, agreement.owner_id, category, severity, description]
    );

    const [[created]] = await pool.query(
        `SELECT mr.*, p.title AS property_title, u.name AS tenant_name
         FROM maintenance_requests mr
         JOIN properties p ON mr.property_id = p.id
         JOIN users u ON mr.tenant_id = u.id
         WHERE mr.id = ?`,
        [requestId]
    );

    return created;
}

// =====================================================
// Tenant: Get Own Maintenance Requests
// =====================================================
async function getTenantMaintenanceRequestsService(tenantId) {
    const [requests] = await pool.query(
        `SELECT mr.*, p.title AS property_title
         FROM maintenance_requests mr
         JOIN properties p ON mr.property_id = p.id
         WHERE mr.tenant_id = ?
         ORDER BY mr.created_at DESC`,
        [tenantId]
    );
    return requests;
}

// =====================================================
// Owner: Get Incoming Maintenance Requests
// =====================================================
async function getOwnerMaintenanceRequestsService(ownerId) {
    const [requests] = await pool.query(
        `SELECT mr.*, p.title AS property_title, u.name AS tenant_name, u.email AS tenant_email, u.phone AS tenant_phone
         FROM maintenance_requests mr
         JOIN properties p ON mr.property_id = p.id
         JOIN users u ON mr.tenant_id = u.id
         WHERE mr.owner_id = ?
         ORDER BY mr.created_at DESC`,
        [ownerId]
    );
    return requests;
}

// =====================================================
// Owner: Update Maintenance Request Status
// =====================================================
async function updateMaintenanceRequestStatusService({ requestId, ownerId, status }) {
    const allowedStatuses = ['pending', 'in_progress', 'resolved', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
        throw new Error("Invalid maintenance request status.");
    }

    const [result] = await pool.query(
        `UPDATE maintenance_requests SET status = ? WHERE id = ? AND owner_id = ?`,
        [status, requestId, ownerId]
    );

    if (result.affectedRows === 0) {
        throw new Error("Maintenance request not found or you are not authorized.");
    }

    const [[updated]] = await pool.query(
        `SELECT mr.*, p.title AS property_title, u.name AS tenant_name
         FROM maintenance_requests mr
         JOIN properties p ON mr.property_id = p.id
         JOIN users u ON mr.tenant_id = u.id
         WHERE mr.id = ?`,
        [requestId]
    );

    return updated;
}

// =====================================================
// Owner: Get Unread Maintenance Notification Count
// =====================================================
async function getUnreadMaintenanceNotificationCountService(ownerId) {
    const [[result]] = await pool.query(
        `SELECT COUNT(*) AS unread_count
         FROM maintenance_requests
         WHERE owner_id = ? AND owner_read = FALSE`,
        [ownerId]
    );

    return Number(result.unread_count || 0);
}

// =====================================================
// Owner: Mark Maintenance Notifications Read
// =====================================================
async function markMaintenanceNotificationsReadService(ownerId) {
    await pool.query(
        `UPDATE maintenance_requests SET owner_read = TRUE WHERE owner_id = ? AND owner_read = FALSE`,
        [ownerId]
    );

    return { success: true };
}

module.exports = {
    createMaintenanceRequestService,
    getTenantMaintenanceRequestsService,
    getOwnerMaintenanceRequestsService,
    updateMaintenanceRequestStatusService,
    getUnreadMaintenanceNotificationCountService,
    markMaintenanceNotificationsReadService
};
