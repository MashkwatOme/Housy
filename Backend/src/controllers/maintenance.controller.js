/**
 * @file src/controllers/maintenance.controller.js
 * @description Maintenance request controller to map routes to maintenance services.
 */

const {
    createMaintenanceRequestService,
    getTenantMaintenanceRequestsService,
    getOwnerMaintenanceRequestsService,
    updateMaintenanceRequestStatusService,
    getUnreadMaintenanceNotificationCountService,
    markMaintenanceNotificationsReadService
} = require("../services/maintenance.service");

// =====================================================
// Tenant: Create Maintenance Request
// =====================================================
async function createMaintenanceRequestController(req, res, next) {
    try {
        const { agreementId, category, severity, description } = req.body;
        if (!agreementId || !category || !severity || !description || !description.trim()) {
            return res.status(400).json({ message: "Agreement, category, severity and description are required." });
        }

        const created = await createMaintenanceRequestService({
            tenantId: req.user.id,
            agreementId,
            category,
            severity,
            description
        });

        const io = req.app.get("io");
        io.to(String(created.owner_id)).emit("maintenance_request_received", {
            requestId: created.id,
            category: created.category,
            severity: created.severity,
            propertyTitle: created.property_title,
            tenantName: created.tenant_name
        });

        return res.status(201).json(created);
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Tenant: Get Own Maintenance Requests
// =====================================================
async function getTenantMaintenanceRequestsController(req, res, next) {
    try {
        const requests = await getTenantMaintenanceRequestsService(req.user.id);
        return res.status(200).json({ requests });
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Owner: Get Incoming Maintenance Requests
// =====================================================
async function getOwnerMaintenanceRequestsController(req, res, next) {
    try {
        const requests = await getOwnerMaintenanceRequestsService(req.user.id);
        return res.status(200).json({ requests });
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Owner: Update Maintenance Request Status
// =====================================================
async function updateMaintenanceRequestStatusController(req, res, next) {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ message: "Status is required." });
        }

        const updated = await updateMaintenanceRequestStatusService({
            requestId: id,
            ownerId: req.user.id,
            status
        });

        return res.status(200).json(updated);
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Owner: Unread Maintenance Notification Count
// =====================================================
async function getUnreadMaintenanceNotificationCountController(req, res, next) {
    try {
        const unreadCount = await getUnreadMaintenanceNotificationCountService(req.user.id);
        return res.status(200).json({ success: true, unreadCount });
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Owner: Mark Maintenance Notifications Read
// =====================================================
async function markMaintenanceNotificationsReadController(req, res, next) {
    try {
        await markMaintenanceNotificationsReadService(req.user.id);
        return res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    createMaintenanceRequestController,
    getTenantMaintenanceRequestsController,
    getOwnerMaintenanceRequestsController,
    updateMaintenanceRequestStatusController,
    getUnreadMaintenanceNotificationCountController,
    markMaintenanceNotificationsReadController
};
