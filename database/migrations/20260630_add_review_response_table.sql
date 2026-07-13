DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'review'
    ) THEN
        RAISE EXCEPTION 'review table not found. Apply the English schema rename migrations first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'account'
    ) THEN
        RAISE EXCEPTION 'account table not found. Apply the English schema rename migrations first.';
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS review_response (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL UNIQUE REFERENCES review(id) ON DELETE CASCADE,
    responder_id INTEGER NOT NULL REFERENCES account(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_response_responder_id
    ON review_response(responder_id);
