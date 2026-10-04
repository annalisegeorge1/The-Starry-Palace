# Vite application setup

The original root README is preserved. This is the initial authentication foundation; it does not migrate the older Inkverse site's content or features.

## Run locally

1. Install Node.js 22.12+ (or supported newer LTS).
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local`.
4. Run `npm run dev`.

The example contains only the browser-safe publishable key for project `sservftxygunkacmwsad`. Never use a service-role key, secret key, database password, or privileged token in a `VITE_` variable or browser code. All `VITE_` variables are public build-time configuration.

## Supabase configuration

In this project's Auth URL Configuration, set the Site URL to your production origin and allow `http://localhost:5173/auth/callback` plus your production `/auth/callback` URL. Email confirmation must redirect to an allowed URL. This repository does not change these dashboard settings. Email/password sign-in and signup use Supabase Auth; confirmation depends on the project's email settings. Google sign-in is not enabled in this foundation.

Routes: `/`, `/login`, and `/auth/callback` are public; `/account` requires a session. Unknown routes show the Palace's 404 page. The client persists sessions, refreshes tokens, listens for login/logout changes across tabs, and waits for initial session restoration before making routing decisions. PKCE callback exchange is handled by Supabase JS's URL detection.

Client route guards control the interface; they are not database authorization. Every future table exposed through the Data API must have RLS and ownership-based policies. Server endpoints must verify access tokens with Supabase `getUser`/`getClaims` and authorize operations; never trust the browser's session object or user-editable metadata.

## Build and host

Run `npm test` and `npm run build`. Serve `dist/` on an SPA host with a fallback to `index.html` for all application routes. Configure the two variables from `.env.example` on the hosting provider before building. `npm run preview` checks the production output locally. No live deployment is included in this repository initialization.
