/**
 * @file src/controllers/schedule.controller.js
 * @description Handles HTTP requests for visit schedules.
 * @author Siyam
 */

const {
    createScheduleService,
    getMySchedulesService,
    getUnreadScheduleStatusCountService,
    markScheduleStatusNotificationsReadService,
    getOwnerSchedulesService,
    updateScheduleStatusService,
} = require("../services/schedule.service")

// =====================================================
// Create Visit Schedule
// =====================================================
async function createScheduleController(req, res, next) {
    try {
        const {
            propertyId,
            ownerId,
            visitDate,
            timeSlot,
            name,
            email,
            phone,
        } = req.body

        const tenantId = req.user.id

        const result = await createScheduleService({
            propertyId,
            tenantId,
            ownerId,
            visitDate,
            timeSlot,
            name,
            email,
            phone,
        })

        res.status(201).json({
            success: true,
            result,
        })
    } catch (error) {
        next(error)
    }
}

async function getUnreadScheduleStatusCountController(req, res, next) {
    try {
        const unreadCount = await getUnreadScheduleStatusCountService(req.user.id)
        res.status(200).json({ success: true, unreadCount })
    } catch (error) {
        next(error)
    }
}

async function markScheduleStatusNotificationsReadController(req, res, next) {
    try {
        await markScheduleStatusNotificationsReadService(req.user.id)
        res.status(200).json({ success: true })
    } catch (error) {
        next(error)
    }
}

// =====================================================
// Get Tenant Schedules
// =====================================================
async function getMySchedulesController(req, res, next) {
    try {
        const tenantId = req.user.id
        const schedules = await getMySchedulesService(tenantId)

        res.status(200).json({
            success: true,
            schedules,
        })
    } catch (error) {
        next(error)
    }
}

// =====================================================
// Get Owner Incoming Schedules
// =====================================================
async function getOwnerSchedulesController(req, res, next) {
    try {
        const ownerId = req.user.id
        const schedules = await getOwnerSchedulesService(ownerId)

        res.status(200).json({
            success: true,
            schedules,
        })
    } catch (error) {
        next(error)
    }
}

// =====================================================
// Update Schedule Status
// =====================================================
async function updateScheduleStatusController(req, res, next) {
    try {
        const { id } = req.params
        const { status } = req.body
        const userId = req.user.id

        const result = await updateScheduleStatusService(id, status, userId)

        res.status(200).json({
            success: true,
            result,
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    createScheduleController,
    getMySchedulesController,
    getUnreadScheduleStatusCountController,
    markScheduleStatusNotificationsReadController,
    getOwnerSchedulesController,
    updateScheduleStatusController,
}
