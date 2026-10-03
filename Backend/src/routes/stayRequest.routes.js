/**
 * @file src/routes/stayRequest.routes.js
 * @description Stay request routes.
 * @author Siyam
 */

const express =
    require("express")

const router =
    express.Router()

const {

    verifyToken,

} = require(
    "../middlewares/auth.middleware"
)

const {

    createStayRequestController,

    getMyStayRequestsController,

    getOwnerStayRequestsController,

    updateStayRequestStatusController,

} = require(
    "../controllers/stayRequest.controller"
)

// =====================================================
// Create Stay Request
// =====================================================

router.post(
    "/",
    verifyToken,
    createStayRequestController
)

// =====================================================
// Tenant Requests
// =====================================================

router.get(
    "/my",
    verifyToken,
    getMyStayRequestsController
)

// =====================================================
// Owner Incoming Requests
// =====================================================

router.get(
    "/owner",
    verifyToken,
    getOwnerStayRequestsController
)

// =====================================================
// Approve / Reject Request
// =====================================================

router.patch(
    "/:id",
    verifyToken,
    updateStayRequestStatusController
)

module.exports =
    router