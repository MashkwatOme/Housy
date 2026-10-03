const {
    createPropertyService,
    getAllPropertiesService,
    getPropertyByIdService,
    getOwnerPropertiesService,
    editPropertyService,
    deletePropertyService,
} = require("../services/property.service")

async function createPropertyController(req, res) {
    try {

        const property = await createPropertyService(
            req.user.id,
            req.body,
            req.files || {}
        )

        return res.status(201).json({
            message: "Property created successfully.",
            property,
        })

    } catch (err) {

        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

async function getAllPropertiesController(req, res) {
    try {

        const properties = await getAllPropertiesService()

        return res.status(200).json({ properties })

    } catch (err) {

        return res.status(500).json({
            message: err.message || "Internal server error.",
        })
    }
}

async function getPropertyByIdController(req, res) {
    try {
        let user = null;
        const access_token = req.cookies?.access_token;
        if (access_token) {
            try {
                const jwt = require("jsonwebtoken");
                const decoded = jwt.verify(access_token, process.env.JWT_ACCESS_KEY);
                user = decoded;
            } catch (err) {
                // Token invalid/expired, proceed as anonymous
            }
        }

        const property = await getPropertyByIdService(req.params.id, user)

        return res.status(200).json({ property })

    } catch (err) {

        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

async function getOwnerPropertiesController(req, res) {
    try {

        const properties = await getOwnerPropertiesService(req.user.id)

        return res.status(200).json({ properties })

    } catch (err) {

        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

async function editPropertyController(req, res) {
    try {
        const property = await editPropertyService(
            req.user.id,
            req.params.id,
            req.body,
            req.files || {}
        )

        return res.status(200).json({
            message: "Property updated successfully.",
            property,
        })
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

async function deletePropertyController(req, res) {
    try {
        await deletePropertyService(req.user.id, req.params.id)

        return res.status(200).json({
            message: "Property deleted successfully."
        })
    } catch (err) {
        return res.status(err.statusCode || 500).json({
            message: err.message || "Internal server error.",
        })
    }
}

module.exports = {
    createPropertyController,
    getAllPropertiesController,
    getPropertyByIdController,
    getOwnerPropertiesController,
    editPropertyController,
    deletePropertyController,
}
