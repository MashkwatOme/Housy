/**
 * @file src/services/stayRequest.service.js
 * @description Handles stay request business logic.
 *              Responsible for:
 *              - Creating requests
 *              - Fetching tenant requests
 *              - Fetching owner requests
 *              - Updating request status
 *              - Preventing duplicate requests
 *              - Hiding full property after approval
 *              - Auto generating agreement drafts
 * @author Siyam
 */

const {
    createAgreementDraftService
} = require("./agreement.service")

const {
    getPool
} = require("../config/db")

const pool =
    getPool()

// =====================================================
// Create Stay Request
// =====================================================

/**
 * @name createStayRequestService
 * @description Create a new stay request
 * @param {Object} data
 * @returns {Object}
 */

async function createStayRequestService(data) {

    const {
        propertyId,
        tenantId,
        ownerId,
        message,
        moveInDate,
    } = data

    // ─────────────────────────────
    // Prevent Owner Requesting
    // Own Property
    // ─────────────────────────────

    if (tenantId === ownerId) {

        throw new Error(
            "Owners cannot request their own property."
        )
    }

    // ─────────────────────────────
    // Prevent Duplicate Requests
    // ─────────────────────────────

    const [existing] =
        await pool.query(
            `
            SELECT id

            FROM stay_requests

            WHERE property_id = ?
            AND tenant_id = ?

            AND status IN (
                'pending',
                'approved'
            )
            `,
            [
                propertyId,
                tenantId,
            ]
        )

    if (existing.length > 0) {

        throw new Error(
            "Stay request already exists."
        )
    }

    // ─────────────────────────────
    // Check Property Visibility
    // ─────────────────────────────

    const [[property]] =
        await pool.query(
            `
            SELECT
                visibility_status

            FROM properties

            WHERE id = ?
            `,
            [propertyId]
        )

    if (!property) {

        throw new Error(
            "Property not found."
        )
    }

    // ─────────────────────────────
    // Prevent Requests On Hidden
    // Properties
    // ─────────────────────────────

    if (
        property.visibility_status
        !== "active"
    ) {

        throw new Error(
            "Property is not available."
        )
    }

    // ─────────────────────────────
    // Create Request
    // ─────────────────────────────

    const [result] =
        await pool.query(
            `
            INSERT INTO stay_requests (

                property_id,
                tenant_id,
                owner_id,
                message,
                move_in_date

            )

            VALUES (?, ?, ?, ?, ?)
            `,
            [
                propertyId,
                tenantId,
                ownerId,
                message,
                moveInDate,
            ]
        )

    return {

        success: true,

        insertId:
            result.insertId,
    }
}

// =====================================================
// Get Tenant Requests
// =====================================================

/**
 * @name getMyStayRequestsService
 * @description Get logged-in tenant requests
 * @param {string} tenantId
 * @returns {Array}
 */

async function getMyStayRequestsService(
    tenantId
) {

    const [requests] =
        await pool.query(
            `
            SELECT
                sr.*,
                p.title,
                p.monthly_rent,
                p.area,

                (
                    SELECT image_url
                    FROM property_images
                    WHERE property_id = p.id
                    LIMIT 1
                ) AS image_url

            FROM stay_requests sr

            JOIN properties p
            ON sr.property_id = p.id

            WHERE sr.tenant_id = ?

            ORDER BY sr.created_at DESC
            `,
            [tenantId]
        )

    return requests
}

// =====================================================
// Get Owner Incoming Requests
// =====================================================

/**
 * @name getOwnerStayRequestsService
 * @description Get incoming stay requests for owner
 * @param {string} ownerId
 * @returns {Array}
 */

async function getOwnerStayRequestsService(
    ownerId
) {

    const [requests] =
        await pool.query(
            `
            SELECT
                sr.*,
                p.title,
                p.monthly_rent,
                p.area,

                (
                    SELECT image_url
                    FROM property_images
                    WHERE property_id = p.id
                    LIMIT 1
                ) AS image_url,

                u.name AS tenant_name,
                u.email AS tenant_email

            FROM stay_requests sr

            JOIN properties p
            ON sr.property_id = p.id

            JOIN users u
            ON sr.tenant_id = u.id

            WHERE sr.owner_id = ?

            ORDER BY sr.created_at DESC
            `,
            [ownerId]
        )

    return requests
}

// =====================================================
// Update Stay Request Status
// =====================================================

/**
 * @name updateStayRequestStatusService
 * @description Approve or reject stay request
 * @param {string} requestId
 * @param {string} status
 * @param {string} currentUserId
 * @returns {Object}
 */

async function updateStayRequestStatusService(
    requestId,
    status,
    currentUserId
) {

    // ─────────────────────────────
    // Validate Status
    // ─────────────────────────────

    const allowedStatuses = [
        "approved",
        "rejected",
    ]

    if (
        !allowedStatuses.includes(status)
    ) {

        throw new Error(
            "Invalid status."
        )
    }

    // ─────────────────────────────
    // Get Request Info
    // ─────────────────────────────

    const [[request]] =
        await pool.query(
            `
            SELECT
                sr.*,
                p.listing_type

            FROM stay_requests sr

            JOIN properties p
            ON sr.property_id = p.id

            WHERE sr.id = ?
            `,
            [requestId]
        )

    if (!request) {

        throw new Error(
            "Stay request not found."
        )
    }

    // ─────────────────────────────
    // Only Property Owner Can
    // Approve / Reject
    // ─────────────────────────────

    if (
        request.owner_id
        !== currentUserId
    ) {

        throw new Error(
            "Unauthorized action."
        )
    }

    // ─────────────────────────────
    // Prevent Multiple Updates
    // ─────────────────────────────

    if (
        request.status !== "pending"
    ) {

        throw new Error(
            "Request already processed."
        )
    }

    // ─────────────────────────────
    // Update Request Status
    // ─────────────────────────────

    await pool.query(
        `
        UPDATE stay_requests

        SET status = ?

        WHERE id = ?
        `,
        [
            status,
            requestId,
        ]
    )

    // ─────────────────────────────
    // Handle Approval Workflow
    // ─────────────────────────────

    if (status === "approved") {

        // ─────────────────────────
        // Hide Full Property
        // ─────────────────────────

        if (
            request.listing_type
            === "full_property"
        ) {

            await pool.query(
                `
                UPDATE properties

                SET visibility_status = 'hidden'

                WHERE id = ?
                `,
                [request.property_id]
            )
        }

        // ─────────────────────────
        // Auto Create Agreement Draft
        // ─────────────────────────

        await createAgreementDraftService(
            requestId
        )
    }

    return {
        success: true,
    }
}

module.exports = {

    createStayRequestService,

    getMyStayRequestsService,

    getOwnerStayRequestsService,

    updateStayRequestStatusService,
}