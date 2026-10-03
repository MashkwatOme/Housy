/**
 * @file src/services/admin.service.js
 * @description Business logic for admin verification system
 */

const { getPool } = require("../config/db")
const { sendApprovalEmail } = require("./email.service")

/**
 * @name getPendingUsersService
 * @description Get all pending users
 */
async function getPendingUsersService() {
    const pool = getPool()

    const [rows] = await pool.query(`
        SELECT
            id,
            name,
            email,
            phone,
            role,
            nid_front_url,
            nid_back_url,
            status,
            is_verified,
            created_at
        FROM users
        WHERE status = 'pending'
        ORDER BY created_at DESC
    `)

    return rows
}

/**
 * @name approveUserService
 * @description Approve user account
 */
async function approveUserService(userId) {
    const pool = getPool()

    // Get user first
    const [users] = await pool.query(
        "SELECT name, email FROM users WHERE id=?",
        [userId]
    )

    if (users.length === 0) {
        const error = new Error("User not found.")
        error.statusCode = 404
        throw error
    }

    const user = users[0]

    // Update status
    await pool.query(
        `
        UPDATE users
        SET status = 'accepted',
            is_verified = TRUE
        WHERE id = ?
        `,
        [userId]
    )

    // Send approval email
    await sendApprovalEmail(user.email, user.name)
}

/**
 * @name rejectUserService
 * @description Reject user account
 */
async function rejectUserService(userId) {
    const pool = getPool()

    const [result] = await pool.query(
        `
        UPDATE users
        SET status = 'rejected',
            is_verified = FALSE
        WHERE id = ?
        `,
        [userId]
    )

    if (result.affectedRows === 0) {
        const error = new Error("User not found.")
        error.statusCode = 404
        throw error
    }
}

/**
 * @name getDashboardStatsService
 * @description Aggregated platform metrics for the admin dashboard
 */
async function getDashboardStatsService() {
    const pool = getPool()

    const [
        [userGroups],
        [signupRows],
        [propertyGroups],
        [stayGroups],
        [maintenanceGroups],
        [paymentRows],
        [recentUsers],
        [recentProperties],
    ] = await Promise.all([
        pool.query(`
            SELECT role, status, COUNT(*) AS count
            FROM users
            WHERE role <> 'admin'
            GROUP BY role, status
        `),
        pool.query(`
            SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(*) AS count
            FROM users
            WHERE role <> 'admin'
              AND created_at >= CURDATE() - INTERVAL 13 DAY
            GROUP BY day
        `),
        pool.query(`
            SELECT visibility_status AS status, COUNT(*) AS count
            FROM properties
            GROUP BY visibility_status
        `),
        pool.query(`
            SELECT status, COUNT(*) AS count
            FROM stay_requests
            GROUP BY status
        `),
        pool.query(`
            SELECT status, COUNT(*) AS count
            FROM maintenance_requests
            GROUP BY status
        `),
        pool.query(`
            SELECT
                COALESCE(SUM(CASE WHEN status = 'paid' THEN amount END), 0) AS total_paid,
                COALESCE(SUM(CASE WHEN status = 'paid'
                    AND paid_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN amount END), 0) AS month_paid,
                COALESCE(SUM(status = 'pending'), 0) AS pending_count,
                COALESCE(SUM(status = 'failed'), 0) AS failed_count
            FROM rent_payments
        `),
        pool.query(`
            SELECT id, name, role, status, created_at
            FROM users
            WHERE role <> 'admin'
            ORDER BY created_at DESC
            LIMIT 6
        `),
        pool.query(`
            SELECT p.id, p.title, p.property_type, p.monthly_rent, p.area, p.district,
                   p.visibility_status, p.created_at, u.name AS owner_name
            FROM properties p
            JOIN users u ON u.id = p.owner_id
            ORDER BY p.created_at DESC
            LIMIT 5
        `),
    ])

    const toMap = (rows) =>
        rows.reduce((acc, r) => ({ ...acc, [r.status]: Number(r.count) }), {})

    // Users: totals by role and by status
    const users = { total: 0, tenants: 0, owners: 0, pending: 0, accepted: 0, rejected: 0 }
    for (const r of userGroups) {
        const n = Number(r.count)
        users.total += n
        if (r.role === 'tenant') users.tenants += n
        if (r.role === 'owner') users.owners += n
        users[r.status] += n
    }

    // Signups: fill in the zero days so the chart has a continuous 14-day axis
    const signupMap = Object.fromEntries(signupRows.map(r => [r.day, Number(r.count)]))
    const signups = []
    for (let i = 13; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const day = [
            d.getFullYear(),
            String(d.getMonth() + 1).padStart(2, "0"),
            String(d.getDate()).padStart(2, "0"),
        ].join("-")
        signups.push({ day, count: signupMap[day] || 0 })
    }

    const properties = toMap(propertyGroups)
    const payments = paymentRows[0] || {}

    return {
        users,
        signups,
        properties: {
            total: Object.values(properties).reduce((a, b) => a + b, 0),
            byStatus: properties,
        },
        stayRequests: toMap(stayGroups),
        maintenance: toMap(maintenanceGroups),
        payments: {
            totalPaid: Number(payments.total_paid || 0),
            monthPaid: Number(payments.month_paid || 0),
            pending: Number(payments.pending_count || 0),
            failed: Number(payments.failed_count || 0),
        },
        recentUsers,
        recentProperties,
    }
}

module.exports = {
    getPendingUsersService,
    approveUserService,
    rejectUserService,
    getDashboardStatsService,
}
