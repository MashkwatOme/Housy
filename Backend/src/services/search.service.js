/**
 * =========================================================
 * Intelligent Conversational Property Search Service
 * =========================================================
 *
 * Features:
 * ✔ Natural language search
 * ✔ Dynamic SQL filtering
 * ✔ Geo / nearby place search
 * ✔ Amenities filtering
 * ✔ Conversational memory using Redis
 * ✔ Context merging across multiple searches
 *
 * Example Conversation:
 *
 * Query 1:
 * "2 bedroom apartment in badda"
 *
 * Stored Context:
 * {
 *   bedrooms: 2,
 *   propertyType: "apartment",
 *   location: "badda"
 * }
 *
 * Query 2:
 * "under 25k"
 *
 * Final Merged Context:
 * {
 *   bedrooms: 2,
 *   propertyType: "apartment",
 *   location: "badda",
 *   maxRent: 25000
 * }
 *
 * =========================================================
 */

const { getPool } =
    require("../config/db")

// Database connection pool

const pool = getPool()

// Conversation memory helpers

const {
    getConversationContext,
    saveConversationContext,
    mergeContexts,
} = require("./conversation.service")

// Query parser utility

const parseSearchQuery =
    require("../utils/queryParser")

// Google geocoding utility

const geocodePlace =
    require("../utils/geocodePlace")

// Generic "near <category>" (e.g. hospital, school) helper —
// used instead of geocoding when nearPlace isn't a specific named landmark

const {
    getPlaceCategoryType,
    hasNearbyPlace,
} = require("../utils/nearbyCategorySearch")

/**
 * =========================================================
 * Main Search Service
 * =========================================================
 *
 * @param {string} query
 * User's natural language query
 *
 * @param {string} sessionId
 * Unique session identifier for
 * conversational memory
 *
 * @returns {Array}
 * Matching properties
 */

async function searchPropertiesService(
    query,
    sessionId
) {

    /**
     * =====================================================
     * STEP 1:
     * Load available searchable areas dynamically
     * =====================================================
     *
     * Instead of hardcoding:
     * - badda
     * - uttara
     * - mirpur
     *
     * We dynamically fetch areas
     * from the database.
     */

    const [locations] =
        await pool.query(`
            SELECT DISTINCT area, district, division
            FROM properties
        `)

    /**
     * =====================================================
     * STEP 2:
     * Parse current natural language query
     * =====================================================
     *
     * Example:
     *
     * Query:
     * "2 bedroom apartment near airport"
     *
     * Parsed:
     * {
     *   bedrooms: 2,
     *   propertyType: "apartment",
     *   nearPlace: "airport"
     * }
     */

    const parsed =
        parseSearchQuery(query, locations)

    console.log(
        "Current Parsed Query:"
    )

    console.log(parsed)

    /**
     * =====================================================
     * STEP 2b:
     * Reject queries that don't map to real database data
     * =====================================================
     *
     * The bot only answers from the database:
     * - nothing recognizable in the query (e.g. "hello") → no results
     * - only a place name was given, and no property is located
     *   there → no results
     *
     * Returning early here also keeps junk text out of the saved
     * conversation context, so it can't break the next search.
     */

    const hasRecognizedCriteria =
        [
            "bedrooms",
            "bathrooms",
            "maxRent",
            "location",
            "propertyType",
            "nearPlace",
        ].some(
            (field) => parsed[field] !== null && parsed[field] !== undefined
        )
        ||
        (parsed.amenities && parsed.amenities.length > 0)

    if (!hasRecognizedCriteria) {

        let placeExists = false

        if (parsed.locationPhrase) {

            const like = `%${parsed.locationPhrase}%`

            const [placeRows] =
                await pool.query(
                    `
                    SELECT 1
                    FROM properties
                    WHERE visibility_status = 'active'
                    AND (
                        area LIKE ?
                        OR district LIKE ?
                        OR division LIKE ?
                        OR address LIKE ?
                    )
                    LIMIT 1
                    `,
                    [like, like, like, like]
                )

            placeExists = placeRows.length > 0
        }

        if (!placeExists) {

            return {
                properties: [],
                nearbyPlaces: [],
                categoryType: null,
            }
        }
    }

    /**
     * =====================================================
     * STEP 3:
     * Load previous conversation context
     * =====================================================
     *
     * Example previous context:
     *
     * {
     *   bedrooms: 2,
     *   location: "badda"
     * }
     *
     * A query that already specifies 2+ filter dimensions of its
     * own (e.g. "apartment" + "4 bedrooms") reads as a complete,
     * standalone search rather than a one-word refinement like
     * "under 25k" or "4 bedroom" — so it should NOT silently
     * inherit unrelated leftover filters (e.g. a bathroom count)
     * from an earlier, unrelated search in the same session.
     */

    const parsedFilterDimensionCount =
        [
            "bedrooms",
            "bathrooms",
            "maxRent",
            "location",
            "locationPhrase",
            "propertyType",
            "nearPlace",
        ].filter(
            (field) => parsed[field] !== null && parsed[field] !== undefined
        ).length
        +
        (parsed.amenities && parsed.amenities.length > 0 ? 1 : 0)

    // A query that is only a place name ("azimpur") is also a fresh
    // search — otherwise hidden leftovers from earlier turns (bedrooms,
    // bathrooms, budget...) silently narrow it, so the same input gives
    // different results depending on what was searched before.

    const isPlaceOnly =
        Boolean(parsed.location || parsed.locationPhrase)
        &&
        parsedFilterDimensionCount === 1

    const isStandaloneSearch =
        parsedFilterDimensionCount >= 2
        ||
        isPlaceOnly

    const oldContext =
        isStandaloneSearch
            ? {}
            : await getConversationContext(
                sessionId
            )

    console.log("Old Context:")

    console.log(oldContext)

    /**
     * =====================================================
     * STEP 4:
     * Merge old + new search context
     * =====================================================
     *
     * Previous:
     * {
     *   bedrooms: 2,
     *   location: "badda"
     * }
     *
     * New:
     * {
     *   maxRent: 25000
     * }
     *
     * Result:
     * {
     *   bedrooms: 2,
     *   location: "badda",
     *   maxRent: 25000
     * }
     */

    const mergedContext =
        mergeContexts(
            oldContext,
            parsed
        )

    console.log("Merged Context:")

    console.log(mergedContext)

    /**
     * =====================================================
     * STEP 5:
     * Save updated conversation context
     * =====================================================
     *
     * Redis stores the latest search state
     * for this session.
     */

    await saveConversationContext(
        sessionId,
        mergedContext
    )

    /**
     * =====================================================
     * STEP 6:
     * Convert nearby place into coordinates
     * =====================================================
     *
     * Example:
     * "near airport"
     *
     * Google Geocoding API returns:
     * latitude + longitude
     */

    // A "near X" phrase is either a specific named landmark
    // (geocode it to one point) or a generic category like
    // "hospital"/"school" (checked per-property below instead).

    const categoryType =
        mergedContext.nearPlace
            ? getPlaceCategoryType(mergedContext.nearPlace)
            : null

    let nearbyCoordinates = null

    if (
    mergedContext.nearPlace
    &&
    !mergedContext.location
    &&
    !categoryType
) {

    nearbyCoordinates =
        await geocodePlace(
            mergedContext.nearPlace
        )

    console.log(
        "Nearby Coordinates:"
    )

    console.log(
        nearbyCoordinates
    )
}

    /**
     * =====================================================
     * STEP 7:
     * Base SQL Query
     * =====================================================
     *
     * LEFT JOIN used for amenities filtering.
     */

    let sql = `
    SELECT DISTINCT p.*
    FROM properties p

    LEFT JOIN property_amenities pa
    ON p.id = pa.property_id

    LEFT JOIN amenities a
    ON pa.amenity_id = a.id

    WHERE p.visibility_status = 'active'
    `

    // SQL values array
    // used for parameterized queries

    const values = []

    /**
     * =====================================================
     * STEP 8:
     * Bedrooms Filter
     * =====================================================
     */

    if (mergedContext.bedrooms) {

        sql += `
        AND p.total_bedrooms = ?
        `

        values.push(
            mergedContext.bedrooms
        )
    }

    /**
     * =====================================================
     * STEP 9:
     * Bathrooms Filter
     * =====================================================
     */

    if (mergedContext.bathrooms) {

        sql += `
        AND p.total_bathrooms = ?
        `

        values.push(
            mergedContext.bathrooms
        )
    }

    /**
     * =====================================================
     * STEP 10:
     * Budget Filter
     * =====================================================
     */

    if (mergedContext.maxRent) {

        sql += `
        AND p.monthly_rent <= ?
        `

        values.push(
            mergedContext.maxRent
        )
    }

    /**
     * =====================================================
     * STEP 11:
     * Property Type Filter
     * =====================================================
     */

    if (mergedContext.propertyType) {

        sql += `
        AND p.property_type = ?
        `

        values.push(
            mergedContext.propertyType
        )
    }

    /**
     * =====================================================
     * STEP 12:
     * Area / District / Division / Address Search
     * =====================================================
     *
     * If the user named a place, a location constraint is
     * always applied here — never silently skipped — so a
     * search never falls back to "every area" just because
     * the phrase didn't exactly match a known DB value.
     *
     * Search matches:
     * - area
     * - district
     * - division
     * - address
     */

    const locationToMatch =
        mergedContext.location
        ||
        mergedContext.locationPhrase

    if (locationToMatch) {

        sql += `
        AND (
            p.area LIKE ?
            OR p.district LIKE ?
            OR p.division LIKE ?
            OR p.address LIKE ?
        )
        `

        values.push(
            `%${locationToMatch}%`,
            `%${locationToMatch}%`,
            `%${locationToMatch}%`,
            `%${locationToMatch}%`
        )
    }

    /**
     * =====================================================
     * STEP 13:
     * Amenities Filter
     * =====================================================
     */

    if (
    mergedContext.amenities &&
    mergedContext.amenities.length > 0
) {

        sql += `
        AND a.name IN (?)
        `

        values.push(
            mergedContext.amenities
        )
    }

    /**
     * =====================================================
     * STEP 14:
     * Geo Distance Search
     * =====================================================
     *
     * Uses Haversine Formula
     *
     * Finds properties within
     * 2 kilometers of searched place.
     */

    if (nearbyCoordinates) {

        sql += `
        AND (
            6371 * acos(
                cos(radians(?))
                * cos(radians(p.latitude))
                * cos(radians(p.longitude)
                - radians(?))
                + sin(radians(?))
                * sin(radians(p.latitude))
            )
        ) < 2
        `

        values.push(
            nearbyCoordinates.latitude,
            nearbyCoordinates.longitude,
            nearbyCoordinates.latitude
        )
    }

    /**
     * =====================================================
     * STEP 15:
     * Final Ordering
     * =====================================================
     */

    sql += `
    ORDER BY p.created_at DESC
    `

    console.log("Generated SQL:")

    console.log(sql)

    console.log("SQL Values:")

    console.log(values)

    /**
     * =====================================================
     * STEP 16:
     * Execute SQL Query
     * =====================================================
     */

    const [properties] =
        await pool.query(sql, values)

    /**
     * =====================================================
     * STEP 16b:
     * Generic Category "Near" Filter
     * =====================================================
     *
     * For category searches ("near hospital", "near school")
     * there's no single anchor point to run through SQL, so
     * each candidate property's own coordinates are checked
     * against Google Places Nearby Search instead.
     */

    if (!categoryType) {

        // A specific named landmark ("near UIU") resolves to one
        // geocoded point — surface it too so the frontend can plot
        // and highlight it, same as a category match below.

        const nearbyPlaces =
            nearbyCoordinates
                ? [{
                    id: mergedContext.nearPlace,
                    name:
                        nearbyCoordinates.name
                        ||
                        mergedContext.nearPlace,
                    latitude: nearbyCoordinates.latitude,
                    longitude: nearbyCoordinates.longitude,
                    category: "landmark",
                }]
                : []

        return {
            properties,
            nearbyPlaces,
            categoryType: null,
        }
    }

    const nearbyPlacesById =
        new Map()

    const withNearbyCategory =
        await Promise.all(
            properties.map(async (property) => {

                if (
                    !property.latitude
                    ||
                    !property.longitude
                ) {

                    return null
                }

                const {
                    found,
                    places,
                } = await hasNearbyPlace(
                        property.latitude,
                        property.longitude,
                        categoryType
                    )

                // Google returns up to 20 results per property; keep
                // only the closest few per property so the map stays
                // a useful highlight instead of a wall of pins.

                places.slice(0, 6).forEach((place) => {

                    if (
                        place.place_id
                        &&
                        !nearbyPlacesById.has(place.place_id)
                    ) {

                        nearbyPlacesById.set(
                            place.place_id,
                            {
                                id: place.place_id,
                                name: place.name,
                                latitude:
                                    place.geometry.location.lat,
                                longitude:
                                    place.geometry.location.lng,
                                category: categoryType,
                            }
                        )
                    }
                })

                return found ? property : null
            })
        )

    /**
     * =====================================================
     * STEP 17:
     * Return Results
     * =====================================================
     *
     * Alongside the matching properties, also return the actual
     * nearby places (e.g. the specific schools/hospitals found)
     * so the frontend can highlight them on the map.
     */

    return {
        properties: withNearbyCategory.filter(Boolean),
        nearbyPlaces: Array.from(nearbyPlacesById.values()).slice(0, 40),
        categoryType,
    }
}

module.exports = {
    searchPropertiesService,
}