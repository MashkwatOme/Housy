-- Run this once on an existing Housy database.
-- Existing property photos and image records are not changed.

CREATE TABLE IF NOT EXISTS property_video_walkthroughs (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    property_id CHAR(36) NOT NULL,
    video_url TEXT NOT NULL,
    public_id VARCHAR(255) DEFAULT NULL,
    duration_seconds DECIMAL(10,2) DEFAULT NULL,
    markers LONGTEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_property_video_walkthrough (property_id),
    CONSTRAINT property_video_walkthroughs_ibfk_1 FOREIGN KEY (property_id)
        REFERENCES properties (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
