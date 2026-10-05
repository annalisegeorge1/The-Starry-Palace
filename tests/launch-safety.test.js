import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=resolve(process.cwd());
const read=(p)=>readFileSync(resolve(root,p),'utf8');
const main=read('src/main.jsx');
const live=read('src/liveRooms.jsx');
const pkg=JSON.parse(read('package.json'));

describe('Starry Palace launch safety',()=>{
  it('keeps protected member rooms behind ProtectedRoute',()=>{
    for(const path of ['/chamber','/writing','/comics/studio','/palace-life','/treasury','/settings','/activity','/library','/letters','/council']){
      expect(main).toContain(`<Route path="${path}" element={<ProtectedRoute>`);
    }
  });

  it('does not use raw browser prompt or confirm dialogs',()=>{
    expect(live).not.toContain('window.prompt(');
    expect(live).not.toContain('window.confirm(');
  });

  it('keeps a static-host SPA fallback in the production build',()=>{
    expect(pkg.scripts.build).toContain('cp dist/index.html dist/404.html');
  });

  it('keeps Palace route rooms lazy-loaded',()=>{
    expect(main).toContain("React.lazy(()=>importWithRecovery(()=>import('./liveRooms'))");
    expect(main).toContain('<React.Suspense');
  });

  it('never asks members for the password to their email inbox',()=>{
    expect(main).toContain('never enter the password for your email inbox');
    expect(main).not.toContain('Your email password is never required by the Palace.');
  });

  it('avoids ambiguous ballot-option embeds',()=>{
    const data=read('src/palaceData.js');
    expect(data).not.toContain("member_ballot_options(id,label,description,position)");
    expect(data).toContain("from('member_ballot_options').select('id,ballot_id,label,description,position')");
  });

  it('keeps creator support external and secure',()=>{
    const data=read('src/palaceData.js');
    expect(data).toContain("Creator support links must begin with https://");
    expect(live).toContain('rel="noopener noreferrer"');
    expect(live).toContain('support_enabled');
  });

  it('resets scroll and shows a recoverable room loader on route changes',()=>{
    expect(main).toContain('function NavigationReset()');
    expect(main).toContain('window.scrollTo({top:0,left:0,behavior:\'auto\'})');
    expect(main).toContain('function RouteLoading()');
    expect(main).toContain('Reload room');
    expect(main).toContain('RouteErrorBoundary');
    expect(main).toContain('importWithRecovery');
  });

  it('keeps production chunks split and recoverable',()=>{
    const vite=read('vite.config.js');
    expect(vite).toContain("name: 'react-vendor'");
    expect(vite).toContain("name: 'supabase-vendor'");
    expect(main).toContain("vite:preloadError");
    expect(main).toContain("palace-preload-reload");
  });

  it('keeps badge artwork metadata tier-split',()=>{
    const badge=read('src/PalaceBadge.jsx');
    expect(badge).not.toContain("import frames from './originalBadgeArt.json'");
    expect(badge).not.toContain("import art from './badgeArt.json'");
    expect(badge).toContain("import('./badgeFrames.bronze.json')");
    expect(badge).toContain("import('./badgeFrames.emerald.json')");
  });

  it('keeps deep routes inside their Palace parent room',()=>{
    expect(main).toContain("'/club/'");
    expect(main).toContain("'/work/'");
    expect(main).toContain("'/comic/'");
    expect(main).toContain("location.pathname.startsWith('/member/')");
  });


  it('keeps the full Palace gift catalogue wired',()=>{
    const treasury=read('src/Treasury.jsx');
    const data=read('src/palaceData.js');
    const main=read('src/main.jsx');
    expect(treasury).toContain('getGiftCatalogue');
    expect(treasury).toContain('PalaceGift');
    expect(treasury).toContain('PAGE_SIZE=48');
    expect(data).toContain("from('virtual_gifts')");
    expect(data).toContain("eq('reward_eligible',true)");
    expect(main).toContain("/treasury/catalogue");
    expect(main).toContain('600 treasures');
  });

  it('keeps gift artwork as painted editions rather than generic placeholders',()=>{
    const gift=read('src/PalaceGift.jsx');
    const treasury=read('src/Treasury.jsx');
    for(const edition of ['nocturne','starlit','moonwashed','celestial','cloudglass','silverleaf','dreaming','blue-hour','midnight']){
      expect(gift).toContain(edition);
    }
    expect(gift).toContain('gift-painted-object');
    expect(gift).toContain('feTurbulence');
    expect(gift).toContain('ObjectDrawing');
    expect(treasury).toContain('giftEditionFilter');
    expect(treasury).toContain('gift-edition-ribbon');
  });

  it('keeps all twenty Palace court gift identities distinct',()=>{
    const gift=read('src/PalaceGift.jsx');
    const treasury=read('src/Treasury.jsx');
    for(const court of ['Moon Garden','Celestial Library','Lantern Court','Sapphire Observatory','Ink Pavilion','Jade Conservatory','Silver Archive','Starfall Salon','Lotus Chamber','Midnight Gallery','Dreaming Terrace','Crescent Atelier','Cloud Pavilion',"Poet's Alcove",'Aurora Hall','Tea Moon Court','Astral Music Room','Compass Court',"Storyteller's Garden",'Royal Post']){
      expect(gift).toContain(court);
    }
    expect(gift).toContain('CourtMotif');
    expect(gift).toContain('giftCourt');
    expect(treasury).toContain('giftCourts');
    expect(treasury).toContain('gift-court-atlas');
  });

  it('keeps the gift catalogue tied to the member collection ledger',()=>{
    const treasury=read('src/Treasury.jsx');
    expect(treasury).toContain('getTreasury(session.user.id)');
    expect(treasury).toContain('giftOwnership');
    expect(treasury).toContain("value=\"owned\"");
    expect(treasury).toContain("value=\"missing\"");
    expect(treasury).toContain("value=\"duplicates\"");
    expect(treasury).toContain("value=\"ascendable\"");
    expect(treasury).toContain('gift-collection-summary');
    expect(treasury).toContain('In your cabinet');
  });

  it('renders showcased gifts with the painted Palace gift system',()=>{
    expect(live).toContain('<PalaceGift gift={x.virtual_gifts} tier={x.display_tier}/>');
    expect(live).not.toContain('<div className="showcase-orb">☾</div>');
    expect(live).toContain('DISPLAYED HONOURS');
  });

  it('shows per-court collection progress in the Treasury atlas',()=>{
    const treasury=read('src/Treasury.jsx');
    expect(treasury).toContain('courtProgress');
    expect(treasury).toContain('collected</em>');
  });

  it('keeps badge artwork split by tier',()=>{
    const badge=read('src/PalaceBadge.jsx');
    expect(badge).not.toContain('originalBadgeArt.json');
    expect(badge).not.toContain('badgeArt.json');
    for(const tier of ['bronze','silver','gold','platinum','emerald']){
      expect(badge).toContain(`badgeFrames.${tier}.json`);
    }
  });

  it('keeps the tablet Palace header tall enough for both icon and search rows',()=>{
    const css=read('src/polish.css');
    expect(css).toContain('@media(min-width:721px) and (max-width:1120px)');
    expect(css).toContain('min-height:118px');
    expect(css).toContain('grid-template-rows:44px 48px');
    expect(css).toContain('overflow:visible');
  });

  it('keeps the professional polish layer and accessible main landmark wired',()=>{
    const polish=read('src/polish.css');
    expect(main).toContain("import './polish.css'");
    expect(main).toContain('skip-to-content');
    expect(main).toContain('id="palace-content"');
    expect(polish).toContain('--palace-content');
    expect(polish).toContain('@media(prefers-reduced-motion:reduce)');
    expect(polish).toContain('@media(prefers-contrast:more)');
  });

  it('keeps quiet activity rooms useful rather than visually empty',()=>{
    expect(live).toContain('activity-empty-state');
    expect(live).toContain('Open My Library');
    expect(live).toContain('Continue writing');
    expect(live).toContain('Visit Palace Life');
  });

  it('keeps shared room states visually finished across the Palace',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('palace-state-loading');
    expect(live).toContain('Try this room again');
    expect(polish).toContain('.palace-state');
    expect(polish).toContain('.palace-dialog');
    expect(polish).toContain('.library-tabs,.treasury-tabs,.life-tabs');
  });

  it('keeps professional search semantics and the Palace footer wired',()=>{
    const polish=read('src/polish.css');
    expect(main).toContain('role="search"');
    expect(main).toContain('Search The Starry Palace');
    expect(main).toContain('palace-footer');
    expect(main).toContain('Gather. Have a cup of tea. Write and read with me.');
    expect(polish).toContain('.palace-footer');
  });

  it('keeps long rooms visually stable while media loads',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('loading="lazy" decoding="async"');
    expect(live).toContain('fetchPriority="high"');
    expect(polish).toContain('content-visibility:auto');
    expect(polish).toContain('contain-intrinsic-size:auto 260px');
  });

  it('keeps the Welcome Home dashboard and public chamber polish wired',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('palace-home-actions');
    expect(live).toContain('palace-return-card');
    expect(live).toContain('palace-quick-card');
    expect(live).toContain('aria-current="page"');
    expect(polish).toContain('/* Welcome Home — editorial dashboard */');
    expect(polish).toContain('/* Member chamber — profile identity should read clearly before decoration. */');
  });

  it('keeps Reading Rooms and My Library polished and functional',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('summary,work_type,rating');
    expect(live).toContain("origin==='fandom'?w.work_type==='fanwork':w.work_type!=='fanwork'");
    expect(live).toContain('discovery-explainer');
    expect(live).toContain('Search the current Reading Room');
    expect(polish).toContain('/* Reading Rooms — quieter discovery, stronger bookshop hierarchy */');
    expect(polish).toContain('/* My Library — private, organised and calm */');
  });

  it('keeps dual-layer writing recovery and Palace Life discovery wired',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(live).toContain('palace-recovery:');
    expect(live).toContain('Saved to Palace');
    expect(live).toContain('Recovery copy kept on this device');
    expect(live).toContain('commons-lens');
    expect(live).toContain('club-discovery-room');
    expect(data).toContain('discoverableClubs');
    expect(polish).toContain('.draft-recovery-banner');
    expect(polish).toContain('.club-discovery-grid');
  });

  it('keeps the global quick-navigation palette wired',()=>{
    const polish=read('src/polish.css');
    expect(main).toContain('commandOpen');
    expect(main).toContain("e.key.toLowerCase()==='k'");
    expect(main).toContain('palace-command');
    expect(main).toContain('Open Palace quick navigation');
    expect(polish).toContain('.palace-command-backdrop');
    expect(polish).toContain('.command-trigger');
  });

  it('keeps Writing Chamber library controls useful at scale',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('writing-library-tools');
    expect(live).toContain('Search my works');
    expect(live).toContain('Recently updated');
    expect(live).toContain('Most words');
    expect(live).toContain('words across drafts');
    expect(polish).toContain('.writing-library-tools');
  });

  it('keeps Palace Letters searchable, unread-aware and draft-safe',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('latest_message:latest');
    expect(data).toContain('unread}');
    expect(live).toContain('palace-letter-draft:');
    expect(live).toContain('Search Palace Letters');
    expect(live).toContain("['unread','Unread']");
    expect(live).toContain('draft saved on this device');
    expect(polish).toContain('.letters-search');
    expect(polish).toContain('.letter-unread-dot');
  });

  it('keeps Events searchable with RSVP states, agenda and reminder presets',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('event-browser-tools');
    expect(live).toContain("['going','Going']");
    expect(live).toContain("['interested','Interested']");
    expect(live).toContain("['declined','Not going']");
    expect(live).toContain('personal-agenda');
    expect(live).toContain('1 hour before');
    expect(live).toContain('1 day before');
    expect(live).toContain('1 week before');
    expect(polish).toContain('.event-rsvp-group');
    expect(polish).toContain('.personal-agenda');
  });

  it('keeps the chamber editor preview and profile limits wired',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(live).toContain('chamber-live-preview');
    expect(live).toContain('chamber profile complete');
    expect(live).toContain('maxLength="1200"');
    expect(live).toContain('maxLength="140"');
    expect(data).toContain('cleanList=(value,maxItems=8,maxLength=50)');
    expect(polish).toContain('.chamber-live-preview');
  });

  it('keeps privacy and notification presets available without removing granular controls',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain("applyPrivacyPreset('open')");
    expect(live).toContain("applyPrivacyPreset('members')");
    expect(live).toContain("applyPrivacyPreset('private')");
    expect(live).toContain("applyNotificationPreset('focused')");
    expect(live).toContain('PRESETS SAVE IMMEDIATELY');
    expect(polish).toContain('.settings-presets');
  });

  it('keeps Palace Search scoped with recent local queries',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('palace-recent-searches');
    expect(live).toContain('search-lenses');
    expect(live).toContain('recent-searches');
    expect(live).toContain("scope==='all'");
    expect(polish).toContain('.search-lenses');
    expect(polish).toContain('.recent-searches');
  });

  it('keeps the public Home alive and the Palace Gates free of dead controls',()=>{
    const polish=read('src/polish.css');
    expect(main).toContain('home-live-worlds');
    expect(main).toContain('NEWLY OPENED WORLDS');
    expect(main).toContain('Email me a passwordless entrance link');
    expect(main).toContain('password-field');
    expect(main).not.toContain('Google entrance · coming soon');
    expect(polish).toContain('.home-world-grid');
    expect(polish).toContain('.password-field');
  });

  it('keeps Comics and Series discovery useful at scale',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('comicSort');
    expect(live).toContain('comicStatus');
    expect(live).toContain('comic-result-count');
    expect(live).toContain('series-browser-tools');
    expect(live).toContain('seriesView');
    expect(live).toContain('Most works');
    expect(polish).toContain('.comic-tools.refined');
    expect(polish).toContain('.series-browser-tools');
  });

  it('keeps the story reader deeply configurable without changing global theme',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('palace-reader-face');
    expect(live).toContain('palace-reader-leading');
    expect(live).toContain('palace-reader-tone');
    expect(live).toContain('Reset reader');
    expect(live).toContain('reader-quick-jump');
    expect(polish).toContain('.reader-page.face-sans');
    expect(polish).toContain('.reader-page.tone-paper');
  });

  it('keeps spoilers functionally hidden until the reader reveals them',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('revealedSpoilers');
    expect(live).toContain('Spoiler hidden');
    expect(live).toContain('spoiler-reveal');
    expect(polish).toContain('.reader-comment.spoiler-hidden');
  });

  it('keeps work pages aware of saved following and reading progress state',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('getWorkReaderState');
    expect(data).toContain('setWorkSaved');
    expect(data).toContain('setWorkFollowing');
    expect(live).toContain('Continue reading →');
    expect(live).toContain('work-resume-strip');
    expect(live).toContain('Saved ✓');
    expect(live).toContain('Following ✓');
    expect(polish).toContain('.work-resume-strip');
  });

  it('keeps moderated reader responses private until approved',()=>{
    expect(live).toContain("c.status==='approved'||c.author_id===session?.user?.id");
    expect(live).toContain('visibleComments');
  });

  it('keeps Tag Constellation searches reusable and device-private',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('palace-saved-constellations');
    expect(live).toContain('Save constellation');
    expect(live).toContain('saved-constellations');
    expect(live).toContain('applyConstellation');
    expect(polish).toContain('.saved-constellations');
  });

  it('keeps Moonlight Activity actionable instead of decorative',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('setNoticeSaved');
    expect(data).toContain('dismissNotice');
    expect(live).toContain('activity-lenses');
    expect(live).toContain('noticeHref');
    expect(live).toContain('No notices in this view.');
    expect(polish).toContain('.activity-notice-actions');
  });

  it('keeps My Library search honest across shelves and resumes exact reading places',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('Search the current Library shelf');
    expect(live).toContain('filteredSavedComics');
    expect(live).toContain('filteredStorySubs');
    expect(live).toContain('filteredWriters');
    expect(live).toContain('x.chapter_id?"/work/"+x.works.slug+"/chapter/"+x.chapter_id');
    expect(live).toContain('x.episode_id?"/comic/"+x.comics.slug+"/episode/"+x.episode_id');
    expect(polish).toContain('.library-search-live>button');
  });

  it('keeps Lost Works provenance-first and personally saveable',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('setArchiveRecordSaved');
    expect(live).toContain('archive-advanced-filters');
    expect(live).toContain('Recently verified/updated');
    expect(live).toContain('Saved ✓');
    expect(polish).toContain('.archive-advanced-filters');
  });

  it('keeps Palace Council queues searchable without broadening permissions',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('council-queue-tools');
    expect(live).toContain('Search current Council queue');
    expect(live).toContain('openCouncilCount');
    expect(live).toContain('future appeal');
    expect(polish).toContain('.council-queue-tools');
  });

  it('keeps Throne of Honour recommendations persistent and reviewable',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('createHonourRecommendation');
    expect(data).toContain('withdrawHonourRecommendation');
    expect(data).toContain('reviewHonourRecommendation');
    expect(live).toContain('Recommend an author');
    expect(live).toContain('honour-my-recommendations');
    expect(live).toContain('Honour recommendations');
    expect(live).toContain('Publish tribute');
    expect(polish).toContain('.honour-monthly-courts');
  });

  it('keeps Library organizers editable removable and safely deletable',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('updateLibraryOrganizer');
    expect(data).toContain('deleteLibraryOrganizer');
    expect(data).toContain('removeLibraryOrganizerItem');
    expect(live).toContain('edit-organizer');
    expect(live).toContain('delete-organizer');
    expect(live).toContain('Remove "+(i.works?.title||i.comics?.title||\'item\')+" from collection');
    expect(polish).toContain('.organizer-item-row');
  });

  it('keeps Writing Chamber revision snapshots separate from autosave',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('getChapterSnapshots');
    expect(data).toContain('createChapterSnapshot');
    expect(data).toContain('deleteChapterSnapshot');
    expect(live).toContain('Revision snapshots');
    expect(live).toContain('Create snapshot');
    expect(live).toContain('Restore to editor');
    expect(live).toContain('save to Palace when ready');
    expect(polish).toContain('.snapshot-list');
  });

  it('keeps creator backups portable and keyboard saving available',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('getWorkExport');
    expect(live).toContain('Export work backup');
    expect(live).toContain("e.key.toLowerCase()==='s'");
    expect(live).toContain('Portable work backup exported.');
    expect(live).toContain('Ctrl/⌘ S · save chapter');
    expect(polish).toContain('.studio-head-actions');
  });

  it('keeps Palace Forum replies persistent and threaded',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain("from('forum_replies')");
    expect(data).toContain('replyForumThread');
    expect(live).toContain('Reply to thread');
    expect(live).toContain('forum-thread-room');
    expect(live).toContain('reply_count');
    expect(polish).toContain('.forum-ledger-thread');
    expect(polish).toContain('.forum-reply-compose');
  });

  it('keeps open and request-to-join club doors functionally distinct',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('requestClubMembership');
    expect(data).toContain('withdrawClubMembershipRequest');
    expect(data).toContain('respondClubMembershipRequest');
    expect(data).toContain(".in('privacy',['open','request_to_join'])");
    expect(live).toContain('Request to join');
    expect(live).toContain('STEWARD QUEUE');
    expect(live).toContain('Doors you are waiting on.');
    expect(polish).toContain('.club-door-queue');
  });

  it('self-heals stale lazy-room styling and protects mobile top controls',()=>{
    const polish=read('src/polish.css');
    expect(main).toContain('roomCssMatches');
    expect(main).toContain('palace-room-css-sync-reload');
    expect(live).toContain('PALACE_ROOM_CSS_VERSION=2026100503');
    expect(polish).toContain('--palace-room-css-version:2026100503');
    expect(polish).toContain('env(safe-area-inset-top)');
    expect(polish).toContain('.top-icon-link');
  });

  it('keeps gift ascension server-validated and chamber showcases ownership-safe',()=>{
    const data=read('src/palaceData.js');
    const treasury=read('src/Treasury.jsx');
    const collection=read('src/treasuryCollection.js');
    const css=read('src/treasury.css');
    expect(data).toContain('ascendPalaceGift');
    expect(data).toContain('setProfileGiftShowcase');
    expect(data).toContain('removeProfileGiftShowcase');
    expect(treasury).toContain('Ascend ');
    expect(treasury).toContain('Add to chamber showcase');
    expect(treasury).toContain('treasury-showcase-dialog');
    expect(collection).toContain('counts:{}');
    expect(collection).toContain('entry.ascendable');
    expect(css).toContain('.gift-card-actions');
  });

  it('keeps Moonlight and club chat realtime with a refresh fallback',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('getMoonlightMessages');
    expect(data).toContain('getClubChatMessages');
    expect(live).toContain("table:'public_chat_messages'");
    expect(live).toContain("table:'club_chat_messages'");
    expect(live).toContain('Auto-refreshing');
    expect(live).toContain('new message');
    expect(polish).toContain('.moon-connection.live');
    expect(polish).toContain('.moon-new-messages');
  });

  it('keeps duplicate gift trading atomic and duplicate-only',()=>{
    const data=read('src/palaceData.js');
    const treasury=read('src/Treasury.jsx');
    const css=read('src/treasury.css');
    expect(data).toContain('getGiftTrades');
    expect(data).toContain('createGiftTradeOffer');
    expect(data).toContain('respondGiftTradeOffer');
    expect(treasury).toContain('DUPLICATE EXCHANGE');
    expect(treasury).toContain('Trade without giving up your only copy.');
    expect(treasury).toContain('Accept trade');
    expect(treasury).toContain('Cancel offer');
    expect(css).toContain('.gift-trade-list');
  });

  it('keeps earned achievement showcases tied to verified progress',()=>{
    const data=read('src/palaceData.js');
    const treasury=read('src/Treasury.jsx');
    const css=read('src/treasury.css');
    expect(data).toContain('setProfileAchievementShowcase');
    expect(data).toContain('removeProfileAchievementShowcase');
    expect(treasury).toContain('achievementProgress');
    expect(treasury).toContain('Not unlocked yet');
    expect(treasury).toContain('Earned · ');
    expect(treasury).toContain('badge-showcase-dialog');
    expect(css).toContain('.badge-earned-state');
    expect(css).toContain('.badge-showcase-actions');
  });

  it('keeps chamber honours split into achievement and treasure galleries',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('ACHIEVEMENT WALL');
    expect(live).toContain('TREASURE CABINET');
    expect(live).toContain('Arrange achievements →');
    expect(live).toContain('Arrange treasures →');
    expect(live).toContain('showcase-slot');
    expect(polish).toContain('.chamber-honour-groups');
    expect(polish).toContain('.showcase-slot');
  });

  it('keeps Series ownership safe while allowing metadata and reading-order management',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('updateSeries');
    expect(data).toContain('deleteSeries');
    expect(data).toContain('reorderSeriesWorks');
    expect(live).toContain('Edit series');
    expect(live).toContain('Delete this series?');
    expect(live).toContain('series-order-actions');
    expect(live).toContain('series-completion');
    expect(polish).toContain('.series-owner-actions');
    expect(polish).toContain('.series-order-actions');
  });

  it('keeps Comics Studio sequence and accessibility metadata editable',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('reorderComicEpisodes');
    expect(data).toContain('reorderComicPages');
    expect(data).toContain('updateComicPage');
    expect(live).toContain('episode-reorder-controls');
    expect(live).toContain('comic-page-order-actions');
    expect(live).toContain('Edit page details');
    expect(live).toContain('Save page details');
    expect(polish).toContain('.episode-reorder-controls');
    expect(polish).toContain('.comic-page-order-actions');
  });

  it('keeps the comic reader sequence-aware and locally persistent',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('palace-comic-reader-mode');
    expect(live).toContain('comic-episode-jump');
    expect(live).toContain('Arrow keys turn pages');
    expect(live).toContain('Next episode →');
    expect(live).toContain('comic-episode-nav');
    expect(polish).toContain('.comic-episode-jump');
    expect(polish).toContain('.comic-episode-nav');
  });

  it('keeps Comic Studio settings aligned and creator library manageable',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('setComicArchived');
    expect(data).toContain("['ltr','rtl','vertical']");
    expect(data).toContain("['open','moderated','closed']");
    expect(live).toContain('Search my comics');
    expect(live).toContain('Active comics');
    expect(live).toContain('Archived comics');
    expect(live).toContain('Restore as private draft');
    expect(live).toContain('<option value="closed">Closed</option>');
    expect(polish).toContain('.comic-library-tools');
  });

  it('keeps Comic Studio publication-ready and accessibility-safe',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain("from('comic_pages').select('id,alt_text,decorative')");
    expect(data).toContain('Add at least one comic page before publishing this episode.');
    expect(data).toContain('Add image descriptions to every non-decorative page before publishing.');
    expect(live).toContain('PUBLISH READINESS');
    expect(live).toContain('comic-readiness-checks');
    expect(live).toContain('missingDescriptions');
    expect(polish).toContain('.comic-readiness');
    expect(polish).toContain('.comic-readiness-track');
  });

  it('keeps scheduled comic publishing real, durable and safety-checked',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    const sql=read('database/comic-scheduled-publishing.sql');
    expect(data).toContain('scheduleComicEpisode');
    expect(data).toContain('cancelComicEpisodeSchedule');
    expect(data).toContain("Object.prototype.hasOwnProperty.call(patch,'scheduled_for')");
    expect(data).toContain("scheduled_for:null");
    expect(live).toContain('Schedule publication');
    expect(live).toContain('Cancel schedule');
    expect(live).toContain('comicLocalDateTimeValue');
    expect(live).toContain("comic_studio:'/comics/studio'");
    expect(live).toContain('scheduled</span>');
    expect(polish).toContain('.episode-schedule-note');
    expect(sql).toContain('private.process_scheduled_comic_episodes()');
    expect(sql).toContain("'palace-scheduled-comic-publisher'");
    expect(sql).toContain("'* * * * *'");
    expect(sql).toContain('for update of e skip locked');
    expect(sql).toContain('Scheduled comic release needs attention');
  });

  it('keeps comic doorways aware of saved following and reading state',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('getComicReaderState');
    expect(data).toContain('setComicSaved');
    expect(data).toContain('setComicFollowing');
    expect(live).toContain('comic-resume-strip');
    expect(live).toContain('Saved ✓');
    expect(live).toContain('Following ✓');
    expect(live).toContain('YOUR READING PLACE');
    expect(polish).toContain('.comic-resume-strip');
  });

  it('only completes a comic on the final page of the final readable episode',()=>{
    expect(live).toContain('const comicCompleted=ix===pages.length-1&&episodeIndex===readableEpisodes.length-1');
    expect(live).toContain('i===pages.length-1&&episodeIndex===readableEpisodes.length-1');
    expect(live).toContain("comicHistory.filter(comicFinished)");
    expect(live).toContain('Finished comic · your reading history is kept');
    expect(live).toContain('Completed stories and comics will gather here.');
  });

  it('keeps Comics Gallery aware of reader shelf state',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('getComicShelfState');
    expect(data).toContain("from('saved_comics').select('comic_id')");
    expect(data).toContain("from('comic_reading_progress').select('comic_id,episode_id,page_id,completed,updated_at')");
    expect(live).toContain('comic-reader-flags');
    expect(live).toContain("keep.progress&&!keep.progress.completed?'Continue →':'Open panels →'");
    expect(live).toContain('<span className="resume">Reading</span>');
    expect(polish).toContain('.comic-reader-flags');
  });

  it('keeps comic follow cadence aligned with the database constraint',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain("frequency='immediate'");
    expect(data).toContain("['immediate','weekly'].includes(frequency)");
    expect(data).not.toContain("setComicFollowing(userId,comicId,enabled,frequency='instant'");
    expect(live).toContain('comic-follow-frequency');
    expect(live).toContain('<option value="immediate">As soon as published</option>');
    expect(live).toContain('<option value="weekly">Weekly digest</option>');
    expect(polish).toContain('.comic-follow-frequency');
  });

  it('backs comic notification cadence with real database behavior',()=>{
    const sql=read('database/comic-notification-cadence.sql');
    expect(sql).toContain("s.frequency='immediate'");
    expect(sql).toContain("s.frequency='weekly'");
    expect(sql).toContain('private.send_weekly_comic_digest()');
    expect(sql).toContain("'palace-weekly-comic-digest'");
    expect(sql).toContain("'0 12 * * 0'");
    expect(live).toContain("item.route_name==='comic'");
    expect(live).toContain("item.metadata?.tab");
  });

  it('reopens finished comics when newer panels are published',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('comics(id,title,slug,cover_path,last_published_at)');
    expect(live).toContain('const hasNewPanels=');
    expect(live).toContain('NEW PANELS ARE WAITING');
    expect(live).toContain('A newer episode was published after you finished.');
    expect(live).toContain('comicHasNew');
    expect(live).toContain('comicFinished');
    expect(live).toContain('New panels available');
    expect(polish).toContain('.comic-reader-flags span.new');
    expect(polish).toContain('.comic-resume-strip.new-panels');
  });

  it('records comic progress when the visible page opens',()=>{
    expect(live).toContain('if(!session||!data||!page)return');
    expect(live).toContain('recordComicProgress(session.user.id,data.comic.id,data.episode.id,page.id,comicCompleted)');
    expect(live).toContain('index===pages.length-1&&episodeIndex===readableEpisodes.length-1');
  });

  it('surfaces unread comic updates in Library subscriptions',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('comics(id,title,slug,last_published_at)');
    expect(live).toContain('comicSubscriptionHasNew');
    expect(live).toContain('New panels waiting · ');
    expect(live).toContain("x.frequency==='weekly'?'weekly digest':'immediate updates'");
    expect(polish).toContain('.followed-list>a.has-new-panels');
  });

  it('lets signed-in readers filter Comics Gallery by their own shelf state',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain("const[readerView,setReaderView]=useState('all')");
    expect(live).toContain('<span>My shelf</span>');
    for(const value of ['new','reading','saved','following','finished'])expect(live).toContain('<option value="'+value+'">');
    expect(live).toContain("readerView==='new'&&hasNew");
    expect(live).toContain("readerView==='finished'&&!!keep.progress?.completed&&!hasNew");
    expect(polish).toContain('repeat(5,minmax(115px,150px))');
  });

  it('shows comic access level and counts new panels for the signed-in reader',()=>{
    const data=read('src/palaceData.js');
    expect(data).toContain('completion_status,visibility,reading_direction');
    expect(live).toContain('const newForReaderCount=');
    expect(live).toContain("newForReaderCount+' new for you'");
    expect(live).toContain("c.visibility==='members'?' · members only'");
    expect(live).toContain("data.visibility==='private'?' · PRIVATE PREVIEW'");
  });

  it('keeps restored sidebar sections fully wired',()=>{
    expect(main).not.toContain('RESTORING');
    expect(main).not.toContain('restoring-section');
    expect(main).toContain("['Monthly rankings','/treasury?tab=rankings']");
    expect(main).toContain("['Storage & uploads','/settings?tab=storage']");
    expect(main).toContain("['Clubs','/palace-life?room=clubs']");
  });

  it('keeps Tag Constellation links on the live route',()=>{
    expect(live).not.toContain('/tag-search');
    expect(main).toContain('<Route path="/tags"');
  });

  it('uses the schema-approved comic permission scope',()=>{
    expect(live).toContain("'offline_reader_copy'");
    expect(live).not.toContain("requestComicDownload(session.user.id,data.id,'images'");
  });

  it('keeps the restored full Palace hierarchy visible',()=>{
    for(const label of ['My Palace','Reading Rooms','My Library','Writing Chamber','Palace Life','Events & Heritage','Royal Treasury','Settings & Safety','Palace Council','The Palace Code']){
      expect(main).toContain(label);
    }
    expect(main).not.toContain(',null]');
  });
});

