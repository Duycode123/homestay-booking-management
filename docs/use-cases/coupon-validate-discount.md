# Validate coupon and calculate discount

## Business goal

Allow the system to validate a coupon code and calculate the discount before a customer confirms a booking/payment.

## Actors

- Customer checks a coupon during checkout.
- Admin manages coupon campaigns using rows in `discount_code`.

## Preconditions

- Coupon data exists in the `discount_code` table.
- Request supplies a coupon code and current order amount.

## Main flow

1. Client calls `POST /api/coupons/validate`.
2. Backend normalizes the coupon code.
3. Backend loads the coupon from `discount_code`.
4. Backend checks expiry date and minimum order value.
5. Backend calculates discount amount.
6. Backend returns whether the coupon is valid, discount amount, and payable amount.

## Alternate and error flows

- Coupon does not exist: return `valid=false` with reason `Coupon khong ton tai`.
- Coupon expired: return `valid=false` with reason `Coupon da het han`.
- Order amount below minimum: return `valid=false` with reason `Don hang chua dat gia tri toi thieu`.
- Blank code or non-positive order amount: return HTTP 400 from request validation.

## Business rules

- `PERCENTAGE`: discount = order amount * value / 100.
- `FIXED_AMOUNT`: discount = value.
- Discount amount cannot exceed the order amount.
- Coupon is valid through its `expires_at` date and becomes expired after that date.
- Validation endpoint only checks the coupon.
- Booking creation can apply a valid coupon and store the final payable amount.
- Coupon usage is recorded only after payment is confirmed as paid.

## Related endpoints

- `POST /api/coupons/validate`

## Data touched

- Reads `discount_code`.
- `POST /api/coupons/validate` does not write data.
- `POST /api/bookings` can store `booking.discount_code_id`.
- Payment confirmation writes `coupon_usage`.

## Current implementation notes

- Implemented as a feature package under `backend.coupon`.
- Controller is the inbound web adapter.
- `CouponValidationService` is the application use case.
- `JdbcDiscountCodeAdapter` is the outbound persistence adapter.

## Known gaps

- Usage limit, per-user limit, and active/inactive status are not implemented yet.
