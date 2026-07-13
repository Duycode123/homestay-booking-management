# Homestay Booking Chatbot - Cloudflare Workers AI

This Worker is the AI layer for the Homestay Booking Management web app.

Flow:

```txt
Web app
-> POST /chat
-> Cloudflare Worker
-> GET backend /api/rooms
-> Cloudflare Workers AI model
-> Friendly room recommendation response
```

The AI does not memorize rooms. It reads fresh room data from the backend every time the user asks a question.

## Model

Current model:

```txt
@cf/meta/llama-3.1-8b-instruct-fast
```

This is configured in:

```txt
wrangler.toml
```

## Install

```powershell
cd C:\Users\duyth\Documents\homestay-booking-management\homestay-booking-management\cloudflare-ai-worker
npm install
```

## Run local demo

First run backend:

```powershell
cd C:\Users\duyth\Documents\homestay-booking-management\homestay-booking-management\backend
.\mvnw.cmd spring-boot:run
```

Then run Worker:

```powershell
cd C:\Users\duyth\Documents\homestay-booking-management\homestay-booking-management\cloudflare-ai-worker
npm run dev
```

Worker local URL:

```txt
http://localhost:8787
```

## Test with Postman

Method:

```txt
POST
```

URL:

```txt
http://localhost:8787/chat
```

Headers:

```txt
Content-Type: application/json
```

Body:

```json
{
  "message": "Toi di 4 nguoi, muon phong duoi 200k"
}
```

## Suggested questions

```txt
GET http://localhost:8787/suggested-questions
```

## Health check

```txt
GET http://localhost:8787/health
```

## Important deploy note

When deploying to Cloudflare, `localhost:8080` will not work because it points to Cloudflare's server, not your laptop.

For real deployment, change `BACKEND_BASE_URL` to:

- deployed backend URL, or
- Cloudflare Tunnel URL, or
- ngrok URL

Example:

```toml
BACKEND_BASE_URL = "https://your-backend-domain.com"
```
