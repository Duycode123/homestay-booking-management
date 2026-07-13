BEGIN;

ALTER TYPE vai_tro RENAME TO role;

ALTER TYPE trang_thai_phong RENAME TO room_status;
ALTER TYPE room_status RENAME VALUE 'TRONG' TO 'AVAILABLE';
ALTER TYPE room_status RENAME VALUE 'DANG_DUNG' TO 'IN_USE';
ALTER TYPE room_status RENAME VALUE 'BAO_TRI' TO 'MAINTENANCE';

ALTER TYPE trang_thai_dat_phong RENAME TO booking_status;
ALTER TYPE booking_status RENAME VALUE 'CHO_THANH_TOAN' TO 'PENDING_PAYMENT';
ALTER TYPE booking_status RENAME VALUE 'DA_THANH_TOAN' TO 'PAID';
ALTER TYPE booking_status RENAME VALUE 'DA_CHECKIN' TO 'CHECKED_IN';
ALTER TYPE booking_status RENAME VALUE 'HOAN_TAT' TO 'COMPLETED';
ALTER TYPE booking_status RENAME VALUE 'DA_HUY' TO 'CANCELLED';

ALTER TYPE phuong_thuc_thanh_toan RENAME TO payment_method;
ALTER TYPE payment_method RENAME VALUE 'TIEN_MAT' TO 'CASH';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cong_thanh_toan') THEN
        ALTER TYPE cong_thanh_toan RENAME TO payment_provider;
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_giao_dich') THEN
        ALTER TYPE trang_thai_giao_dich RENAME TO payment_transaction_status;
        ALTER TYPE payment_transaction_status RENAME VALUE 'KHOI_TAO' TO 'INITIALIZED';
        ALTER TYPE payment_transaction_status RENAME VALUE 'CHO_THANH_TOAN' TO 'PENDING';
        ALTER TYPE payment_transaction_status RENAME VALUE 'THANH_CONG' TO 'SUCCEEDED';
        ALTER TYPE payment_transaction_status RENAME VALUE 'THAT_BAI' TO 'FAILED';
        ALTER TYPE payment_transaction_status RENAME VALUE 'DA_HUY' TO 'CANCELLED';
    END IF;
END
$$;

ALTER TABLE tai_khoan RENAME TO account;
ALTER TABLE account RENAME COLUMN mat_khau_hash TO password_hash;
ALTER TABLE account RENAME COLUMN vai_tro TO role;
ALTER TABLE account RENAME COLUMN ngay_tao TO created_at;

ALTER TABLE khach_hang RENAME TO customer;
ALTER TABLE customer RENAME COLUMN tai_khoan_id TO account_id;
ALTER TABLE customer RENAME COLUMN ho_ten TO full_name;
ALTER TABLE customer RENAME COLUMN so_dien_thoai TO phone_number;
ALTER TABLE customer RENAME COLUMN ngay_sinh TO date_of_birth;

ALTER TABLE nhan_vien RENAME TO staff;
ALTER TABLE staff RENAME COLUMN tai_khoan_id TO account_id;
ALTER TABLE staff RENAME COLUMN ho_ten TO full_name;
ALTER TABLE staff RENAME COLUMN so_dien_thoai TO phone_number;
ALTER TABLE staff RENAME COLUMN ngay_sinh TO date_of_birth;

ALTER TABLE hang_phong RENAME TO room_tier;
ALTER TABLE room_tier RENAME COLUMN ten_hang TO name;
ALTER TABLE room_tier RENAME COLUMN mo_ta TO description;
ALTER TABLE room_tier RENAME COLUMN gia_gio TO hourly_rate;

ALTER TABLE phong RENAME TO room;
ALTER TABLE room RENAME COLUMN ten TO name;
ALTER TABLE room RENAME COLUMN hang_phong_id TO room_tier_id;
ALTER TABLE room RENAME COLUMN trang_thai TO status;

ALTER TABLE dat_phong RENAME TO booking;
ALTER TABLE booking RENAME COLUMN khach_hang_id TO customer_id;
ALTER TABLE booking RENAME COLUMN phong_id TO room_id;
ALTER TABLE booking RENAME COLUMN gio_bat_dau TO start_time;
ALTER TABLE booking RENAME COLUMN gio_ket_thuc TO end_time;
ALTER TABLE booking RENAME COLUMN phuong_thuc TO payment_method;
ALTER TABLE booking RENAME COLUMN gia_gio_ap_dung TO applied_hourly_rate;
ALTER TABLE booking RENAME COLUMN tong_tien TO total_price;
ALTER TABLE booking RENAME COLUMN trang_thai TO status;
ALTER TABLE booking RENAME COLUMN ghi_chu TO notes;
ALTER TABLE booking RENAME COLUMN ghi_chu_nhac_cu TO equipment_notes;
ALTER TABLE booking RENAME COLUMN ngay_tao TO created_at;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'giao_dich_thanh_toan'
    ) THEN
        ALTER TABLE giao_dich_thanh_toan RENAME TO payment_transaction;
        ALTER TABLE payment_transaction RENAME COLUMN dat_phong_id TO booking_id;
        ALTER TABLE payment_transaction RENAME COLUMN cong_thanh_toan TO provider;
        ALTER TABLE payment_transaction RENAME COLUMN ma_giao_dich TO transaction_reference;
        ALTER TABLE payment_transaction RENAME COLUMN ma_giao_dich_cong TO provider_transaction_id;
        ALTER TABLE payment_transaction RENAME COLUMN so_tien TO amount;
        ALTER TABLE payment_transaction RENAME COLUMN trang_thai TO status;
        ALTER TABLE payment_transaction RENAME COLUMN ma_phan_hoi TO response_code;
        ALTER TABLE payment_transaction RENAME COLUMN thoi_gian_thanh_toan TO paid_at;
        ALTER TABLE payment_transaction RENAME COLUMN ngay_tao TO created_at;
        ALTER TABLE payment_transaction RENAME COLUMN ngay_cap_nhat TO updated_at;
    END IF;
END
$$;

COMMIT;
