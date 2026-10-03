const { filterPropertiesService, getAmenitiesService } = require("../services/filter.service")

async function filterPropertiesController(req, res) {
    try {
        const properties = await filterPropertiesService(req.query)
        return res.status(200).json({ properties })
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Internal server error.",
        })
    }
}

async function getAmenitiesController(req, res) {
    try {
        const amenities = await getAmenitiesService()
        return res.status(200).json({ amenities })
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Internal server error.",
        })
    }
}

module.exports = {
    filterPropertiesController,
    getAmenitiesController
}
