const express = require("express")

const router = express.Router()

const {
    searchPropertiesController
} = require("../controllers/search.controller")

router.post("/", searchPropertiesController)

module.exports = router