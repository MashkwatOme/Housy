/**
 * @file src/config/redis.js
 * @description Upstash Redis client setup using ioredis.
 *              Used for storing refresh token sessions.
 * @author Siyam
 */

const Redis = require("ioredis")
require("dotenv").config()

const client = new Redis(process.env.UPSTASH_REDIS_URL, {
    tls: { rejectUnauthorized: false }, 
    maxRetriesPerRequest: 3,
})

client.on("connect", () => console.log("Redis connected"))
client.on("error", (err) => console.error(" Redis error:", err.message))

module.exports = { client }