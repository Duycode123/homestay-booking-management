ALTER TABLE app_notification
    ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN NOT NULL DEFAULT false;
