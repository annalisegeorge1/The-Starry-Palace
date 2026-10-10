# Google login for The Starry Palace

Website: https://thestarrypalace.com
Supabase project: sservftxygunkacmwsad
Google sign-in feature flag: VITE_GOOGLE_LOGIN_ENABLED

## Activate Google OAuth (account owner only)

1. In Google Cloud Console, choose or create a Google Cloud project. Open Google Auth Platform to configure the consent screen, branding, audience, and scopes. Choose External audience for public members and publish the app to production when ready. Google may require brand verification.
2. Under Clients, create an OAuth client of type **Web application**. Add authorized JavaScript origin **https://thestarrypalace.com**.
3. Add **https://sservftxygunkacmwsad.supabase.co/auth/v1/callback** to the **Authorized redirect URIs**. This is the callback to Supabase, not the SPA's own /auth/callback.
4. In Supabase Dashboard → Authentication → Sign In / Providers → Google, turn on Google, enter the **Client ID** and **Client Secret**, and save. Keep the client secret in Supabase; never commit it to GitHub or place it in Vite/Cloudflare build variables.
5. In Supabase → Authentication → URL Configuration, keep the Site URL **https://thestarrypalace.com** and permit the exact redirect **https://thestarrypalace.com/auth/callback**. Preserve any working legacy redirects during the transition.
6. In Cloudflare Worker → Settings → Build → Variables and secrets, add **VITE_GOOGLE_LOGIN_ENABLED** with the value **true**. Trigger a fresh production build. The Google button is intentionally hidden until this flag is set so members never see a broken option.
7. Use a private/incognito browser to sign in with Google, return to the Palace, visit several rooms and refresh; also confirm email/password and magic-link sign-in still work. For an existing email account, use the same **verified email** when signing in with Google to benefit from Supabase's automatic identity linking.
8. If the OAuth consent screen says the app is still in Testing, add Google test users temporarily or publish it before opening Google login to all members. Avoid requesting additional Google scopes beyond name/profile/email.

Implementation: Supabase signInWithOAuth({ provider: 'google', options: { redirectTo: 'https://thestarrypalace.com/auth/callback' } }).
Supabase keeps persistent browser sessions and handles OAuth code exchange with the client configuration flowType: pkce and detectSessionInUrl: true.

Docs:
- https://supabase.com/docs/guides/auth/social-login/auth-google
- https://supabase.com/docs/guides/auth/auth-identity-linking
- https://supabase.com/docs/guides/auth/redirect-urls
