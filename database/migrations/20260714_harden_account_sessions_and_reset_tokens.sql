BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE account
    ADD COLUMN IF NOT EXISTS credentials_version INTEGER NOT NULL DEFAULT 0;

ALTER TABLE account
    DROP CONSTRAINT IF EXISTS chk_account_credentials_version;

ALTER TABLE account
    ADD CONSTRAINT chk_account_credentials_version
    CHECK (credentials_version >= 0);

-- Preserve active legacy reset links while replacing raw UUID values with SHA-256 hashes.
UPDATE account
SET reset_token = encode(digest(reset_token, 'sha256'), 'hex')
WHERE reset_token IS NOT NULL
  AND char_length(reset_token) <> 64;

COMMENT ON COLUMN account.credentials_version IS
    'Incremented after a password change/reset so all previously issued JWTs become invalid.';
COMMENT ON COLUMN account.reset_token IS
    'SHA-256 hash of the password-reset token; the raw token is sent only by email.';

COMMIT;
