const axios = require("axios")

/**
 * Maps common generic "near <category>" words to Google Places API types.
 * A named landmark (e.g. "UIU", "Tiger Pass") won't appear here, so
 * lookups for those fall through to the existing geocoding flow.
 */
const CATEGORY_PLACE_TYPES = {
    hospital: "hospital",
    hospitals: "hospital",
    clinic: "hospital",
    clinics: "hospital",

    school: "school",
    schools: "school",

    university: "university",
    universities: "university",
    college: "university",
    colleges: "university",

    market: "supermarket",
    markets: "supermarket",
    supermarket: "supermarket",
    supermarkets: "supermarket",
    bazar: "supermarket",

    mosque: "place_of_worship",
    mosques: "place_of_worship",
    temple: "place_of_worship",
    temples: "place_of_worship",
    church: "place_of_worship",
    churches: "place_of_worship",

    restaurant: "restaurant",
    restaurants: "restaurant",

    pharmacy: "pharmacy",
    pharmacies: "pharmacy",

    bank: "bank",
    banks: "bank",
    atm: "atm",
    atms: "atm",

    park: "park",
    parks: "park",

    gym: "gym",
    gyms: "gym",

    "bus stand": "bus_station",
    "bus station": "bus_station",

    "train station": "train_station",

    airport: "airport",
    airports: "airport",
}

function getPlaceCategoryType(nearPlaceText) {

    if (!nearPlaceText) {
        return null
    }

    const key = nearPlaceText.trim().toLowerCase()

    return CATEGORY_PLACE_TYPES[key] || null
}

// Finds a generic category word ("hospitals", "school", "bus stand"...)
// anywhere in free text, as a whole word. Longest keys are tried first
// so "bus station" wins over a shorter overlapping key.

const CATEGORY_KEYS_BY_LENGTH =
    Object.keys(CATEGORY_PLACE_TYPES)
        .sort((a, b) => b.length - a.length)

function findCategoryWord(text) {

    if (!text) {
        return null
    }

    const lower = text.toLowerCase()

    return CATEGORY_KEYS_BY_LENGTH.find(
        (key) => new RegExp(`\\b${key}\\b`).test(lower)
    ) || null
}

async function hasNearbyPlace(latitude, longitude, placeType, radiusMeters = 2000) {

    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    const response = await axios.get(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        {
            params: {
                location: `${latitude},${longitude}`,
                radius: radiusMeters,
                type: placeType,
                key: apiKey,
            },
        }
    )

    console.log(
        `Places Nearby Search (${placeType} @ ${latitude},${longitude}):`,
        response.data.status
    )

    const places =
        Array.isArray(response.data.results)
            ? response.data.results
            : []

    // Return the actual matched places (not just a boolean) so the
    // caller can plot/highlight them on the map, not only use them
    // to filter properties.

    return {
        found: places.length > 0,
        places,
    }
}

module.exports = {
    getPlaceCategoryType,
    findCategoryWord,
    hasNearbyPlace,
}
