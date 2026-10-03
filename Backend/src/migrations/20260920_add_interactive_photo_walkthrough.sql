-- Use this migration only for an older Housy database whose property_images
-- table does not already contain these three walkthrough columns.
-- The supplied housy(3).sql already includes them, so no migration is needed
-- when that complete database file is imported.

ALTER TABLE property_images
    ADD COLUMN location_name VARCHAR(100) NULL AFTER image_url,
    ADD COLUMN tour_order INT NULL AFTER location_name,
    ADD COLUMN is_tour_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER tour_order;

CREATE INDEX idx_property_images_walkthrough
    ON property_images (property_id, is_tour_enabled, tour_order);
