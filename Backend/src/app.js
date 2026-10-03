/**
 * @file src/app.js
 * @description Express application setup — middleware and routes only.
 *              No service connections here. All connections
 *              are handled in server.js before this app starts.
 * @author Siyam
 */

const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const authRoutes = require("./routes/auth.routes")
const adminRoutes = require("./routes/admin.routes")
const propertyRoutes = require("./routes/property.routes")
const searchRoutes = require("./routes/search.routes")
const filterRoutes = require("./routes/filter.routes")
const chatRoutes =require("./routes/chat.routes")
const stayRequestRoutes =require("./routes/stayRequest.routes")
const agreementRoutes =require("./routes/agreement.routes")
const scheduleRoutes = require("./routes/schedule.routes")
const paymentRoutes = require("./routes/payment.routes")
const maintenanceRoutes = require("./routes/maintenance.routes")

const app = express()

// ─── Middleware ───────────────────────────────────────────
app.use(cors({
    origin: function(origin, callback) {
        // Allow all origins for local testing
        callback(null, true);
    },
    credentials: true, // Required for cookies
}))
app.use("/api/payments/webhook", express.raw({ type: "application/json" }))
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // For multipart form-data text fields
app.use(cookieParser())

// ─── Routes ───────────────────────────────────────────────
app.use("/api/auth", authRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/properties", propertyRoutes)
app.use("/api/properties-filter", filterRoutes)
app.use("/api/search", searchRoutes)
app.use("/api/chat",chatRoutes)
app.use("/api/stay-request",stayRequestRoutes)
app.use("/api/agreements",agreementRoutes)
app.use("/api/schedules", scheduleRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/maintenance", maintenanceRoutes)

// ─── Health Check ─────────────────────────────────────────
app.get("/", (req, res) => {
    res.status(200).json({ message: "EasyRentBD API is running 🚀" })
})
app.use((err, req, res, next) => {
    console.error(err) // 🔥 see real error in terminal

    res.status(err.statusCode || 500).json({
        message: err.message || "Internal server error"
    })
})

module.exports = app