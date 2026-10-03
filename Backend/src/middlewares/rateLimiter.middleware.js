// middlewares/rateLimiter.middleware.js
const rateLimit = require("express-rate-limit")

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 50, // limit each IP
    message: "Too many requests, try again later."
})

module.exports = { authLimiter }