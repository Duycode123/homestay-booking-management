# Authentication and authorization

## Business goal

Let a user sign in with email/password or Google and establish exactly one trusted browser identity. The UI, role-based navigation, and protected APIs must all describe the same authenticated account.

## Actors

- Customer, staff member, or administrator
- Google OAuth 2.0
- Spring Security and the frontend session provider

## Preconditions

- The account exists, is enabled, and has a supported role.
- A local account has verified its email.
- A Google account returns a verified email and is linked or created by the OAuth use case.
- Production uses HTTPS and `APP_COOKIE_SECURE=true`.

## Main flow

1. The user signs in with credentials or starts Google OAuth.
2. The backend authenticates the account and issues access and refresh tokens in HttpOnly cookies.
3. Google OAuth always redirects to `/oauth/callback` on the configured frontend base URL.
4. The frontend asks `GET /api/auth/session`; this backend response is the source of truth for account ID, email, and role.
5. The frontend loads `GET /api/users/me`, verifies that its email matches the authenticated session, and updates the account UI.
6. Role-specific pages use the verified session while backend endpoints enforce final authorization.

## Alternate and error flows

- Missing or invalid cookies produce `401` and the frontend clears cached identity data.
- An unsupported or missing session role is rejected instead of being silently treated as a customer.
- OAuth failure clears auth cookies and redirects to `/login?oauthError=google_login_failed`.
- A user with a valid session but the wrong role is redirected only after the verified backend session has loaded.
- Login, refresh, and logout are serialized in one browser tab so an older refresh response cannot overwrite a new login.
- Logout clears current cookies plus legacy `/api` and `/api/auth` cookie paths before removing all cached frontend identity data.
- JWT cookies are the only persisted source of authenticated identity. OAuth may create a short-lived servlet session for the Google handshake, but it is invalidated after the callback and its security context is never persisted.
- Login, token refresh, logout, and OAuth completion also clear legacy `JSESSIONID`/`SESSION` cookies. A valid JWT always replaces any stale request authentication so an earlier account cannot override the newly signed-in account.
- If login succeeds but the optional profile request is temporarily unavailable, the verified session remains signed in and the profile is retried by the account UI.

## Business and security rules

- Local storage is only a refresh hint; it never proves authentication.
- HttpOnly cookies use `SameSite=Lax` for the top-level Google redirect and `Secure` in production.
- Browser API calls use the same frontend origin and are proxied to the backend.
- Logout does not require a CSRF token: `SameSite=Lax` prevents cross-site POST cookies, and making logout idempotent avoids trapping a user in a stale session.
- Session and current-profile responses use `Cache-Control: no-store`.
- JWT payload decoding in Next.js middleware is not an authorization decision because it does not verify the signature.
- The backend remains the final authority for every protected API.

## Related endpoints

- `POST /api/auth/login`
- `GET /oauth2/authorization/google`
- `GET /login/oauth2/code/google`
- `GET /api/auth/session`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/users/me`

## Data touched

- `account`
- customer or staff profile associated with the authenticated account
- revoked access/refresh tokens
- OAuth provider identity fields on the account

## Current implementation notes

- OAuth handlers are inbound adapters and delegate account linking to `AuthenticateOAuthUserUseCase`.
- The common frontend base URL is configured by `APP_FRONTEND_BASE_URL`; OAuth no longer has a separate success URL that can drift to `/`.
- The frontend clears the previous profile immediately when the authenticated identity changes.

## Known gaps

- Cross-tab login/refresh coordination is not distributed through `BroadcastChannel`; each tab is currently coordinated independently.
- Device/session management and user-visible session revocation are not yet implemented.
