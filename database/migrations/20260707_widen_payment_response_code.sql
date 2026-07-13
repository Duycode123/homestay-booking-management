-- Widen payment_transaction.response_code from varchar(20) to varchar(50).
--
-- The application writes response codes longer than 20 characters:
--   'PAYMENT_SESSION_REPLACED' (24) when a customer restarts checkout,
--   'SEPAY_TRANSACTION_VOID'   (22) and 'SEPAY_ORDER_CANCELLED' (21) from
--   SePay Payment Gateway IPN failure/cancel notifications.
-- With varchar(20) those UPDATEs failed at commit ("value too long") and
-- rolled back the whole webhook/checkout transaction, so payment and booking
-- status changes were silently lost.

ALTER TABLE payment_transaction
    ALTER COLUMN response_code TYPE varchar(50);
