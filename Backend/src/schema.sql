
-- USERS TABLE
CREATE TABLE users (
    id              CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone           VARCHAR(20) NOT NULL UNIQUE,
    password        TEXT NOT NULL,
    role            ENUM('tenant', 'owner', 'admin') NOT NULL DEFAULT 'tenant',
    nid_front_url   TEXT,
    nid_back_url    TEXT,
    profile_picture_url TEXT,
    status            ENUM('accepted', 'pending', 'rejected') NOT NULL DEFAULT 'pending',
    is_verified     BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
-- PROPERTIES TABLE
-- =========================================================

CREATE TABLE properties (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    owner_id CHAR(36) NOT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    property_type ENUM(
        'apartment',
        'house',
        'hostel',
        'commercial'
    ) NOT NULL,

    listing_type ENUM(
        'full_property',
        'shared_living'
    ) DEFAULT 'full_property',

    total_units INT DEFAULT 1,

    monthly_rent DECIMAL(10,2) NOT NULL,

    expected_security_deposit DECIMAL(10,2) DEFAULT 0,

    total_bedrooms INT DEFAULT 0,
    total_bathrooms INT DEFAULT 0,

    division VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    area VARCHAR(100) NOT NULL,

    address TEXT NOT NULL,

    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    available_from DATE,

    visibility_status ENUM(
        'active',
        'hidden',
        'reported'
    ) DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    property_size_sqft INT,
    FOREIGN KEY(owner_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
-- PROPERTY IMAGES TABLE
-- =========================================================

CREATE TABLE property_images (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    property_id CHAR(36) NOT NULL,

    image_url TEXT NOT NULL,
    location_name VARCHAR(100) NULL,
    tour_order INT NULL,
    is_tour_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_property_images_walkthrough (property_id, is_tour_enabled, tour_order),

    FOREIGN KEY(property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE
);
-- PROPERTY VIDEO WALKTHROUGHS TABLE
-- =========================================================

CREATE TABLE property_video_walkthroughs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id CHAR(36) NOT NULL UNIQUE,
    video_url TEXT NOT NULL,
    public_id VARCHAR(255),
    duration_seconds DECIMAL(10,2),
    markers LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);
-- AMENITIES TABLE
-- =========================================================

CREATE TABLE amenities (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

    name VARCHAR(100) UNIQUE NOT NULL
);
-- PROPERTY AMENITIES TABLE
-- =========================================================

CREATE TABLE property_amenities (
    property_id CHAR(36),
    amenity_id CHAR(36),

    PRIMARY KEY(property_id, amenity_id),

    FOREIGN KEY(property_id)
        REFERENCES properties(id)
        ON DELETE CASCADE,

    FOREIGN KEY(amenity_id)
        REFERENCES amenities(id)
        ON DELETE CASCADE
);

-- CONVERSATION TABLE
-- ========================================================
CREATE TABLE conversations (

    id CHAR(36)
    PRIMARY KEY DEFAULT (UUID()),

    property_id CHAR(36),

    tenant_id CHAR(36)
    NOT NULL,

    owner_id CHAR(36)
    NOT NULL,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_conversation_participants (
        property_id,
        tenant_id,
        owner_id
    ),

    FOREIGN KEY (property_id)
    REFERENCES properties(id)
    ON DELETE CASCADE,

    FOREIGN KEY (tenant_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY (owner_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- MESSAGES TABLE
-- ============================================================
CREATE TABLE messages (

    id CHAR(36)
    PRIMARY KEY DEFAULT (UUID()),

    conversation_id CHAR(36)
    NOT NULL,

    sender_id CHAR(36)
    NOT NULL,

    message TEXT
    NOT NULL,

    is_read BOOLEAN
    DEFAULT FALSE,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (conversation_id)
    REFERENCES conversations(id)
    ON DELETE CASCADE,

    FOREIGN KEY (sender_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);
-- =========================================================
-- STAY REQUESTS TABLE
-- =========================================================
CREATE TABLE stay_requests (

    -- Primary Key
    id CHAR(36)
    PRIMARY KEY DEFAULT (UUID()),

    property_id CHAR(36)
    NOT NULL,

    tenant_id CHAR(36)
    NOT NULL,

    owner_id CHAR(36)
    NOT NULL,

    message TEXT,

    status ENUM(
        'pending',
        'approved',
        'rejected',
        'cancelled'
    ) DEFAULT 'pending',

    move_in_date DATE,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (property_id)
    REFERENCES properties(id)
    ON DELETE CASCADE,

    FOREIGN KEY (tenant_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY (owner_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);
-- =========================================================
-- AGREEMENT TEMPLATES
-- =========================================================

CREATE TABLE agreement_templates (

    id CHAR(36)
    PRIMARY KEY DEFAULT (UUID()),

    template_name VARCHAR(255)
    NOT NULL,

    template_type ENUM(
        'full_property',
        'shared_living',
        'commercial'
    ) NOT NULL,

    is_active BOOLEAN
    DEFAULT TRUE,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);
-- =========================================================
-- AGREEMENT CLAUSES
-- =========================================================

CREATE TABLE agreement_clauses (

    id CHAR(36)
    PRIMARY KEY DEFAULT (UUID()),

    clause_category VARCHAR(100),

    clause_title VARCHAR(255),

    clause_content TEXT
    NOT NULL,

    is_default BOOLEAN
    DEFAULT FALSE,

    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
);
-- =========================================================
-- AGREEMENT DRAFTS
-- =========================================================

CREATE TABLE agreement_drafts (

    id CHAR(36)
    PRIMARY KEY DEFAULT (UUID()),

    stay_request_id CHAR(36)
    NOT NULL,

    property_id CHAR(36)
    NOT NULL,

    tenant_id CHAR(36)
    NOT NULL,

    owner_id CHAR(36)
    NOT NULL,

    template_id CHAR(36)
    NOT NULL,
    agreement_type ENUM(
    'full_property',
    'shared_living',
    'commercial'
    ),

    monthly_rent DECIMAL(10,2)
    NOT NULL,

    
    security_deposit DECIMAL(10,2)
    DEFAULT 0,

    agreement_start_date DATE,

    agreement_end_date DATE,

    custom_rules JSON,
    negotiation_notes TEXT,

    status ENUM(
        'draft',
        'pending_signature',
        'tenant_signed',
        'signed',
        'cancelled'
    ) DEFAULT 'draft',
    draft_version INT,
    created_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP
    DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    tenant_signature TEXT NULL,
    owner_signature TEXT NULL,
    tenant_signed_at TIMESTAMP NULL,
    owner_signed_at TIMESTAMP NULL,

    agreement_pdf_url TEXT NULL,

    FOREIGN KEY (stay_request_id)
    REFERENCES stay_requests(id)
    ON DELETE CASCADE,

    FOREIGN KEY (property_id)
    REFERENCES properties(id)
    ON DELETE CASCADE,

    FOREIGN KEY (tenant_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY (owner_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

    FOREIGN KEY (template_id)
    REFERENCES agreement_templates(id)
    ON DELETE CASCADE
);
-- =========================================================
-- AGREEMENT DRAFT CLAUSES
-- =========================================================

CREATE TABLE agreement_draft_clauses (

    agreement_draft_id CHAR(36),

    clause_id CHAR(36),

    PRIMARY KEY (
        agreement_draft_id,
        clause_id
    ),

    FOREIGN KEY (agreement_draft_id)
    REFERENCES agreement_drafts(id)
    ON DELETE CASCADE,

    FOREIGN KEY (clause_id)
    REFERENCES agreement_clauses(id)
    ON DELETE CASCADE
);

-- =========================================================
-- VISIT SCHEDULES TABLE
-- =========================================================
CREATE TABLE schedules (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    owner_id CHAR(36) NOT NULL,
    visit_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    tenant_status_read BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================
-- RENT PAYMENTS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS rent_payments (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    agreement_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    owner_id CHAR(36) NOT NULL,
    payment_month VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_gateway ENUM('stripe', 'bkash', 'cash') NOT NULL,

    transaction_id VARCHAR(255) NULL,
    stripe_session_id VARCHAR(255) NULL,
    bkash_payment_id VARCHAR(255) NULL,
    status ENUM('pending', 'paid', 'failed') NOT NULL DEFAULT 'pending',
    owner_read TINYINT(1) NOT NULL DEFAULT 1,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agreement_id) REFERENCES agreement_drafts(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =========================================================
-- MAINTENANCE REQUESTS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    property_id CHAR(36) NOT NULL,
    tenant_id CHAR(36) NOT NULL,
    owner_id CHAR(36) NOT NULL,
    category VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'Low',
    description TEXT NOT NULL,
    status ENUM('pending', 'in_progress', 'resolved', 'cancelled') NOT NULL DEFAULT 'pending',
    owner_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
