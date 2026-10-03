/**
 * @file src/services/auth.service.js
 * @description All business logic for authentication —
 *              DB queries, password hashing, token generation, Redis session management.
 * @author Siyam
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { getPool } = require("../config/db");
const { client } = require("../config/redis");
const { log } = require("console");
require("dotenv").config();

// ─── Token Helpers ───

/**
 * @name generateTokens
 * @description Generate access and refresh JWT tokens
 * @param {string} userId
 * @param {string} role
 * @returns {{ access_token, refresh_token, sessionId }}
 */
function generateTokens(userId, role) {
  const sessionId = randomUUID();

  const access_token = jwt.sign(
    { id: userId, role },
    process.env.JWT_ACCESS_KEY,
    { expiresIn: "15m" },
  );
  const refresh_token = jwt.sign(
    { id: userId, sessionId },
    process.env.JWT_REFRESH_KEY,
    { expiresIn: "7d" },
  );
  return { access_token, refresh_token, sessionId };
}

/**
 * @name storeRefreshToken
 * @description Store refresh token in Redis with 7 day expiry
 * @param {string} userId
 * @param {string} sessionId
 * @param {string} refresh_token
 */
async function storeRefreshToken(userId, sessionId, refresh_token) {
  await client.set(
    `refresh_token:${userId}:${sessionId}`,
    refresh_token,
    "EX",
    7 * 24 * 60 * 60,
  );
}

// ─── Auth Services ────────────────────────────────────────────────────────────

/**
 * @name registerService
 * @description Validates, creates user, returns tokens and user info
 * @param {{ name, email, phone, password, role }} body
 * @param {{ nid_front, nid_back }} files - Cloudinary uploaded file objects
 * @returns {{ user, access_token, refresh_token, sessionId }}
 */
async function registerService({ name, email, phone, password, role }, files) {
  const pool = getPool();

  // ── Validate required fields ──
  if (!name || !email || !phone || !password) {
    const error = new Error("Missing required fields.");
    error.statusCode = 400;
    throw error;
  }
  email=email.toLowerCase()
  const userRole = role || "tenant";
  if (!["tenant", "owner"].includes(userRole)) {
    const error = new Error("Invalid role. Must be tenant or owner.");
    error.statusCode = 400;
    throw error;
  }

  // ── Validate NID uploads ──
  const nid_front_url = files?.nid_front?.[0]?.path || null;
  const nid_back_url = files?.nid_back?.[0]?.path || null;

  if (!nid_front_url || !nid_back_url) {
    const error = new Error("Both NID front and back images are required.");
    error.statusCode = 400;
    throw error;
  }

  // ── Check if user already exists ──
  const [existing] = await pool.query(
    "SELECT id FROM users WHERE email=? OR phone=?",
    [email, phone],
  );
  if (existing.length > 0) {
    const error = new Error("User with this email or phone already exists.");
    error.statusCode = 409;
    throw error;
  }

  // ── Hash password ──
  const hashedPassword = await bcrypt.hash(password, 10);

  // ── Insert user ──
  const userId = randomUUID();
  await pool.query(
    `INSERT INTO users (id, name, email, phone, password, role, nid_front_url, nid_back_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      name,
      email,
      phone,
      hashedPassword,
      userRole,
      nid_front_url,
      nid_back_url,
    ],
  );

  const [rows] = await pool.query(
    "SELECT id, name, email, phone, role, is_verified,status, created_at FROM users WHERE id=?",
    [userId],
  );
  const user = rows[0];
  return { user };
}

/**
 * @name loginService
 * @description Validates credentials, returns tokens and user info
 * @param {{ email, password }} body
 * @returns {{ user, access_token, refresh_token, sessionId }}
 */
async function loginService({ email, password }) {
  const pool = getPool();

  if (!email || !password) {
    const error = new Error("Missing credentials.");
    error.statusCode = 400;
    throw error;
  }

  // ── Find user ──
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, password, role, is_verified, status, profile_picture_url FROM users WHERE email=?",
    [email],
  );
  if (rows.length === 0) {
    const error = new Error("Invalid credentials.");
    error.statusCode = 401;
    throw error;
  }

  const user = rows[0];

  // ── Compare password ──
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error("Invalid credentials.");
    error.statusCode = 401;
    throw error;
  }
  if(user.status!='accepted'||(user.is_verified==0)){
    const error = new Error("user not verfied or pending");
    error.statusCode = 403;
    throw error;
    
  }

  // ── Generate tokens ──
  const { access_token, refresh_token, sessionId } = generateTokens(
    user.id,
    user.role,
  );

  // ── Store refresh token in Redis ──
  await storeRefreshToken(user.id, sessionId, refresh_token);

  // ── Remove password before returning ──
  delete user.password;

  return { user, access_token, refresh_token, sessionId };
}

/**
 * @name logoutService
 * @description Deletes refresh token session from Redis
 * @param {string} refresh_token - from cookie
 */
async function logoutService(refresh_token) {
  const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_KEY);
  await client.del(`refresh_token:${decoded.id}:${decoded.sessionId}`);
}

/**
 * @name refreshTokenService
 * @description Validates refresh token, rotates it, returns new tokens
 * @param {string} refresh_token - from cookie
 * @returns {{ access_token, refresh_token, sessionId }}
 */
async function refreshTokenService(refresh_token) {
  const pool = getPool();

  // ── Verify token ──
  const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_KEY);
  const { id, sessionId } = decoded;

  // ── Check Redis ──
  const storedToken = await client.get(`refresh_token:${id}:${sessionId}`);
  if (!storedToken || storedToken !== refresh_token) {
    const error = new Error("Invalid or reused session. Please login again.");
    error.statusCode = 401;
    throw error;
  }

  // ── Get user role ──
  const [rows] = await pool.query("SELECT role FROM users WHERE id=?", [id]);
  if (rows.length === 0) {
    const error = new Error("User not found.");
    error.statusCode = 401;
    throw error;
  }
  const { role } = rows[0];

  // ── Rotate — delete old, generate new ──
  await client.del(`refresh_token:${id}:${sessionId}`);
  const {
    access_token,
    refresh_token: newRefreshToken,
    sessionId: newSessionId,
  } = generateTokens(id, role);
  await storeRefreshToken(id, newSessionId, newRefreshToken);

  return {
    access_token,
    refresh_token: newRefreshToken,
    sessionId: newSessionId,
  };
}

/**
 * @name getMeService
 * @description Returns current logged in user info from DB
 * @param {string} userId - from verified token
 * @returns {object} user
 */
async function getMeService(userId) {
  const pool = getPool();
  const [rows] = await pool.query(
    "SELECT id, name, email, phone, role, is_verified, status, profile_picture_url, created_at FROM users WHERE id=?",
    [userId],
  );
  if (rows.length === 0) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }
  return rows[0];
}

async function updateProfileService(userId, { name, email, phone }, profilePictureUrl) {
  const pool = getPool();
  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPhone = String(phone || "").trim();

  if (!cleanName || !cleanEmail || !cleanPhone) {
    const error = new Error("Name, email and phone number are required.");
    error.statusCode = 400;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    const error = new Error("Please enter a valid email address.");
    error.statusCode = 400;
    throw error;
  }

  if (!/^\+?[0-9][0-9\s-]{7,19}$/.test(cleanPhone)) {
    const error = new Error("Please enter a valid phone number.");
    error.statusCode = 400;
    throw error;
  }

  const [duplicates] = await pool.query(
    "SELECT id FROM users WHERE (email = ? OR phone = ?) AND id <> ? LIMIT 1",
    [cleanEmail, cleanPhone, userId],
  );

  if (duplicates.length > 0) {
    const error = new Error("That email address or phone number is already in use.");
    error.statusCode = 409;
    throw error;
  }

  await pool.query(
    `UPDATE users
     SET name = ?, email = ?, phone = ?,
         profile_picture_url = COALESCE(?, profile_picture_url)
     WHERE id = ?`,
    [cleanName, cleanEmail, cleanPhone, profilePictureUrl, userId],
  );

  return getMeService(userId);
}

module.exports = {
  registerService,
  loginService,
  logoutService,
  refreshTokenService,
  getMeService,
  updateProfileService,
};
