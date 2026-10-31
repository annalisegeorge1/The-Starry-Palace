# The Starry Palace — GIPHY Web GIF search setup

**Status at inspection (31 October 2026):** Palace Messenger already supports GIPHY GIF search, reaction shortcuts, a PG content rating, and click-to-load GIFs in messages. The Cloudflare Pages project `the-starry-palace` does **not** have a `VITE_GIPHY_API_KEY` build variable in either production or preview. The integration therefore displays an unavailable state.

**GIPHY beta API is free at 100 requests per hour, shared across the key.** A larger Production API key requires contacting GIPHY and may cost money. Do **not** upgrade without a deliberate budget decision.

## Create your GIPHY Web API key (account owner)

1. Visit https://developers.giphy.com/dashboard/ and sign into your GIPHY account.
2. Choose **Create an App / Create an API Key**. Select **API**, not SDK. Create a **Web** integration named `The Starry Palace — Messenger GIF Search`, using the Palace website URL where requested.
3. Review the GIPHY API terms, acceptable use, and brand attribution requirements. Copy the rate-limited **beta API key** to your private clipboard. Do not paste the key into GitHub issues, screenshots, tickets, chats, or a public `.env` file.
4. One Web key covers this one GIF-search integration used in direct and group conversations. GIPHY asks for separate keys for different platforms and distinct product integrations.

## Configure Cloudflare Pages

1. Open https://dash.cloudflare.com, then **Workers & Pages** → the existing Pages project **the-starry-palace** → **Settings** → **Variables and Secrets** (the wording may vary).
2. Under the **Production** deployment environment, add:
   - **Variable name:** `VITE_GIPHY_API_KEY`
   - **Value:** your own GIPHY Web beta key
   - **Type:** a build-time text variable is sufficient.
3. If you also want GIF search in preview builds, independently set the same variable name for **Preview**; consider a separate GIPHY Web beta key for testing so it doesn't consume production's hourly allowance.
4. Save the settings. **Trigger a new production Pages build/deployment** from `main` after the variable is saved. Vite embeds `VITE_` values at build time; changing the variable alone does not rewrite an already-built JavaScript bundle.
5. Keep the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` settings untouched. The existing custom-domain Worker is a Pages bridge; the key belongs to the **Pages build configuration**, not the Worker environment.

### Important: the key is browser-public

GIPHY requires the Search request to happen in the client/browser. Thus any `VITE_GIPHY_API_KEY` bundled into Vite is readable by visitors in browser resources/network requests, even if Cloudflare labels the stored input a *secret*. This key must **never** be a Supabase service-role key or any private platform credential. Use a dedicated GIPHY Web API key, monitor quotas and replace it through the GIPHY dashboard if abused.

## Test safely after a successful Pages deployment

1. On https://thestarrypalace.com, sign in as a test member.
2. Open **Palace Letters** or **Palace Messenger**, enter a direct or group conversation, open **GIF**, and search `celebrate`.
3. Confirm that GIF thumbnails appear, a selection sends a GIF message, the recipient can tap **View GIF**, and the **Powered by GIPHY** attribution is visible.
4. Test the reaction shortcuts and an empty/no-results search. GIPHY may return a rate-limit message after 100 API requests in an hour; do not run a high-volume automated test using the beta key.
5. Test mobile and desktop. Verify no console/API key authorization errors. If search remains unavailable, ensure the new production Pages deployment was built after saving the variable and that the variable name matches exactly.

## Privacy and safety

- Opening the panel **alone** does not send a search. Typing two or more characters or pressing a reaction shortcut sends that search term directly to GIPHY from the member's browser; GIPHY can receive network data such as IP addresses according to its own practices.
- Search requests **do not send private chat-message contents or manuscript text**. Only the selected GIF's media URL is stored in a chat message after a person sends it. Recipients load external media only after tapping the GIF.
- Results are filtered with `rating=pg`, a conservative baseline for a 13+ community. PG does **not** mean an absence of all mature themes or that all possible content is suitable for every child.
- A conspicuous **Powered by GIPHY** attribution is already in the picker. Check GIPHY's latest approved brand-mark rules before requesting Production API status.
- There is no GIPHY server-side proxy, AI content analysis, or model training of member chat in this integration.

Official documentation:
- https://developers.giphy.com/docs/api/
- https://support.giphy.com/hc/en-us/articles/10389869671322-Is-there-a-fee-for-using-GIPHY-s-API
- https://developers.giphy.com/docs/optional-settings/rating/

**Do not commit an API key to the repo. Only the owner can generate/approve a GIPHY developer key through their account; this runbook does not create an account or access any key.**
