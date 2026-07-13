# Manage Current User Profile And Avatar

## Metadata

- Primary actors: Customer, Staff, Admin
- Supporting actors: Authentication system, Cloudinary image storage
- Current status in repo: Implemented

## Goal

Allow an authenticated account to view its current profile, update contact information, and upload an avatar image whose URL is persisted on the account record.

## Related Endpoints

- `GET /api/users/me`
- `PUT /api/users/me`
- `PATCH /api/users/me`
- `POST /api/users/me/avatar`
- `PUT /api/users/me/password`
- `GET /api/users/me/notification-settings`
- `PUT /api/users/me/notification-settings`

## Preconditions

- The caller is authenticated with a valid account session.
- The account exists in `account`.
- For avatar upload: Cloudinary backend configuration is available and the request contains one image file.

## Main Flow

### View Current Profile

1. Authenticated user requests the current profile.
2. Backend loads the current account by authenticated email.
3. Backend resolves customer or staff profile data when present.
4. Backend returns full name, email, phone, role, and `avatarUrl`.

### Update Current Profile

1. Authenticated user submits full name, email, and phone.
2. Backend validates required fields and email / phone format.
3. Backend rejects duplicate email already used by another account.
4. Backend updates the `account.email` and the related `customer` or `staff` identity record.
5. Backend rotates auth cookies because the email-backed token subject may change.
6. Backend returns the updated profile.

### Upload Avatar

1. Authenticated user submits one image file to the avatar endpoint.
2. Backend validates that the file exists, is an image, and is at most 5 MB.
3. Backend uploads the file to Cloudinary through the outbound storage adapter.
4. Backend stores the returned secure URL into `account.avatar_url`.
5. Backend returns the updated profile with the new `avatarUrl`.

### Update Notification Settings

1. Authenticated user submits notification preferences.
2. Backend loads or creates that account's `user_notification_settings` row.
3. Backend stores the five preference flags for booking, shift, room issue, and equipment issue notifications.
4. Backend returns the saved notification settings.

## Alternate And Error Flows

- Missing or invalid session: backend rejects the request as unauthorized.
- Invalid email or phone format: backend returns a validation error.
- Duplicate email: backend rejects the profile update.
- Missing file, non-image file, or file larger than 5 MB: backend rejects the avatar upload.
- Cloudinary upload failure: backend returns an application error and does not update `account.avatar_url`.
- Account exists but has no customer or staff row: backend still returns a fallback profile based on account email and role.
- Missing notification settings row: backend treats all notification preferences as enabled and creates the row on first save.

## Business Rules

- `account.avatar_url` is the single source of truth for the current avatar across customer, staff, and admin experiences.
- Avatar uploads must pass through the backend; the frontend does not upload directly to Cloudinary.
- Only HTTP(S) avatar URLs are allowed to be persisted.
- Avatar URLs are limited to 500 characters.
- Profile update and avatar upload are separate operations to keep business validation and file handling isolated.
- Each account has at most one notification settings row, enforced by `user_notification_settings.account_id`.

## Data Touched

- `account`
- `customer`
- `staff`
- `user_notification_settings`

## Current Implementation Notes

- The backend keeps avatar persistence on the `account` row so one authenticated identity has one current avatar regardless of role-specific profile table.
- Customer and staff profile views already consume `avatarUrl`; admin can access the same current-user profile endpoint and shared profile page.
- Avatar upload reuses the existing Cloudinary integration style already used for room images, but with a dedicated avatar folder.
- Notification settings use an idempotent upsert keyed by account id.

## Known Gaps

- There is no avatar delete / reset endpoint yet.
- The current backend only stores the secure URL, not Cloudinary public ID metadata for future cleanup workflows.
