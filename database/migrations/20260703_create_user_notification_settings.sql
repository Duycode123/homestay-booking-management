CREATE TABLE IF NOT EXISTS user_notification_settings (
    id SERIAL PRIMARY KEY,
    account_id INT NOT NULL UNIQUE REFERENCES account(id) ON DELETE CASCADE,
    new_booking BOOLEAN NOT NULL DEFAULT TRUE,
    booking_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    shift_reminder BOOLEAN NOT NULL DEFAULT TRUE,
    room_issue BOOLEAN NOT NULL DEFAULT TRUE,
    equipment_issue BOOLEAN NOT NULL DEFAULT TRUE
);

DELETE FROM user_notification_settings newer
USING user_notification_settings older
WHERE newer.account_id = older.account_id
  AND newer.id > older.id;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uk_user_notification_settings_account_id'
    ) THEN
        ALTER TABLE user_notification_settings
        ADD CONSTRAINT uk_user_notification_settings_account_id UNIQUE (account_id);
    END IF;
END $$;
