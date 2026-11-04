/**
 * Review-only, reproducible acceptance cases. These do not execute,
 * record approval, access member manuscripts, or alter the live site.
 * A real human observation must be stored as an issue after approved setup.
 */
export const PALACE_OBSERVATORY_ACCEPTANCE=Object.freeze([
 {id:'guest-fanfiction',group:'Public discovery',surface:'Reading Rooms → Fanfiction',
  route:'/reading?section=fanfiction',persona:'Signed-out reader',viewport:'Mobile and desktop',
  expected:'Published public hosted and author-source-linked fanworks appear in one discoverable catalogue; source links are clearly distinguished from hosted text.'},
 {id:'fandom-shelf',group:'Public discovery',surface:'Fandom Atlas → Fanfiction',
  route:'/fandoms?section=fanfiction',persona:'Signed-out reader',viewport:'Mobile and desktop',
  expected:'Selecting a fandom finds public fanfiction, supports checking further result pages without a premature no-works claim, and restores the unified hosted-versus-original-source list when cleared.'},
 {id:'fandom-tag-link',group:'Public discovery',surface:'Story tag → Fandom Atlas',
  route:'/fandoms?section=fanfiction&fandom=Naruto',persona:'Signed-out reader',viewport:'Mobile and desktop',
  expected:'A named fandom link waits for directory resolution before declaring a result, uses the same paginated public search as selecting the tag ID, and clearly identifies unresolved or failed directory lookups without implying no works exist. Unique accepted aliases resolve to their canonical fandom, including non-Latin names; ambiguous aliases never merge separate canons.'},
 {id:'tags-inclusion',group:'Public discovery',surface:'Tag Constellation',
  route:'/tags',persona:'Signed-out reader',viewport:'Mobile and desktop',
  expected:'Including real fandom and relationship tags returns matching public works. Combining two tags does not silently ignore either.'},
 {id:'tags-exclusion',group:'Public discovery',surface:'Tag exclusion',
  route:'/reading',persona:'Signed-out reader',viewport:'Mobile and desktop',
  expected:'Works bearing excluded tags do not appear, while eligible included-tag matches remain visible.'},
 {id:'global-search',group:'Public discovery',surface:'Global Search',
  route:'/search',persona:'Signed-out reader',viewport:'Mobile and desktop',
  expected:'A published work is searchable by title and its accepted tags without incorrect duplicates or hidden source distinctions.'},
 {id:'restricted-metadata',group:'Age and privacy',surface:'Mature/Explicit discovery',
  route:'/reading?section=fanfiction',persona:'Signed-out reader',viewport:'Mobile and desktop',
  expected:'Published Mature and Explicit metadata can appear for matching tags unless explicitly excluded; no reader is granted restricted chapter access by seeing a card.'},
 {id:'restricted-reader',group:'Age and privacy',surface:'Restricted reader',
  route:'/reading',persona:'Authorized age-policy test account',viewport:'Mobile and desktop',
  expected:'Restricted chapter text remains inaccessible to accounts that do not meet age requirements. This check must not rely on user-declared identity categories.'},
 {id:'private-work',group:'Age and privacy',surface:'Unpublished works',
  route:'/search',persona:'Signed-out reader',viewport:'Mobile and desktop',
  expected:'Private or unpublished member drafts are absent from search and public discovery. Do not open or copy their contents during testing.'},
 {id:'permissions',group:'Rights',surface:'Hosting and source permissions',
  route:'/reading?section=fanfiction',persona:'Signed-out reader',viewport:'Desktop and mobile',
  expected:'Author-source links are not represented as mirrored hosted text; permission-pending licensed intake remains unpublished.'},
 {id:'small-android',group:'Navigation and accessibility',surface:'Mobile navigation',
  route:'/reading',persona:'Authorized test reader',viewport:'Small Android (320–390px)',
  expected:'No fixed bottom bar overlaps content; headings, controls, focus order, and filter removal remain usable without horizontal overflow.'},
 {id:'tablet',group:'Navigation and accessibility',surface:'Tablet / desktop comparison',
  route:'/fandoms?section=fanfiction',persona:'Authorized test reader',viewport:'Tablet and desktop',
  expected:'Navigation, colours, readable text contrast and displayed results agree across screen sizes; no overlapping headers or popovers.'},
 {id:'owner-only',group:'Owner administration',surface:'The Palace Observatory',
  route:'/admin/observatory',persona:'Signed-out or non-Owner account',viewport:'Mobile and desktop',
  expected:'Access is denied without loading private review data. No issue storage or role assignment is created automatically.'},
 {id:'owner-issues',group:'Owner administration',surface:'Issue tracker and screenshots',
  route:'/admin/observatory',persona:'Authorized Owner account after separate schema approval',viewport:'Mobile and desktop',
  expected:'Review-only issue edits, audit history and private screenshot access enforce RLS. No save creates a deployment or changes a published work.'}
]);
export const palaceObservatoryAcceptanceGroups=Object.freeze([
 'Public discovery','Age and privacy','Rights','Navigation and accessibility','Owner administration'
]);
