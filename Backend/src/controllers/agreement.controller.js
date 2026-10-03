/**
 * @file src/controllers/agreement.controller.js
 * @description Agreement draft controllers
 * @author Siyam
 */

const {

    getAgreementDraftService,

    updateAgreementDraftService,

    getMyAgreementDraftsService,
    sendAgreementForSignatureService,

    getOwnerAgreementDraftsService,
    signAgreementService,
    generateAgreementPdfService

} = require("../services/agreement.service")

// =====================================================
// Get Single Agreement Draft
// =====================================================

async function getAgreementDraftController(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params

        const draft =
            await getAgreementDraftService(id, req.user)

        res.status(200).json({

            success: true,

            draft,
        })

    } catch (error) {

        next(error)
    }
}

// =====================================================
// Update Agreement Draft
// =====================================================

async function updateAgreementDraftController(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params

        const result =
            await updateAgreementDraftService(
                id,
                req.body,
                req.user
            )

        res.status(200).json(
            result
        )

    } catch (error) {

        next(error)
    }
}

// =====================================================
// Get Tenant Agreement Drafts
// =====================================================

async function getMyAgreementDraftsController(
    req,
    res,
    next
) {

    try {

        const drafts =
            await getMyAgreementDraftsService(
                req.user.id
            )

        res.status(200).json({

            success: true,

            drafts,
        })

    } catch (error) {

        next(error)
    }
}

// =====================================================
// Get Owner Agreement Drafts
// =====================================================

async function getOwnerAgreementDraftsController(
    req,
    res,
    next
) {

    try {

        const drafts =
            await getOwnerAgreementDraftsService(
                req.user.id
            )

        res.status(200).json({

            success: true,

            drafts,
        })

    } catch (error) {

        next(error)
    }
}
// =====================================================
// Send Agreement For Signature
// =====================================================

async function sendAgreementForSignatureController(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params

        const result =
            await sendAgreementForSignatureService(
                id,
                req.user
            )

        res.status(200).json(
            result
        )

    } catch (error) {

        next(error)
    }
}
// =====================================================
// Sign Agreement
// =====================================================

async function signAgreementController(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params

        const {
            signatureUrl
        } = req.body

        const result =
            await signAgreementService(
                id,
                signatureUrl,
                req.user
            )

        res.status(200).json(
            result
        )

    } catch (error) {

        next(error)
    }
}

// =====================================================
// Download Agreement PDF
// =====================================================

async function downloadAgreementPdfController(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params

        const pdfBuffer =
            await generateAgreementPdfService(
                id,
                req.user
            )

        res.setHeader(
            "Content-Type",
            "application/pdf"
        )

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="agreement-${id}.pdf"`
        )

        res.status(200).send(
            pdfBuffer
        )

    } catch (error) {

        next(error)
    }
}

module.exports = {

    getAgreementDraftController,

    updateAgreementDraftController,

    getMyAgreementDraftsController,

    sendAgreementForSignatureController,

    getOwnerAgreementDraftsController,

    signAgreementController,

    downloadAgreementPdfController
}
