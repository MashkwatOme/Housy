const express = require("express")
const router = express.Router()
const { filterPropertiesController, getAmenitiesController } = require("../controllers/filter.controller")

router.get("/", filterPropertiesController)
router.get("/amenities", getAmenitiesController)

module.exports = router
