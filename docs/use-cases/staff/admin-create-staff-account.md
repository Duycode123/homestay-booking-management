# Admin manage staff accounts

## Business goal

Allow an admin to view staff account/profile information, create staff accounts, and disable accounts for staff who have left without deleting operational history.

## Actors

- Primary actor: Admin
- Supporting actor: Staff member

## Preconditions

- Admin is authenticated with `ADMIN` role.
- The target email is not already used by an account.
- The target email is not already used by a staff profile.

## Main flow

### View staff accounts

1. Admin opens staff management.
2. Backend returns all staff profiles with linked account information: account id, staff id, email, full name, phone, date of birth, avatar URL, role, email verification state, enabled state, and account creation time.
3. Admin can open one staff profile to view the same detail for a single staff member.

### Create staff account

1. Admin enters staff full name, email, optional phone, optional date of birth, and optional initial password.
2. Backend normalizes the email.
3. Backend creates an `account` row with role `STAFF`.
4. Backend marks the account `enabled = true` and `email_verified = false`.
5. Backend creates a `staff` row linked by `staff.account_id`.
6. Backend creates an email verification token and sends a verification email to the staff email address.
7. Backend returns the account id, staff id, and initial password.
8. Staff verifies their email from the link before logging in with the initial password.

### Disable staff account

1. Admin selects a staff member who has left.
2. Backend verifies the staff profile exists and is linked to a `STAFF` account.
3. Backend sets `account.enabled = false`.
4. The staff profile and account row remain in place so attendance, shift, booking, and facility history stay traceable.
5. Disabled staff accounts cannot log in, refresh sessions, or continue authenticated JWT access.

## Alternate and error flows

- Missing full name or email: backend returns validation error.
- Duplicate account email: backend rejects the request.
- Duplicate staff profile email: backend rejects the request.
- Missing initial password: backend uses `123123`.
- Staff tries to login before email verification: backend rejects login and asks them to verify email first.
- Staff profile not found during detail/disable: backend returns not found.

## Business rules

- Admin-created staff accounts use role `STAFF`.
- Admin-created staff accounts start as unverified and require email verification before login.
- Admin-created staff accounts are enabled by default.
- Staff-only APIs require both `account.role = STAFF` and a linked `staff` profile.
- Disabling a staff account does not delete staff or account rows.
- Disabled staff accounts are excluded from authentication through Spring Security `UserDetails.isEnabled()`.

## Related endpoints

- `GET /api/admin/staff`
- `GET /api/admin/staff/{staffId}`
- `POST /api/admin/staff`
- `PATCH /api/admin/staff/{staffId}/disable`

## Data touched

- Reads `account`.
- Reads `staff`.
- Writes `account`.
- Writes `staff`.
- Writes account email verification token fields.
- Updates `account.enabled`.

## Current implementation notes

- Implemented in the `backend.staff` feature package with a use-case boundary.
- `StaffManagementUseCaseService` creates the account, staff profile, and email verification token in one transaction.
- `StaffEmailVerificationMailAdapter` sends the verification link to the staff email address.
- `StaffManagementUseCaseService` lists staff accounts, returns staff detail, and disables accounts through dedicated use-case ports.
- Frontend admin staff schedule page exposes a create-staff modal that calls `POST /api/admin/staff`.

## Known gaps

- The initial password is returned in the response for local/admin handoff; a forced password-change flow is still future scope.
- There is no re-enable endpoint yet.
