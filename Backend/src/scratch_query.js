const { getPool } = require('./config/db');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
require('dotenv').config();

async function run() {
    const pool = getPool();
    try {
        const email = 'test@gmail.com';
        const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        
        const hashedPassword = await bcrypt.hash('123456', 10);
        
        if (existing.length > 0) {
            console.log("User already exists. Updating credentials...");
            await pool.query(
                "UPDATE users SET password = ?, status = 'accepted', is_verified = 1 WHERE email = ?",
                [hashedPassword, email]
            );
        } else {
            console.log("Creating new test user...");
            const userId = randomUUID();
            await pool.query(
                `INSERT INTO users (id, name, email, phone, password, role, nid_front_url, nid_back_url, status, is_verified)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    'Test User',
                    email,
                    '01700000000',
                    hashedPassword,
                    'tenant',
                    'http://example.com/nid_front.png',
                    'http://example.com/nid_back.png',
                    'accepted',
                    1
                ]
            );
        }
        
        const [users] = await pool.query("SELECT id, name, email, role, status, is_verified FROM users WHERE email = ?", [email]);
        console.log("Verified test user in DB:", users[0]);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
