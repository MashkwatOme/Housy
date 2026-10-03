-- Run once on an existing Housy database.
ALTER TABLE schedules
    ADD COLUMN tenant_status_read TINYINT(1) NOT NULL DEFAULT 1 AFTER status;

CREATE INDEX idx_schedules_tenant_unread
    ON schedules (tenant_id, tenant_status_read, status);
