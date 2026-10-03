/**
 * @file src/routes/payment.routes.js
 * @description Exposes payment API routes.
 * @author Siyam
 */

const express = require("express");
const router = express.Router();

const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware");
const {
    createCheckoutSessionController,
    stripeWebhookController,
    createBkashPaymentController,
    executeBkashPaymentController,
    getMyPaymentsController,
    getOwnerPaymentDashboardController,
    getPaymentDetailsController,
    recordCashPaymentController,
    getUnreadPaymentNotificationCountController,
    markPaymentNotificationsReadController
} = require("../controllers/payment.controller");

// Stripe Webhook (Unauthenticated, raw body is processed in app.js)
router.post("/webhook", stripeWebhookController);

// Tenant-only payment operations
router.post("/create-checkout-session", verifyToken, authorizeRoles("tenant"), createCheckoutSessionController);
router.post("/bkash/create", verifyToken, authorizeRoles("tenant"), createBkashPaymentController);
router.post("/bkash/execute", verifyToken, authorizeRoles("tenant"), executeBkashPaymentController);
router.get("/my-payments", verifyToken, authorizeRoles("tenant"), getMyPaymentsController);

// Owner-only payment operations
router.get("/owner", verifyToken, authorizeRoles("owner"), getOwnerPaymentDashboardController);
router.post("/record-cash", verifyToken, authorizeRoles("owner"), recordCashPaymentController);
router.get("/owner/unread-count", verifyToken, authorizeRoles("owner"), getUnreadPaymentNotificationCountController);
router.patch("/owner/mark-read", verifyToken, authorizeRoles("owner"), markPaymentNotificationsReadController);

// Single transaction details (Access checked in controller)
router.get("/:id", verifyToken, getPaymentDetailsController);


module.exports = router;
