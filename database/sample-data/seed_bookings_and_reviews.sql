BEGIN;

-- This script targets the English schema (`customer`, `room`, `booking`, `review`, `review_response`).
-- It intentionally does not create `account`, `customer`, or `payment_transaction` data.
-- Instead, it reuses the first 3 existing customers and the seeded sample rooms.
DO $$
DECLARE
    available_customer_count integer;
    required_room_count integer;
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'account'
    ) THEN
        RAISE EXCEPTION 'account table not found. Apply the English schema migrations first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'customer'
    ) THEN
        RAISE EXCEPTION 'customer table not found. Apply the English schema migrations first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'room'
    ) THEN
        RAISE EXCEPTION 'room table not found. Apply the English schema migrations first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'room_tier'
    ) THEN
        RAISE EXCEPTION 'room_tier table not found. Apply the English schema migrations first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'booking'
    ) THEN
        RAISE EXCEPTION 'booking table not found. Apply the English schema migrations first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'review'
    ) THEN
        RAISE EXCEPTION 'review table not found. Apply the English schema migrations first.';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'review_response'
    ) THEN
        RAISE EXCEPTION 'review_response table not found. Apply the review response migration first.';
    END IF;

    SELECT COUNT(*)
    INTO available_customer_count
    FROM (
        SELECT id
        FROM customer
        ORDER BY id
        LIMIT 3
    ) existing_customers;

    IF available_customer_count < 3 THEN
        RAISE EXCEPTION 'Need at least 3 existing customers before seeding bookings and reviews.';
    END IF;

    SELECT COUNT(*)
    INTO required_room_count
    FROM room
    WHERE name IN (
        'Standard Garden 101',
        'Standard Garden 102',
        'Deluxe Balcony 201',
        'Deluxe City View 202',
        'Family Suite 301',
        'Family Garden 302'
    );

    IF required_room_count < 6 THEN
        RAISE EXCEPTION 'Required sample rooms are missing. Run database/sample-data/seed_rooms_and_equipment.sql first.';
    END IF;
END
$$;

WITH selected_customers AS (
    SELECT id,
           row_number() OVER (ORDER BY id) AS customer_slot
    FROM customer
    ORDER BY id
    LIMIT 3
),
sample_booking_templates(seed_key, customer_slot, room_name, start_time, end_time, payment_method, status, equipment_notes, note_body) AS (
    VALUES
        (
            'booking-01',
            1,
            'Standard Garden 101',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '2 day' + INTERVAL '18 hour',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '2 day' + INTERVAL '20 hour',
            'CASH',
            'PENDING_PAYMENT',
            'Please ensure Wi-Fi and the smart TV are ready before check-in.',
            'Upcoming Standard room stay for a weekend trip.'
        ),
        (
            'booking-02',
            2,
            'Deluxe Balcony 201',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '5 day' + INTERVAL '19 hour',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '5 day' + INTERVAL '22 hour',
            'ONLINE',
            'PAID',
            'Please prepare the extra bed and confirm hot water before check-in.',
            'Paid Deluxe room stay for a small group trip.'
        ),
        (
            'booking-03',
            3,
            'Deluxe City View 202',
            CURRENT_TIMESTAMP - INTERVAL '45 minute',
            CURRENT_TIMESTAMP + INTERVAL '1 hour' + INTERVAL '15 minute',
            'ONLINE',
            'CHECKED_IN',
            'Customer requested a quick monitor balance check on arrival.',
            'Ongoing evening homestay booking that is already checked in.'
        ),
        (
            'booking-04',
            1,
            'Family Suite 301',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '8 day' + INTERVAL '16 hour',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '8 day' + INTERVAL '19 hour',
            'ONLINE',
            'COMPLETED',
            'Please prepare stable Wi-Fi, the smart TV, and hot water before check-in.',
            'Completed Family room stay with a positive amenity review.'
        ),
        (
            'booking-05',
            2,
            'Standard Garden 102',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '4 day' + INTERVAL '18 hour',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '4 day' + INTERVAL '21 hour',
            'CASH',
            'COMPLETED',
            'Need stable Wi-Fi and the smart TV prepared for the family.',
            'Completed trio practice session before cafe live set.'
        ),
        (
            'booking-06',
            3,
            'Family Garden 302',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '9 day' + INTERVAL '18 hour',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '9 day' + INTERVAL '21 hour',
            'ONLINE',
            'CANCELLED',
            'Requested live room scene setup, later cancelled by staff.',
            'Cancelled homestay booking after the room maintenance schedule changed.'
        ),
        (
            'booking-07',
            1,
            'Standard Garden 101',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '2 day' + INTERVAL '14 hour',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '2 day' + INTERVAL '16 hour',
            'CASH',
            'COMPLETED',
            'Need metronome feed in headphones only.',
            'Completed personal drill session that is still awaiting a review.'
        )
),
resolved_sample_bookings AS (
    SELECT
        t.seed_key,
        c.id AS customer_id,
        r.id AS room_id,
        date_trunc('minute', t.start_time) AS start_time,
        date_trunc('minute', t.end_time) AS end_time,
        t.payment_method::payment_method AS payment_method,
        rt.hourly_rate AS applied_hourly_rate,
        ROUND((EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 3600.0 * rt.hourly_rate)::numeric, 2) AS total_price,
        t.status::booking_status AS status,
        t.equipment_notes,
        t.note_body || ' [seed:' || t.seed_key || ']' AS notes
    FROM sample_booking_templates t
    JOIN selected_customers c ON c.customer_slot = t.customer_slot
    JOIN room r ON r.name = t.room_name
    JOIN room_tier rt ON rt.id = r.room_tier_id
)
UPDATE booking b
SET customer_id = sample.customer_id,
    room_id = sample.room_id,
    start_time = sample.start_time,
    end_time = sample.end_time,
    payment_method = sample.payment_method,
    applied_hourly_rate = sample.applied_hourly_rate,
    total_price = sample.total_price,
    status = sample.status,
    equipment_notes = sample.equipment_notes,
    notes = sample.notes
FROM resolved_sample_bookings sample
WHERE b.notes LIKE '%[seed:' || sample.seed_key || ']%';

WITH selected_customers AS (
    SELECT id,
           row_number() OVER (ORDER BY id) AS customer_slot
    FROM customer
    ORDER BY id
    LIMIT 3
),
sample_booking_templates(seed_key, customer_slot, room_name, start_time, end_time, payment_method, status, equipment_notes, note_body) AS (
    VALUES
        (
            'booking-01',
            1,
            'Standard Garden 101',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '2 day' + INTERVAL '18 hour',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '2 day' + INTERVAL '20 hour',
            'CASH',
            'PENDING_PAYMENT',
            'Please ensure Wi-Fi and the smart TV are ready before check-in.',
            'Upcoming Standard room stay for a weekend trip.'
        ),
        (
            'booking-02',
            2,
            'Deluxe Balcony 201',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '5 day' + INTERVAL '19 hour',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '5 day' + INTERVAL '22 hour',
            'ONLINE',
            'PAID',
            'Please prepare the extra bed and confirm hot water before check-in.',
            'Paid Deluxe room stay for a small group trip.'
        ),
        (
            'booking-03',
            3,
            'Deluxe City View 202',
            CURRENT_TIMESTAMP - INTERVAL '45 minute',
            CURRENT_TIMESTAMP + INTERVAL '1 hour' + INTERVAL '15 minute',
            'ONLINE',
            'CHECKED_IN',
            'Customer requested a quick monitor balance check on arrival.',
            'Ongoing evening homestay booking that is already checked in.'
        ),
        (
            'booking-04',
            1,
            'Family Suite 301',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '8 day' + INTERVAL '16 hour',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '8 day' + INTERVAL '19 hour',
            'ONLINE',
            'COMPLETED',
            'Please prepare stable Wi-Fi, the smart TV, and hot water before check-in.',
            'Completed Family room stay with a positive amenity review.'
        ),
        (
            'booking-05',
            2,
            'Standard Garden 102',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '4 day' + INTERVAL '18 hour',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '4 day' + INTERVAL '21 hour',
            'CASH',
            'COMPLETED',
            'Need stable Wi-Fi and the smart TV prepared for the family.',
            'Completed trio practice session before cafe live set.'
        ),
        (
            'booking-06',
            3,
            'Family Garden 302',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '9 day' + INTERVAL '18 hour',
            date_trunc('day', CURRENT_TIMESTAMP) + INTERVAL '9 day' + INTERVAL '21 hour',
            'ONLINE',
            'CANCELLED',
            'Requested live room scene setup, later cancelled by staff.',
            'Cancelled homestay booking after the room maintenance schedule changed.'
        ),
        (
            'booking-07',
            1,
            'Standard Garden 101',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '2 day' + INTERVAL '14 hour',
            date_trunc('day', CURRENT_TIMESTAMP) - INTERVAL '2 day' + INTERVAL '16 hour',
            'CASH',
            'COMPLETED',
            'Need metronome feed in headphones only.',
            'Completed personal drill session that is still awaiting a review.'
        )
),
resolved_sample_bookings AS (
    SELECT
        t.seed_key,
        c.id AS customer_id,
        r.id AS room_id,
        date_trunc('minute', t.start_time) AS start_time,
        date_trunc('minute', t.end_time) AS end_time,
        t.payment_method::payment_method AS payment_method,
        rt.hourly_rate AS applied_hourly_rate,
        ROUND((EXTRACT(EPOCH FROM (t.end_time - t.start_time)) / 3600.0 * rt.hourly_rate)::numeric, 2) AS total_price,
        t.status::booking_status AS status,
        t.equipment_notes,
        t.note_body || ' [seed:' || t.seed_key || ']' AS notes
    FROM sample_booking_templates t
    JOIN selected_customers c ON c.customer_slot = t.customer_slot
    JOIN room r ON r.name = t.room_name
    JOIN room_tier rt ON rt.id = r.room_tier_id
)
INSERT INTO booking (
    customer_id,
    room_id,
    start_time,
    end_time,
    payment_method,
    applied_hourly_rate,
    total_price,
    status,
    equipment_notes,
    notes
)
SELECT
    sample.customer_id,
    sample.room_id,
    sample.start_time,
    sample.end_time,
    sample.payment_method,
    sample.applied_hourly_rate,
    sample.total_price,
    sample.status,
    sample.equipment_notes,
    sample.notes
FROM resolved_sample_bookings sample
WHERE NOT EXISTS (
    SELECT 1
    FROM booking b
    WHERE b.notes LIKE '%[seed:' || sample.seed_key || ']%'
);

WITH sample_reviews(seed_key, rating, content, approved) AS (
    VALUES
        (
            'booking-04',
            5,
            'Clean room, stable Wi-Fi, comfortable air conditioning, and helpful staff.',
            true
        ),
        (
            'booking-05',
            4,
            'Good energy and useful room layout, but one mic stand felt loose near the end of the session.',
            false
        )
),
resolved_sample_reviews AS (
    SELECT
        b.id AS booking_id,
        sample.rating,
        sample.content,
        sample.approved
    FROM sample_reviews sample
    JOIN booking b ON b.notes LIKE '%[seed:' || sample.seed_key || ']%'
)
UPDATE review r
SET rating = sample.rating,
    content = sample.content,
    approved = sample.approved
FROM resolved_sample_reviews sample
WHERE r.booking_id = sample.booking_id;

WITH sample_reviews(seed_key, rating, content, approved) AS (
    VALUES
        (
            'booking-04',
            5,
            'Clean room, stable Wi-Fi, comfortable air conditioning, and helpful staff.',
            true
        ),
        (
            'booking-05',
            4,
            'Good energy and useful room layout, but one mic stand felt loose near the end of the session.',
            false
        )
),
resolved_sample_reviews AS (
    SELECT
        b.id AS booking_id,
        sample.rating,
        sample.content,
        sample.approved
    FROM sample_reviews sample
    JOIN booking b ON b.notes LIKE '%[seed:' || sample.seed_key || ']%'
)
INSERT INTO review (
    booking_id,
    rating,
    content,
    approved
)
SELECT
    sample.booking_id,
    sample.rating,
    sample.content,
    sample.approved
FROM resolved_sample_reviews sample
WHERE NOT EXISTS (
    SELECT 1
    FROM review r
    WHERE r.booking_id = sample.booking_id
);

WITH selected_admin AS (
    SELECT id
    FROM account
    WHERE role = 'ADMIN'::role
    ORDER BY id
    LIMIT 1
),
sample_review_responses(seed_key, content) AS (
    VALUES
        (
            'booking-04',
            'Thanks for the thoughtful feedback. We have noted your preferred monitoring setup for future sessions.'
        )
),
resolved_sample_review_responses AS (
    SELECT
        r.id AS review_id,
        admin.id AS responder_id,
        sample.content
    FROM sample_review_responses sample
    JOIN booking b ON b.notes LIKE '%[seed:' || sample.seed_key || ']%'
    JOIN review r ON r.booking_id = b.id
    JOIN selected_admin admin ON true
)
UPDATE review_response rr
SET responder_id = sample.responder_id,
    content = sample.content,
    updated_at = CURRENT_TIMESTAMP
FROM resolved_sample_review_responses sample
WHERE rr.review_id = sample.review_id;

WITH selected_admin AS (
    SELECT id
    FROM account
    WHERE role = 'ADMIN'::role
    ORDER BY id
    LIMIT 1
),
sample_review_responses(seed_key, content) AS (
    VALUES
        (
            'booking-04',
            'Thanks for the thoughtful feedback. We have noted your preferred monitoring setup for future sessions.'
        )
),
resolved_sample_review_responses AS (
    SELECT
        r.id AS review_id,
        admin.id AS responder_id,
        sample.content
    FROM sample_review_responses sample
    JOIN booking b ON b.notes LIKE '%[seed:' || sample.seed_key || ']%'
    JOIN review r ON r.booking_id = b.id
    JOIN selected_admin admin ON true
)
INSERT INTO review_response (
    review_id,
    responder_id,
    content
)
SELECT
    sample.review_id,
    sample.responder_id,
    sample.content
FROM resolved_sample_review_responses sample
WHERE NOT EXISTS (
    SELECT 1
    FROM review_response rr
    WHERE rr.review_id = sample.review_id
);

COMMIT;
