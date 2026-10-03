/**
 * @file src/middlewares/auth.middleware.js
 * @description Middleware to protect private routes.
 *              Verifies access token from httpOnly cookie.
 * @author Siyam
 */

const jwt = require("jsonwebtoken")
require("dotenv").config()

/**
 * @name verifyToken
 * @description Protects private routes — attaches decoded user to req.user
 */
function verifyToken(req, res, next) {
    try {
        const access_token = req.cookies.access_token
        if (!access_token) {
            return res.status(401).json({ message: "Access denied. No token provided." })
        }
        const decoded = jwt.verify(access_token, process.env.JWT_ACCESS_KEY)
        req.user = decoded // { id, role }
        next()
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired access token." })
    }
}

/**
 * @name authorizeRoles
 * @description Restricts route access by role
 * @param {...string} roles - e.g. ("owner", "admin")
 */
function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access forbidden: insufficient permissions." })
        }
        next()
    }
}

module.exports = { verifyToken, authorizeRoles }