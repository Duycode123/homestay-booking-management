-- Keep an audit trail of the admin/staff account that initiated or confirmed
-- a checkout balance collection. Existing customer payments remain nullable.

ALTER TABLE payment_transaction
    ADD COLUMN IF NOT EXISTS processed_by_user_id INT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_payment_transaction_processed_by_user'
    ) THEN
        ALTER TABLE payment_transaction
            ADD CONSTRAINT fk_payment_transaction_processed_by_user
            FOREIGN KEY (processed_by_user_id) REFERENCES account(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_transaction_processed_by
    ON payment_transaction(processed_by_user_id, created_at DESC)
    WHERE processed_by_user_id IS NOT NULL;
