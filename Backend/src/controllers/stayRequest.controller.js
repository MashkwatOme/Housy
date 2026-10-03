/**
 * @file src/controllers/stayRequest.controller.js
 * @description Handles HTTP requests for stay requests.
 * @author Siyam
 */

const {

    createStayRequestService,

    getMyStayRequestsService,

    getOwnerStayRequestsService,

    updateStayRequestStatusService,

} = require(
    "../services/stayRequest.service"
)

// =====================================================
// Create Stay Request
// =====================================================

async function createStayRequestController(
    req,
    res,
    next
) {

    try {

        const {

            propertyId,
            ownerId,
            message,
            moveInDate,

        } = req.body

        const tenantId =
            req.user.id

        const result =
            await createStayRequestService({

                propertyId,
                tenantId,
                ownerId,
                message,
                moveInDate,
            })

        res.status(201).json({

            success: true,
            result,
        })

    } catch (error) {

        next(error)
    }
}

// =====================================================
// Get Tenant Requests
// =====================================================

async function getMyStayRequestsController(
    req,
    res,
    next
) {

    try {

        const tenantId =
            req.user.id

        const requests =
            await getMyStayRequestsService(
                tenantId
            )

        res.status(200).json({

            success: true,
            requests,
        })

    } catch (error) {

        next(error)
    }
}

// =====================================================
// Get Owner Requests
// =====================================================

async function getOwnerStayRequestsController(
    req,
    res,
    next
) {

    try {

        const ownerId =
            req.user.id

        const requests =
            await getOwnerStayRequestsService(
                ownerId
            )

        res.status(200).json({

            success: true,
            requests,
        })

    } catch (error) {

        next(error)
    }
}

// =====================================================
// Update Request Status
// =====================================================

async function updateStayRequestStatusController(
    req,
    res,
    next
) {

    try {

        const {
            id
        } = req.params

        const {
            status
        } = req.body

        const result =
            await updateStayRequestStatusService(
                id,
                status,
                req.user.id
            )

        res.status(200).json({

            success: true,
            result,
        })

    } catch (error) {

        next(error)
    }
}

module.exports = {

    createStayRequestController,

    getMyStayRequestsController,

    getOwnerStayRequestsController,

    updateStayRequestStatusController,
}