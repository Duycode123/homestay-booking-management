-- Report-oriented indexes and daily pre-aggregation support.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'booking'
    ) THEN
        RAISE EXCEPTION 'booking table not found. Apply the English schema rename migrations first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'payment_transaction'
    ) THEN
        RAISE EXCEPTION 'payment_transaction table not found. Apply the payment transaction migrations first.';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_booking_status_start_time
    ON booking (status, start_time);

CREATE INDEX IF NOT EXISTS idx_payment_transaction_status_paid_at
    ON payment_transaction (status, paid_at)
    WHERE paid_at IS NOT NULL;

CREATE MATERIALIZED VIEW IF NOT EXISTS report_daily_booking_summary AS
SELECT
    date_trunc('day', b.start_time)::date AS booking_day,
    COALESCE(SUM(b.total_price), 0)::NUMERIC(12, 2) AS total_revenue,
    COUNT(*)::BIGINT AS total_bookings,
    ROUND(
        COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600), 0)::NUMERIC,
        2
    ) AS total_usage_hours
FROM booking b
WHERE b.status IN (
    'PAID'::booking_status,
    'CHECKED_IN'::booking_status,
    'COMPLETED'::booking_status
)
GROUP BY date_trunc('day', b.start_time)::date
WITH DATA;

CREATE UNIQUE INDEX IF NOT EXISTS idx_report_daily_booking_summary_day
    ON report_daily_booking_summary (booking_day);

COMMENT ON MATERIALIZED VIEW report_daily_booking_summary IS
    'Daily pre-aggregated revenue and usage for reportable bookings. Refresh after booking data changes.';
