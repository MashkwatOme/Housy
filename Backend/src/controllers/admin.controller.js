/**
 * @file src/controllers/admin.controller.js
 * @description Handles admin verification requests
 */

const {
    getPendingUsersService,
    approveUserService,
    rejectUserService,
    getDashboardStatsService,
} = require("../services/admin.service")

/**
 * @name getPendingUsersController
 */
async function getPendingUsersController(req, res) {
    try {
        const users = await getPendingUsersService()

        return res.status(200).json({
            users,
        })
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

/**
 * @name approveUserController
 */
async function approveUserController(req, res) {
    try {
        const userId = req.params.id

        await approveUserService(userId)

        return res.status(200).json({
            message: "User approved successfully.",
        })
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

/**
 * @name rejectUserController
 */
async function rejectUserController(req, res) {
    try {
        const userId = req.params.id

        await rejectUserService(userId)

        return res.status(200).json({
            message: "User rejected successfully.",
        })
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

/**
 * @name getDashboardStatsController
 */
async function getDashboardStatsController(req, res) {
    try {
        const stats = await getDashboardStatsService()

        return res.status(200).json(stats)
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

module.exports = {
    getPendingUsersController,
    approveUserController,
    rejectUserController,
    getDashboardStatsController,
}