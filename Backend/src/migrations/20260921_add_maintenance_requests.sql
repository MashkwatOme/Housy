-- Run once on an existing Housy database.
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    owner_id CHAR(36) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Low',
    description TEXT NOT NULL,
    status ENUM('pending', 'in_progress', 'resolved', 'cancelled') NOT NULL DEFAULT 'pending',
    owner_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_maintenance_requests_owner_unread
    ON maintenance_requests (owner_id, owner_read);
