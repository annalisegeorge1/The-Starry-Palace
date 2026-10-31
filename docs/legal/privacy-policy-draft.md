# THE STARRY PALACE
## Privacy Policy
**WORKING DRAFT — NOT IN FORCE — NOT PUBLISHED**  
**Prepared:** 31 October 2026  
**Platform:** thestarrypalace.com  
**Privacy contact:** Annalise Pierre · annalise.pierre.28@gmail.com

This draft describes the intended privacy practices for The Starry Palace. It must be checked against the deployed application, hosting and database configuration, retention settings, and applicable law before publication. It is not a promise that every listed process is already active.

### 1. Who operates the Palace

The Starry Palace is operated by Annalise Pierre. Privacy questions or requests may be sent to [annalise.pierre.28@gmail.com](mailto:annalise.pierre.28@gmail.com). Before this policy is published, confirm the operator's required legal address, applicable privacy contact details, and any representative required by law.

### 2. Minimum age and children

The proposed minimum age to create or use an account is **13 years old**. The Palace asks members for a date of birth during registration or, for existing accounts, before further account access. Account creation is blocked when the supplied date indicates that the person is under 13. People under 13 must not create or use a Palace account. A creator may set a higher minimum reader age for a published story or comic.

Age is self-declared; the Palace does not currently verify identity or a person's date of birth. The age control can be evaded by someone who supplies false information. Do not treat it as verified identity, parental consent, or a guarantee that a person cannot see unsuitable material. Because members may be under 18, counsel must confirm the rules for collecting children's information, parental consent, notices, and age-appropriate safeguards in every jurisdiction where the Palace is offered before this policy is published.

### 3. Information the Palace handles

- **Account and sign-in information:** email address, authentication identifiers, password authentication data handled by the sign-in provider, and account metadata needed to operate the account.
- **Date of birth:** collected to check the 13-year account minimum and to enforce creator-selected minimum reader ages. The date is stored in a private database table, not in a public profile, and the registration flow removes it from the temporary sign-up metadata after saving it to that private table. The Palace receives a self-declared date, not identity documents.
- **Profile and community information:** chosen username, display name, avatar, profile details, interests, public posts, comments, messages, follows, blocks, reports and feature settings, depending on what a member chooses to provide or use.
- **Creative content:** manuscripts, chapters, comics, images, captions, comments and other material members create or upload. Drafts are intended to remain accessible only to their author and authorised collaborators; publication and visibility settings determine the audience for published work.
- **Feature and device information:** reading progress, saved items, notifications, preferences, browser session data and device-local composer drafts, depending on the feature and browser used.
- **Operational and security data:** technical logs, request details and security signals processed by the hosting, database, email or security providers. The exact fields and retention periods must be confirmed from provider configuration.
- **Payment information:** the Palace may display creator support links, but an external payment provider handles payment details when a member follows one. The Palace should not ask members to send payment credentials through messages.

### 4. Why information is used

The purposes are to create and secure accounts; enforce the account minimum age and creator-set reading limits; provide writing, reading, comics and community features; store drafts and deliver published work to the chosen audience; remember settings and reading progress; send account or feature notices; respond to reports and privacy requests; prevent abuse, fraud and security incidents; maintain and improve the service; and meet legal obligations. **The Palace has no intention of using AI models with member data for any purpose** and will not submit or expose member data to AI models or services for training, generation, analysis, moderation, recommendations, profiling, or other AI processing.

### 5. Private writing and AI

The Palace has no intention of using AI models with member data on any front. This applies to account and profile information, dates of birth, messages, reports, activity, technical records, drafts, published writing, artwork, comics, comments and uploaded files. The Palace will not offer an AI feature that processes member data or provide it to AI providers for such processing. People maintaining the Palace must not put member data, unpublished writing, private messages, identifiable records or production database exports into AI coding assistants or test services. Development and troubleshooting must use source code, synthetic data or properly redacted examples that do not identify members or reveal their content.

### 6. When information is shared

Information may be processed by service providers needed to operate the Palace, such as authentication/database, hosting/content delivery, email delivery, security, and payment services used when a member follows an external support link. The provider list, corporate identities, data locations, access roles, contractual terms and international transfer arrangements must be verified from the current production configuration before publication.

Published content is visible according to the creator's selected settings and age limit. Account dates of birth and private drafts must not be included in public API responses or profiles. The Palace may disclose information where required by applicable law, to address a credible safety emergency, or to investigate abuse or security incidents, subject to review and applicable safeguards. Do not promise absolute confidentiality for messages, reports, logs or content that a member has shared with other people.

### 7. Storage, cookies and retention

The website uses browser storage for sign-in sessions, preferences and some device-local writing or reading state. A separate Cookie and Browser Storage Notice should describe the current storage inventory, including what is strictly necessary and any optional technologies. The application source reviewed for the companion draft did not contain direct `document.cookie` code or an app-level advertising tag; production response headers, Cloudflare/Supabase settings and embedded services still require a live inventory.

The date of birth is intended to be retained in the private age table while needed to enforce age eligibility, then removed when the account is deleted, subject to verified backup and legal-retention practices. The exact deletion flow, backup expiry and retention schedule must be checked before publication. Operational logs, reports, messages, and backups may have different retention periods; specify each period or a meaningful determination method after configuration is reviewed.

### 8. Security and access controls

The Palace intends to use authentication, row-level database policies and private storage access controls to keep unpublished work, restricted comic images and member information from unauthorised readers. Date of birth is not provided through a member-facing lookup endpoint; the age service should return only an eligibility status and should be callable only by the signed-in account holder. These are security goals, not a guarantee that a system is invulnerable. Access permissions and recovery processes should be reviewed regularly, and suspected incidents should be investigated and handled as required by law.

### 9. Member choices and privacy requests

Members may use a pen name and should not need to display a legal name on a public profile. Members should be able to review and update profile details, manage visibility and communication settings, request access to or correction of personal information, and close an account through the published route. Before this policy is final, confirm which self-service tools exist, how identity is checked for a request without collecting excess information, applicable response timelines, and how account deletion affects content, collaborative works, reports and backups.

### 10. Changes and contact

Material changes to privacy practices should be explained before or when they take effect, with notice appropriate to the change and applicable law. The final published version should identify its effective date and describe any choices a member has when they do not accept a material change.

Contact: **Annalise Pierre · annalise.pierre.28@gmail.com**

### Review items before publication

- Confirm legal entity/operator details, location, jurisdictions served, lawful bases or other required legal disclosures, and privacy-request process.
- Verify age-related requirements for a service that accepts members from age 12, including parental consent and age-appropriate design obligations.
- Inspect deployed Supabase/Auth settings, Cloudflare and hosting configuration, storage providers, email services, logs, cookies, local storage, and embeds.
- Confirm the auth signup flow saves the date privately and removes it from sign-up metadata; verify all RLS, signed comic asset, search, RPC and direct-link age gates.
- Confirm data processor contracts, access roles, data residency, transfers, security incident procedures and retention periods.
- Confirm export, correction, account deletion, backup expiration and the treatment of collaborative work and moderation records.
- Obtain legal review before approval and publication.
