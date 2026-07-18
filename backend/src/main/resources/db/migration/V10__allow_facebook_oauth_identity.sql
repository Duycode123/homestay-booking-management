ALTER TABLE oauth_identity
  DROP CONSTRAINT IF EXISTS chk_oauth_identity_provider;

ALTER TABLE oauth_identity
  ADD CONSTRAINT chk_oauth_identity_provider
  CHECK (provider IN ('GOOGLE', 'FACEBOOK'));
