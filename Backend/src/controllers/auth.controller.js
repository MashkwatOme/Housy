/**
 * @file src/controllers/auth.controller.js
 * @description Handles HTTP req/res for auth routes.
 *              Delegates everything to auth.service.js
 * @author Siyam
 */

const {
    registerService,
    loginService,
    logoutService,
    refreshTokenService,
    getMeService,
    updateProfileService,
} = require("../services/auth.service")

// ─── Cookie Config (SHARED) ───────────────────────────────────────────────────

const isProduction = process.env.NODE_ENV === "production"

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
}

// ─── Cookie Helper ────────────────────────────────────────────────────────────

function setCookies(res, access_token, refresh_token) {
    res.cookie("access_token", access_token, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000,
    })

    res.cookie("refresh_token", refresh_token, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })
}

// ─── Controllers ──────────────────────────────────────────────────────────────

async function registerController(req, res) {
    try {
        const { user} = await registerService(req.body, req.files)


        return res.status(201).json({
            message: "Registered successfully. Awaiting NID verification by admin.",
            user,
        })
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

async function loginController(req, res) {
    try {
        const { user, access_token, refresh_token } = await loginService(req.body)

        setCookies(res, access_token, refresh_token)

        return res.status(200).json({
            message: "Logged in successfully.",
            user,
        })
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

async function logoutController(req, res) {
    try {
        const refresh_token = req.cookies.refresh_token

        if (!refresh_token) {
            return res.status(400).json({ message: "No active session found." })
        }

        await logoutService(refresh_token)

        res.clearCookie("access_token", cookieOptions)
        res.clearCookie("refresh_token", cookieOptions)

        return res.status(200).json({ message: "Logged out successfully." })
    } catch (err) {
        res.clearCookie("access_token", cookieOptions)
        res.clearCookie("refresh_token", cookieOptions)

        return res.status(err.statusCode || 500).json({
            message: err.message || "Logout failed.",
        })
    }
}

async function refreshTokenController(req, res) {
    try {
        const refresh_token = req.cookies.refresh_token

        if (!refresh_token) {
            return res.status(401).json({ message: "No refresh token provided." })
        }

        const { access_token, refresh_token: newRefreshToken } =
            await refreshTokenService(refresh_token)

        setCookies(res, access_token, newRefreshToken)

        return res.status(200).json({
            message: "Token refreshed successfully.",
        })
    } catch (err) {
        res.clearCookie("access_token", cookieOptions)
        res.clearCookie("refresh_token", cookieOptions)

        return res.status(err.statusCode || 401).json({
            message: err.message || "Invalid or expired refresh token.",
        })
    }
}

async function getMeController(req, res) {
    try {
        const user = await getMeService(req.user.id)

        return res.status(200).json({ user })
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

async function updateProfileController(req, res) {
    try {
        const user = await updateProfileService(
            req.user.id,
            req.body,
            req.file?.path || null
        )

        return res.status(200).json({
            message: "Profile updated successfully.",
            user,
        })
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            message: err.message || "Unable to update profile.",
        })
    }
}

module.exports = {
    registerController,
    loginController,
    logoutController,
    refreshTokenController,
    getMeController,
    updateProfileController,
}

