ALTER TABLE account
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);

ALTER TABLE account
    DROP CONSTRAINT IF EXISTS chk_account_avatar_url_length;

ALTER TABLE account
    ADD CONSTRAINT chk_account_avatar_url_length
    CHECK (avatar_url IS NULL OR char_length(avatar_url) <= 500);
