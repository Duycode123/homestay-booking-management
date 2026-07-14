-- Preserve booking history while allowing administrators to remove rooms and
-- room tiers from the active catalog.

ALTER TYPE room_status ADD VALUE IF NOT EXISTS 'INACTIVE';

ALTER TABLE room_tier
    ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_room_active_tier
    ON room(room_tier_id)
    WHERE status <> 'INACTIVE';

CREATE INDEX IF NOT EXISTS idx_booking_active_room
    ON booking(room_id, status)
    WHERE status IN ('PENDING_PAYMENT', 'DEPOSIT_PAID', 'PAID', 'CHECKED_IN');
