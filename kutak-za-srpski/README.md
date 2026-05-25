## Kutak za srpski

Next.js application for public pages, bookings, newsletter, and admin dashboard.

## Local development

1. Copy .env.example to .env.local.
2. Fill Firebase and email values.
3. Run:

```bash
npm install
npm run dev
```

## Required environment variables

Public client SDK:

- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID

Email:

- RESEND_API_KEY
- EMAIL_FROM
- EMAIL_ADMIN_TO

Admin allow-list:

- ADMIN_EMAILS

Use a comma, space, or semicolon separated list, for example:

```text
ADMIN_EMAILS=ivanadurovic94@gmail.com,amraisakovic.fig@gmail.com
```

Firebase Admin credentials (use one of the two options):

Option A (recommended on Vercel):

- FIREBASE_ADMIN_PROJECT_ID
- FIREBASE_ADMIN_CLIENT_EMAIL
- FIREBASE_ADMIN_PRIVATE_KEY

Option B:

- FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON

Optional local file fallback:

- FIREBASE_ADMIN_PRIVATE_KEY_PATH=.firebase-key.json

## Vercel deployment notes

If /api/admin returns 403 or a credentials error, check:

1. Firebase Admin env vars are set in Vercel Project Settings -> Environment Variables.
2. The signed-in Firebase Auth email is included in ADMIN_EMAILS.
3. FIREBASE_ADMIN_PRIVATE_KEY contains valid newline escapes (\\n) when stored in one line.
4. A redeploy was triggered after env changes.

## Build

```bash
npm run build
```
