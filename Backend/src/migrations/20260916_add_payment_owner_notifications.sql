-- Run once on an existing Housy database.
ALTER TABLE rent_payments
    ADD COLUMN owner_read TINYINT(1) NOT NULL DEFAULT 1 AFTER status;

CREATE INDEX idx_rent_payments_owner_unread
    ON rent_payments (owner_id, owner_read, status);
