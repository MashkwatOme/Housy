-- Run once on an existing Housy database.
ALTER TABLE agreement_drafts
    ADD COLUMN agreement_pdf_url TEXT NULL AFTER owner_signed_at;
