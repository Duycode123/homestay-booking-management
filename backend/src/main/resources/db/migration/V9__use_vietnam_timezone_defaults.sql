ALTER TABLE booking
    ALTER COLUMN created_at SET DEFAULT timezone('Asia/Ho_Chi_Minh', now());

ALTER TABLE payment_transaction
    ALTER COLUMN created_at SET DEFAULT timezone('Asia/Ho_Chi_Minh', now()),
    ALTER COLUMN updated_at SET DEFAULT timezone('Asia/Ho_Chi_Minh', now());

ALTER TABLE app_notification
    ALTER COLUMN created_at SET DEFAULT timezone('Asia/Ho_Chi_Minh', now());
