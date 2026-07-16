# Database Documentation

This folder contains the repository-owned database documentation and migrations.

## Fresh Deployment Bootstrap

`Homestay_Database.sql` is the canonical PostgreSQL schema for a new database.
The production Flyway bootstrap files `V1__canonical_schema.sql` and
`V2__runtime_additions.sql` are frozen snapshots because Neon has already
recorded their checksums in `flyway_schema_history`. Never regenerate or edit
an applied migration; add the next numbered migration instead. Docker now
packages these immutable files directly from `backend/src/main/resources`.

Flyway runs the migrations before Hibernate validates the mapped schema. The
Docker build context remains the repository root because Render builds the
backend image from `backend/Dockerfile`.

## Current Source of Truth

Use the following order when reasoning about schema:

1. `database/Homestay_Database.sql` for a fresh English core schema
2. SQL migrations in `database/migrations/` for incremental/legacy upgrades
3. `database/schema-target-en.dbml` and this document
4. JPA/JDBC persistence mappings in `backend/src/main/java/backend/`
5. use case docs under `docs/use-cases/`
6. external SRS or backlog documents

## Setup Paths

- Fresh database: run `database/Homestay_Database.sql`. It contains the current runtime tables, constraints, indexes, and homestay enum values; do not replay the historical rename/content migrations on top of it. Apply only future migrations created after this canonical snapshot.
- Existing Vietnamese-named database: apply `20260628_rename_vn_schema_to_en.sql`, `20260630_complete_vn_schema_to_en.sql`, the remaining dated feature migrations, and finally `20260713_convert_legacy_to_homestay.sql`.
- Never run the Vietnamese-to-English rename migrations against a fresh database created from the current canonical schema.

## Current Schema Areas Visible In Source

The current backend source clearly models these areas:

- user and role data
- customer and staff identities
- room and room type data
- booking data
- discount code and coupon usage data
- review and admin review response data
- payment transaction data
- customer issue report data
- user notification settings data
- app notification data
- staff attendance data
- facility condition report data
- revoked token data

Core model/entity classes currently present in backend source:

- `User`
- `Customer`
- `Staff`
- `Room`
- `RoomType`
- `Equipment`
- `Booking`
- `DiscountCode`
- `CouponUsage`
- `Review`
- `ReviewAdminResponse`
- `PaymentTransaction`
- `CustomerIssueReport`
- `UserNotificationSettings`
- `AppNotification`
- `staff_attendance` table through the attendance JDBC adapter
- `facility_condition_report` table through the facility condition JDBC adapter
- `RevokedToken`

## Existing Files

- `database/Homestay_Database.sql`
- `database/migrations/20260624_create_payment_transactions.sql`
- `database/migrations/20260628_rename_vn_schema_to_en.sql`
- `database/migrations/20260630_complete_vn_schema_to_en.sql`
- `database/migrations/20260630_add_review_response_table.sql`
- `database/migrations/20260701_add_coupon_usage_and_sepay.sql`
- `database/migrations/20260701_add_customer_issue_report_and_counter_provider.sql`
- `database/migrations/20260701_create_app_notifications.sql`
- `database/migrations/20260702_add_facility_condition_report.sql`
- `database/migrations/20260702_optimize_reporting_indexes.sql`
- `database/migrations/20260703_add_room_image_and_capacity.sql`
- `database/migrations/20260703_create_staff_attendance.sql`
- `database/migrations/20260703_create_user_notification_settings.sql`
- `database/migrations/20260703_add_email_verification_to_account.sql`
- `database/migrations/20260703_add_account_avatar_url.sql`
- `database/migrations/20260706_add_deposit_paid_and_payment_timeout.sql`
- `database/migrations/20260707_widen_payment_response_code.sql`
- `database/migrations/20260708_add_app_notification_resolved.sql`
- `database/migrations/20260709_add_facility_condition_report_handling.sql`
- `database/migrations/20260713_convert_legacy_to_homestay.sql`
- `database/migrations/20260714_add_booking_cancellation_approval.sql`
- `database/migrations/20260714_create_favorite_rooms.sql`
- `database/migrations/20260714_expand_homestay_amenities_and_room_gallery.sql`
- `database/migrations/20260714_add_room_archiving.sql`
- `database/migrations/20260715_add_checkout_payment_operator.sql`
- `database/migrations/20260716_add_room_sleeping_layout.sql`
- `database/migrations/20260716_serialize_open_payment_sessions.sql`
- `database/sample-data/seed_accounts_and_customers.sql`
- `database/sample-data/seed_rooms_and_equipment.sql`
- `database/sample-data/seed_bookings_and_reviews.sql`
- `database/schema-target-en.dbml`

## Concurrency Constraints

- `excl_booking_no_overlap` prevents two blocking bookings from occupying the same room time range, even when requests reach different backend instances.
- `ux_payment_transaction_one_open_per_booking` permits at most one open (`INITIALIZED` or `PENDING`) payment session per booking. The migration closes older duplicate sessions before creating the index.
- Payment state changes lock booking first and payment transaction second; provider webhooks, polling, replacement QR creation, and expiry cleanup use the same order.
- Shift registration and attendance use transaction-scoped PostgreSQL advisory locks around check-then-write rules; existing database exclusion/unique constraints remain final safeguards.

## Sample Data

For local development or demo setup, `database/sample-data/seed_rooms_and_equipment.sql` inserts sample:

- `room_tier`
- `room`
- `equipment`

The room catalog contains 12 rooms with tier-specific equipment and amenities:

- 4 Standard rooms at `350,000 VND/hour`
- 4 Deluxe rooms at `550,000 VND/hour`
- 4 Family rooms at `750,000 VND/hour`

Each room includes the four core equipment records plus additional amenities by tier. Standard rooms receive essential work and refreshment items; Deluxe rooms add minibar, safe and lounge comforts; Family rooms add dining, food-warming and child-friendly amenities.

The script targets the English schema and is written to be rerun safely:

- existing room tiers are updated by `name`
- existing rooms are updated by `name`
- existing equipment rows are updated by `(room, name)`
- missing rows are inserted

Suggested usage after schema setup / rename migrations:

```powershell
psql -h 127.0.0.1 -p 5432 -U <user> -d homestaydb -f database/sample-data/seed_rooms_and_equipment.sql
```

To add only the tier-specific amenities to an existing room database without changing room status, price, or images:

```powershell
psql -h 127.0.0.1 -p 5432 -U <user> -d homestaydb -f database/sample-data/seed_tier_amenities.sql
```

Before booking/review data, seed three demo customer accounts. All demo accounts use password `Admin@123`:

```powershell
psql -h 127.0.0.1 -p 5432 -U <user> -d homestaydb -f database/sample-data/seed_accounts_and_customers.sql
```

For booking and review demos, `database/sample-data/seed_bookings_and_reviews.sql` inserts sample:

- `booking`
- `review`
- `review_response`

This script is also rerun-safe, but it intentionally does not seed `account`, `customer`, or `payment_transaction`:

- it reuses the first 3 existing customers ordered by `id`
- it expects the sample rooms from `seed_rooms_and_equipment.sql` to already exist
- sample bookings are matched by a stable `[seed:booking-xx]` marker embedded in `booking.notes`
- sample reviews are updated by `booking_id`
- sample review responses are inserted when at least one `ADMIN` account already exists

Suggested usage after customer data already exists:

```powershell
psql -h 127.0.0.1 -p 5432 -U <user> -d homestaydb -f database/sample-data/seed_bookings_and_reviews.sql
```

## Target Naming Direction

The enforced naming direction for this project is:

- English names
- `snake_case` for tables and columns
- English enum type names
- English enum values

The backend JPA mappings now target the English schema. Existing PostgreSQL databases that still use Vietnamese names must apply the phased rename migrations, including `database/migrations/20260628_rename_vn_schema_to_en.sql` and `database/migrations/20260630_complete_vn_schema_to_en.sql`, before running a backend build that includes the English mappings.

## Booking Cancellation Approval

`booking` stores the lifecycle of one customer cancellation request through `cancellation_request_status`:

- `PENDING`: the customer submitted a request at least 24 hours before check-in; the booking remains active.
- `APPROVED`: an admin approved the request, the booking became `CANCELLED`, and refund details were recorded.
- `REJECTED`: an admin rejected the request; the booking status remains unchanged.

Refund fields record the approved amount, percentage, method, and expected completion time. The amount is based on money actually collected and never exceeds the booking total. Existing databases must apply `database/migrations/20260714_add_booking_cancellation_approval.sql` before starting a backend build with schema validation enabled.

Do not mix new Vietnamese names into new schema work unless a task is strictly limited to keeping a legacy area stable.

## Room And Room Tier Archiving

Rooms and room tiers are archived rather than physically deleted so booking, payment, review, equipment, and reporting history remains valid.

- `room.status = INACTIVE` removes a room from the default active catalog.
- `room_tier.active = false` removes a tier from room-tier selection.
- Active bookings (`PENDING_PAYMENT`, `DEPOSIT_PAID`, `PAID`, `CHECKED_IN`) prevent room archiving.
- Historical bookings (`COMPLETED`, `CANCELLED`) do not prevent archiving.
- A room tier can be archived only after all rooms assigned to it are also archived or reassigned.

Existing databases must apply `database/migrations/20260714_add_room_archiving.sql`. With the current local configuration, restarting the backend also applies the equivalent idempotent additions from `schema-postgresql.sql` before Hibernate validation.

## Legacy To Current Mapping

This is the intended conceptual mapping for the core schema:

| Current name                   | Target name                                          |
| ------------------------------ | ---------------------------------------------------- |
| `tai_khoan`                    | `account`                                            |
| `khach_hang`                   | `customer`                                           |
| `nhan_vien`                    | `staff`                                              |
| `hang_phong`                   | `room_tier`                                          |
| `phong`                        | `room`                                               |
| `thiet_bi`                     | `equipment`                                          |
| `ma_giam_gia`                  | `discount_code`                                      |
| `dat_phong`                    | `booking`                                            |
| `giao_dich_thanh_toan`         | `payment_transaction` or future payment table family |
| `lich_su_trang_thai_dat_phong` | `booking_status_history`                             |
| `danh_gia`                     | `review`                                             |
| `ca_lam`                       | `shift`                                              |

Important enum mappings:

| Current enum type        | Target enum type   |
| ------------------------ | ------------------ |
| `vai_tro`                | `role`             |
| `trang_thai_phong`       | `room_status`      |
| `trang_thai_dat_phong`   | `booking_status`   |
| `phuong_thuc_thanh_toan` | `payment_method`   |
| `loai_giam_gia`          | `discount_type`    |
| `trang_thai_ca`          | `shift_status`     |
| `loai_thiet_bi`          | `equipment_type`   |
| `trang_thai_thiet_bi`    | `equipment_status` |

## Documentation Rule For Schema Changes

When schema changes:

1. add or update a migration
2. update this document if the change affects business meaning or constraints
3. update related use case docs if behavior changes
4. keep entity mappings and migration intent aligned

If the change is part of the Vietnamese-to-English rename:

5. update `database/schema-target-en.dbml` if the target model changes
6. document whether the task changes only documentation, only SQL, or both SQL and JPA mappings

## What To Document For Each Important Table

- table purpose
- main relationships
- important enums and statuses
- unique constraints
- concurrency-sensitive fields
- timestamps and lifecycle fields
- business notes that affect use cases

## Current Notes

- Booking is already a lifecycle-heavy aggregate and should be documented carefully whenever status semantics change.
- Review moderation keeps `approved = false` by default until an admin approves the review.
- Each review can have at most one admin response stored in `review_response`.
- `review_image` stores up to four Cloudinary HTTPS images for each verified-stay review. Images are ordered by `display_order` and are removed automatically when their review is deleted.
- Payment and booking timeout behavior must stay aligned with booking-expiry logic in the backend. Browsing and confirming booking details do not create a database booking or block availability. The booking and payment transaction are created only when the customer requests a VietQR payment session. Checkout sessions expire after `app.booking.payment-expiration-seconds` seconds by default (`300`, or 5 minutes), cancelling both the pending `payment_transaction` and its still-pending booking. The customer payment-status polling endpoint applies this timeout, while the scheduled sweep runs every 10 seconds by default to release abandoned holds promptly.
- `payment_transaction.response_code` is `varchar(50)` and stores application-level outcome codes (`PAYMENT_TIMEOUT`, `PAYMENT_SESSION_REPLACED`, `SEPAY_SUCCESS`, `SEPAY_ORDER_FAILED`, `SEPAY_TRANSACTION_VOID`, VNPay numeric codes). Keep new codes within 50 characters.
- `payment_transaction.processed_by_user_id` is nullable for historical/customer payments and references the admin/staff account that initiated a checkout balance QR or confirmed cash collection. This supports end-of-shift reconciliation without changing historical rows.
- Enum-backed statuses deserve explicit documentation because they affect filters, transitions, and reporting.
- `booking_status.DEPOSIT_PAID` means the customer paid only the online deposit. Full online payment still uses `PAID`.
- Online deposits are 50% of the final booking total. An optional coupon is validated and persisted on the still-pending booking when the customer creates the checkout session, before the deposit/full-payment amount is calculated. At checkout, the remainder is either recorded immediately as a successful `COUNTER` cash transaction (`BALANCE_CASH_SETTLED`) or collected through a pending `SEPAY` VietQR transaction (`CHECKOUT_BALANCE_PENDING`). A transfer completes the booking only after provider reconciliation changes the response code to `CHECKOUT_BALANCE_SETTLED`.

### Refund reconciliation

- `booking_refund` is the operational ledger for an approved customer cancellation. `booking.status = CANCELLED` releases the room, while `booking_refund.status` independently tracks whether money is still pending, processing, completed, failed, or requires retry.
- One booking has at most one refund record (`uk_booking_refund_booking`). This prevents duplicate refund workflows when an approval endpoint is retried.
- `amount` is the amount actually collected from successful payment transactions and is capped by the final booking total. Deposit-paid bookings therefore refund only the collected deposit.
- `COMPLETED` requires both `completed_at` and a unique `transaction_reference`. This field is the reconciliation reference: it stores the optional bank transaction code when supplied, otherwise backend generates `REFUND-{bookingCode}-{refundId}`. `proof_image_url` stores an optional Cloudinary receipt for exception handling and audit support.
- The original successful `payment_transaction` is immutable. Manual refund reconciliation references it through `original_payment_transaction_id` instead of changing its success status.
- Current production behavior is manual disbursement with recorded evidence. Automatic provider reversal must only be added when a real merchant refund API and credentials are available.
- A customer cancellation request records `refund_bank_code`, `refund_bank_name`, `refund_account_number`, and `refund_account_holder`. All four values must be present together and account numbers are restricted to 6-30 digits.
- On approval, those values are copied to `booking_refund.recipient_*` as an immutable payout snapshot. The admin UI derives a VietQR with the approved amount and booking reference; the QR itself is not stored and never means the transfer has completed.
- `payment_provider.COUNTER` records the successful remaining-balance collection at checkout. The booking management API derives `paidAmount` and `remainingAmount` from successful payment transactions instead of duplicating totals in the booking row.
- `payment_provider` includes `SEPAY` for online deposit/full checkout through VietQR plus SePay transaction polling; webhook confirmation remains supported as a fallback.
- `room.max_people` stores the maximum number of people a specific room can hold. `room.image_url` is the primary image; `image_url_2` through `image_url_4` form the detail-page gallery. `common_amenity` stores large shared facilities available to every guest, while the existing equipment tables remain room-specific.
  - `common_amenity.active` controls public visibility; the public API returns active rows only.
  - Rows are admin-managed business data. Startup schema scripts and repeatable migrations must not seed or reactivate them, otherwise an administrator's delete/hide decision would be reverted after restart.
- `account.avatar_url` stores the current profile image URL for customer, staff, and admin accounts after upload through the backend.
- `account.enabled` controls whether an account can authenticate. Disabled staff accounts are kept for historical references but cannot log in or continue JWT sessions.
- `staff.account_id` is required for staff-only workflows. The backfill migration creates a minimal staff profile for existing `account.role = 'STAFF'` rows that were missing a `staff` record.
- Approved staff shift registrations must have a matching `shift` row because the staff schedule page reads assigned shifts from `shift`; `20260707_backfill_shifts_for_approved_staff_registrations.sql` creates missing shifts for already approved registrations.
- `coupon_usage` records the exact discount amount actually consumed by one paid booking and enforces one usage row per booking through `booking_id` uniqueness.
- `customer_issue_report` stores customer-submitted support issues, optionally linked to one owned booking, keeps a small explicit lifecycle (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`), and stores the latest admin handling note in `admin_note`.
- `user_notification_settings` stores per-account notification preferences for operational events such as booking updates, shift reminders, room issues, and equipment issues.
- `app_notification` stores in-app notifications per account. `is_read` tracks acknowledgement, while `is_resolved` tracks operational completion for staff-facing notification workflows.
- `facility_condition_report` stores staff-recorded room/equipment condition history, marks broken reports as maintenance suggestions, and tracks admin handling through `status`, `admin_note`, and `resolved_at`.

## User Notification Settings Table

`user_notification_settings` persists staff/customer notification preferences per account.

- Purpose: keep notification toggles stable across logout, login, and page reloads.
- Main relationship:
  - `account_id -> account.id`
- Uniqueness and concurrency:
  - `account_id` is unique, so each account has at most one settings row.
  - Missing settings are treated as all enabled and created on first read/update by the backend.
- Preference fields:
  - `new_booking`
  - `booking_reminder`
  - `shift_reminder`
  - `room_issue`
  - `equipment_issue`
- Migration:
  - `database/migrations/20260703_create_user_notification_settings.sql`
- Revenue reporting still accepts arbitrary `timestamp` ranges, so any daily pre-aggregation must remain an optimization layer and not silently replace the exact `booking.start_time` source for partial-day windows.
- A standalone `booking(room_id)` index is intentionally not added because the existing `idx_booking_room_start_end` index already exposes `room_id` as its left-most access path; duplicating it would add write overhead without improving the current report predicates.
- `account.email_verified` controls whether a customer can sign in after registration. New customer accounts remain unverified until the email verification token is confirmed.

## Account Email Verification Fields

The `account` table stores email verification state for customer registration.

- Purpose: require new customer accounts to prove access to their email address before login.
- Lifecycle fields:
  - `email_verified`: `false` for new customer registrations and `true` after a valid verification token is confirmed.
  - `email_verification_token_hash`: SHA-256 hash of the current verification token. Raw tokens are sent only by email and are not stored.
  - `email_verification_expires_at`: expiration timestamp for the verification link.
  - `email_verification_sent_at`: timestamp used to enforce resend cooldown.
  - `avatar_url`: optional HTTP(S) URL of the latest uploaded avatar image for the account, shared across customer, staff, and admin profile views.
  - `enabled`: false prevents authentication and JWT session refresh/use while preserving the account row for operational history.
  - `credentials_version`: incremented after a successful password change or reset. Access and refresh JWTs carry the current value, so every older session is rejected immediately.
  - `reset_token`: stores only the SHA-256 hash of the password-reset token; the raw value exists only in the email link.
- Uniqueness and security:
  - `ux_account_email_verification_token_hash` prevents token-hash collisions while allowing nulls for verified accounts.
  - existing accounts are marked verified by the migration so current users are not locked out.
- Migration:
  - `database/migrations/20260703_add_email_verification_to_account.sql`
  - `database/migrations/20260703_add_account_avatar_url.sql`
  - `database/migrations/20260709_add_account_enabled.sql`
  - `database/migrations/20260714_harden_account_sessions_and_reset_tokens.sql`

## Reporting Optimization Assets

`database/migrations/20260702_optimize_reporting_indexes.sql` adds report-oriented structures on the English schema.

- `idx_booking_status_start_time` keeps a direct `(status, start_time)` access path for revenue and usage slicing by booking start timestamp.
- `idx_payment_transaction_status_paid_at` targets paid transaction reporting by status and `paid_at`. The index is partial (`WHERE paid_at IS NOT NULL`) because rows without a payment timestamp do not help time-based reporting.
- `report_daily_booking_summary` is a materialized view that pre-aggregates reportable bookings (`PAID`, `CHECKED_IN`, `COMPLETED`) by day with total revenue, booking count, and usage hours.
- `idx_report_daily_booking_summary_day` is unique so the materialized view can be refreshed with `REFRESH MATERIALIZED VIEW CONCURRENTLY report_daily_booking_summary;`.

Operational note:
The current admin revenue report still queries raw `booking` rows because the HTTP API accepts arbitrary `from` and `to` timestamps. The materialized view is intended for day-aligned analytics or a future reporting pipeline that can tolerate refresh lag.

- `staff_attendance` stores staff check-in/check-out timestamps linked to `staff` and optionally `shift`, with lifecycle statuses `WORKING`, `DONE`, and `MISSING_CHECKOUT`.

## Staff Attendance Table

`staff_attendance` is the source record for actual staff working time.

- Purpose: record check-in and check-out events for payroll, work tracking, and reconciliation.
- Main relationships:
  - `staff_id -> staff.id`
  - `shift_id -> shift.id`, nullable to keep the model open for future manual/admin records
- Status meanings:
  - `WORKING`: staff checked in and has not checked out yet
  - `DONE`: staff checked out and `work_duration_hours` was calculated
  - `MISSING_CHECKOUT`: end-of-day sweep found an unfinished working record
- Uniqueness and concurrency:
  - partial unique index `ux_staff_attendance_working_shift` prevents two `WORKING` rows for the same staff and shift.
  - application logic also rejects duplicate check-in before inserting.
- Lifecycle fields:
  - `check_in_time` is required.
  - `check_out_time` is written on checkout and must be after `check_in_time`.
  - `work_duration_hours` is calculated in hours with two decimal places.
  - `created_at` and `updated_at` support operational auditing.
- Migration:
  - `database/migrations/20260703_create_staff_attendance.sql`

## Facility Condition Report Table

`facility_condition_report` is the audit log for staff facility checks.

- Purpose: record who inspected a room or equipment item, when it was inspected, what condition was found, and whether admin maintenance follow-up is suggested.
- Main relationships:
  - `staff_id -> staff.id`
  - `room_id -> room.id`
  - `equipment_id -> equipment.id`, nullable for room-only reports
- Condition meanings:
  - `GOOD`: usable / clean
  - `NEED_CLEANING`: room or asset needs cleaning
  - `NEED_CHECK`: room or asset should be checked before normal use
  - `BROKEN`: damaged or unusable; requires a non-empty note
- Lifecycle fields:
  - `note` is limited to 500 characters and required for `BROKEN`.
  - `image_url` stores an optional supporting image URL.
  - `maintenance_suggested` is true when staff reports a broken asset/room or moves a room to maintenance.
  - `room_status_after_update` records the room status written by the staff action.
  - `created_at` records the audit timestamp.
- Migration:
  - `database/migrations/20260702_add_facility_condition_report.sql`

## Coupon Usage Table

`SERENE10` is the seeded new-customer campaign. It is a 10% percentage discount with no minimum order value or fixed expiry. Eligibility is not inferred from `coupon_usage`: the application checks that the customer has no other `booking` row, locks the customer during booking creation, and excludes only the current pending booking during checkout revalidation. This strict first-booking rule also treats cancelled and expired booking attempts as prior bookings.

The campaign is seeded only by `backend/src/main/resources/db/migration/V4__seed_new_customer_coupon.sql`. The canonical schema file remains immutable because Render derives Flyway `V1` from it and changing an already-applied migration would cause a checksum mismatch.

`coupon_usage` is the persistence record of a coupon that was actually consumed after payment is confirmed.

- Purpose: preserve the coupon, customer, booking, and exact discount amount used for a paid booking.
- Main relationships:
  - `discount_code_id -> discount_code.id`
  - `customer_id -> customer.id`
  - `booking_id -> booking.id`
- Uniqueness and concurrency:
  - `booking_id` is unique, so one booking can consume at most one coupon usage row.
  - `discount_amount` must be non-negative.
- Lifecycle fields:
  - `used_at` records when the usage row was written.
- Migration:
  - `database/migrations/20260701_add_coupon_usage_and_sepay.sql`
  - This migration assumes the English schema tables (`discount_code`, `customer`, `booking`) already exist.

## Migration Guidance For The Rename

The English rename is now implemented in JPA and must be rolled out to legacy PostgreSQL instances with a deliberate migration, not with scattered manual edits.

Recommended order:

1. freeze the target English schema in `database/schema-target-en.dbml`
2. decide whether to migrate in place or create compatibility views / phased aliases
3. write SQL migrations for enum types, tables, columns, indexes, constraints, and foreign keys
4. update JPA `@Table`, `@Column`, `@JoinColumn`, and enum `columnDefinition` mappings
5. run repository and integration tests against the migrated schema
6. update documentation and deployment instructions together

Current repository status:

- JPA mappings: English
- target DBML: English
- fresh-install SQL base: English and homestay-oriented
- rename rollout SQL: phase 1 (`20260628_rename_vn_schema_to_en.sql`) plus completion pass (`20260630_complete_vn_schema_to_en.sql`)

If a task is only about documentation, do not pretend the runtime schema has already been renamed.

## Known Gaps Versus Product Scope

The source SRS and backlog mention additional domains that are not yet represented consistently across the current backend source tree, including:

- optional amenity/service add-on details
- customer review flows
- maintenance workflow
- notifications
- staff attendance and shift planning
- refund workflow for customer self-cancellation

When these areas are implemented, add migrations and document them here instead of relying only on backlog text.
