ALTER TABLE account
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS email_verification_token_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS email_verification_expires_at TIMESTAMP,
    ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS ux_account_email_verification_token_hash
    ON account(email_verification_token_hash)
    WHERE email_verification_token_hash IS NOT NULL;

UPDATE account
SET email_verified = true
WHERE email_verified = false
  AND email_verification_token_hash IS NULL
  AND email_verification_expires_at IS NULL;
