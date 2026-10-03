const {
    createConversationService,
    sendMessageService,
    getMessagesService,
    getConversationsService,markMessagesReadService
} = require("../services/chat.service")

// =====================================================
// Create Conversation
// =====================================================

async function createConversationController(
    req,
    res,
    next
) {

    try {

        const {
            propertyId,
            ownerId,
        } = req.body

        const tenantId =
            req.user.id

        const conversation =
            await createConversationService(
                propertyId,
                tenantId,
                ownerId
            )

        res.status(201).json({
            success: true,
            conversation,
        })

    } catch (error) {

        next(error)
    }
}

// =====================================================
// Send Message
// =====================================================

async function sendMessageController(
    req,
    res,
    next
) {

    try {

        const {
            conversationId,
            message,
        } = req.body

        const senderId =
            req.user.id

        // ─────────────────────────
        // Save message in MySQL
        // ─────────────────────────

        await sendMessageService(
            conversationId,
            senderId,
            message
        )

        // ─────────────────────────
        // Create realtime payload
        // ─────────────────────────

        const newMessage = {

            conversation_id:
                conversationId,

            sender_id:
                senderId,

            message,

            created_at:
                new Date(),
        }

        // ─────────────────────────
        // Get Socket.io instance
        // ─────────────────────────

        const io =
            req.app.get("io")

        // ─────────────────────────
        // Emit realtime event
        // ─────────────────────────

        io.to(conversationId).emit(
            "receive_message",
            newMessage
        )

        // ─────────────────────────
        // Response
        // ─────────────────────────

        res.status(201).json({

            success: true,

            message: newMessage,
        })

    } catch (error) {

        next(error)
    }
}

// =====================================================
// Get Messages
// =====================================================

async function getMessagesController(
    req,
    res,
    next
) {

    try {

        const {
            conversationId
        } = req.params

        const messages =
            await getMessagesService(
                conversationId,
                req.user.id
            )

        res.status(200).json({
            success: true,
            messages,
        })

    } catch (error) {

        next(error)
    }
}

// =====================================================
// Get Conversations
// =====================================================

async function getConversationsController(
    req,
    res,
    next
) {

    try {

        const userId =
            req.user.id

        const conversations =
            await getConversationsService(
                userId
            )

        res.status(200).json({
            success: true,
            conversations,
        })

    } catch (error) {

        next(error)
    }
}
// =====================================================
// Mark Messages Read
// =====================================================

async function markMessagesReadController(
    req,
    res,
    next
) {

    try {

        const {
            conversationId
        } = req.params

        const userId =
            req.user.id

        await markMessagesReadService(
            conversationId,
            userId
        )

        // ─────────────────────────
        // Socket Realtime Event
        // ─────────────────────────

        const io =
            req.app.get("io")

        io.to(conversationId).emit(
            "messages_seen",
            {
                conversationId,
                seenBy: userId
            }
        )

        res.status(200).json({
            success: true
        })

    } catch (error) {

        next(error)
    }
}

module.exports = {
    createConversationController,
    sendMessageController,
    getMessagesController,
    getConversationsController,
    markMessagesReadController,
}
