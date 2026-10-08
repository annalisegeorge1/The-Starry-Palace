# The Starry Palace · Manual Cloudflare preview ZIP

This is an **optional temporary preview path** when Render refuses builds because its pipeline minutes are exhausted. It does not migrate, replace, or shut down Render, and it does not change DNS or Supabase data.

## Package the current Palace from GitHub

1. Open the repository **Actions** tab and select **Palace Cloudflare preview bundle**.
2. The workflow creates one initial package when introduced. For a later version, select **Run workflow** with branch `main`. Check that the run shows a green check.
3. Under the completed workflow run's **Artifacts**, download `palace-cloudflare-preview-<commit-hash>`. GitHub downloads a ZIP containing the built website contents. The ZIP expires after two days; repeat the manual workflow to create another.
4. This output includes the same **browser-public** Supabase URL and publishable key already stored in `.env.example`, baked into the Vite frontend. It intentionally does **not** contain service-role credentials or passwords. Treat the ZIP as a publishable frontend, **not** a private database backup.
5. The workflow runs `npm test` first, then produces a Cloudflare SPA build with **no root `404.html`**, preserving deep-link refresh behavior.

## Create a *separate* Cloudflare Direct Upload project

1. In the intended Cloudflare account open **Workers & Pages** → **Create application** → **Pages** → **Drag and drop your files**.
2. Give it a distinct, temporary name such as `starry-palace-review` if available. Do not reuse a Cloudflare Pages project already connected to GitHub, or the district office's domain/site.
3. Upload the completed GitHub Actions artifact ZIP and choose **Deploy site**. Cloudflare provides the actual `https://<project>.pages.dev` address.
4. **Important trade-off:** Cloudflare does not allow changing a *Direct Upload* Pages project into Git integration later. Use this temporary project for review only; keep a separate project for future automatic GitHub deployments.
5. Do not point any public custom domain or DNS record to the preview until you have completed real-device acceptance tests.
6. In the **existing Supabase Auth URL Configuration**, keep the primary Site URL unchanged and allow the **exact** `https://<project>.pages.dev/auth/callback` redirect before trying signup/magic links/password resets. Verify the public Supabase connection and RLS policies as before.
7. The same Supabase backend is shared with the live site. Changes made by your testers—including posts and uploads—can be real. Use test accounts and disposable manuscripts.
8. Browser-local drafts, preferences and sessions are separated by origin. Save/export any on-device draft on Render before using the Pages preview; you will need to sign in again on the new address.
9. Have testers refresh `/reading`, `/writing`, `/library`, `/work/<slug>`, and a chapter permalink (using actual permitted test data). Test mobile navigation, chapter save/reopen, passwordless sign-in and light/dark contrast.
10. The preview must be evaluated, not assumed to be live. If an auth route fails, inspect Supabase's redirect allowlist before editing application logic. If another failed build occurs, **do not** point testers at it.

## Limits and safeguards

- GitHub stores the uploaded artifact for **2 days**; it may not be available forever.
- Dashboard Direct Upload supports ZIP files, but individual Pages assets must be below Cloudflare's upload limit; the repo's public assets are expected to fit, and actual upload success must be verified in the dashboard.
- This packaged build uses `.env.example` as its **current public Vite config**. Before shipping a future preview on a different Supabase project, update the workflow/source configuration deliberately; never commit any secret role key.
- Downloading the ZIP alone does **not** deploy a website. Creating the Pages project and allowing the exact Supabase redirect require the account owner's action.
- If you prefer automatic updates, use the **Git-integrated** setup in [CLOUDFLARE_PAGES_PREVIEW.md](./CLOUDFLARE_PAGES_PREVIEW.md) instead; do not confuse these two modes.

Official references:
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/configuration/serving-pages/
- https://supabase.com/docs/guides/auth/redirect-urls
