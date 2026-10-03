/**
 * @file src/middlewares/upload.middleware.js
 * @description Multer + Cloudinary storage middleware for NID photo uploads.
 *              Accepts nid_front and nid_back as multipart/form-data fields.
 * @author Siyam
 */

const multer = require("multer")
const { CloudinaryStorage } = require("multer-storage-cloudinary")
const cloudinary = require("../config/cloudinary")

// ── Cloudinary storage for NID images ──
const nidStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "easyrentbd/nid",
        allowed_formats: ["jpg", "jpeg", "png"],
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
    },
})

// ── Only allow image files ──
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error("Only JPG and PNG files are allowed."), false)
    }
}

const profileFileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error("Only JPG, PNG and WebP files are allowed."), false)
    }
}

// ── Upload middleware ──
const uploadNID = multer({
    storage: nidStorage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).fields([
    { name: "nid_front", maxCount: 1 },
    { name: "nid_back", maxCount: 1 },
])

const profileStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "easyrentbd/profiles",
        allowed_formats: ["jpg", "jpeg", "png", "webp"],
        resource_type: "image",
        transformation: [
            { width: 600, height: 600, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
        ],
    },
})

const uploadProfilePicture = multer({
    storage: profileStorage,
    fileFilter: profileFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
}).single("profile_picture")

module.exports = { uploadNID, uploadProfilePicture }
