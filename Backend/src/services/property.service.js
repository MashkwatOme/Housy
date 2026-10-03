const { v4: uuidv4 } = require("uuid")
const cloudinary = require("../config/cloudinary")
const {getPool} = require("../config/db")

function parseTourConfig(value) {
    if (!value) return null

    let parsed
    try {
        parsed = typeof value === "string" ? JSON.parse(value) : value
    } catch {
        const error = new Error("Invalid photo walkthrough configuration.")
        error.statusCode = 400
        throw error
    }

    if (!Array.isArray(parsed)) {
        const error = new Error("Photo walkthrough configuration must be an array.")
        error.statusCode = 400
        throw error
    }

    const enabled = parsed.filter(item => item && item.enabled)
    if (enabled.length < 2) {
        const error = new Error("An interactive photo walkthrough requires at least two photos.")
        error.statusCode = 400
        throw error
    }

    enabled.forEach((item, index) => {
        if (!String(item.location_name || "").trim()) {
            const error = new Error(`Location name is required for walkthrough photo ${index + 1}.`)
            error.statusCode = 400
            throw error
        }
    })

    return parsed
}

function parseWalkthroughMarkers(value, requireMinimum = false) {
    if (!value) return []

    let parsed
    try {
        parsed = typeof value === "string" ? JSON.parse(value) : value
    } catch {
        const error = new Error("Invalid walkthrough markers.")
        error.statusCode = 400
        throw error
    }

    if (!Array.isArray(parsed)) {
        const error = new Error("Walkthrough markers must be an array.")
        error.statusCode = 400
        throw error
    }

    const markers = parsed.map((item, index) => ({
        label: String(item?.label || "").trim().slice(0, 100),
        time_seconds: Number(item?.time_seconds),
    })).sort((a, b) => a.time_seconds - b.time_seconds)

    if (requireMinimum && markers.length < 2) {
        const error = new Error("A video walkthrough requires at least two room markers.")
        error.statusCode = 400
        throw error
    }

    markers.forEach((item, index) => {
        if (!item.label || !Number.isFinite(item.time_seconds) || item.time_seconds < 0) {
            const error = new Error(`A valid room name and video time are required for marker ${index + 1}.`)
            error.statusCode = 400
            throw error
        }
    })

    return markers
}

function uploadToCloudinary(file, options) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(options, (err, result) => {
            if (err) reject(err)
            else resolve(result)
        }).end(file.buffer)
    })
}

async function createPropertyService(ownerId, body, uploadedFiles) {

    const pool = getPool()

    const {
        title,
        description,
        property_type,
        listing_type,
        total_units,
        monthly_rent,
        expected_security_deposit,
        total_bedrooms,
        total_bathrooms,
        property_size_sqft,
        division,
        district,
        area,
        address,
        latitude,
        longitude,
        available_from,
        amenities,
        tour_config,
        walkthrough_markers,
    } = body
    const imageFiles = uploadedFiles?.property_images || []
    const walkthroughVideo = uploadedFiles?.walkthrough_video?.[0] || null
    const parsedTourConfig = parseTourConfig(tour_config)
    const parsedMarkers = parseWalkthroughMarkers(walkthrough_markers, Boolean(walkthroughVideo))

    if (!title || !property_type || !monthly_rent) {
        const error = new Error("Required fields missing.")
        error.statusCode = 400
        throw error
    }

    // ─────────────────────────────────────────────
    // Insert property
    // ─────────────────────────────────────────────
const propertyId = uuidv4()

const [propertyResult] = await pool.query(
    `
    INSERT INTO properties (
        id,
        owner_id,
        title,
        description,
        property_type,
        listing_type,
        total_units,
        monthly_rent,
        expected_security_deposit,
        total_bedrooms,
        total_bathrooms,
        property_size_sqft,
        division,
        district,
        area,
        address,
        latitude,
        longitude,
        available_from
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
        propertyId,
        ownerId,
        title,
        description,
        property_type,
        listing_type || "full_property",
        total_units || 1,
        monthly_rent,
        expected_security_deposit || 0,
        total_bedrooms || 0,
        total_bathrooms || 0,
        property_size_sqft || null,
        division,
        district,
        area,
        address,
        latitude,
        longitude,
        available_from,
    ]
)

    // ─────────────────────────────────────────────
    // Upload images
    // ─────────────────────────────────────────────

    if (imageFiles.length > 0) {
        for (const [fileIndex, file] of imageFiles.entries()) {
            const uploaded = await uploadToCloudinary(file, { folder: "easyrentbd/properties" })
            const tourItem = parsedTourConfig?.find(item =>
                item.enabled && item.source === "new" && Number(item.file_index) === fileIndex
            )

            await pool.query(
                `
                INSERT INTO property_images
                    (property_id, image_url, location_name, tour_order, is_tour_enabled)
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    propertyId,
                    uploaded.secure_url,
                    tourItem ? String(tourItem.location_name).trim().slice(0, 100) : null,
                    tourItem ? Number(tourItem.tour_order) : null,
                    tourItem ? 1 : 0
                ]
            )
        }
    }

    if (walkthroughVideo) {
        const uploaded = await uploadToCloudinary(walkthroughVideo, {
            resource_type: "video",
            folder: "easyrentbd/property-walkthroughs",
        })
        await pool.query(
            `INSERT INTO property_video_walkthroughs
             (id, property_id, video_url, public_id, duration_seconds, markers)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [uuidv4(), propertyId, uploaded.secure_url, uploaded.public_id, uploaded.duration || null, JSON.stringify(parsedMarkers)]
        )
    }

    // ─────────────────────────────────────────────
    // Amenities
    // ─────────────────────────────────────────────

    if (amenities) {

        const parsedAmenities =
            typeof amenities === "string"
                ? JSON.parse(amenities)
                : amenities

        for (const amenityId of parsedAmenities) {

            await pool.query(
                `
                INSERT INTO property_amenities (
                    property_id,
                    amenity_id
                )
                VALUES (?, ?)
                `,
                [propertyId, amenityId]
            )
        }
    }

    return {
        id: propertyId,
        title,
    }
}

async function getAllPropertiesService() {

    const pool = getPool()

    const [properties] = await pool.query(
        `
        SELECT p.*,
               (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image
        FROM properties p
        WHERE p.visibility_status = 'active'
        ORDER BY p.created_at DESC
        `
    )

    return properties
}

async function getPropertyByIdService(propertyId, user = null) {

    const pool = getPool()

    const [properties] = await pool.query(
        `
        SELECT p.*, u.name AS owner_name
        FROM properties p
        INNER JOIN users u ON p.owner_id = u.id
        WHERE p.id = ?
        `,
        [propertyId]
    )

    if (properties.length === 0) {
        const error = new Error("Property not found.")
        error.statusCode = 404
        throw error
    }

    const property = properties[0]

    const [images] = await pool.query(
        `
        SELECT id, image_url, location_name, tour_order, is_tour_enabled
        FROM property_images
        WHERE property_id = ?
        ORDER BY COALESCE(tour_order, 2147483647), created_at ASC
        `,
        [propertyId]
    )

    const [amenities] = await pool.query(
        `
        SELECT a.id, a.name
        FROM amenities a
        INNER JOIN property_amenities pa
        ON a.id = pa.amenity_id
        WHERE pa.property_id = ?
        `,
        [propertyId]
    )

    property.images = images
    property.amenities = amenities

    const [walkthroughs] = await pool.query(
        `SELECT id, video_url, duration_seconds, markers
         FROM property_video_walkthroughs
         WHERE property_id = ? LIMIT 1`,
        [propertyId]
    )
    property.walkthrough = walkthroughs.length ? {
        ...walkthroughs[0],
        markers: parseWalkthroughMarkers(walkthroughs[0].markers),
    } : null

    // Check if there is an active signed agreement for the property
    const [agreements] = await pool.query(
        `
        SELECT ad.id AS agreement_id, ad.agreement_start_date, ad.agreement_end_date,
               u.name AS tenant_name, u.email AS tenant_email, u.phone AS tenant_phone,
               u.nid_front_url, u.nid_back_url
        FROM agreement_drafts ad
        INNER JOIN users u ON ad.tenant_id = u.id
        WHERE ad.property_id = ? AND ad.status = 'signed'
        ORDER BY ad.created_at DESC
        LIMIT 1
        `,
        [propertyId]
    )

    property.is_occupied = agreements.length > 0

    if (property.is_occupied) {
        const isOwner = user && (user.id === property.owner_id || user.role === "admin")
        if (isOwner) {
            property.tenant_details = {
                name: agreements[0].tenant_name,
                email: agreements[0].tenant_email,
                phone: agreements[0].tenant_phone,
                nid_front_url: agreements[0].nid_front_url,
                nid_back_url: agreements[0].nid_back_url,
            }
            property.agreement_id = agreements[0].agreement_id
            property.agreement_start_date = agreements[0].agreement_start_date
            property.agreement_end_date = agreements[0].agreement_end_date
        }
    }

    return property
}

async function getOwnerPropertiesService(ownerId) {

    const pool = getPool()

    const [properties] = await pool.query(
        `
        SELECT p.*,
               (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) as cover_image
        FROM properties p
        WHERE p.owner_id = ?
        ORDER BY p.created_at DESC
        `,
        [ownerId]
    )

    return properties
}

async function editPropertyService(ownerId, propertyId, body, uploadedFiles) {
    const pool = getPool()

    // 1. Verify existence and ownership
    const [properties] = await pool.query(
        "SELECT * FROM properties WHERE id = ?",
        [propertyId]
    )

    if (properties.length === 0) {
        const error = new Error("Property not found.")
        error.statusCode = 404
        throw error
    }

    if (properties[0].owner_id !== ownerId) {
        const error = new Error("You are not authorized to edit this property.")
        error.statusCode = 403
        throw error
    }

    const {
        title,
        description,
        property_type,
        listing_type,
        total_units,
        monthly_rent,
        expected_security_deposit,
        total_bedrooms,
        total_bathrooms,
        property_size_sqft,
        division,
        district,
        area,
        address,
        latitude,
        longitude,
        available_from,
        amenities,
        removed_images,
        tour_config,
        walkthrough_markers,
        remove_walkthrough_video,
    } = body
    const imageFiles = uploadedFiles?.property_images || []
    const walkthroughVideo = uploadedFiles?.walkthrough_video?.[0] || null
    const parsedTourConfig = parseTourConfig(tour_config)
    const parsedMarkers = walkthrough_markers !== undefined
        ? parseWalkthroughMarkers(walkthrough_markers, Boolean(walkthroughVideo))
        : null

    // 2. Update properties table
    await pool.query(
        `
        UPDATE properties
        SET 
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            property_type = COALESCE(?, property_type),
            listing_type = COALESCE(?, listing_type),
            total_units = COALESCE(?, total_units),
            monthly_rent = COALESCE(?, monthly_rent),
            expected_security_deposit = COALESCE(?, expected_security_deposit),
            total_bedrooms = COALESCE(?, total_bedrooms),
            total_bathrooms = COALESCE(?, total_bathrooms),
            property_size_sqft = ?,
            division = COALESCE(?, division),
            district = COALESCE(?, district),
            area = COALESCE(?, area),
            address = COALESCE(?, address),
            latitude = ?,
            longitude = ?,
            available_from = ?
        WHERE id = ?
        `,
        [
            title || null,
            description || null,
            property_type || null,
            listing_type || null,
            total_units !== undefined ? total_units : null,
            monthly_rent || null,
            expected_security_deposit !== undefined ? expected_security_deposit : null,
            total_bedrooms !== undefined ? total_bedrooms : null,
            total_bathrooms !== undefined ? total_bathrooms : null,
            property_size_sqft !== undefined ? property_size_sqft : null,
            division || null,
            district || null,
            area || null,
            address || null,
            latitude !== undefined ? latitude : null,
            longitude !== undefined ? longitude : null,
            available_from || null,
            propertyId
        ]
    )

    // 3. Handle removed images
    if (removed_images) {
        const parsedRemoved = typeof removed_images === 'string' ? JSON.parse(removed_images) : removed_images
        if (Array.isArray(parsedRemoved) && parsedRemoved.length > 0) {
            await pool.query(
                "DELETE FROM property_images WHERE property_id = ? AND image_url IN (?)",
                [propertyId, parsedRemoved]
            )
        }
    }

    // 4. Handle new image uploads
    const newImageIds = []
    if (imageFiles.length > 0) {
        for (const [fileIndex, file] of imageFiles.entries()) {
            const uploaded = await uploadToCloudinary(file, { folder: "easyrentbd/properties" })
            const tourItem = parsedTourConfig?.find(item =>
                item.enabled && item.source === "new" && Number(item.file_index) === fileIndex
            )
            const imageId = uuidv4()
            newImageIds.push(imageId)

            await pool.query(
                `
                INSERT INTO property_images
                    (id, property_id, image_url, location_name, tour_order, is_tour_enabled)
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    imageId,
                    propertyId,
                    uploaded.secure_url,
                    tourItem ? String(tourItem.location_name).trim().slice(0, 100) : null,
                    tourItem ? Number(tourItem.tour_order) : null,
                    tourItem ? 1 : 0
                ]
            )
        }
    }

    if (parsedTourConfig) {
        await pool.query(
            `UPDATE property_images
             SET location_name = NULL, tour_order = NULL, is_tour_enabled = 0
             WHERE property_id = ?`,
            [propertyId]
        )

        for (const item of parsedTourConfig.filter(config => config.enabled)) {
            const imageId = item.source === "existing"
                ? item.image_id
                : newImageIds[Number(item.file_index)]

            if (!imageId) continue

            await pool.query(
                `UPDATE property_images
                 SET location_name = ?, tour_order = ?, is_tour_enabled = 1
                 WHERE id = ? AND property_id = ?`,
                [
                    String(item.location_name).trim().slice(0, 100),
                    Number(item.tour_order),
                    imageId,
                    propertyId
                ]
            )
        }
    }

    const [existingWalkthroughs] = await pool.query(
        "SELECT public_id FROM property_video_walkthroughs WHERE property_id = ? LIMIT 1",
        [propertyId]
    )
    const existingWalkthrough = existingWalkthroughs[0]

    if (remove_walkthrough_video === "true") {
        await pool.query("DELETE FROM property_video_walkthroughs WHERE property_id = ?", [propertyId])
        if (existingWalkthrough?.public_id) {
            cloudinary.uploader.destroy(existingWalkthrough.public_id, { resource_type: "video" }).catch(() => {})
        }
    } else if (walkthroughVideo) {
        const uploaded = await uploadToCloudinary(walkthroughVideo, {
            resource_type: "video",
            folder: "easyrentbd/property-walkthroughs",
        })
        await pool.query(
            `INSERT INTO property_video_walkthroughs
             (id, property_id, video_url, public_id, duration_seconds, markers)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE video_url = VALUES(video_url), public_id = VALUES(public_id),
             duration_seconds = VALUES(duration_seconds), markers = VALUES(markers)`,
            [uuidv4(), propertyId, uploaded.secure_url, uploaded.public_id, uploaded.duration || null, JSON.stringify(parsedMarkers)]
        )
        if (existingWalkthrough?.public_id && existingWalkthrough.public_id !== uploaded.public_id) {
            cloudinary.uploader.destroy(existingWalkthrough.public_id, { resource_type: "video" }).catch(() => {})
        }
    } else if (parsedMarkers) {
        await pool.query(
            "UPDATE property_video_walkthroughs SET markers = ? WHERE property_id = ?",
            [JSON.stringify(parsedMarkers), propertyId]
        )
    }

    // 5. Handle amenities
    if (amenities !== undefined) {
        const parsedAmenities = typeof amenities === "string" ? JSON.parse(amenities) : amenities
        
        // Remove existing relations
        await pool.query(
            "DELETE FROM property_amenities WHERE property_id = ?",
            [propertyId]
        )

        // Insert new relations
        if (Array.isArray(parsedAmenities)) {
            for (const amenityId of parsedAmenities) {
                await pool.query(
                    `
                    INSERT INTO property_amenities (
                        property_id,
                        amenity_id
                    )
                    VALUES (?, ?)
                    `,
                    [propertyId, amenityId]
                )
            }
        }
    }

    return {
        id: propertyId,
        title: title || properties[0].title
    }
}

async function deletePropertyService(ownerId, propertyId) {
    const pool = getPool()

    // 1. Verify existence and ownership
    const [properties] = await pool.query(
        "SELECT * FROM properties WHERE id = ?",
        [propertyId]
    )

    if (properties.length === 0) {
        const error = new Error("Property not found.")
        error.statusCode = 404
        throw error
    }

    if (properties[0].owner_id !== ownerId) {
        const error = new Error("You are not authorized to delete this property.")
        error.statusCode = 403
        throw error
    }

    // 2. Delete property (will cascade delete related images, amenities, stay requests, schedules, etc.)
    await pool.query(
        "DELETE FROM properties WHERE id = ?",
        [propertyId]
    )

    return { id: propertyId }
}

module.exports = {
    createPropertyService,
    getAllPropertiesService,
    getPropertyByIdService,
    getOwnerPropertiesService,
    editPropertyService,
    deletePropertyService,
}
