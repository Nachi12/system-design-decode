-- Migration 001: Initial Schema for SeatLock Lab
-- Enforces: For a given show, a seat cannot have two valid concurrent holds, and a confirmed seat cannot be reserved again.

-- 1. Shows Table
CREATE TABLE IF NOT EXISTS shows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    auditorium_name VARCHAR(100) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Physical Seats Table
CREATE TABLE IF NOT EXISTS seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auditorium_name VARCHAR(100) NOT NULL,
    row_label VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    tier VARCHAR(20) NOT NULL DEFAULT 'STANDARD',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_seat_coordinate UNIQUE (auditorium_name, row_label, seat_number)
);

-- 3. Show-Specific Seat Inventory State
CREATE TABLE IF NOT EXISTS show_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    current_hold_id UUID,
    fencing_token BIGINT NOT NULL DEFAULT 1,
    hold_expires_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ,
    confirmed_by_customer_id VARCHAR(100),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_show_seat UNIQUE (show_id, seat_id),
    CONSTRAINT ck_seat_status CHECK (status IN ('AVAILABLE', 'HELD', 'CONFIRMED'))
);

-- 4. Durable Seat Holds Table
CREATE TABLE IF NOT EXISTS seat_holds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    show_id UUID NOT NULL REFERENCES shows(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
    customer_id VARCHAR(100) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    fencing_token BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_hold_status CHECK (status IN ('ACTIVE', 'CONFIRMED', 'RELEASED', 'EXPIRED'))
);

-- 5. Auditable Hold Lifecycle History
CREATE TABLE IF NOT EXISTS hold_audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hold_id UUID REFERENCES seat_holds(id) ON DELETE SET NULL,
    show_id UUID NOT NULL,
    seat_id UUID NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    coordination_mode VARCHAR(30) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast seat grid querying and hold reconciliation
CREATE INDEX IF NOT EXISTS idx_show_seats_show ON show_seats(show_id);
CREATE INDEX IF NOT EXISTS idx_show_seats_lookup ON show_seats(show_id, seat_id);
CREATE INDEX IF NOT EXISTS idx_show_seats_expired_holds ON show_seats(show_id, hold_expires_at) WHERE status = 'HELD';
CREATE INDEX IF NOT EXISTS idx_seat_holds_show_seat ON seat_holds(show_id, seat_id);
CREATE INDEX IF NOT EXISTS idx_seat_holds_idempotency ON seat_holds(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_hold_audit_events_hold ON hold_audit_events(hold_id);
