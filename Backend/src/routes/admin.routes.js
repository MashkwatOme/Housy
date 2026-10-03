/**
 * @file src/routes/admin.routes.js
 * @description Admin verification routes
 */

const express = require("express")
const router = express.Router()

const {
    verifyToken,
    authorizeRoles,
} = require("../middlewares/auth.middleware")

const {
    getPendingUsersController,
    approveUserController,
    rejectUserController,
    getDashboardStatsController,
} = require("../controllers/admin.controller")

// ─── Dashboard Stats ──────────────────────────────────────────

router.get(
    "/stats",
    verifyToken,
    authorizeRoles("admin"),
    getDashboardStatsController
)

// ─── Pending Users ─────────────────────────────────────────────

router.get(
    "/pending-users",
    verifyToken,
    authorizeRoles("admin"),
    getPendingUsersController
)

// ─── Approve User ─────────────────────────────────────────────

router.patch(
    "/users/:id/approve",
    verifyToken,
    authorizeRoles("admin"),
    approveUserController
)

// ─── Reject User ─────────────────────────────────────────────

router.patch(
    "/users/:id/reject",
    verifyToken,
    authorizeRoles("admin"),
    rejectUserController
)

module.exports = router