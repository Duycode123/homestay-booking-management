INSERT INTO discount_code (code, type, value, min_order_value, expires_at)
VALUES ('SERENE10', 'PERCENTAGE', 10.00, 0.00, NULL)
ON CONFLICT (code) DO UPDATE
SET type = EXCLUDED.type,
    value = EXCLUDED.value,
    min_order_value = EXCLUDED.min_order_value,
    expires_at = EXCLUDED.expires_at;
