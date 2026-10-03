/**
 * @file src/routes/agreement.routes.js
 * @description Agreement draft routes
 * @author Siyam
 */

const express =
    require("express")

const router =
    express.Router()

const {

    verifyToken,
    authorizeRoles

} = require("../middlewares/auth.middleware")

const {

    getAgreementDraftController,

    updateAgreementDraftController,

    getMyAgreementDraftsController,

    sendAgreementForSignatureController,

    getOwnerAgreementDraftsController,
    signAgreementController,
    downloadAgreementPdfController

} = require("../controllers/agreement.controller")

// =====================================================
// Tenant Drafts
// =====================================================

router.get(
    "/my",
    verifyToken,
    authorizeRoles("tenant"),
    getMyAgreementDraftsController
)

// =====================================================
// Owner Drafts
// =====================================================

router.get(
    "/owner",
    verifyToken,
    authorizeRoles("owner"),
    getOwnerAgreementDraftsController
)

// =====================================================
// Get Single Draft
// =====================================================

router.get(
    "/drafts/:id",
    verifyToken,
    getAgreementDraftController
)

// =====================================================
// Update Draft
// =====================================================

router.patch(
    "/drafts/:id",
    verifyToken,
    updateAgreementDraftController
)
router.patch(
    "/:id/send-signature",
    verifyToken,
    sendAgreementForSignatureController
)
router.patch(
    "/:id/sign",
    verifyToken,
    signAgreementController
)

// =====================================================
// Download Final Agreement PDF
// =====================================================

router.get(
    "/:id/pdf",
    verifyToken,
    downloadAgreementPdfController
)

module.exports =
    router
