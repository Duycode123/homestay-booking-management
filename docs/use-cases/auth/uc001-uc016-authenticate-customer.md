# UC001 / UC016 - Authenticate Customer

## Metadata

- Source: Product Backlog `UC001`, `UC016`
- Primary actor: Customer
- Supporting actors: Authentication system, email service
- Current status in repo: Implemented with email verification and cookie-based JWT session flow

## Goal

Allow a customer to register, verify their email address, sign in, refresh session, sign out, inspect the current session, and recover a password securely.

## Related Endpoints

- `POST /api/auth/register`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification-email`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/session`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

## Preconditions

- For registration: customer provides valid registration data.
- For email verification: customer has a pending unexpired verification token.
- For login: customer already has a verified account.
- For refresh/logout/session: auth cookies may already exist.
- For password reset: customer account exists and email delivery is available.

## Main Flow

### Register

1. Customer opens the registration screen.
2. Customer submits registration data, including date of birth when the frontend collects it.
3. Backend validates required fields and uniqueness constraints.
4. Backend rejects known disposable email domains.
5. Backend hashes the password and creates an unverified account.
6. Backend stores a hashed email verification token with an expiration time.
7. Backend sends a verification email.
8. Backend returns a successful registration response indicating email verification is required.

### Verify Email

1. Customer opens the verification link from email.
2. Frontend submits the raw token to the backend.
3. Backend hashes the token, loads the pending account, and checks expiration.
4. Backend marks the account email as verified and clears verification token fields.

### Resend Verification Email

1. Customer requests a new verification link for the registered email.
2. Backend rejects already verified accounts and applies a resend cooldown.
3. Backend stores a new hashed token and sends a new verification email.

### Login

1. Customer submits email and password.
2. Backend validates credentials.
3. Backend rejects login if the account email is not verified.
4. Backend issues access and refresh tokens.
5. Backend sets auth cookies and returns the auth payload.

### Refresh Session

1. Client sends the refresh request with refresh cookie.
2. Backend validates the refresh token.
3. Backend issues a new token pair.
4. Backend rotates auth cookies.

### Logout

1. Customer chooses logout.
2. Backend invalidates or revokes the active tokens.
3. Backend clears auth cookies.

### Forgot / Reset Password

1. Customer submits email for password recovery.
2. Backend creates a reset token and stores an expiration time.
3. Backend sends reset email with reset link.
4. Customer submits new password with reset token.
5. Backend validates token and updates the password.

## Alternate and Error Flows

- Duplicate registration data: backend rejects duplicate email.
- Disposable email domain: backend rejects registration.
- Unverified login: backend rejects login until email verification is completed.
- Expired or invalid verification token: backend denies verification and clears stale token data when applicable.
- Resend too soon: backend rejects repeated verification email requests within the cooldown window.
- Invalid credentials: backend returns authentication failure.
- Missing or invalid refresh token: backend denies refresh.
- Unknown email on forgot-password: backend returns an error.
- Expired or invalid reset token: backend denies reset.
- Email delivery failure: backend returns server error for forgot-password.

## Business Rules

- Passwords must never be stored in plain text.
- Newly registered customer accounts must remain blocked from login until `account.email_verified = true`.
- Email verification tokens must be stored as hashes, not raw tokens.
- Email verification tokens expire after 24 hours.
- Verification email resend is limited by a 60-second cooldown.
- Session tokens must be rotated via refresh.
- Logout must make old tokens unusable.
- Session inspection must return unauthorized when the principal is invalid.
- Password reset tokens must expire.

## Data Touched

- `User`
- `Customer`
- `RevokedToken`
- reset token fields on user account
- email verification fields on user account

## Current Implementation Notes

- The backend sets both access and refresh cookies on login and refresh.
- The backend also returns token values in the response body today.
- `GET /api/auth/session` currently returns the authenticated role only.
- Forgot-password and email verification links use `app.frontend.base-url` with a local default.
- Auth application service owns the core registration, login, verification, resend, and reset flows behind use case ports.

## Known Gaps / Follow-up

- Align one clear session contract across frontend and backend so cookies are the primary transport.
- Standardize error payload shape for all auth failure modes.
- Replace the static disposable-domain blocklist with a maintained validation service if product risk justifies it.

## Hexagonal Refactor Notes

Suggested inbound ports:

- `RegisterCustomerUseCase`
- `LoginCustomerUseCase`
- `RefreshSessionUseCase`
- `LogoutUseCase`
- `RequestPasswordResetUseCase`
- `ResetPasswordUseCase`
- `VerifyEmailUseCase`
- `ResendEmailVerificationUseCase`

Suggested outbound ports:

- `LoadUserPort`
- `SaveUserPort`
- `IssueTokenPort`
- `RevokeTokenPort`
- `SendEmailPort`
