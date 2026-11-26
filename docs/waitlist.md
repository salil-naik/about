# Learn waitlist

The React form POSTs JSON to `/api/interest` on this website. The Vite dev middleware and Vercel function use the same server-only handler in `server/waitlist.ts`, which validates the request and forwards it to the private Sites API. The Sites API validates it again and upserts the record into D1 by normalized email address.

Private dashboard: https://salil-learn-waitlist.salilnaik.chatgpt.site

Site project: `appgprj_6b084a5611d081919ac3bf95262f7652`

## Runtime configuration

Configure these **server-only** environment variables in `.env.local` for local development and in the personal website's Vercel project for production:

- `WAITLIST_SITE_URL`: the private Site origin.
- `WAITLIST_SITES_TOKEN`: the Site's service-access bearer token.
- `WAITLIST_WRITE_KEY`: the API write key, also configured as a secret in Sites.

Never prefix these names with `VITE_`. Never commit their values. The browser receives no backend credentials.

Restart Vite after changing environment variables. Deploy the personal website after setting its Vercel environment variables. The Sites database is live independently of the personal website.

## Storage and access

The service source is in `services/learn-waitlist`, with its own Sites source repository and `.openai/hosting.json` identity. D1 table `interests` stores name, normalized email, experience, course interest, consent text, consent, creation time, and last update time. Repeated signups update the existing email's row without resetting its first signup time.

The Site remains owner-private. Its dashboard requires ChatGPT sign-in, and `/api/export` provides a CSV export only to a signed-in viewer. Public-site submissions go through the private API using server credentials. Neither the personal website nor the browser has a public read endpoint for signup data.

## Verification

`node scripts/test-waitlist.mjs` checks the server handler with a mock Sites API: validation, duplicates forwarded as normalized emails, upstream failures, and successful persistence acknowledgments. Production writes must be verified against the Sites database before claiming the form is connected.
