const {
    getPlaceCategoryType,
    findCategoryWord,
} = require("./nearbyCategorySearch")

// Small edit distance so common transliteration spelling variants
// (e.g. "Bashundhara" vs the DB's "Basundhara") still match.

function levenshteinDistance(a, b) {

    const rows = a.length + 1
    const cols = b.length + 1

    const dp =
        Array.from(
            { length: rows },
            (_, i) => new Array(cols).fill(0)
        )

    for (let i = 0; i < rows; i++) dp[i][0] = i
    for (let j = 0; j < cols; j++) dp[0][j] = j

    for (let i = 1; i < rows; i++) {

        for (let j = 1; j < cols; j++) {

            dp[i][j] =
                a[i - 1] === b[j - 1]
                    ? dp[i - 1][j - 1]
                    : 1 + Math.min(
                        dp[i - 1][j],
                        dp[i][j - 1],
                        dp[i - 1][j - 1]
                    )
        }
    }

    return dp[rows - 1][cols - 1]
}

// Only the first (most distinctive) word of a location value is
// fuzzy-matched — generic descriptor words like "residential" or
// "area" are skipped to avoid false positives.

function fuzzyLocationWordMatch(word, queryWords) {

    if (word.length < 5) return false

    const maxDistance =
        word.length <= 7 ? 1 : 2

    return queryWords.some(
        (queryWord) =>
            levenshteinDistance(word, queryWord) <= maxDistance
    )
}

function parseSearchQuery(query, availableLocations) {

    const parsed = {
        bedrooms: null,
        bathrooms: null,
        maxRent: null,
        location: null,
        locationPhrase: null,
        propertyType: null,
        amenities: [],
        nearPlace: null,
    }

    const lower =
        query.toLowerCase()

    // ─────────────────────────────
    // Bedrooms
    // ─────────────────────────────

    const bedroomMatch =
        lower.match(/(\d+)\s*bed/)

    if (bedroomMatch) {

        parsed.bedrooms =
            parseInt(bedroomMatch[1])
    }

    // ─────────────────────────────
    // Bathrooms
    // ─────────────────────────────

    const bathroomMatch =
        lower.match(/(\d+)\s*(?:bath|washroom)/)

    if (bathroomMatch) {

        parsed.bathrooms =
            parseInt(bathroomMatch[1])
    }

    // ─────────────────────────────
    // Budget
    // ─────────────────────────────

    const budgetMatch =
        lower.match(/under\s*(\d+)k?/)

    if (budgetMatch) {

        let amount =
            parseInt(budgetMatch[1])

        if (lower.includes("k")) {
            amount *= 1000
        }

        parsed.maxRent = amount
    }

    // ─────────────────────────────
    // Property Type
    // ─────────────────────────────

    const propertyTypes = [
        "apartment",
        "house",
        "hostel",
        "commercial",
    ]

    propertyTypes.forEach((type) => {

        if (lower.includes(type)) {

            parsed.propertyType = type
        }
    })

    // ─────────────────────────────
    // Dynamic Location Matching
    // ─────────────────────────────
    //
    // Recognize a location by matching the query text against
    // known area / district / division values already present
    // in the database (not just area, as before). Falls back to
    // a fuzzy match on the first word so spelling variants (e.g.
    // "Bashundhara" vs a DB value stored as "Basundhara") still
    // resolve instead of silently failing to match.

    const queryWords =
        lower.split(/\s+/).filter(Boolean)

    availableLocations.forEach((item) => {

        [item.area, item.district, item.division].forEach((value) => {

            if (!value) return

            const lowerValue =
                value.toLowerCase()

            if (lower.includes(lowerValue)) {

                parsed.location =
                    value

                return
            }

            const firstWord =
                lowerValue.split(/\s+/)[0]

            if (fuzzyLocationWordMatch(firstWord, queryWords)) {

                parsed.location =
                    value
            }
        })
    })

    // ─────────────────────────────
    // Location Phrase Fallback
    // ─────────────────────────────
    //
    // If the user names a place ("in <place>" / "at <place>")
    // that didn't match any known area/district/division above,
    // still capture the raw phrase so the caller can fall back
    // to a free-text LIKE match instead of silently dropping the
    // location constraint entirely.

    if (!parsed.location) {

        const locationPhraseMatch =
            lower.match(
                /\b(?:in|at)\s+([a-zA-Z][a-zA-Z\s]*?)(?:\swith|\sunder|\sfor|$)/
            )

        if (locationPhraseMatch) {

            parsed.locationPhrase =
                locationPhraseMatch[1].trim()
        }
    }

    // ─────────────────────────────
    // Nearby Place Detection
    // ─────────────────────────────

    // Stops at " in " / " at " too, so "near hospitals in bashundhara"
    // captures just "hospitals" instead of "hospitals in bashundhara".

    const nearMatch =
        lower.match(
            /near\s+([a-zA-Z\s]+?)(?:\swith|\sunder|\sin\s|\sat\s|$)/
        )

    if (nearMatch) {

        parsed.nearPlace =
            nearMatch[1].trim()

        // "<category> near <place>" (e.g. "hospitals near bashundhara"):
        // the category comes before "near" and the text after it is
        // really the area to search in, so swap them.

        if (!getPlaceCategoryType(parsed.nearPlace)) {

            const categoryWord =
                findCategoryWord(
                    lower.slice(0, nearMatch.index)
                )

            if (categoryWord) {

                if (!parsed.location && !parsed.locationPhrase) {

                    parsed.locationPhrase =
                        parsed.nearPlace
                }

                parsed.nearPlace =
                    categoryWord
            }
        }
    }

    // ─────────────────────────────
    // Amenities
    // ─────────────────────────────

    const amenities = [
        "parking",
        "wifi",
        "pool",
        "gym",
        "lift",
    ]

    amenities.forEach((amenity) => {

        if (lower.includes(amenity)) {

            parsed.amenities.push(amenity)
        }
    })

    // ─────────────────────────────
    // Bare Place Name Fallback
    // ─────────────────────────────
    //
    // If the query produced no filter at all (e.g. the user just
    // typed "gabtoli"), treat the whole text as a place name so it
    // is matched against area / district / division / address.
    // Without this, no WHERE clause is added and every active
    // property comes back as a "random" result.

    const hasAnyFilter =
        Object.entries(parsed).some(
            ([_, value]) =>
                Array.isArray(value)
                    ? value.length > 0
                    : value !== null
        )

    if (!hasAnyFilter) {

        const barePlace =
            lower
                .replace(/[^\p{L}\p{N}\s-]/gu, " ")
                .replace(/\s+/g, " ")
                .trim()

        // 3+ characters so stray fragments ("a", "in") can't LIKE-match
        // almost every address in the database.

        if (barePlace.length >= 3) {

            parsed.locationPhrase =
                barePlace
        }
    }

    return parsed
}

module.exports = parseSearchQuery