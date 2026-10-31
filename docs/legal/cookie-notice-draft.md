# THE STARRY PALACE
## Cookie and Browser Storage Notice
**WORKING DRAFT — NOT IN FORCE — NOT PUBLISHED**
**Review date:** 31 October 2026
**Platform:** thestarrypalace.com

This is a draft notice for members and visitors. It separates cookies from other browser storage and does not claim a complete live inventory. The current application source has been reviewed, but the live Cloudflare, Supabase and hosting responses still need to be checked before this notice can be finalised.

### What the current application source shows
The browser client is configured to persist sign-in sessions. The app also uses local browser storage for preferences and some device-local drafts and progress. This storage is tied to the browser profile on that device; it is not necessarily a cookie and may not sync with a member's account. Clearing browser data may sign a member out, reset preferences or delete local-only draft text. Members should keep their own copies of important writing.

The application source reviewed on 31 October 2026 contains no direct `document.cookie` code and no app-level advertising or analytics tags. That does not rule out cookies or storage set by Cloudflare, Supabase, hosting responses, security features or future embedded services. A live browser and response-header inventory is still required.

### Categories to verify before this notice is published

| Category | Current evidence | Purpose and treatment | Details still to confirm |
| --- | --- | --- | --- |
| Sign-in and session | Supabase client is configured to persist a signed-in session in browser storage. | Maintain sign-in and refresh the authenticated session when requested. | Actual storage key, expiry, whether any provider cookie is used, and the effect of clearing it. |
| Preferences and feature state | App source stores theme/reading preferences, progress, dismissed guidance and some composer drafts in local browser storage. | Remember a member's chosen settings or temporary device-local work. | Complete key inventory, retention, which items sync to the account, and which are strictly optional. |
| Hosting and security | Cloudflare, Supabase or other service responses may use cookies or similar storage. | Service-specific delivery, security or abuse prevention, if enabled. | Inspect production and staging response headers, provider settings, names, domain, duration and purpose. |
| Analytics, advertising and profiling | No app-level analytics or advertising tag was found in the reviewed client source. | Not currently identified in the app source. | Confirm no service-level or tag-manager configuration adds these tools. Do not activate optional tracking without updated notice and consent where required. |
| Third-party embeds | No complete live embed audit has been performed for this notice. | A third party may set its own storage when its content is loaded. | List each embed, whether it loads before a click, its provider, and how it is blocked until any required consent. |

### Choices and control
The Palace's proposed approach is to use only storage needed for a feature the member requests. Optional analytics, advertising and behavioural profiling should remain off unless separately introduced with clear information and any consent required for the visitor's location. Consent should not be inferred from scrolling, continuing to read or a preselected toggle. Where a consent interface is required, accepting optional technologies and rejecting them should be equally easy, and members should be able to change or withdraw their choice later. Public reading should not require acceptance of optional tracking.

As of this review, no app-level cookie-preference banner or settings control was found in the application source. The Palace must not tell visitors that such a control is available until it has been built and tested. Browser settings can clear or block cookies and local storage, but doing so may interrupt sign-in, reset preferences or remove device-only drafts.

### Third-party services
The Palace may rely on hosting, authentication, security or other service providers. Their storage practices can depend on configuration and may change. The final notice should identify each provider and link to its current privacy information after the live configuration has been checked. A person who follows an external payment or social link leaves the Palace and is subject to that provider's own notices and controls.

### Before publication
The operator must test the live site in clean logged-out and signed-in browser sessions on desktop and mobile; inspect cookies, local/session storage, response headers, embeds, Cloudflare and Supabase settings; record each name, provider, purpose, duration and whether it is strictly necessary; test any consent choice; and update the separate Privacy Policy. Cookie and device-storage obligations depend on where the Palace offers its services and which technologies it uses. Obtain legal review before taking this draft live.

**Draft note:** This notice is not a promise that a particular cookie is present or absent on every visit. It remains unpublished until the inventory and controls above are verified.
