
BEGIN;

-- Complete the Vietnamese-to-English rename for legacy enum types and values.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loai_giam_gia') THEN
        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'loai_giam_gia'
              AND e.enumlabel = 'PHAN_TRAM'
        ) THEN
            ALTER TYPE loai_giam_gia RENAME VALUE 'PHAN_TRAM' TO 'PERCENTAGE';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'loai_giam_gia'
              AND e.enumlabel = 'SO_TIEN'
        ) THEN
            ALTER TYPE loai_giam_gia RENAME VALUE 'SO_TIEN' TO 'FIXED_AMOUNT';
        END IF;

        ALTER TYPE loai_giam_gia RENAME TO discount_type;
    ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discount_type') THEN
        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'discount_type'
              AND e.enumlabel = 'PHAN_TRAM'
        ) THEN
            ALTER TYPE discount_type RENAME VALUE 'PHAN_TRAM' TO 'PERCENTAGE';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'discount_type'
              AND e.enumlabel = 'SO_TIEN'
        ) THEN
            ALTER TYPE discount_type RENAME VALUE 'SO_TIEN' TO 'FIXED_AMOUNT';
        END IF;
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_ca') THEN
        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'trang_thai_ca'
              AND e.enumlabel = 'DA_PHAN'
        ) THEN
            ALTER TYPE trang_thai_ca RENAME VALUE 'DA_PHAN' TO 'ASSIGNED';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'trang_thai_ca'
              AND e.enumlabel = 'DANG_LAM'
        ) THEN
            ALTER TYPE trang_thai_ca RENAME VALUE 'DANG_LAM' TO 'IN_PROGRESS';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'trang_thai_ca'
              AND e.enumlabel = 'HOAN_TAT'
        ) THEN
            ALTER TYPE trang_thai_ca RENAME VALUE 'HOAN_TAT' TO 'COMPLETED';
        END IF;

        ALTER TYPE trang_thai_ca RENAME TO shift_status;
    ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shift_status') THEN
        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'shift_status'
              AND e.enumlabel = 'DA_PHAN'
        ) THEN
            ALTER TYPE shift_status RENAME VALUE 'DA_PHAN' TO 'ASSIGNED';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'shift_status'
              AND e.enumlabel = 'DANG_LAM'
        ) THEN
            ALTER TYPE shift_status RENAME VALUE 'DANG_LAM' TO 'IN_PROGRESS';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'shift_status'
              AND e.enumlabel = 'HOAN_TAT'
        ) THEN
            ALTER TYPE shift_status RENAME VALUE 'HOAN_TAT' TO 'COMPLETED';
        END IF;
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loai_thiet_bi') THEN
        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'loai_thiet_bi'
              AND e.enumlabel = 'TRONG'
        ) THEN
            ALTER TYPE loai_thiet_bi RENAME VALUE 'TRONG' TO 'DRUM';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'loai_thiet_bi'
              AND e.enumlabel = 'KHAC'
        ) THEN
            ALTER TYPE loai_thiet_bi RENAME VALUE 'KHAC' TO 'OTHER';
        END IF;

        ALTER TYPE loai_thiet_bi RENAME TO equipment_type;
    ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_type') THEN
        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'equipment_type'
              AND e.enumlabel = 'TRONG'
        ) THEN
            ALTER TYPE equipment_type RENAME VALUE 'TRONG' TO 'DRUM';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'equipment_type'
              AND e.enumlabel = 'KHAC'
        ) THEN
            ALTER TYPE equipment_type RENAME VALUE 'KHAC' TO 'OTHER';
        END IF;
    END IF;
END
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_thiet_bi') THEN
        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'trang_thai_thiet_bi'
              AND e.enumlabel = 'TOT'
        ) THEN
            ALTER TYPE trang_thai_thiet_bi RENAME VALUE 'TOT' TO 'GOOD';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'trang_thai_thiet_bi'
              AND e.enumlabel = 'HONG'
        ) THEN
            ALTER TYPE trang_thai_thiet_bi RENAME VALUE 'HONG' TO 'BROKEN';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'trang_thai_thiet_bi'
              AND e.enumlabel = 'BAO_TRI'
        ) THEN
            ALTER TYPE trang_thai_thiet_bi RENAME VALUE 'BAO_TRI' TO 'MAINTENANCE';
        END IF;

        ALTER TYPE trang_thai_thiet_bi RENAME TO equipment_status;
    ELSIF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'equipment_status') THEN
        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'equipment_status'
              AND e.enumlabel = 'TOT'
        ) THEN
            ALTER TYPE equipment_status RENAME VALUE 'TOT' TO 'GOOD';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'equipment_status'
              AND e.enumlabel = 'HONG'
        ) THEN
            ALTER TYPE equipment_status RENAME VALUE 'HONG' TO 'BROKEN';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM pg_enum e
            JOIN pg_type t ON t.oid = e.enumtypid
            WHERE t.typname = 'equipment_status'
              AND e.enumlabel = 'BAO_TRI'
        ) THEN
            ALTER TYPE equipment_status RENAME VALUE 'BAO_TRI' TO 'MAINTENANCE';
        END IF;
    END IF;
END
$$;

-- Rename remaining Vietnamese tables to English target names.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'thiet_bi'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'equipment'
    ) THEN
        ALTER TABLE thiet_bi RENAME TO equipment;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'ma_giam_gia'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'discount_code'
    ) THEN
        ALTER TABLE ma_giam_gia RENAME TO discount_code;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'lich_su_trang_thai_dat_phong'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'booking_status_history'
    ) THEN
        ALTER TABLE lich_su_trang_thai_dat_phong RENAME TO booking_status_history;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'danh_gia'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'review'
    ) THEN
        ALTER TABLE danh_gia RENAME TO review;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'ca_lam'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'shift'
    ) THEN
        ALTER TABLE ca_lam RENAME TO shift;
    END IF;
END
$$;

-- Rename columns that are still using Vietnamese names.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'booking'
          AND column_name = 'ma_giam_gia_id'
    ) THEN
        ALTER TABLE booking RENAME COLUMN ma_giam_gia_id TO discount_code_id;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'booking'
          AND column_name = 'nhan_vien_checkin_id'
    ) THEN
        ALTER TABLE booking RENAME COLUMN nhan_vien_checkin_id TO checkin_staff_id;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'booking'
          AND column_name = 'gio_checkin'
    ) THEN
        ALTER TABLE booking RENAME COLUMN gio_checkin TO checkin_time;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'booking'
          AND column_name = 'gio_checkout'
    ) THEN
        ALTER TABLE booking RENAME COLUMN gio_checkout TO checkout_time;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'equipment'
          AND column_name = 'phong_id'
    ) THEN
        ALTER TABLE equipment RENAME COLUMN phong_id TO room_id;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'equipment'
          AND column_name = 'loai'
    ) THEN
        ALTER TABLE equipment RENAME COLUMN loai TO type;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'equipment'
          AND column_name = 'ten'
    ) THEN
        ALTER TABLE equipment RENAME COLUMN ten TO name;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'equipment'
          AND column_name = 'trang_thai'
    ) THEN
        ALTER TABLE equipment RENAME COLUMN trang_thai TO status;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'equipment'
          AND column_name = 'ghi_chu'
    ) THEN
        ALTER TABLE equipment RENAME COLUMN ghi_chu TO notes;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'discount_code'
          AND column_name = 'ma'
    ) THEN
        ALTER TABLE discount_code RENAME COLUMN ma TO code;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'discount_code'
          AND column_name = 'loai'
    ) THEN
        ALTER TABLE discount_code RENAME COLUMN loai TO type;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'discount_code'
          AND column_name = 'gia_tri'
    ) THEN
        ALTER TABLE discount_code RENAME COLUMN gia_tri TO value;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'discount_code'
          AND column_name = 'dieu_kien_min'
    ) THEN
        ALTER TABLE discount_code RENAME COLUMN dieu_kien_min TO min_order_value;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'discount_code'
          AND column_name = 'ngay_het_han'
    ) THEN
        ALTER TABLE discount_code RENAME COLUMN ngay_het_han TO expires_at;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'booking_status_history'
          AND column_name = 'dat_phong_id'
    ) THEN
        ALTER TABLE booking_status_history RENAME COLUMN dat_phong_id TO booking_id;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'booking_status_history'
          AND column_name = 'trang_thai_cu'
    ) THEN
        ALTER TABLE booking_status_history RENAME COLUMN trang_thai_cu TO old_status;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'booking_status_history'
          AND column_name = 'trang_thai_moi'
    ) THEN
        ALTER TABLE booking_status_history RENAME COLUMN trang_thai_moi TO new_status;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'booking_status_history'
          AND column_name = 'ghi_chu'
    ) THEN
        ALTER TABLE booking_status_history RENAME COLUMN ghi_chu TO notes;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'booking_status_history'
          AND column_name = 'thoi_gian'
    ) THEN
        ALTER TABLE booking_status_history RENAME COLUMN thoi_gian TO changed_at;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'booking_status_history'
          AND column_name = 'thuc_hien_boi'
    ) THEN
        ALTER TABLE booking_status_history RENAME COLUMN thuc_hien_boi TO changed_by;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'review'
          AND column_name = 'dat_phong_id'
    ) THEN
        ALTER TABLE review RENAME COLUMN dat_phong_id TO booking_id;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'review'
          AND column_name = 'diem'
    ) THEN
        ALTER TABLE review RENAME COLUMN diem TO rating;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'review'
          AND column_name = 'noi_dung'
    ) THEN
        ALTER TABLE review RENAME COLUMN noi_dung TO content;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'review'
          AND column_name = 'da_duyet'
    ) THEN
        ALTER TABLE review RENAME COLUMN da_duyet TO approved;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'review'
          AND column_name = 'ngay_tao'
    ) THEN
        ALTER TABLE review RENAME COLUMN ngay_tao TO created_at;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'shift'
          AND column_name = 'nhan_vien_id'
    ) THEN
        ALTER TABLE shift RENAME COLUMN nhan_vien_id TO staff_id;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'shift'
          AND column_name = 'ngay'
    ) THEN
        ALTER TABLE shift RENAME COLUMN ngay TO date;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'shift'
          AND column_name = 'gio_bat_dau'
    ) THEN
        ALTER TABLE shift RENAME COLUMN gio_bat_dau TO start_time;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'shift'
          AND column_name = 'gio_ket_thuc'
    ) THEN
        ALTER TABLE shift RENAME COLUMN gio_ket_thuc TO end_time;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'shift'
          AND column_name = 'trang_thai'
    ) THEN
        ALTER TABLE shift RENAME COLUMN trang_thai TO status;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'shift'
          AND column_name = 'diem_chat_luong'
    ) THEN
        ALTER TABLE shift RENAME COLUMN diem_chat_luong TO quality_rating;
    END IF;
END
$$;

-- Rename explicitly named constraints to match the English schema.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'booking'
    ) THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_dat_phong_checkin_checkout') THEN
            ALTER TABLE booking RENAME CONSTRAINT chk_dat_phong_checkin_checkout TO chk_booking_checkin_checkout;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_dat_phong_gia_gio_ap_dung') THEN
            ALTER TABLE booking RENAME CONSTRAINT chk_dat_phong_gia_gio_ap_dung TO chk_booking_applied_hourly_rate_positive;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_dat_phong_khoang_thoi_gian') THEN
            ALTER TABLE booking RENAME CONSTRAINT chk_dat_phong_khoang_thoi_gian TO chk_booking_time_range;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_dat_phong_tong_tien') THEN
            ALTER TABLE booking RENAME CONSTRAINT chk_dat_phong_tong_tien TO chk_booking_total_price_non_negative;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dat_phong_pkey') THEN
            ALTER TABLE booking RENAME CONSTRAINT dat_phong_pkey TO booking_pkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dat_phong_khach_hang_id_fkey') THEN
            ALTER TABLE booking RENAME CONSTRAINT dat_phong_khach_hang_id_fkey TO booking_customer_id_fkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dat_phong_ma_giam_gia_id_fkey') THEN
            ALTER TABLE booking RENAME CONSTRAINT dat_phong_ma_giam_gia_id_fkey TO booking_discount_code_id_fkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dat_phong_nhan_vien_checkin_id_fkey') THEN
            ALTER TABLE booking RENAME CONSTRAINT dat_phong_nhan_vien_checkin_id_fkey TO booking_checkin_staff_id_fkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dat_phong_phong_id_fkey') THEN
            ALTER TABLE booking RENAME CONSTRAINT dat_phong_phong_id_fkey TO booking_room_id_fkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'excl_dat_phong_khong_trung_lich') THEN
            ALTER TABLE booking RENAME CONSTRAINT excl_dat_phong_khong_trung_lich TO excl_booking_no_overlap;
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'discount_code'
    ) THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ma_giam_gia_dieu_kien_min') THEN
            ALTER TABLE discount_code RENAME CONSTRAINT chk_ma_giam_gia_dieu_kien_min TO chk_discount_code_min_order_value_non_negative;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ma_giam_gia_gia_tri_duong') THEN
            ALTER TABLE discount_code RENAME CONSTRAINT chk_ma_giam_gia_gia_tri_duong TO chk_discount_code_value_positive;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ma_giam_gia_phan_tram') THEN
            ALTER TABLE discount_code RENAME CONSTRAINT chk_ma_giam_gia_phan_tram TO chk_discount_code_percentage_value;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ma_giam_gia_pkey') THEN
            ALTER TABLE discount_code RENAME CONSTRAINT ma_giam_gia_pkey TO discount_code_pkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ma_giam_gia_ma_key') THEN
            ALTER TABLE discount_code RENAME CONSTRAINT ma_giam_gia_ma_key TO discount_code_code_key;
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'booking_status_history'
    ) THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lich_su_trang_thai_dat_phong_pkey') THEN
            ALTER TABLE booking_status_history RENAME CONSTRAINT lich_su_trang_thai_dat_phong_pkey TO booking_status_history_pkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lich_su_trang_thai_dat_phong_dat_phong_id_fkey') THEN
            ALTER TABLE booking_status_history RENAME CONSTRAINT lich_su_trang_thai_dat_phong_dat_phong_id_fkey TO booking_status_history_booking_id_fkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lich_su_trang_thai_dat_phong_thuc_hien_boi_fkey') THEN
            ALTER TABLE booking_status_history RENAME CONSTRAINT lich_su_trang_thai_dat_phong_thuc_hien_boi_fkey TO booking_status_history_changed_by_fkey;
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'review'
    ) THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_danh_gia_diem') THEN
            ALTER TABLE review RENAME CONSTRAINT chk_danh_gia_diem TO chk_review_rating_range;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'danh_gia_pkey') THEN
            ALTER TABLE review RENAME CONSTRAINT danh_gia_pkey TO review_pkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'danh_gia_dat_phong_id_fkey') THEN
            ALTER TABLE review RENAME CONSTRAINT danh_gia_dat_phong_id_fkey TO review_booking_id_fkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'danh_gia_dat_phong_id_key') THEN
            ALTER TABLE review RENAME CONSTRAINT danh_gia_dat_phong_id_key TO review_booking_id_key;
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'shift'
    ) THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ca_lam_diem_chat_luong') THEN
            ALTER TABLE shift RENAME CONSTRAINT chk_ca_lam_diem_chat_luong TO chk_shift_quality_rating_range;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_ca_lam_khoang_thoi_gian') THEN
            ALTER TABLE shift RENAME CONSTRAINT chk_ca_lam_khoang_thoi_gian TO chk_shift_time_range;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ca_lam_pkey') THEN
            ALTER TABLE shift RENAME CONSTRAINT ca_lam_pkey TO shift_pkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ca_lam_nhan_vien_id_fkey') THEN
            ALTER TABLE shift RENAME CONSTRAINT ca_lam_nhan_vien_id_fkey TO shift_staff_id_fkey;
        END IF;
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'excl_ca_lam_nhan_vien_khong_trung') THEN
            ALTER TABLE shift RENAME CONSTRAINT excl_ca_lam_nhan_vien_khong_trung TO excl_shift_staff_no_overlap;
        END IF;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'equipment'
    ) THEN
        IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'thiet_bi_pkey') THEN
            ALTER TABLE equipment RENAME CONSTRAINT thiet_bi_pkey TO equipment_pkey;
        END IF;
    END IF;
END
$$;

-- Rename non-constraint indexes that are still carrying Vietnamese names.
ALTER INDEX IF EXISTS idx_dat_phong_khach_hang_ngay_tao RENAME TO idx_booking_customer_created_at;
ALTER INDEX IF EXISTS idx_dat_phong_phong_thoi_gian RENAME TO idx_booking_room_start_end;
ALTER INDEX IF EXISTS idx_dat_phong_trang_thai_gio_bat_dau RENAME TO idx_booking_status_start_time;
ALTER INDEX IF EXISTS idx_thiet_bi_phong_loai RENAME TO idx_equipment_room_type;
ALTER INDEX IF EXISTS idx_lich_su_dat_phong_thoi_gian RENAME TO idx_booking_status_history_booking_changed_at;
ALTER INDEX IF EXISTS idx_ca_lam_nhan_vien_ngay RENAME TO idx_shift_staff_date;

COMMIT;
