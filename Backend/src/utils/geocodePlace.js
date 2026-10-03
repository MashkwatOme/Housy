const axios = require("axios")

async function geocodePlace(place) {

    const apiKey =
        process.env.GOOGLE_MAPS_API_KEY

    const response =
        await axios.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            {
                params: {
                    address: place,
                    key: apiKey,
                    components: "country:BD",
                },
            }
        )

    if (
        response.data.results.length === 0
    ) {
        return null
    }

    const result =
        response.data
            .results[0]

    const location =
        result.geometry
            .location

    return {
        latitude: location.lat,
        longitude: location.lng,
        name: result.formatted_address,
    }
}

module.exports = geocodePlace