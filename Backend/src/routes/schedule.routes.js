/**
 * @file src/routes/schedule.routes.js
 * @description Routes for visit schedules.
 * @author Siyam
 */

const express = require("express")
const router = express.Router()

const { verifyToken } = require("../middlewares/auth.middleware")

const {
    createScheduleController,
    getMySchedulesController,
    getUnreadScheduleStatusCountController,
    markScheduleStatusNotificationsReadController,
    getOwnerSchedulesController,
    updateScheduleStatusController,
} = require("../controllers/schedule.controller")

// Create schedule
router.post("/", verifyToken, createScheduleController)

// Get tenant's schedules
router.get("/my", verifyToken, getMySchedulesController)
router.get("/my/unread-count", verifyToken, getUnreadScheduleStatusCountController)
router.patch("/my/mark-status-read", verifyToken, markScheduleStatusNotificationsReadController)

// Get owner's incoming schedules
router.get("/owner", verifyToken, getOwnerSchedulesController)

// Update schedule status (approve, reject, cancel)
router.patch("/:id", verifyToken, updateScheduleStatusController)

module.exports = router
