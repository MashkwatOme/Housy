/**
 * @file src/routes/auth.routes.js
 * @description Auth routes — wires endpoints, middlewares and controllers together.
 * @author Siyam
 */

const express = require("express")
const router = express.Router()
const { uploadNID, uploadProfilePicture } = require("../middlewares/upload.middleware")
const { verifyToken } = require("../middlewares/auth.middleware")
const { authLimiter } = require("../middlewares/rateLimiter.middleware")

const {
    registerController,
    loginController,
    logoutController,
    refreshTokenController,
    getMeController,
    updateProfileController,
} = require("../controllers/auth.controller")

router.post("/register",authLimiter,uploadNID, registerController)
router.post("/login", authLimiter,loginController)
router.post("/logout",verifyToken, logoutController)
router.post("/refresh",authLimiter, refreshTokenController)
router.get("/me", verifyToken, getMeController)
router.patch("/profile", verifyToken, uploadProfilePicture, updateProfileController)

module.exports = router
