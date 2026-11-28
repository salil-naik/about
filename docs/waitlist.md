# Learn and India course waitlists

The `/learn` form POSTs JSON to `/api/interest`; `/course` POSTs to `/api/course-interest`. Both Vite dev middleware and Vercel functions use the server-only handler in `server/waitlist.ts`, with separate credentials and Sites destinations. Each Sites API validates the request and upserts it into its own D1 database by normalized email address.

Private dashboard: https://salil-learn-waitlist.salilnaik.chatgpt.site

Site project: `appgprj_6b084a5611d081919ac3bf95262f7652`

India course dashboard: https://salil-course-waitlist.salilnaik.chatgpt.site

Course Site project: `appgprj_6b0ab2c26e5081918008616c8fc0d34b`

## Runtime configuration

Configure these **server-only** environment variables in `.env.local` for local development and in the personal website's Vercel project for production:

- `WAITLIST_SITE_URL`: the private Site origin.
- `WAITLIST_SITES_TOKEN`: the Site's service-access bearer token.
- `WAITLIST_WRITE_KEY`: the API write key, also configured as a secret in Sites.

For the India course, configure these additional **server-only** variables in the same places:

- `COURSE_WAITLIST_SITE_URL`: the India course Site origin.
- `COURSE_WAITLIST_SITES_TOKEN`: the India course Site's service-access bearer token.
- `COURSE_WAITLIST_WRITE_KEY`: the India course API write key, configured as `WAITLIST_WRITE_KEY` in its Site.

Never prefix these names with `VITE_`. Never commit their values. The browser receives no backend credentials.

Restart Vite after changing environment variables. Deploy the personal website after setting its Vercel environment variables. The Sites database is live independently of the personal website.

## Storage and access

The service sources are in `services/learn-waitlist` and `services/course-waitlist`, each with its own Sites source repository, `.openai/hosting.json` identity, and D1 database. Both D1 tables store name, normalized email, WhatsApp number (including country code), experience, course interest, consent text, consent, creation time, and last update time. Repeated signups update the existing email's row within its cohort without resetting its first signup time.

The Site remains owner-private. Its dashboard requires ChatGPT sign-in, and `/api/export` provides a CSV export only to a signed-in viewer. Public-site submissions go through the private API using server credentials. Neither the personal website nor the browser has a public read endpoint for signup data.

## Verification

`node scripts/test-waitlist.mjs` checks the server handler with a mock Sites API: validation, duplicates forwarded as normalized emails, upstream failures, and successful persistence acknowledgments. Production writes must be verified against the Sites database before claiming the form is connected.
