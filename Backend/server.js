/**
 * @file server.js
 * @description Entry point — establishes all service connections
 *              (MySQL, Redis) before starting the Express server.
 *              Also initializes Socket.io realtime server.
 * @author Siyam
 */

const http = require("http")

const { Server } =
    require("socket.io")

const app =
    require("./src/app")

const { getPool } =
    require("./src/config/db")

const { client } =
    require("./src/config/redis")

require("dotenv").config()

const PORT =
    process.env.PORT || 5000

// ─────────────────────────────────────────────
// Create HTTP Server
// ─────────────────────────────────────────────

const server =
    http.createServer(app)

// ─────────────────────────────────────────────
// Initialize Socket.io
// ─────────────────────────────────────────────

const io =
    new Server(server, {

        cors: {

            origin: true,

            credentials: true,
        },
    })

// ─────────────────────────────────────────────
// Make io globally accessible
// ─────────────────────────────────────────────

app.set("io", io)

// ─────────────────────────────────────────────
// Online Users Store
// ─────────────────────────────────────────────

const onlineUsers = {}

// ─────────────────────────────────────────────
// Socket.io Connection
// ─────────────────────────────────────────────

io.on(
    "connection",
    (socket) => {

        console.log(
            "User connected:",
            socket.id
        )

        // ─────────────────────────
        // User Online
        // ─────────────────────────

        socket.on(
            "user_online",
            (userId) => {

                onlineUsers[userId] =
                    socket.id

                socket.join(
                    String(userId)
                )

                io.emit(
                    "online_users",
                    Object.keys(
                        onlineUsers
                    )
                )

                console.log(
                    "Online users:",
                    onlineUsers
                )
            }
        )

        // ─────────────────────────
        // Join Conversation Room
        // ─────────────────────────

        socket.on(
            "join_conversation",
            (
                conversationId
            ) => {

                socket.join(
                    String(conversationId)
                )

                console.log(
                    `Socket joined room: ${conversationId}`
                )
            }
        )

        // ─────────────────────────
        // Typing Indicator
        // ─────────────────────────

        socket.on(
            "typing",
            (
                conversationId
            ) => {

                socket.to(
                    String(conversationId)
                ).emit(
                    "user_typing",
                    String(conversationId)
                )
            }
        )

        // ─────────────────────────
        // Disconnect
        // ─────────────────────────

        socket.on(
            "disconnect",
            () => {

                for (
                    const userId
                    in onlineUsers
                ) {

                    if (
                        onlineUsers[userId]
                        === socket.id
                    ) {

                        delete onlineUsers[userId]
                    }
                }

                io.emit(
                    "online_users",
                    Object.keys(
                        onlineUsers
                    )
                )

                console.log(
                    "User disconnected:",
                    socket.id
                )
            }
        )
    }
)

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────

async function startServer() {

    try {

        // ── Ping MySQL ──

        const pool = getPool()

        await pool.query("SELECT 1")

        console.log(
            "MySQL connected"
        )

        // ── Ping Redis ──

        await client.ping()

        console.log(
            "Redis pinged"
        )

        // ── Start Server ──

        server.listen(
            PORT,
            () => {

                console.log(
                    `Server running on http://localhost:${PORT}`
                )
            }
        )

    } catch (err) {

        console.error(
            "Failed to start server:",
            err.message
        )

        process.exit(1)
    }
}

startServer()