/**
 * @file src/routes/maintenance.routes.js
 * @description Exposes maintenance request API routes.
 */

const express = require("express");
const router = express.Router();

const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");
const {
    createMaintenanceRequestController,
    getTenantMaintenanceRequestsController,
    getOwnerMaintenanceRequestsController,
    updateMaintenanceRequestStatusController,
    getUnreadMaintenanceNotificationCountController,
    markMaintenanceNotificationsReadController
} = require("../controllers/maintenance.controller");

// Tenant-only maintenance operations
router.post("/", verifyToken, authorizeRoles("tenant"), createMaintenanceRequestController);
router.get("/tenant", verifyToken, authorizeRoles("tenant"), getTenantMaintenanceRequestsController);

// Owner-only maintenance operations
router.get("/owner", verifyToken, authorizeRoles("owner"), getOwnerMaintenanceRequestsController);
router.get("/owner/unread-count", verifyToken, authorizeRoles("owner"), getUnreadMaintenanceNotificationCountController);
router.patch("/owner/mark-read", verifyToken, authorizeRoles("owner"), markMaintenanceNotificationsReadController);
router.patch("/:id/status", verifyToken, authorizeRoles("owner"), updateMaintenanceRequestStatusController);

module.exports = router;
