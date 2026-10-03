/**
 * @file src/services/payment.service.js
 * @description Handles rent payment logic, Stripe Sandbox, and bKash Sandbox integrations.
 * @author Siyam
 */

const { getPool } = require("../config/db");
const pool = getPool();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// Timezone-safe date parser
function parseDateString(dateVal) {
    if (!dateVal) return null;
    let str = "";
    if (dateVal instanceof Date) {
        str = dateVal.toISOString().split('T')[0];
    } else {
        str = String(dateVal);
    }
    const parts = str.split('T')[0].split('-');
    if (parts.length < 3) return null;
    return {
        year: parseInt(parts[0], 10),
        month: parseInt(parts[1], 10) - 1, // 0-indexed
        day: parseInt(parts[2], 10)
    };
}

// Generate YYYY-MM list of active months for an agreement up to current month (or agreement end month)
function getAgreementMonths(startDateVal, endDateVal) {
    const startInfo = parseDateString(startDateVal);
    const endInfo = parseDateString(endDateVal);
    if (!startInfo || !endInfo) return [];

    const now = new Date();
    const startMonthDate = new Date(startInfo.year, startInfo.month, 1);
    const endMonthDate = new Date(endInfo.year, endInfo.month, 1);
    const currentMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const limitMonthDate = currentMonthDate < endMonthDate ? currentMonthDate : endMonthDate;

    const months = [];
    let temp = new Date(startMonthDate);
    while (temp <= limitMonthDate) {
        const y = temp.getFullYear();
        const m = String(temp.getMonth() + 1).padStart(2, '0');
        months.push(`${y}-${m}`);
        temp.setMonth(temp.getMonth() + 1);
    }
    return months;
}

// =====================================================
// Fetch bKash Token
// =====================================================
async function getBkashToken() {
    try {
        const response = await axios.post(
            `${process.env.BKASH_BASE_URL}/tokenized/checkout/token/grant`,
            {
                app_key: process.env.BKASH_APP_KEY,
                app_secret: process.env.BKASH_APP_SECRET
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "username": process.env.BKASH_USERNAME,
                    "password": process.env.BKASH_PASSWORD
                }
            }
        );
        return response.data.id_token;
    } catch (err) {
        console.error("bKash Token Grant failed:", err.response ? err.response.data : err.message);
        throw new Error("Failed to authenticate with bKash gateway.");
    }
}

// =====================================================
// Stripe: Create Checkout Session
// =====================================================
async function createCheckoutSessionService({ agreementId, paymentMonth, tenantId }) {
    // 1. Fetch active signed agreement
    const [[agreement]] = await pool.query(
        `SELECT ad.*, p.title as property_title 
         FROM agreement_drafts ad
         JOIN properties p ON ad.property_id = p.id
         WHERE ad.id = ? AND ad.tenant_id = ? AND ad.status = 'signed'`,
        [agreementId, tenantId]
    );

    if (!agreement) {
        throw new Error("No active signed agreement found for this payment request.");
    }

    // 2. Prevent double-payments
    const [[existingPaid]] = await pool.query(
        `SELECT id FROM rent_payments WHERE agreement_id = ? AND payment_month = ? AND status = 'paid'`,
        [agreementId, paymentMonth]
    );

    if (existingPaid) {
        const displayMonth = paymentMonth === 'security_deposit' ? 'Security Deposit' : paymentMonth;
        throw new Error(`Rent/deposit for ${displayMonth} has already been paid.`);
    }

    const isDeposit = paymentMonth === 'security_deposit';
    const amount = isDeposit ? parseFloat(agreement.security_deposit) : parseFloat(agreement.monthly_rent);

    if (isDeposit && amount <= 0) {
        throw new Error("No security deposit is defined for this agreement.");
    }

    // Generate unique ID for the payment record before stripe redirect
    const paymentId = uuidv4();

    // 3. Create Stripe checkout session
    let session;
    try {
        session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "bdt",
                        product_data: {
                            name: isDeposit ? `Security Deposit - ${agreement.property_title}` : `Rent Payment - ${agreement.property_title}`,
                            description: isDeposit ? `Security Deposit Payment` : `Month: ${paymentMonth}`,
                        },
                        unit_amount: Math.round(amount * 100), // in cents
                    },
                    quantity: 1,
                },
            ],
            mode: "payment",
            metadata: {
                payment_id: paymentId,
                agreement_id: agreementId,
                tenant_id: tenantId,
                payment_month: paymentMonth,
            },
            success_url: `${process.env.BKASH_CALLBACK_URL}?session_id={CHECKOUT_SESSION_ID}&payment_id=${paymentId}`,
            cancel_url: `${process.env.BKASH_CALLBACK_URL}?payment_status=cancelled`,
        });
    } catch (err) {
        console.error("Stripe Checkout creation failed:", err);
        throw new Error("Stripe checkout creation failed. Make sure valid keys are set.");
    }

    // 4. Save pending payment record in database
    await pool.query(
        `INSERT INTO rent_payments (id, agreement_id, tenant_id, owner_id, payment_month, amount, payment_gateway, stripe_session_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 'stripe', ?, 'pending')`,
        [paymentId, agreementId, tenantId, agreement.owner_id, paymentMonth, amount, session.id]
    );

    return { url: session.url };
}

// =====================================================
// Stripe: Webhook Signature Verification and Handling
// =====================================================
async function stripeWebhookService(rawBody, signature) {
    let event;
    try {
        event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        throw new Error(`Webhook Error: ${err.message}`);
    }

    let notifyPayment = null;

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const paymentId = session.metadata.payment_id;

        if (paymentId) {
            // Update rent_payments table
            const [updateResult] = await pool.query(
                `UPDATE rent_payments
                 SET status = 'paid', transaction_id = ?, paid_at = NOW(), owner_read = FALSE
                 WHERE id = ? AND status = 'pending'`,
                [session.payment_intent || session.id, paymentId]
            );

            if (updateResult.affectedRows > 0) {
                const [[enriched]] = await pool.query(
                    `SELECT rp.id, rp.owner_id, rp.amount, rp.payment_month,
                            p.title AS property_title, u.name AS tenant_name
                     FROM rent_payments rp
                     JOIN agreement_drafts ad ON rp.agreement_id = ad.id
                     JOIN properties p ON ad.property_id = p.id
                     JOIN users u ON rp.tenant_id = u.id
                     WHERE rp.id = ?`,
                    [paymentId]
                );
                notifyPayment = enriched;
            }
            console.log(`Payment success recorded via webhook for PaymentID: ${paymentId}`);
        }
    }

    return { success: true, notifyPayment };
}

// =====================================================
// bKash: Create Payment Session
// =====================================================
async function createBkashPaymentService({ agreementId, paymentMonth, tenantId }) {
    // 1. Fetch active signed agreement
    const [[agreement]] = await pool.query(
        `SELECT ad.*, p.title as property_title 
         FROM agreement_drafts ad
         JOIN properties p ON ad.property_id = p.id
         WHERE ad.id = ? AND ad.tenant_id = ? AND ad.status = 'signed'`,
        [agreementId, tenantId]
    );

    if (!agreement) {
        throw new Error("No active signed agreement found for this payment request.");
    }

    // 2. Prevent double-payments
    const [[existingPaid]] = await pool.query(
        `SELECT id FROM rent_payments WHERE agreement_id = ? AND payment_month = ? AND status = 'paid'`,
        [agreementId, paymentMonth]
    );

    if (existingPaid) {
        const displayMonth = paymentMonth === 'security_deposit' ? 'Security Deposit' : paymentMonth;
        throw new Error(`Rent/deposit for ${displayMonth} has already been paid.`);
    }

    const isDeposit = paymentMonth === 'security_deposit';
    const amount = isDeposit ? parseFloat(agreement.security_deposit) : parseFloat(agreement.monthly_rent);

    if (isDeposit && amount <= 0) {
        throw new Error("No security deposit is defined for this agreement.");
    }

    const paymentId = uuidv4();
    const token = await getBkashToken();

    let response;
    try {
        response = await axios.post(
            `${process.env.BKASH_BASE_URL}/tokenized/checkout/create`,
            {
                mode: "0011",
                payerReference: tenantId.substring(0, 15),
                callbackURL: `${process.env.BKASH_CALLBACK_URL}?payment_id=${paymentId}`,
                amount: String(amount),
                currency: "BDT",
                intent: "sale",
                merchantInvoiceNumber: paymentId.substring(0, 25)
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": token,
                    "X-APP-Key": process.env.BKASH_APP_KEY
                }
            }
        );
    } catch (err) {
        console.error("bKash Create payment failed:", err.response ? err.response.data : err.message);
        throw new Error("bKash payment initialization failed.");
    }

    const { paymentID, bkashURL, errorMessage } = response.data;
    if (errorMessage || !paymentID) {
        throw new Error(errorMessage || "Failed to create bKash transaction session.");
    }

    // 3. Save pending payment record in database
    await pool.query(
        `INSERT INTO rent_payments (id, agreement_id, tenant_id, owner_id, payment_month, amount, payment_gateway, bkash_payment_id, status)
         VALUES (?, ?, ?, ?, ?, ?, 'bkash', ?, 'pending')`,
        [paymentId, agreementId, tenantId, agreement.owner_id, paymentMonth, amount, paymentID]
    );

    return { bkashURL, paymentID };
}

// =====================================================
// bKash: Execute Payment
// =====================================================
async function executeBkashPaymentService({ paymentId, tenantId }) {
    // 1. Fetch pending payment
    const [[payment]] = await pool.query(
        `SELECT * FROM rent_payments WHERE id = ? AND tenant_id = ? AND status = 'pending'`,
        [paymentId, tenantId]
    );

    if (!payment) {
        throw new Error("Pending payment session not found.");
    }

    const token = await getBkashToken();
    let response;
    try {
        response = await axios.post(
            `${process.env.BKASH_BASE_URL}/tokenized/checkout/execute`,
            {
                paymentID: payment.bkash_payment_id
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": token,
                    "X-APP-Key": process.env.BKASH_APP_KEY
                }
            }
        );
    } catch (err) {
        console.error("bKash Execute Payment failed:", err.response ? err.response.data : err.message);
        // Mark payment failed
        await pool.query(
            `UPDATE rent_payments SET status = 'failed' WHERE id = ?`,
            [paymentId]
        );
        throw new Error("bKash payment execution failed.");
    }

    const { statusCode, statusMessage, trxID } = response.data;

    if (statusCode === "0000") {
        // Success
        await pool.query(
            `UPDATE rent_payments
             SET status = 'paid', transaction_id = ?, paid_at = NOW(), owner_read = FALSE
             WHERE id = ?`,
            [trxID, paymentId]
        );
        const [[updatedPayment]] = await pool.query(
            `SELECT rp.*, p.title AS property_title, u.name AS tenant_name
             FROM rent_payments rp
             JOIN agreement_drafts ad ON rp.agreement_id = ad.id
             JOIN properties p ON ad.property_id = p.id
             JOIN users u ON rp.tenant_id = u.id
             WHERE rp.id = ?`,
            [paymentId]
        );
        return updatedPayment;
    } else {
        // Failed / Cancelled
        await pool.query(
            `UPDATE rent_payments SET status = 'failed' WHERE id = ?`,
            [paymentId]
        );
        throw new Error(statusMessage || "bKash transaction was not completed successfully.");
    }
}

async function syncPendingStripePayments(paymentsList) {
    const pendingStripe = paymentsList.filter(p => p.payment_gateway === 'stripe' && p.status === 'pending');
    for (const payment of pendingStripe) {
        try {
            const session = await stripe.checkout.sessions.retrieve(payment.stripe_session_id);
            if (session && session.payment_status === 'paid') {
                await pool.query(
                    `UPDATE rent_payments 
                     SET status = 'paid', transaction_id = ?, paid_at = NOW() 
                     WHERE id = ?`,
                    [session.payment_intent || session.id, payment.id]
                );
                payment.status = 'paid';
                payment.transaction_id = session.payment_intent || session.id;
                payment.paid_at = new Date();
            } else if (session && session.status === 'expired') {
                await pool.query(
                    `UPDATE rent_payments SET status = 'failed' WHERE id = ?`,
                    [payment.id]
                );
                payment.status = 'failed';
            }
        } catch (err) {
            console.error(`Failed to sync pending Stripe payment ${payment.id}:`, err.message);
        }
    }
}

// =====================================================
// Tenant: Get Payments and Calculate Dynamic Dues
// =====================================================
async function getMyPaymentsService(tenantId) {
    // 1. Fetch all tenant payment records
    const [payments] = await pool.query(
        `SELECT rp.*, p.title as property_title, p.address as property_address
         FROM rent_payments rp
         JOIN agreement_drafts ad ON rp.agreement_id = ad.id
         JOIN properties p ON ad.property_id = p.id
         WHERE rp.tenant_id = ?
         ORDER BY rp.created_at DESC`,
        [tenantId]
    );

    await syncPendingStripePayments(payments);

    // 2. Fetch all signed agreements for this tenant
    const [agreements] = await pool.query(
        `SELECT ad.*, p.title as property_title, u.name as owner_name
         FROM agreement_drafts ad
         JOIN properties p ON ad.property_id = p.id
         JOIN users u ON ad.owner_id = u.id
         WHERE ad.tenant_id = ? AND ad.status = 'signed'`,
        [tenantId]
    );

    // 3. For each agreement, calculate dues
    const dues = [];
    const paidSet = new Set(
        payments
            .filter(p => p.status === 'paid')
            .map(p => `${p.agreement_id}_${p.payment_month}`)
    );

    for (const agreement of agreements) {
        // Check if security deposit is due
        if (parseFloat(agreement.security_deposit) > 0) {
            const depositKey = `${agreement.id}_security_deposit`;
            if (!paidSet.has(depositKey)) {
                dues.push({
                    agreementId: agreement.id,
                    propertyTitle: agreement.property_title,
                    monthlyRent: agreement.security_deposit,
                    paymentMonth: 'security_deposit',
                    ownerId: agreement.owner_id,
                    ownerName: agreement.owner_name,
                    isDeposit: true
                });
            }
        }

        const activeMonths = getAgreementMonths(agreement.agreement_start_date, agreement.agreement_end_date);
        for (const month of activeMonths) {
            const key = `${agreement.id}_${month}`;
            if (!paidSet.has(key)) {
                dues.push({
                    agreementId: agreement.id,
                    propertyTitle: agreement.property_title,
                    monthlyRent: agreement.monthly_rent,
                    paymentMonth: month,
                    ownerId: agreement.owner_id,
                    ownerName: agreement.owner_name
                });
            }
        }
    }

    return { payments, dues };
}

// =====================================================
// Owner: Get Dashboard Revenue Statistics & Payments list
// =====================================================
// =====================================================
// Owner: Get Dashboard Revenue Statistics & Payments list
// =====================================================
async function getOwnerPaymentDashboardService(ownerId) {
    // 1. Get all incoming payments
    const [payments] = await pool.query(
        `SELECT rp.*, p.title as property_title, u.name as tenant_name, u.email as tenant_email
         FROM rent_payments rp
         JOIN agreement_drafts ad ON rp.agreement_id = ad.id
         JOIN properties p ON ad.property_id = p.id
         JOIN users u ON rp.tenant_id = u.id
         WHERE rp.owner_id = ?
         ORDER BY rp.created_at DESC`,
        [ownerId]
    );

    await syncPendingStripePayments(payments);

    // 2. Compute statistics
    let totalRevenue = 0.0;
    let monthlyRevenue = 0.0;
    let pendingCount = 0;
    let failedCount = 0;

    const currentYearMonth = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    for (const p of payments) {
        const amt = parseFloat(p.amount);
        if (p.status === 'paid') {
            totalRevenue += amt;
            // Check if paid_at falls within the current month
            if (p.paid_at) {
                const paidDate = new Date(p.paid_at);
                const paidYM = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}`;
                if (paidYM === currentYearMonth) {
                    monthlyRevenue += amt;
                }
            }
        } else if (p.status === 'pending') {
            pendingCount++;
        } else if (p.status === 'failed') {
            failedCount++;
        }
    }

    // 3. Get properties list with active tenant, dynamic dues and history per property
    const [properties] = await pool.query(
        `SELECT p.id, p.title, p.address, p.monthly_rent,
                (SELECT image_url FROM property_images WHERE property_id = p.id LIMIT 1) AS image_url
         FROM properties p
         WHERE p.owner_id = ?`,
        [ownerId]
    );

    const propertiesData = [];
    for (const property of properties) {
        const [[agreement]] = await pool.query(
            `SELECT ad.id, ad.tenant_id, ad.agreement_start_date, ad.agreement_end_date,
                    u.name AS tenant_name, u.email AS tenant_email, u.phone AS tenant_phone
             FROM agreement_drafts ad
             JOIN users u ON ad.tenant_id = u.id
             WHERE ad.property_id = ? AND ad.status = 'signed'
             LIMIT 1`,
            [property.id]
        );

        let dues = [];
        let history = [];
        if (agreement) {
            // Fetch paid payments for this agreement
            const [paymentsForAg] = await pool.query(
                `SELECT * FROM rent_payments WHERE agreement_id = ? ORDER BY created_at DESC`,
                [agreement.id]
            );
            history = paymentsForAg;

            // Calculate dues
            const paidSet = new Set(
                paymentsForAg
                    .filter(p => p.status === 'paid')
                    .map(p => p.payment_month)
            );

            // Check security deposit due
            if (parseFloat(agreement.security_deposit) > 0) {
                if (!paidSet.has('security_deposit')) {
                    dues.push({
                        paymentMonth: 'security_deposit',
                        amount: agreement.security_deposit,
                        isDeposit: true
                    });
                }
            }

            const activeMonths = getAgreementMonths(agreement.agreement_start_date, agreement.agreement_end_date);
            for (const month of activeMonths) {
                if (!paidSet.has(month)) {
                    dues.push({
                        paymentMonth: month,
                        amount: property.monthly_rent
                    });
                }
            }
        }

        propertiesData.push({
            id: property.id,
            title: property.title,
            address: property.address,
            image_url: property.image_url,
            monthly_rent: property.monthly_rent,
            agreement: agreement ? {
                id: agreement.id,
                tenant_id: agreement.tenant_id,
                tenant_name: agreement.tenant_name,
                tenant_email: agreement.tenant_email,
                tenant_phone: agreement.tenant_phone,
                start_date: agreement.agreement_start_date,
                end_date: agreement.agreement_end_date,
                dues,
                history
            } : null
        });
    }

    return {
        payments,
        stats: {
            totalRevenue,
            monthlyRevenue,
            pendingCount,
            failedCount
        },
        properties: propertiesData
    };
}

// =====================================================
// Owner: Record Cash Payment
// =====================================================
async function recordCashPaymentService({ agreementId, paymentMonth, ownerId }) {
    // 1. Fetch active signed agreement and verify owner_id
    const [[agreement]] = await pool.query(
        `SELECT ad.*, p.title as property_title 
         FROM agreement_drafts ad
         JOIN properties p ON ad.property_id = p.id
         WHERE ad.id = ? AND ad.owner_id = ? AND ad.status = 'signed'`,
        [agreementId, ownerId]
    );

    if (!agreement) {
        throw new Error("No active signed agreement found or you are not authorized.");
    }

    // 2. Prevent double-payments
    const [[existingPaid]] = await pool.query(
        `SELECT id FROM rent_payments WHERE agreement_id = ? AND payment_month = ? AND status = 'paid'`,
        [agreementId, paymentMonth]
    );

    if (existingPaid) {
        const displayMonth = paymentMonth === 'security_deposit' ? 'Security Deposit' : paymentMonth;
        throw new Error(`Rent/deposit for ${displayMonth} has already been paid.`);
    }

    const isDeposit = paymentMonth === 'security_deposit';
    const amount = isDeposit ? parseFloat(agreement.security_deposit) : parseFloat(agreement.monthly_rent);

    if (isDeposit && amount <= 0) {
        throw new Error("No security deposit is defined for this agreement.");
    }

    const paymentId = uuidv4();
    const trxId = `CASH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // 3. Insert paid cash payment record
    await pool.query(
        `INSERT INTO rent_payments (id, agreement_id, tenant_id, owner_id, payment_month, amount, payment_gateway, transaction_id, status, paid_at)
         VALUES (?, ?, ?, ?, ?, ?, 'cash', ?, 'paid', NOW())`,
        [paymentId, agreementId, agreement.tenant_id, ownerId, paymentMonth, amount, trxId]
    );

    return { success: true, paymentId, transactionId: trxId };
}

// =====================================================
// Get Payment Details
// =====================================================
async function getPaymentDetailsService(paymentId, userId, role) {
    const [[payment]] = await pool.query(
        `SELECT rp.*, 
                p.title as property_title, p.address as property_address,
                t.name as tenant_name, t.email as tenant_email, t.phone as tenant_phone,
                o.name as owner_name, o.email as owner_email, o.phone as owner_phone
         FROM rent_payments rp
         JOIN agreement_drafts ad ON rp.agreement_id = ad.id
         JOIN properties p ON ad.property_id = p.id
         JOIN users t ON rp.tenant_id = t.id
         JOIN users o ON rp.owner_id = o.id
         WHERE rp.id = ?`,
        [paymentId]
    );

    if (!payment) {
        throw new Error("Payment record not found.");
    }

    // Access control: only the tenant, the owner, or an admin can access
    if (role !== 'admin' && payment.tenant_id !== userId && payment.owner_id !== userId) {
        throw new Error("Access forbidden. You do not have permission to view this transaction.");
    }

    return payment;
}

// =====================================================
// Get Owner Unread Payment Notification Count
// =====================================================
async function getUnreadPaymentNotificationCountService(ownerId) {
    const [[result]] = await pool.query(
        `SELECT COUNT(*) AS unread_count
         FROM rent_payments
         WHERE owner_id = ? AND owner_read = FALSE AND status = 'paid'`,
        [ownerId]
    );

    return Number(result.unread_count || 0);
}

// =====================================================
// Mark Owner Payment Notifications Read
// =====================================================
async function markPaymentNotificationsReadService(ownerId) {
    await pool.query(
        `UPDATE rent_payments
         SET owner_read = TRUE
         WHERE owner_id = ? AND owner_read = FALSE AND status = 'paid'`,
        [ownerId]
    );

    return { success: true };
}

module.exports = {
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
};

