/**
 * @file src/config/db.js
 * @description MySQL connection pool setup.
 *              Uses a singleton pattern — pool is created once and reused.
 * @author Siyam
 */

const mysql = require("mysql2/promise")
require("dotenv").config()

let pool;

function getPool() {
    if (!pool) {
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
        })
    }
    return pool
}

module.exports = { getPool }