/**
 * @file src/controllers/payment.controller.js
 * @description Payment controller to map routes to payment services.
 * @author Siyam
 */

const {
    createCheckoutSessionService,
    stripeWebhookService,
    createBkashPaymentService,
    executeBkashPaymentService,
    getMyPaymentsService,
    getOwnerPaymentDashboardService,
    getPaymentDetailsService,
    recordCashPaymentService,
    getUnreadPaymentNotificationCountService,
    markPaymentNotificationsReadService
} = require("../services/payment.service");

// =====================================================
// Stripe Checkout Session Creation
// =====================================================
async function createCheckoutSessionController(req, res, next) {
    try {
        const { agreementId, paymentMonth } = req.body;
        if (!agreementId || !paymentMonth) {
            return res.status(400).json({ message: "Agreement ID and payment month are required." });
        }

        const result = await createCheckoutSessionService({
            agreementId,
            paymentMonth,
            tenantId: req.user.id
        });

        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Stripe Webhook Endpoint
// =====================================================
async function stripeWebhookController(req, res, next) {
    try {
        const signature = req.headers["stripe-signature"];
        if (!signature) {
            return res.status(400).json({ message: "Stripe signature header is missing." });
        }

        const result = await stripeWebhookService(req.body, signature);

        if (result.notifyPayment) {
            const io = req.app.get("io");
            io.to(String(result.notifyPayment.owner_id)).emit("payment_received", {
                paymentId: result.notifyPayment.id,
                amount: result.notifyPayment.amount,
                paymentMonth: result.notifyPayment.payment_month,
                propertyTitle: result.notifyPayment.property_title,
                tenantName: result.notifyPayment.tenant_name,
                gateway: "stripe"
            });
        }

        return res.status(200).json({ received: true });
    } catch (err) {
        console.error("Stripe Webhook error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
}

// =====================================================
// bKash Create Payment
// =====================================================
async function createBkashPaymentController(req, res, next) {
    try {
        const { agreementId, paymentMonth } = req.body;
        if (!agreementId || !paymentMonth) {
            return res.status(400).json({ message: "Agreement ID and payment month are required." });
        }

        const result = await createBkashPaymentService({
            agreementId,
            paymentMonth,
            tenantId: req.user.id
        });

        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

// =====================================================
// bKash Execute Payment
// =====================================================
async function executeBkashPaymentController(req, res, next) {
    try {
        const { paymentId } = req.body;
        if (!paymentId) {
            return res.status(400).json({ message: "Payment ID is required." });
        }

        const result = await executeBkashPaymentService({
            paymentId,
            tenantId: req.user.id
        });

        const io = req.app.get("io");
        io.to(String(result.owner_id)).emit("payment_received", {
            paymentId: result.id,
            amount: result.amount,
            paymentMonth: result.payment_month,
            propertyTitle: result.property_title,
            tenantName: result.tenant_name,
            gateway: "bkash"
        });

        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Tenant Payments & Dues
// =====================================================
async function getMyPaymentsController(req, res, next) {
    try {
        const result = await getMyPaymentsService(req.user.id);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Owner Payments & Analytics
// =====================================================
async function getOwnerPaymentDashboardController(req, res, next) {
    try {
        const result = await getOwnerPaymentDashboardService(req.user.id);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Single Payment Transaction Details
// =====================================================
async function getPaymentDetailsController(req, res, next) {
    try {
        const { id } = req.params;
        const result = await getPaymentDetailsService(id, req.user.id, req.user.role);
        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Owner: Record Cash Payment
// =====================================================
async function recordCashPaymentController(req, res, next) {
    try {
        const { agreementId, paymentMonth } = req.body;
        if (!agreementId || !paymentMonth) {
            return res.status(400).json({ message: "Agreement ID and payment month are required." });
        }

        const result = await recordCashPaymentService({
            agreementId,
            paymentMonth,
            ownerId: req.user.id
        });

        return res.status(200).json(result);
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Owner: Unread Payment Notification Count
// =====================================================
async function getUnreadPaymentNotificationCountController(req, res, next) {
    try {
        const unreadCount = await getUnreadPaymentNotificationCountService(req.user.id);
        return res.status(200).json({ success: true, unreadCount });
    } catch (err) {
        next(err);
    }
}

// =====================================================
// Owner: Mark Payment Notifications Read
// =====================================================
async function markPaymentNotificationsReadController(req, res, next) {
    try {
        await markPaymentNotificationsReadService(req.user.id);
        return res.status(200).json({ success: true });
    } catch (err) {
        next(err);
    }
}

module.exports = {
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
};
