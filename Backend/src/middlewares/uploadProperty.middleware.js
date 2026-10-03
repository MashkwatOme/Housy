const multer = require("multer")

const storage = multer.memoryStorage()

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"])
const allowedVideoTypes = new Set(["video/mp4", "video/webm", "video/quicktime"])

const uploadPropertyMedia = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024,
    },
    fileFilter: (req, file, callback) => {
        const validImage = file.fieldname === "property_images" && allowedImageTypes.has(file.mimetype)
        const validVideo = file.fieldname === "walkthrough_video" && allowedVideoTypes.has(file.mimetype)

        if (validImage || validVideo) return callback(null, true)

        const error = new Error("Only JPG, PNG, WEBP photos and MP4, WEBM, MOV walkthrough videos are allowed.")
        error.statusCode = 400
        return callback(error)
    },
})

module.exports = uploadPropertyMedia
