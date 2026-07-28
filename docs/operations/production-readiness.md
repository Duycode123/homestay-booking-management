# Production Readiness Checklist

## Automated evidence

- Backend unit, adapter, security, and integration tests pass with Java 21.
- Frontend domain invariants, ESLint, TypeScript, and production build pass.
- Playwright verifies the public homepage, accessible login controls, backend
  authentication errors, and public catalog failure handling.
- GitHub Actions runs the same checks for every push and pull request.

## Required secrets

Configure secrets in the deployment platform, never in repository files:

- PostgreSQL URL, username, and password
- Base64 `JWT_SECRET` containing at least 32 random bytes
- SMTP credentials and verified sender
- Cloudinary URL or cloud name/API credentials
- SePay account details, API token, IPN secret, and webhook HMAC secret
- Google/Facebook OAuth credentials when those providers are enabled

Rotate a credential immediately if it appears in a commit, terminal recording,
shared screenshot, issue, build log, or chat transcript.

## Payment verification

Before a production demonstration:

1. Create a low-value sandbox booking.
2. Verify that an invalid webhook signature is rejected.
3. Send the successful event twice and verify payment is recorded once.
4. Verify booking status changes only after an authenticated provider event.
5. Verify an expired hold releases the room.
6. Verify a late provider event follows the documented reconciliation path.
7. Record transaction reference, received amount, provider event ID, and time.

## Email and upload verification

1. Register a new account and open the verification link once.
2. Confirm the same token cannot be reused.
3. Request a password reset without revealing whether an account exists.
4. Upload valid and invalid room, avatar, review, and refund-proof images.
5. Confirm file size, dimensions, MIME type, and authorization are enforced.

## Deployment

1. Copy `.env.example` to a local `.env` and replace development values.
2. Run `docker compose config --quiet`.
3. Run `docker compose up --build`.
4. Wait for PostgreSQL and backend health checks.
5. Open the frontend and complete one booking smoke test.
6. Back up PostgreSQL before every schema or release migration.
7. Keep `APP_COOKIE_SECURE=true` and HTTPS enabled in production.
8. Restrict CORS to exact frontend origins.

## Demonstration fallback

Keep a prepared local Docker environment and seeded database for the defense.
If SMTP, Cloudinary, or a payment provider is unavailable, demonstrate the saved
provider request/response evidence and clearly label the external outage. Never
replace unavailable production data with fabricated runtime data.

