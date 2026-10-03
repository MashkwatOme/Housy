const { getPool } = require("../config/db")

async function filterPropertiesService(filters = {}) {
    console.log("filterPropertiesService filters received:", filters)
    const pool = getPool()

    const {
        search,
        minPrice,
        maxPrice,
        propertyTypes,
        bedrooms,
        bathrooms,
        amenities,
        availableFrom,
        sortBy
    } = filters

    let sql = `
        SELECT p.*,
               (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image
        FROM properties p
    `

    const values = []
    const whereConditions = ["p.visibility_status = 'active'"]

    // Amenities filtering
    let parsedAmenities = []
    if (amenities) {
        if (Array.isArray(amenities)) {
            parsedAmenities = amenities
        } else if (typeof amenities === 'string' && amenities.trim() !== '') {
            try {
                parsedAmenities = JSON.parse(amenities)
            } catch (e) {
                parsedAmenities = amenities.split(',').map(s => s.trim()).filter(Boolean)
            }
        }
    }

    if (parsedAmenities.length > 0) {
        sql += `
            INNER JOIN property_amenities pa ON p.id = pa.property_id
            INNER JOIN amenities a ON pa.amenity_id = a.id
        `
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (isUuid.test(parsedAmenities[0])) {
            whereConditions.push(`pa.amenity_id IN (?)`)
        } else {
            whereConditions.push(`a.name IN (?)`)
        }
        values.push(parsedAmenities)
    }

    if (search && search.trim() !== '') {
        whereConditions.push(`(p.title LIKE ? OR p.description LIKE ? OR p.area LIKE ? OR p.district LIKE ? OR p.address LIKE ?)`)
        const searchVal = `%${search.trim()}%`
        values.push(searchVal, searchVal, searchVal, searchVal, searchVal)
    }

    if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
        whereConditions.push(`p.monthly_rent >= ?`)
        values.push(Number(minPrice))
    }

    if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
        whereConditions.push(`p.monthly_rent <= ?`)
        values.push(Number(maxPrice))
    }

    if (propertyTypes) {
        let typesList = []
        if (Array.isArray(propertyTypes)) {
            typesList = propertyTypes
        } else if (typeof propertyTypes === 'string' && propertyTypes.trim() !== '') {
            try {
                typesList = JSON.parse(propertyTypes)
            } catch (e) {
                typesList = propertyTypes.split(',').map(s => s.trim()).filter(Boolean)
            }
        }
        if (typesList.length > 0) {
            whereConditions.push(`p.property_type IN (?)`)
            values.push(typesList)
        }
    }

    // Room filters use exact matching for 1, 2 and 3. The separate 3+
    // option intentionally means more than 3, so it does not overlap with 3.
    const addRoomFilter = (selectedValue, columnName) => {
        if (!selectedValue || selectedValue === 'Any') return

        if (selectedValue === '3+') {
            whereConditions.push(`${columnName} > ?`)
            values.push(3)
            return
        }

        if (['1', '2', '3'].includes(String(selectedValue))) {
            whereConditions.push(`${columnName} = ?`)
            values.push(Number(selectedValue))
        }
    }

    addRoomFilter(bedrooms, 'p.total_bedrooms')
    addRoomFilter(bathrooms, 'p.total_bathrooms')

    if (availableFrom && availableFrom !== '') {
        whereConditions.push(`p.available_from >= ?`)
        values.push(availableFrom)
    }

    if (whereConditions.length > 0) {
        sql += ` WHERE ` + whereConditions.join(' AND ')
    }

    if (parsedAmenities.length > 0) {
        sql += ` GROUP BY p.id HAVING COUNT(DISTINCT pa.amenity_id) = ? `
        values.push(parsedAmenities.length)
    }

    // Apply sorting
    if (sortBy === 'Price (Low to High)') {
        sql += ` ORDER BY p.monthly_rent ASC `
    } else if (sortBy === 'Price (High to Low)') {
        sql += ` ORDER BY p.monthly_rent DESC `
    } else {
        sql += ` ORDER BY p.created_at DESC `
    }

    console.log("SQL executed:", sql)
    console.log("SQL values:", values)
    const [properties] = await pool.query(sql, values)
    console.log("Returned properties count:", properties.length)
    return properties
}

async function getAmenitiesService() {
    const pool = getPool()
    const [amenities] = await pool.query("SELECT id, name FROM amenities")
    return amenities
}

module.exports = {
    filterPropertiesService,
    getAmenitiesService
}
