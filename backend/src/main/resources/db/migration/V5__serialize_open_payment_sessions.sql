WITH ranked_open_sessions AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY booking_id
               ORDER BY created_at DESC NULLS LAST, id DESC
           ) AS session_rank
    FROM payment_transaction
    WHERE status IN ('INITIALIZED', 'PENDING')
)
UPDATE payment_transaction transaction
SET status = CAST('CANCELLED' AS payment_transaction_status),
    response_code = 'DUPLICATE_SESSION_CLEANUP',
    updated_at = now()
FROM ranked_open_sessions ranked
WHERE transaction.id = ranked.id
  AND ranked.session_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS ux_payment_transaction_one_open_per_booking
    ON payment_transaction(booking_id)
    WHERE status IN ('INITIALIZED', 'PENDING');
