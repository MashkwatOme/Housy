import React, {
    useMemo,
    useCallback,
    useState,
    useEffect
} from "react"

import {
    GoogleMap,
    useJsApiLoader,
    Marker
} from "@react-google-maps/api"

const containerStyle = {
    width: "100%",
    height: "100%",
}

// Default fallback center

const defaultCenter = {
    lat: 23.8103,
    lng: 90.4125,
}

// Emoji + label shown for each nearby-place category the AI search
// can highlight (kept in sync with Backend/src/utils/nearbyCategorySearch.js)

const CATEGORY_INFO = {
    hospital: { emoji: "🏥", label: "Hospital" },
    school: { emoji: "🏫", label: "School" },
    university: { emoji: "🎓", label: "University / College" },
    supermarket: { emoji: "🛒", label: "Market" },
    place_of_worship: { emoji: "🛐", label: "Place of Worship" },
    restaurant: { emoji: "🍽️", label: "Restaurant" },
    pharmacy: { emoji: "💊", label: "Pharmacy" },
    bank: { emoji: "🏦", label: "Bank" },
    atm: { emoji: "🏧", label: "ATM" },
    park: { emoji: "🌳", label: "Park" },
    gym: { emoji: "🏋️", label: "Gym" },
    bus_station: { emoji: "🚌", label: "Bus Stand" },
    train_station: { emoji: "🚆", label: "Train Station" },
    airport: { emoji: "✈️", label: "Airport" },
    landmark: { emoji: "📍", label: "Landmark" },
}

const getCategoryInfo = (category) =>
    CATEGORY_INFO[category] || { emoji: "📍", label: "Nearby Place" }

// Builds a clean "home" pin for a property marker — a rounded pill
// with a house emoji plus the price (or index, when there are many
// results) rendered directly into the icon.

const buildPropertyIcon = (labelText, isHovered) => {

    const background =
        isHovered ? "#1F3B66" : "#FFFFFF"

    const textColor =
        isHovered ? "#FFFFFF" : "#1F3B66"

    const width =
        36 + labelText.length * 9

    const height = 36

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
            <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="${height / 2}"
                fill="${background}" stroke="#1F3B66" stroke-width="2" />
            <text x="19" y="24" font-size="18" text-anchor="middle" font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">🏠</text>
            <text x="34" y="23" font-size="13" font-weight="700" fill="${textColor}"
                font-family="Arial, Helvetica, sans-serif">${labelText}</text>
        </svg>
    `

    return {
        url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(svg),
        scaledSize: new window.google.maps.Size(width, height),
        anchor: new window.google.maps.Point(height / 2, height / 2),
    }
}

// Builds a small badge icon for a highlighted nearby place
// (school/hospital/etc.) using its category emoji.

const buildNearbyPlaceIcon = (category) => {

    const { emoji } = getCategoryInfo(category)

    const size = 30

    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
            <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 1}"
                fill="#FFFFFF" stroke="#D97706" stroke-width="2" />
            <text x="${size / 2}" y="${size / 2 + 5}" font-size="15" text-anchor="middle"
                font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${emoji}</text>
        </svg>
    `

    return {
        url:
            "data:image/svg+xml;charset=UTF-8," +
            encodeURIComponent(svg),
        scaledSize: new window.google.maps.Size(size, size),
        anchor: new window.google.maps.Point(size / 2, size / 2),
    }
}

// Clean Real Estate Style Map
// Keeps POIs visible
// while matching website theme

const mapStyles = [

    // Water

    {
        featureType: "water",
        elementType: "geometry",
        stylers: [
            {
                color: "#DCE3EE",
            },
        ],
    },

    // Background

    {
        featureType: "landscape",
        elementType: "geometry",
        stylers: [
            {
                color: "#F9FBFC",
            },
        ],
    },

    // Roads

    {
        featureType: "road",
        elementType: "geometry.fill",
        stylers: [
            {
                color: "#FFFFFF",
            },
        ],
    },

    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [
            {
                color: "#E5E7EB",
            },
            {
                weight: 1,
            },
        ],
    },

    // POI Geometry

    {
        featureType: "poi",
        elementType: "geometry",
        stylers: [
            {
                color: "#F3F4F6",
            },
        ],
    },

    // Business Labels

    {
        featureType: "poi.business",
        stylers: [
            {
                visibility: "on",
            },
        ],
    },

    // Hospital Labels

    {
        featureType: "poi.medical",
        stylers: [
            {
                visibility: "on",
            },
        ],
    },

    // School Labels

    {
        featureType: "poi.school",
        stylers: [
            {
                visibility: "on",
            },
        ],
    },

    // Text Color

    {
        elementType: "labels.text.fill",
        stylers: [
            {
                color: "#6B7280",
            },
        ],
    },

    // Text Outline

    {
        elementType: "labels.text.stroke",
        stylers: [
            {
                color: "#FFFFFF",
            },
            {
                weight: 2,
            },
        ],
    },

    // Administrative Borders

    {
        featureType: "administrative",
        elementType: "geometry.stroke",
        stylers: [
            {
                color: "#E5E7EB",
            },
        ],
    },
]

// Map options

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    styles: mapStyles,
}

const SearchMap = ({
    properties = [],
    nearbyPlaces = [],
    hoveredPropertyId,
}) => {

    const [map, setMap] =
        useState(null)

    // Load Google Maps Script

    const { isLoaded } =
        useJsApiLoader({
            id: "google-map-script",
            googleMapsApiKey:
                import.meta.env
                    .VITE_GOOGLE_MAPS_API_KEY || "",
        })

    // On Load

    const onLoad =
        useCallback((mapInstance) => {

            setMap(mapInstance)

        }, [])

    // On Unmount

    const onUnmount =
        useCallback(() => {

            setMap(null)

        }, [])

    // Dynamic Center

    const center = useMemo(() => {

        if (
            properties &&
            properties.length > 0
        ) {

            return {
                lat: Number(
                    properties[0].latitude
                ),
                lng: Number(
                    properties[0].longitude
                ),
            }
        }

        return defaultCenter

    }, [properties])

    // Fit Bounds

    useEffect(() => {

        const hasProperties =
            properties && properties.length > 0

        const hasNearbyPlaces =
            nearbyPlaces && nearbyPlaces.length > 0

        if (
            map &&
            (hasProperties || hasNearbyPlaces)
        ) {

            const bounds =
                new window.google.maps
                    .LatLngBounds()

            properties.forEach(
                (property) => {

                    if (
                        property.latitude &&
                        property.longitude
                    ) {

                        bounds.extend({
                            lat: Number(
                                property.latitude
                            ),
                            lng: Number(
                                property.longitude
                            ),
                        })
                    }
                }
            )

            nearbyPlaces.forEach(
                (place) => {

                    if (
                        place.latitude &&
                        place.longitude
                    ) {

                        bounds.extend({
                            lat: Number(place.latitude),
                            lng: Number(place.longitude),
                        })
                    }
                }
            )

            map.fitBounds(bounds)
        }

    }, [map, properties, nearbyPlaces])

    // Loading State

    if (!isLoaded) {

        return (
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "100%",
                    fontWeight: "600",
                }}
            >
                Loading Map...
            </div>
        )
    }

    return (

        <div style={{ position: "relative", width: "100%", height: "100%" }}>

        <GoogleMap
            mapContainerStyle={
                containerStyle
            }
            center={center}
            zoom={13}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={mapOptions}
        >

            {properties.map(
                (property, index) => {

                    // Skip invalid coords

                    if (
                        isNaN(
                            Number(
                                property.latitude
                            )
                        ) ||
                        isNaN(
                            Number(
                                property.longitude
                            )
                        )
                    ) {

                        return null
                    }

                    const isHovered =
                        hoveredPropertyId === property.id

                    const labelText =
                        properties.length > 1
                            ? String(index + 1)
                            : `৳${Number(
                                  property.price || 0
                              ).toLocaleString()}`

                    return (

                        <Marker
                            key={property.id}

                            title={property.title}

                            position={{
                                lat: Number(
                                    property.latitude
                                ),
                                lng: Number(
                                    property.longitude
                                ),
                            }}

                            icon={buildPropertyIcon(
                                labelText,
                                isHovered
                            )}

                            zIndex={
                                isHovered ? 100 : 1
                            }
                        />
                    )
                }
            )}

            {nearbyPlaces.map((place, index) => {

                if (
                    isNaN(Number(place.latitude)) ||
                    isNaN(Number(place.longitude))
                ) {

                    return null
                }

                return (

                    <Marker
                        key={
                            place.id ||
                            `${place.category}-${index}`
                        }

                        title={
                            `${getCategoryInfo(place.category).emoji} ${place.name}`
                        }

                        position={{
                            lat: Number(place.latitude),
                            lng: Number(place.longitude),
                        }}

                        icon={buildNearbyPlaceIcon(
                            place.category
                        )}

                        zIndex={5}
                    />
                )
            })}

        </GoogleMap>

        {nearbyPlaces.length > 0 && (

            <div
                style={{
                    position: "absolute",
                    top: "12px",
                    left: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 14px",
                    borderRadius: "999px",
                    backgroundColor: "white",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1F3B66",
                }}
            >
                <span style={{ fontSize: "16px" }}>
                    {
                        getCategoryInfo(
                            nearbyPlaces[0].category
                        ).emoji
                    }
                </span>

                Highlighting nearby{" "}
                {
                    getCategoryInfo(
                        nearbyPlaces[0].category
                    ).label
                }
                {nearbyPlaces.length > 1 ? "s" : ""}
            </div>
        )}

        </div>
    )
}

export default React.memo(SearchMap)