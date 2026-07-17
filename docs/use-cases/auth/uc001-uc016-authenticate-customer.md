# UC001 / UC016 - Authenticate Customer

## Metadata

- Source: Product Backlog `UC001`, `UC016`
- Primary actor: Customer
- Supporting actors: Authentication system, email service
- Current status in repo: Implemented with email verification, Google OAuth, and cookie-based JWT session flow

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
- `GET /api/auth/csrf`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /oauth2/authorization/google`
- `GET /login/oauth2/code/google`

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

### Login with Google

1. Customer selects **Continue with Google** on the login page.
2. The browser starts the OAuth flow through the same Next.js origin and Google authenticates the customer.
3. Google redirects to `/login/oauth2/code/google`; Next.js proxies the callback to Spring Security.
4. Backend requires a verified Google email and uses Google's stable `sub` claim as the identity key.
5. Backend loads the linked customer, links an existing enabled customer with the same verified email, or creates a new verified customer account.
6. Backend refuses to link admin/staff or disabled accounts.
7. Backend issues the same access/refresh JWT HttpOnly cookies used by password login.
8. Browser returns to `/oauth/callback`, restores the customer profile, and enters the customer site.

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
2. Backend creates a reset token, stores only its SHA-256 hash, and stores an expiration time.
3. Backend sends reset email with reset link.
4. Customer submits new password with reset token.
5. Backend validates token and updates the password.

## Alternate and Error Flows

- Duplicate registration data: backend rejects duplicate email.
- Disposable email domain: backend rejects registration.
- Unverified login: backend rejects login until email verification is completed.
- Expired or invalid verification token: backend denies verification and clears stale token data when applicable.
- Resend too soon, already verified, disabled, or unknown email: backend returns the same generic success response without sending mail.
- Invalid credentials: backend returns authentication failure.
- Missing Google subject/email, unverified Google email, disabled account, or admin/staff email: backend rejects OAuth login and redirects to login with a generic error.
- Missing or invalid refresh token: backend denies refresh.
- Unknown or disabled email on forgot-password: backend returns the same generic success response to prevent account enumeration.
- Expired or invalid reset token: backend denies reset.
- Email delivery failure: registration, forgot-password, and resend-verification roll back their token/account changes and return HTTP 503 instead of reporting a false success.

## Business Rules

- Passwords must never be stored in plain text.
- New and reset passwords must contain 8-72 characters, including at least one letter and one number.
- Newly registered customer accounts must remain blocked from login until `account.email_verified = true`.
- Email verification tokens must be stored as hashes, not raw tokens.
- Email verification and password-reset tokens use UUID format and malformed tokens are rejected before persistence lookup.
- Email verification tokens expire after 24 hours.
- Verification email resend is limited by a 60-second cooldown.
- Registration validates customer name length, email shape and length, Vietnamese mobile number shape, date of birth, and the minimum age rule.
- Session tokens must be rotated via refresh.
- Logout must make old tokens unusable.
- Session inspection must return unauthorized when the principal is invalid.
- Password reset tokens must expire.
- Password reset tokens must be stored as SHA-256 hashes, never as raw bearer values.
- Successful password change/reset increments `account.credentials_version`; every older access and refresh JWT then becomes invalid.
- Direct profile email changes are blocked until a dedicated verify-new-email flow is implemented.
- Credentialed CORS uses an exact origin allowlist; production must not use wildcard origins.
- Browser mutations require CSRF tokens, except authenticated payment-provider webhook/IPN endpoints.
- A missing or mismatched CSRF token returns HTTP 403 with code `CSRF_TOKEN_INVALID`; the browser obtains a fresh token and retries the original request at most once.
- Generic HTTP 401 responses must not clear authentication cookies because an older in-flight request could otherwise erase a newly established login session. Cookie clearing belongs to the explicit logout flow.
- Login, registration, forgot/reset password, and verification resend endpoints are limited to 10 requests per IP/path per 15-minute window.
- Social login creates customer accounts only. It never grants `STAFF` or `ADMIN`.
- Provider access/ID tokens are not stored in the database or exposed to browser JavaScript.
- Google identities are keyed by `(provider, provider_subject)`, not by mutable profile fields.

## Data Touched

- `User`
- `Customer`
- `RevokedToken`
- `oauth_identity`
- reset token fields on user account
- email verification fields on user account

## Current Implementation Notes

- The backend sets both access and refresh cookies on login and refresh.
- Logout is a writable application transaction because revoking access and refresh tokens inserts records into `revoked_token`; it must override the auth service's read-only query default.
- Access and refresh token fields are excluded from serialized response bodies; browsers receive them only through HttpOnly cookies.
- `GET /api/auth/session` currently returns the authenticated role only.
- Forgot-password and email verification links are built through a shared URL builder. `app.frontend.base-url` must be an absolute HTTP/HTTPS origin; a missing or blank local value falls back to `http://localhost:3000`.
- Verification and password-reset messages include responsive HTML and a plain-text fallback. Customer, staff, and password-reset emails share the branded template and show the raw URL as a fallback when the CTA cannot be opened.
- Mail credentials are provided through `MAIL_USERNAME` and `MAIL_PASSWORD`; they must not be committed to source control.
- JWT signing configuration comes from `app.jwt.*`; `JWT_SECRET` is required outside the ignored local-development configuration and must decode to at least 32 random bytes.
- `GET /api/auth/csrf` issues the token that the frontend Axios client explicitly attaches to unsafe requests. Axios's default XSRF-cookie reader is disabled so a legacy cookie cannot overwrite that header.
- The CSRF cookie uses the project-specific name `HOMESTAY-XSRF-TOKEN`, path `/`, and the configured secure-cookie policy. This isolates current sessions from stale framework-default `XSRF-TOKEN` cookies.
- When a browser sends duplicate legacy/current access cookies, the JWT inbound adapter evaluates every raw cookie candidate and authenticates with the newest valid, non-revoked access token.
- Auth application service owns the core registration, login, verification, resend, and reset flows behind use case ports.
- `OAuthUserLoginService` owns Google account linking/creation behind `AuthenticateOAuthUserUseCase`, `OAuthIdentityPort`, `AuthAccountPort`, and `AuthSecurityPort`.

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
