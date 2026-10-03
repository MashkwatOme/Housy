/**
 * @file src/services/agreement.service.js
 * @description Agreement draft business logic
 *              Responsible for:
 *              - Creating agreement drafts
 *              - Fetching drafts
 *              - Updating drafts
 *              - Managing clauses
 * @author Siyam
 */
const { v4: uuidv4 } =
    require("uuid")

const {
    getPool
} = require("../config/db")

const cloudinary =
    require("../config/cloudinary")

const axios =
    require("axios")

const {
    buildAgreementPdfBuffer
} = require("../utils/agreementPdf.util")

const pool =
    getPool()

/**
 * @name createAgreementDraftService
 * @description Auto-generate agreement draft
 *              after stay request approval
 * @param {string} stayRequestId
 * @returns {Object}
 */

async function createAgreementDraftService(
    stayRequestId
) {

    // ─────────────────────────────
    // Fetch Stay Request + Property
    // ─────────────────────────────

    const [[request]] =
        await pool.query(
            `
            SELECT

                sr.*,

                p.monthly_rent,
                p.expected_security_deposit,
                p.listing_type

            FROM stay_requests sr

            JOIN properties p
            ON sr.property_id = p.id

            WHERE sr.id = ?
            `,
            [stayRequestId]
        )

    if (!request) {

        throw new Error(
            "Stay request not found."
        )
    }
    // ─────────────────────────────
    // Get Matching Template
    // ─────────────────────────────

    const [[template]] =
        await pool.query(
            `
            SELECT id

            FROM agreement_templates

            WHERE template_type = ?
            AND is_active = TRUE

            LIMIT 1
            `,
            [request.listing_type]
        )
    if (!template) {

        throw new Error(
            "Agreement template not found."
        )
    }
    // ─────────────────────────────
    // Generate UUID
    // ─────────────────────────────

    const agreementDraftId =
        uuidv4()
    // ─────────────────────────────
    // Create Agreement Draft
    // ─────────────────────────────

    await pool.query(
        `
        INSERT INTO agreement_drafts (
            id,
            stay_request_id,
            property_id,
            tenant_id,
            owner_id,
            template_id,
            agreement_type,
            monthly_rent,
            security_deposit,
            agreement_start_date,
            custom_rules
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [

            agreementDraftId,

            request.id,

            request.property_id,

            request.tenant_id,

            request.owner_id,

            template.id,

            request.listing_type,

            request.monthly_rent,

            request.expected_security_deposit,

            request.move_in_date,

            JSON.stringify([]),
        ]
    )

    // ─────────────────────────────
    // Fetch Default Clauses
    // ─────────────────────────────

    const [clauses] =
        await pool.query(
            `
            SELECT id

            FROM agreement_clauses

            WHERE is_default = TRUE
            `
        )

    // ─────────────────────────────
    // Attach Clauses To Draft
    // ─────────────────────────────

    for (const clause of clauses) {

        await pool.query(
            `
            INSERT INTO agreement_draft_clauses (

                agreement_draft_id,
                clause_id

            )

            VALUES (?, ?)
            `,
            [
                agreementDraftId,
                clause.id,
            ]
        )
    }

    return {

        success: true,

        agreementDraftId,
    }
}
/**
 * @name getAgreementDraftService
 * @description Fetch single agreement draft
 * @param {string} agreementDraftId
 * @returns {Object}
 */

async function getAgreementDraftService(
    agreementDraftId,
    user
) {
    // ─────────────────────────────
    // Fetch Draft
    // ─────────────────────────────

    const [[draft]] =
        await pool.query(
            `
            SELECT 
                ad.id AS id,
                ad.*,
                COALESCE(ad.draft_version, 1) AS draft_version,
                p.title AS property_title,
                p.address AS property_address,
                p.total_bedrooms AS property_bedrooms,
                p.total_bathrooms AS property_bathrooms,
                p.property_type AS property_type,
                p.listing_type AS property_listing_type,
                p.property_size_sqft AS property_size,
                o.name AS owner_name,
                o.email AS owner_email,
                o.phone AS owner_phone,
                t.name AS tenant_name,
                t.email AS tenant_email,
                t.phone AS tenant_phone,
                at.template_name AS template_name
            FROM agreement_drafts ad
            JOIN properties p ON ad.property_id = p.id
            JOIN users o ON ad.owner_id = o.id
            JOIN users t ON ad.tenant_id = t.id
            LEFT JOIN agreement_templates at ON ad.template_id = at.id
            WHERE ad.id = ?
            `,
            [agreementDraftId]
        )

    if (!draft) {

        throw new Error(
            "Agreement draft not found."
        )
    }

    if (
        user.id !== draft.tenant_id &&
        user.id !== draft.owner_id &&
        user.role !== "admin"
    ) {
        const error = new Error("Unauthorized access.")
        error.statusCode = 403
        throw error
    }

    // ─────────────────────────────
    // Fetch Clauses
    // ─────────────────────────────

    const [clauses] =
        await pool.query(
            `
            SELECT

                ac.id,
                ac.clause_title,
                ac.clause_content,
                ac.clause_category

            FROM agreement_draft_clauses adc

            JOIN agreement_clauses ac
            ON adc.clause_id = ac.id

            WHERE adc.agreement_draft_id = ?
            `,
            [agreementDraftId]
        )
    draft.clauses =
        clauses
    return draft
}

/**
 * @name updateAgreementDraftService
 * @description Update editable agreement draft
 * @param {string} agreementDraftId
 * @param {Object} data
 * @returns {Object}
 */

async function updateAgreementDraftService(
    agreementDraftId,
    data,
    user
) {
    const {
        customRules,

        agreementStartDate,

        agreementEndDate,

        negotiationNotes,

    } = data
    // ─────────────────────────────
    // Fetch Draft
    // ─────────────────────────────
    const [[draft]] =
        await pool.query(
            `
            SELECT

                status,
                tenant_id,
                owner_id

            FROM agreement_drafts

            WHERE id = ?
            `,
            [agreementDraftId]
        )

    if (!draft) {

        throw new Error(
            "Agreement draft not found."
        )
    }

    // ─────────────────────────────
    // Prevent Editing Locked Agreements
    // ─────────────────────────────

    if (
        draft.status !== "draft"
    ) {

        throw new Error(
            "Agreement can no longer be edited."
        )
    }

    // ─────────────────────────────
    // Access Control
    // ─────────────────────────────

    if (
        user.id !== draft.tenant_id &&
        user.id !== draft.owner_id &&
        user.role !== "admin"
    ) {

        throw new Error(
            "Unauthorized access."
        )
    }

    // ─────────────────────────────
    // Tenant Feedback Update
    // ─────────────────────────────

    if (
        user.role === "tenant"
    ) {

        await pool.query(
            `
            UPDATE agreement_drafts

            SET

                negotiation_notes = ?,

                draft_version =
                    COALESCE(
                        draft_version,
                        1
                    ) + 1

            WHERE id = ?
            `,
            [
                negotiationNotes,
                agreementDraftId,
            ]
        )
    }

    // ─────────────────────────────
    // Owner Agreement Update
    // ─────────────────────────────

    else if (
        user.role === "owner"
    ) {

        await pool.query(
            `
            UPDATE agreement_drafts

            SET
                custom_rules = ?,

                agreement_start_date = ?,

                agreement_end_date = ?,

                draft_version =
                    COALESCE(
                        draft_version,
                        1
                    ) + 1

            WHERE id = ?
            `,
            [

                JSON.stringify(
                    customRules || []
                ),

                agreementStartDate,

                agreementEndDate,

                agreementDraftId,
            ]
        )
    }

    return {
        success: true,
    }
}

/**
 * @name sendAgreementForSignatureService
 * @description Lock agreement and send for signature
 * @param {string} agreementDraftId
 * @param {Object} user
 * @returns {Object}
 */
async function sendAgreementForSignatureService(
    agreementDraftId,
    user
) {

    // ─────────────────────────────
    // Fetch Draft
    // ─────────────────────────────

    const [[draft]] =
        await pool.query(
            `
            SELECT

                id,
                owner_id,
                status

            FROM agreement_drafts

            WHERE id = ?
            `,
            [agreementDraftId]
        )

    if (!draft) {

        throw new Error(
            "Agreement draft not found."
        )
    }
    // ─────────────────────────────
    // Only Owner Can Send
    // ─────────────────────────────

    if (
        draft.owner_id !== user.id
    ) {

        throw new Error(
            "Only owner can send agreement for signature."
        )
    }

    // ─────────────────────────────
    // Must Be Draft
    // ─────────────────────────────

    if (
        draft.status !== "draft"
    ) {

        throw new Error(
            "Agreement already locked."
        )
    }

    // ─────────────────────────────
    // Update Status
    // ─────────────────────────────

    await pool.query(
        `
        UPDATE agreement_drafts

        SET

            status = 'pending_signature'

        WHERE id = ?
        `,
        [agreementDraftId]
    )

    return {

        success: true,

        message:
            "Agreement sent for signature.",
    }
}

// =====================================================
// Get Tenant Agreement Drafts
// =====================================================

/**
 * @name getMyAgreementDraftsService
 * @description Get tenant agreement drafts
 * @param {string} tenantId
 * @returns {Array}
 */

async function getMyAgreementDraftsService(
    tenantId
) {

    const [drafts] =
        await pool.query(
            `
            SELECT 
                ad.id AS id,
                ad.*,
                COALESCE(ad.draft_version, 1) AS draft_version,
                p.title AS property_title,
                p.address AS property_address,
                o.name AS owner_name,
                o.email AS owner_email,
                o.phone AS owner_phone,
                (SELECT image_url FROM property_images pi WHERE pi.property_id = p.id LIMIT 1) AS property_image,
                at.template_name AS template_name
            FROM agreement_drafts ad
            JOIN properties p ON ad.property_id = p.id
            JOIN users o ON ad.owner_id = o.id
            LEFT JOIN agreement_templates at ON ad.template_id = at.id
            WHERE ad.tenant_id = ?
            ORDER BY ad.created_at DESC
            `,
            [tenantId]
        )

    return drafts
}
/**
 * @name getOwnerAgreementDraftsService
 * @description Get owner agreement drafts
 * @param {string} ownerId
 * @returns {Array}
 */

async function getOwnerAgreementDraftsService(
    ownerId
) {

    const [drafts] =
        await pool.query(
            `
            SELECT 
                ad.id AS id,
                ad.*,
                COALESCE(ad.draft_version, 1) AS draft_version,
                p.title AS property_title,
                p.address AS property_address,
                t.name AS tenant_name,
                t.email AS tenant_email,
                at.template_name AS template_name
            FROM agreement_drafts ad
            JOIN properties p ON ad.property_id = p.id
            JOIN users t ON ad.tenant_id = t.id
            LEFT JOIN agreement_templates at ON ad.template_id = at.id
            WHERE ad.owner_id = ?
            ORDER BY ad.created_at DESC
            `,
            [ownerId]
        )
    return drafts
}
/**
 * @name signAgreementService
 * @description Sign agreement using Cloudinary signature URL
 * @param {string} agreementDraftId
 * @param {string} signatureUrl
 * @param {Object} user
 * @returns {Object}
 */

async function signAgreementService(
    agreementDraftId,
    signatureUrl,
    user
) {

    let pdfReady = false

    // ─────────────────────────────
    // Fetch Agreement
    // ─────────────────────────────

    const [[draft]] =
        await pool.query(
            `
            SELECT *

            FROM agreement_drafts

            WHERE id = ?
            `,
            [agreementDraftId]
        )

    if (!draft) {

        throw new Error(
            "Agreement not found."
        )
    }

    // ─────────────────────────────
    // Validate Status
    // ─────────────────────────────

    if (
        draft.status !==
            "pending_signature" &&
        draft.status !==
            "tenant_signed"
    ) {

        throw new Error(
            "Agreement is not ready for signing."
        )
    }

    // ─────────────────────────────
    // Validate Signature URL
    // ─────────────────────────────

    if (!signatureUrl) {

        throw new Error(
            "Signature URL is required."
        )
    }

    // ─────────────────────────────
    // Tenant Signature
    // ─────────────────────────────

    if (
        user.role === "tenant"
    ) {

        // prevent duplicate sign

        if (
            draft.tenant_signature
        ) {

            throw new Error(
                "Tenant already signed."
            )
        }

        // ensure correct tenant

        if (
            draft.tenant_id !== user.id
        ) {

            throw new Error(
                "Unauthorized tenant."
            )
        }

        await pool.query(
            `
            UPDATE agreement_drafts

            SET

                tenant_signature = ?,

                tenant_signed_at = NOW(),

                status = 'tenant_signed'

            WHERE id = ?
            `,
            [
                signatureUrl,
                agreementDraftId,
            ]
        )

    }

    // ─────────────────────────────
    // Owner Signature
    // ─────────────────────────────

    else if (
        user.role === "owner"
    ) {

        // ensure tenant signed first

        if (
            !draft.tenant_signature
        ) {

            throw new Error(
                "Tenant must sign first."
            )
        }

        // prevent duplicate sign

        if (
            draft.owner_signature
        ) {

            throw new Error(
                "Owner already signed."
            )
        }

        // ensure correct owner

        if (
            draft.owner_id !== user.id
        ) {

            throw new Error(
                "Unauthorized owner."
            )
        }

        await pool.query(
            `
            UPDATE agreement_drafts

            SET

                owner_signature = ?,

                owner_signed_at = NOW(),

                status = 'signed'

            WHERE id = ?
            `,
            [
                signatureUrl,
                agreementDraftId,
            ]
        )

        // The owner's signature finalizes the agreement. Generate and cache
        // the completed PDF immediately, while keeping the signed agreement
        // valid if the external cache is temporarily unavailable.
        try {
            const finalizedDraft =
                await getAgreementDraftService(
                    agreementDraftId,
                    user
                )

            const pdfBuffer =
                await buildAgreementPdfBuffer(
                    finalizedDraft
                )

            await cacheAgreementPdf(
                finalizedDraft,
                pdfBuffer
            )

            pdfReady = true

        } catch (error) {

            console.error(
                "Agreement was signed, but automatic PDF caching failed:",
                error.message
            )
        }
    }

    else {

        throw new Error(
            "Invalid user role."
        )
    }

    return {

        success: true,

        message:
            "Agreement signed successfully.",

        pdfReady,
    }
}

/**
 * Uploads a generated PDF and records its URL on the finalized agreement.
 * The caller decides whether a cache failure should fail the request.
 */
async function cacheAgreementPdf(
    draft,
    pdfBuffer
) {

    const uploadResult =
        await cloudinary.uploader.upload(
            `data:application/pdf;base64,${pdfBuffer.toString("base64")}`,
            {
                resource_type: "raw",
                folder: "easyrentbd/agreements",
                public_id: draft.id,
                format: "pdf",
                overwrite: true,
            }
        )

    await pool.query(
        `
        UPDATE agreement_drafts

        SET agreement_pdf_url = ?

        WHERE id = ?
        `,
        [
            uploadResult.secure_url,
            draft.id,
        ]
    )

    return uploadResult.secure_url
}

/**
 * @name generateAgreementPdfService
 * @description Builds (or reuses a cached) final agreement PDF for a
 *              fully signed draft, and returns the PDF bytes.
 * @param {string} agreementDraftId
 * @param {Object} user
 * @returns {Promise<Buffer>}
 */

async function generateAgreementPdfService(
    agreementDraftId,
    user
) {

    // ─────────────────────────────
    // Fetch Draft (Access Checked)
    // ─────────────────────────────

    const draft =
        await getAgreementDraftService(
            agreementDraftId,
            user
        )

    // ─────────────────────────────
    // Must Be Fully Signed
    // ─────────────────────────────

    if (
        draft.status !== "signed"
    ) {

        const error = new Error(
            "Agreement must be fully signed by both parties before it can be downloaded as a PDF."
        )
        error.statusCode = 400
        throw error
    }

    // ─────────────────────────────
    // Return Cached PDF If Present
    // ─────────────────────────────
    // Falls through to regeneration below if Cloudinary refuses to
    // serve the cached file back (e.g. raw PDF delivery blocked by
    // the account's security settings) instead of failing the request.

    if (
        draft.agreement_pdf_url
    ) {

        try {

            const cached =
                await axios.get(
                    draft.agreement_pdf_url,
                    { responseType: "arraybuffer" }
                )

            return Buffer.from(
                cached.data
            )

        } catch (err) {

            console.error(
                "Cached agreement PDF fetch failed, regenerating:",
                err.message
            )
        }
    }

    // ─────────────────────────────
    // Generate PDF
    // ─────────────────────────────

    const pdfBuffer =
        await buildAgreementPdfBuffer(
            draft
        )

    // Cache for future downloads. A cache outage must not prevent the
    // authenticated parties from receiving a freshly generated document.
    try {

        await cacheAgreementPdf(
            draft,
            pdfBuffer
        )

    } catch (error) {

        console.error(
            "Agreement PDF cache failed; returning generated PDF:",
            error.message
        )
    }

    return pdfBuffer
}

module.exports = {
    createAgreementDraftService,
    getAgreementDraftService,
    updateAgreementDraftService,
    getMyAgreementDraftsService,
    getOwnerAgreementDraftsService,
    sendAgreementForSignatureService,
    signAgreementService,
    generateAgreementPdfService
}
