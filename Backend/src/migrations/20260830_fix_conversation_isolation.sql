-- Run this once on an existing Housy database.
-- It prevents duplicate threads for the same property/tenant/owner combination.
ALTER TABLE conversations
    ADD CONSTRAINT uq_conversation_participants
    UNIQUE (property_id, tenant_id, owner_id);
