const express = require("express")

const router = express.Router()

const {
    createPropertyController,
    getAllPropertiesController,
    getPropertyByIdController,
    getOwnerPropertiesController,
    editPropertyController,
    deletePropertyController,
} = require("../controllers/property.controller")

const { verifyToken, authorizeRoles } = require("../middlewares/auth.middleware")

const uploadPropertyMedia = require("../middlewares/uploadProperty.middleware")
const propertyMediaFields = uploadPropertyMedia.fields([
    { name: "property_images", maxCount: 10 },
    { name: "walkthrough_video", maxCount: 1 },
])

router.post(
    "/",
    verifyToken,
    authorizeRoles("owner"),
    propertyMediaFields,
    createPropertyController
)

router.get("/", getAllPropertiesController)

router.get("/my-properties",
    verifyToken,
    authorizeRoles("owner"),
    getOwnerPropertiesController
)

router.get("/:id", getPropertyByIdController)

router.patch(
    "/:id",
    verifyToken,
    authorizeRoles("owner"),
    propertyMediaFields,
    editPropertyController
)

router.delete(
    "/:id",
    verifyToken,
    authorizeRoles("owner"),
    deletePropertyController
)

module.exports = router
