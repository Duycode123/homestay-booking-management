BEGIN;

-- Tài khoản demo dùng chung mật khẩu: Admin@123
WITH sample_accounts(email, password_hash, role) AS (
    VALUES
        ('minh.nguyen@homestay.local', '$2a$10$GvWVKahyW48qvHRAsjGbYOXoFz3b/cDSykbxByfHGnCFw/oIvOuZS', 'CUSTOMER'),
        ('lan.tran@homestay.local', '$2a$10$GvWVKahyW48qvHRAsjGbYOXoFz3b/cDSykbxByfHGnCFw/oIvOuZS', 'CUSTOMER'),
        ('family.le@homestay.local', '$2a$10$GvWVKahyW48qvHRAsjGbYOXoFz3b/cDSykbxByfHGnCFw/oIvOuZS', 'CUSTOMER')
)
INSERT INTO account (email, password_hash, role, email_verified, enabled)
SELECT email, password_hash, role::role, true, true
FROM sample_accounts
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    email_verified = true,
    enabled = true;

WITH sample_customers(email, full_name, phone_number, date_of_birth) AS (
    VALUES
        ('minh.nguyen@homestay.local', 'Nguyễn Hoàng Minh', '0901000001', DATE '1995-04-12'),
        ('lan.tran@homestay.local', 'Trần Ngọc Lan', '0901000002', DATE '1998-09-23'),
        ('family.le@homestay.local', 'Gia đình Lê', '0901000003', DATE '1990-01-15')
)
UPDATE customer
SET full_name = sample_customers.full_name,
    phone_number = sample_customers.phone_number,
    email = sample_customers.email,
    date_of_birth = sample_customers.date_of_birth
FROM sample_customers
JOIN account ON account.email = sample_customers.email
WHERE customer.account_id = account.id;

WITH sample_customers(email, full_name, phone_number, date_of_birth) AS (
    VALUES
        ('minh.nguyen@homestay.local', 'Nguyễn Hoàng Minh', '0901000001', DATE '1995-04-12'),
        ('lan.tran@homestay.local', 'Trần Ngọc Lan', '0901000002', DATE '1998-09-23'),
        ('family.le@homestay.local', 'Gia đình Lê', '0901000003', DATE '1990-01-15')
)
INSERT INTO customer (account_id, full_name, phone_number, email, date_of_birth)
SELECT account.id, sample_customers.full_name, sample_customers.phone_number,
       sample_customers.email, sample_customers.date_of_birth
FROM sample_customers
JOIN account ON account.email = sample_customers.email
WHERE NOT EXISTS (SELECT 1 FROM customer WHERE customer.account_id = account.id);

COMMIT;
