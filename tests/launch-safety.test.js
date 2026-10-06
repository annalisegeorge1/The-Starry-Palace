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

  it('lets signed-in members change their Palace password without asking for an email inbox password',()=>{
    expect(live).toContain('Change Palace password');
    expect(live).toContain('Current Palace password');
    expect(live).toContain('supabase.auth.updateUser(update)');
    expect(live).toContain('current_password');
    expect(live).toContain('The new passwords do not match.');
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

  it('warms the main Palace room bundle without wasting constrained connections',()=>{
    expect(main).toContain('function RoomBundleWarmup()');
    expect(main).toContain("connection?.saveData");
    expect(main).toContain("/2g/.test(connection?.effectiveType||'')");
    expect(main).toContain("requestIdleCallback");
    expect(main).toContain("importWithRecovery(()=>import('./liveRooms'))");
    expect(main).toContain('<RoomBundleWarmup/>');
  });

  it('keeps full Palace content search reachable from the compact command panel',()=>{
    const polish=read('src/polish.css');
    expect(main).toContain('function searchCommand()');
    expect(main).toContain("navigate('/search?q='+encodeURIComponent(q))");
    expect(main).toContain('Search all Palace content');
    expect(main).toContain('Search Palace rooms, sections or content');
    expect(main).toContain("visibleCommandItems[commandIndex]?chooseCommand(visibleCommandItems[commandIndex].path):searchCommand()");
    expect(main).toContain('Stories, comics, writers, tags, fandoms and clubs');
    expect(polish).toContain('.command-search-all');
  });

  it('shows unread Activity count in the persistent Palace header',()=>{
    expect(main).toContain('const [activityBadge,setActivityBadge]=useState(0)');
    expect(main).toContain("from('notifications').select('id',{count:'exact',head:true})");
    expect(main).toContain(".eq('unread',true).eq('dismissed',false)");
    expect(main).toContain("activityBadge+' unread notifications'");
    expect(main).toContain("activityBadge>99?'99+':activityBadge");
  });

  it('keeps fair discovery unranked and makes saved shelves resume directly',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('✦ Surprise me');
    expect(live).toContain('it does not use a popularity score');
    expect(live).toContain('savedStoryProgress');
    expect(live).toContain('savedComicProgress');
    expect(live).toContain('SAVED · CONTINUE');
    expect(live).toContain('COMICS SHELF · CONTINUE');
    expect(polish).toContain('.surprise-story');
  });

  it('keeps private Nightstand discovery and precise chapter continuity connected to member home',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('chapter_progress_percent');
    expect(data).toContain('author_id,title,slug,summary');
    expect(live).toContain('FOR YOUR NIGHTSTAND');
    expect(live).toContain('Three worlds chosen from your own interests.');
    expect(live).toContain('resume near ');
    expect(live).toContain('Current chapter');
    expect(live).toContain('Save My Preferences');
    expect(polish).toContain('.palace-nightstand-grid');
    expect(polish).toContain('.chapter-place');
  });

  it('keeps My Palace focused on continuity, attention and upcoming work',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('scheduledComicEpisodes');
    expect(data).toContain('collaborationInvites');
    expect(data).toContain('downloadRequests');
    expect(data).toContain('eventInvitations');
    expect(data).toContain('upcomingEvents');
    expect(live).toContain('palace-resume-grid');
    expect(live).toContain('NEEDS YOUR ATTENTION');
    expect(live).toContain('CREATOR RELEASE DESK');
    expect(live).toContain('palace-home-pulse');
    expect(live).toContain('comicHasNew');
    expect(polish).toContain('.palace-command-centre');
    expect(polish).toContain('.palace-attention-grid');
    expect(polish).toContain('.palace-coming-grid');
  });

  it('keeps My Palace counts aligned and merges prose with comic releases',()=>{
    const data=read('src/palaceData.js');
    expect(data).toContain('unreadNotices,savedNotices,letterRequests,savedCount');
    expect(data).toContain('scheduledComicEpisodes,scheduledChapters,collaborationInvites');
    expect(data).toContain('scheduledChapters:scheduledChapters.data||[]');
    expect(data).toContain('savedNotices:savedNotices.count||0');
    expect(live).toContain("type:'writing'");
    expect(live).toContain("type:'comic'");
    expect(live).toContain('(counts.scheduledComics||0)+(counts.scheduledChapters||0)');
    expect(live).toContain('When you schedule chapters or comic episodes');
  });

  it('keeps My Palace quick actions compact and mobile-scrollable',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('palace-home-shortcuts');
    for(const path of ['/writing','/library','/comics/studio','/events?tab=calendar','/treasury','/search'])expect(live).toContain('to="'+path+'"');
    expect(polish).toContain('.palace-home-shortcuts');
    expect(polish).toContain('overflow-x:auto');
    expect(polish).toContain('scroll-snap-type:x proximity');
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

  it('keeps the My Palace dashboard and public chamber polish wired',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('palace-command-centre');
    expect(live).toContain('palace-resume-card');
    expect(live).toContain('palace-attention-grid');
    expect(live).toContain('aria-current="page"');
    expect(polish).toContain('/* My Palace command centre */');
    expect(polish).toContain('/* Member chamber — profile identity should read clearly before decoration. */');
  });

  it('keeps member chambers complete, boundary-aware and creator-focused',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain("from('comics').select('id,title,slug,summary,completion_status,cover_path,last_published_at')");
    expect(data).toContain("from('series').select('id,title,slug,summary,visibility,updated_at,series_works");
    expect(data).toContain('comics:signedComics,series:visibleSeries');
    expect(live).toContain('chamber-creator-overview');
    expect(live).toContain('Open correspondence');
    expect(live).toContain('Requests at the door');
    expect(live).toContain('Letters closed');
    expect(live).toContain('Begin correspondence');
    expect(live).toContain('CREATIVE SHELVES');
    expect(live).toContain('Illustrated worlds');
    expect(live).toContain('Connected reading paths');
    expect(live).toContain('const fullBio=p?.bio?.trim()');
    expect(polish).toContain('/* Member chamber creator-home expansion */');
    expect(polish).toContain('.member-comics-grid');
    expect(polish).toContain('.member-series-grid');
  });

  it('deep-links open chamber correspondence into Palace Letters',()=>{
    expect(live).toContain("const requestedConversation=new URLSearchParams(window.location.search).get('conversation')");
    expect(live).toContain("navigate('/letters?conversation='+encodeURIComponent(r.conversation_id))");
    expect(live).toContain("setSeriesQuery]=useState(()=>new URLSearchParams(window.location.search).get('q')||'')");
  });

  it('keeps Exile destructive to stale social links without weakening authenticated creator RPCs',()=>{
    const sql=read('database/social-boundary-hardening.sql');
    expect(sql).toContain('private.enforce_member_exile_cleanup()');
    expect(sql).toContain('delete from public.member_follows');
    expect(sql).toContain('delete from public.message_requests');
    expect(sql).toContain("where status='pending'");
    expect(sql).toContain('revoke execute on function public.ascend_palace_gift(uuid,text) from public, anon');
    expect(sql).toContain('grant execute on function public.ascend_palace_gift(uuid,text) to authenticated');
    expect(sql).toContain('revoke execute on function public.reorder_comic_pages(uuid,uuid[]) from public, anon');
    expect(sql).toContain('revoke execute on function public.set_profile_gift_showcase(uuid,text,integer) from public, anon');
    expect(live).toContain("if(saved.blocked){navigate('/settings?tab=boundaries');return}");
  });

  it('makes member Mute quiet ambient personal feeds without blocking direct access',()=>{
    const data=read('src/palaceData.js');
    expect(data).toContain("from('user_member_boundaries').select('other_user_id,muted,blocked').eq('user_id',userId)");
    expect(data).toContain("const quiet=new Set((boundaries.data||[]).filter(x=>x.muted||x.blocked).map(x=>x.other_user_id))");
    expect(data).toContain('const quietMemberIds=new Set((boundaries.data||[]).filter(x=>x.muted||x.blocked).map(x=>x.other_user_id))');
    expect(data).toContain('const visibleThreads=(threads.data||[]).filter(x=>!quietMemberIds.has(x.author_id))');
    expect(data).toContain('const visibleReplies=(replies.data||[]).filter(x=>!quietMemberIds.has(x.author_id))');
    expect(data).toContain('const visibleChat=(chat.data||[]).filter(x=>!quietMemberIds.has(x.author_id))');
    expect(data).toContain("select('id,author_id,title,body,highlighted,created_at,profiles!member_introductions_author_id_fkey");
    expect(data).toContain('introductions:visibleIntros');
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

  it('keeps prose discovery continuity-aware without fake shelf labels',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('getWorkShelfState');
    expect(data).toContain('first_published_at,last_published_at');
    expect(live).toContain('Following Updates');
    expect(live).toContain('Continue Reading');
    expect(live).toContain('Quiet Shelves');
    expect(live).not.toContain('Trending Now');
    expect(live).not.toContain('Palace Picks');
    expect(live).toContain('story-reader-flags');
    expect(live).toContain("reopened=w=>!!stateFor(w).progress?.completed&&hasNew(w)");
    expect(polish).toContain('/* Prose reader continuity */');
    expect(polish).toContain('.story-reader-flags');
  });

  it('reopens completed prose only when new chapters arrive and preserves mid-story resume',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain("select('chapter_id,progress_percent,chapter_progress_percent,completed')");
    expect(data).toContain('const sameChapter=current.data?.chapter_id===chapterId');
    expect(data).toContain('const done=sameChapter?Boolean(current.data?.completed||completed):Boolean(completed)');
    expect(data).toContain('chapter_progress_percent:precise');
    expect(live).toContain('For Your Nightstand');
    expect(live).toContain('palace-reading-place:');
    expect(data).toContain('last_published_at');
    expect(live).toContain('storyReopened');
    expect(live).toContain('CONTINUE · NEW CHAPTER AHEAD');
    expect(live).toContain('reopenedAfterFinish');
    expect(live).toContain('nextUnreadChapter');
    expect(live).toContain('NEW CHAPTER AFTER YOU FINISHED');
    expect(polish).toContain('/* Story landing update continuity */');
  });

  it('makes Reading Room tag and fandom search match its own placeholder',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('work_tags(tags(id,name,category,status))');
    expect(live).toContain("const workTags=w=>(w.work_tags||[]).map(x=>x.tags).filter(t=>t?.status==='canonical')");
    expect(live).toContain('...workTags(w).flatMap(t=>[t.name,t.category])');
    expect(live).toContain('reading-card-tags');
    expect(live).toContain('Title, writer, fandom or tag…');
    expect(polish).toContain('/* Reading Room canonical tag hints */');
  });

  it('lets members nominate another Chamber for recognition without creating a popularity system',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('nominateCommunityHighlight');
    expect(data).toContain('Community Highlights are for recognising another member.');
    expect(data).toContain('You already have an open nomination for this member.');
    expect(live).toContain('Nominate a Community Highlight');
    expect(live).toContain('✦ Nominate someone');
    expect(live).toContain('Highlights never raise a work in discovery or ranking.');
    expect(live).toContain('nominations are recognition, not popularity votes');
    expect(polish).toContain('.highlight-head-actions');
    expect(polish).toContain('.highlight-member-results');
  });

  it('uses real-member Salon prompts instead of fabricated social activity',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('THE SALON TABLE');
    expect(live).toContain('They are prompts, not fake activity');
    expect(live).toContain('Bring to the Commons →');
    expect(live).toContain('useSalonPrompt');
    expect(live).toContain('threadComposeRef');
    expect(polish).toContain('.salon-prompt-room');
    expect(polish).toContain('.salon-prompt-grid');
  });

  it('keeps Palace Life social without turning it into an endless feed',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('saveCommunityIntroduction');
    expect(data).toContain('deleteCommunityIntroduction');
    expect(data).toContain("needClient().from('member_follows').select('followed_id')");
    expect(live).toContain('FROM CHAMBERS YOU CHOSE');
    expect(live).toContain('This is a small continuity shelf from people you follow—not an endless social feed.');
    expect(live).toContain('MY INTRODUCTION');
    expect(live).toContain('Introduce myself ✦');
    expect(live).toContain('Follow chamber');
    expect(polish).toContain('.following-chamber-shelf');
    expect(live).toContain('new-stars-lens');
    expect(live).toContain('New to me');
    expect(live).toContain('My introduction');
    expect(live).toContain("post.profiles?.title||'Palace Member'");
    expect(live).toContain("msg.profiles?.title||'Palace Member'");
    expect(live).toContain("member.profiles?.title||'Palace Member'");
    expect(polish).toContain('.new-stars-lens');
    expect(polish).toContain('/* Identity follows members into social rooms */');
  });

  it('gives clubs useful pulse and quiet member discovery without follower-count pressure',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('clubPulseIds');
    expect(data).toContain('member_count:clubMemberRows');
    expect(data).toContain('clubFollowingIds');
    expect(live).toContain('ROOM PULSE');
    expect(live).toContain('club-interior-pulse');
    expect(live).toContain('Search club members');
    expect(live).toContain("['following','Following']");
    expect(live).toContain('Follow chamber');
    expect(live).not.toContain('followers in this circle');
    expect(polish).toContain('/* Club pulse + quiet member discovery */');
    expect(polish).toContain('.club-member-grid.enriched');
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
    expect(main).toContain('recentPalaceRoutes');
    expect(main).toContain('Surprise me with a story');
    expect(main).toContain("e.key==='ArrowDown'");
    expect(main).toContain('activeSection');
    expect(live).toContain("get('surprise')!=='1'");
    expect(polish).toContain('.palace-command-backdrop');
    expect(polish).toContain('.command-trigger');
    expect(polish).toContain('.command-group-title');
    expect(polish).toContain('.surprise-story');
  });

  it('keeps room atmosphere CSS-native rather than cover-image dependent',()=>{
    const polish=read('src/polish.css');
    expect(polish).toContain('Room atmosphere without generated cover art');
    expect(polish).toContain('.legacy-reading-page::before');
    expect(polish).toContain('.legacy-life-page::before');
    expect(polish).toContain('.legacy-treasury-page::before');
    expect(polish).toContain('.legacy-lost-page::before');
  });

  it('keeps the Production Prep shell proportions without replacing the Palace sidebar',()=>{
    const polish=read('src/polish.css');
    expect(polish).toContain('Production Prep shell proportion pass');
    expect(polish).toContain('.full-sidebar');
    expect(polish).toContain('width:288px!important');
    expect(polish).toContain('.palace-cover-live');
    expect(polish).toContain('height:136px!important');
    expect(polish).toContain('.global-search-live');
    expect(polish).toContain('border-radius:999px!important');
  });

  it('keeps the Production Prep composition system as a site-wide guide',()=>{
    const polish=read('src/polish.css');
    expect(polish).toContain('--palace-content:min(1460px,100%)');
    expect(polish).toContain('Production Prep composition system · site-wide');
    expect(polish).toContain('--palace-content-wide:1460px');
    expect(polish).toContain('.legacy-reading-page');
    expect(polish).toContain('.legacy-library-page');
    expect(polish).toContain('.writing-studio-grid');
    expect(polish).toContain('.legacy-treasury-page');
  });

  it('keeps nested Palace Life main content from inheriting outer-page padding',()=>{
    const style=read('src/style.css');
    const polish=read('src/polish.css');
    expect(style).toContain('.palace-stage>main{max-width:1280px');
    expect(style).not.toContain('.palace-stage main{max-width:1280px');
    expect(polish).toContain('Desktop monitor composition correction · real-device QA');
    expect(polish).toContain('.palace-stage .palace-social-column');
    expect(polish).toContain('padding:0!important');
  });

  it('keeps fun discovery controls optional and non-ranking',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('reading-compass');
    expect(live).toContain('A finished world');
    expect(live).toContain('Take me back');
    expect(live).toContain('life-wander');
    expect(live).toContain('wanderPalaceLife');
    expect(live).toContain('drawReveal');
    expect(live).toContain('draw-reveal-stars');
    expect(live).toContain('aria-live="polite"');
    expect(polish).toContain('.reading-compass');
    expect(polish).toContain('.life-wander');
    expect(polish).toContain('@keyframes palaceTreasureReveal');
  });

  it('keeps the optional Moon Prompt playful without streak pressure',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('palace-moon-prompt');
    expect(live).toContain('MOON PROMPT · A SMALL CREATIVE SPARK');
    expect(live).toContain('No streak. No score.');
    expect(live).toContain('setPromptShift');
    expect(live).toContain('Write from this →');
    expect(polish).toContain('.palace-moon-prompt');
    expect(polish).toContain('.moon-prompt-actions');
  });

  it('keeps one-handed mobile Palace navigation available',()=>{
    const polish=read('src/polish.css');
    expect(main).toContain('mobile-palace-dock');
    expect(main).toContain('aria-label="Quick Palace navigation"');
    expect(main).toContain('mobile-dock-write');
    expect(main).toContain('mobile-palace-more');
    expect(main).toContain('mobile-palace-more-sheet');
    expect(main).toContain('More of your Palace'.toUpperCase());
    expect(main).toContain('Everything stays one tap away without crowding the dock.');
    expect(main).toContain("activeRoom?.id==='reading'");
    expect(main).toContain("['library','events','treasury','settings'].includes(activeRoom?.id)");
    expect(main).toContain('activityBadge+letterBadge');
    expect(polish).toContain('.mobile-palace-dock');
    expect(polish).toContain('grid-template-columns:repeat(5');
    expect(polish).toContain('.mobile-more-backdrop');
    expect(polish).toContain('.mobile-more-grid');
    expect(polish).toContain('.full-top-actions .write-action{display:none!important}');
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

  it('keeps scheduled prose publishing real, safe and creator-visible',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    const sql=read('database/chapter-scheduled-publishing.sql');
    expect(data).toContain('scheduleChapter');
    expect(data).toContain('cancelChapterSchedule');
    expect(data).toContain('assertChapterPublishable');
    expect(data).toContain("scheduled_for:null");
    expect(live).toContain("chapter.scheduled_for?'Reschedule':'Schedule'");
    expect(live).toContain('Schedule publication');
    expect(live).toContain('writing-chapter-health');
    expect(live).toContain('writing-release-queue');
    expect(live).toContain('Search my works and chapters');
    expect(live).toContain("draftFilter==='scheduled'&&workHasScheduled(w)");
    expect(polish).toContain('/* Writing Chamber release readiness */');
    expect(polish).toContain('.writing-release-queue');
    expect(sql).toContain('private.process_scheduled_chapters()');
    expect(sql).toContain("'palace-scheduled-chapter-publisher'");
    expect(sql).toContain("'* * * * *'");
    expect(sql).toContain('for update of ch skip locked');
    expect(sql).toContain("'work',v_slug,'Read chapter'");
  });

  it('keeps long prose works manageable with a searchable chapter manager',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain("const[chapterQuery,setChapterQuery]=useState('')");
    expect(live).toContain("const[chapterView,setChapterView]=useState('all')");
    expect(live).toContain('chapterMatchesView');
    expect(live).toContain('shownChapters');
    expect(live).toContain('CHAPTER MANAGER');
    expect(live).toContain('<option value="ready">Ready to publish</option>');
    expect(live).toContain('<option value="scheduled">Scheduled</option>');
    expect(live).toContain('No chapters in this view.');
    expect(polish).toContain('/* Writing Chamber chapter manager */');
    expect(polish).toContain('.writing-chapter-manager-tools');
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

  it('keeps Palace Life social without becoming an endless feed',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('saveCommunityIntroduction');
    expect(data).toContain('deleteCommunityIntroduction');
    expect(data).toContain('followingIds');
    expect(live).toContain('FROM CHAMBERS YOU CHOSE');
    expect(live).toContain('One introduction, edited whenever you like.');
    expect(live).toContain('Follow chamber');
    expect(live).toContain('Introduce myself ✦');
    expect(polish).toContain('.my-introduction-desk');
    expect(polish).toContain('.following-chamber-shelf');
  });

  it('shows exact private chapter place and clearer end-of-chapter navigation',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('YOUR PLACE IN THIS CHAPTER');
    expect(live).toContain('Private place saved');
    expect(live).toContain('reader-nav-context');
    expect(live).toContain('reader-nav-actions');
    expect(polish).toContain('.reader-place-status');
    expect(polish).toContain('.reader-nav-actions');
  });

  it('keeps public chambers and story/comic doorways consistent on small screens',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('publication-glance');
    expect(live).toContain('comic-publication-glance');
    expect(live).toContain('chapter_progress_percent');
    expect(live).toContain('FROM THE CHAMBER OF');
    expect(polish).toContain('.chamber-section-nav');
    expect(polish).toContain('scroll-margin-top:135px');
    expect(polish).toContain('/* Mobile public reading actions */');
    expect(polish).toContain('.comic-page{max-width:1180px');
  });

  it('carries Palace titles from creator chambers onto public story and comic doorways',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('avatar_url,title');
    expect(live).toContain('creator-doorway');
    expect(live).toContain('FROM THE CHAMBER OF');
    expect(live).toContain("data.profiles?.title||'Palace Member'");
    expect(live).toContain("data.creator.title||'Palace Member'");
    expect(polish).toContain('.creator-doorway');
  });

  it('offers curated Palace titles during first-night setup and later preference tuning',()=>{
    expect(live).toContain('Palace title<select');
    expect(live).toContain('title:palaceTitle');
    expect(live).toContain('Special titles appear here only when your account holds them.');
    expect(live).toContain('titleChoices.find');
  });

  it('uses curated Palace titles and protects special titles',()=>{
    const data=read('src/palaceData.js');
    const migration=read('database/palace-profile-title-catalogue.sql');
    const polish=read('src/polish.css');
    expect(data).toContain('getPalaceTitleOptions');
    expect(data).toContain("Choose a Palace title available to your chamber.");
    expect(live).toContain('Palace title<select');
    expect(live).toContain('Special Palace title');
    expect(live).not.toContain('Palace title<input');
    expect(migration).toContain("'Celestial Monarch','Special'");
    expect(migration).toContain('profile_title_entitlements');
    expect(migration).toContain('validate_profile_title_choice');
    expect(polish).toContain('.chamber-title-mark');
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

  it('keeps the Palace Lorebook reveal system available',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain("rpc('get_work_lore'");
    expect(data).toContain("rpc('save_work_lore_entry'");
    expect(data).toContain("rpc('delete_work_lore_entry'");
    expect(live).toContain('PALACE LOREBOOK');
    expect(live).toContain('Build the world behind the work.');
    expect(live).toContain('Behind the curtain.');
    expect(live).toContain('Unlock after chapter');
    expect(live).toContain('Reveal spoiler lore');
    expect(polish).toContain('Palace Lorebook');
  });

  it('keeps Relay Audience Balcony host-controlled and choice-based',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain("rpc('set_relay_audience'");
    expect(data).toContain("rpc('create_relay_poll'");
    expect(data).toContain("rpc('vote_relay_poll'");
    expect(live).toContain('Open Audience Balcony');
    expect(live).toContain('Ask the audience');
    expect(live).toContain('Writers in the relay cannot vote');
    expect(polish).toContain('Audience Balcony + Ink Duels');
  });

  it('keeps Ink Duels timed, blind and participation-focused',()=>{
    const data=read('src/palaceData.js');
    expect(data).toContain("rpc('get_micro_duels')");
    expect(data).toContain("rpc('create_micro_duel'");
    expect(data).toContain("rpc('submit_micro_duel_entry'");
    expect(data).toContain("rpc('vote_micro_duel'");
    expect(live).toContain('MICRO-FICTION DUELS');
    expect(live).toContain('Fifteen minutes. One strange prompt.');
    expect(live).toContain('Cast blind vote');
    expect(live).toContain('winning never changes discovery ranking');
  });

  it('keeps chapter praise unified with Heart Star Moon Crown',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('LEAVE A LITTLE LIGHT ON THIS CHAPTER');
    expect(live).toContain("givePalacePraise('chapter'");
    expect(live).toContain("recordPalaceShare(data.work.id)");
    expect(live).not.toContain('chapter-star-button');
    expect(polish).toContain('Chapter praise room');
  });

  it('keeps Relay Writing Rooms invite-only and turn-based',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain("rpc('get_my_relay_rooms')");
    expect(data).toContain("rpc('create_relay_room'");
    expect(data).toContain("rpc('invite_relay_writer'");
    expect(data).toContain("rpc('submit_relay_turn'");
    expect(live).toContain('RELAY WRITING ROOMS');
    expect(live).toContain('Pass the quill, not the ownership.');
    expect(live).toContain('Open a Relay Room ✦');
    expect(live).toContain('Pass the quill →');
    expect(polish).toContain('Relay Writing Rooms');
  });

  it('keeps earned special titles grouped into Celestial constellations',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain("name:'First Light'");
    expect(live).toContain("name:'Moon Court'");
    expect(live).toContain("name:'Eclipse Court'");
    expect(live).toContain("name:'Astral Throne'");
    expect(live).toContain("name:'Crown Constellation'");
    expect(live).toContain('title-constellation-grid');
    expect(polish).toContain('Royal Treasury Celestial Titles chamber');
  });

  it('keeps the Events calendar and secondary controls in moonstone language',()=>{
    const polish=read('src/polish.css');
    expect(polish).toContain('Moonstone controls + celestial observatory calendar');
    expect(polish).toContain('--moonstone-line');
    expect(polish).toContain('.button-moonstone');
    expect(polish).toContain('.button-twilight');
    expect(polish).toContain('.button-starlight');
    expect(polish).toContain('.button-relic');
    expect(polish).toContain('.palace-month-calendar::after');
  });

  it('keeps Celestial Point balance and title ladder in the Royal Treasury, not the catalogue',()=>{
    const treasury=read('src/Treasury.jsx');
    const polish=read('src/polish.css');
    expect(live).toContain('CELESTIAL HONOURS');
    expect(live).toContain('Names written in the Palace sky.');
    expect(live).toContain('lifetime points');
    expect(live).toContain('How my points were earned');
    expect(live).toContain('celestial_points_required');
    expect(treasury).toContain('Special titles now live in the Royal Treasury.');
    expect(treasury).not.toContain('celestial-balance-room');
    expect(polish).toContain('grid-template-columns:minmax(0,1fr)!important');
  });

  it('keeps Celestial praise and special-title progress wired',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain("rpc('get_my_celestial_points')");
    expect(data).toContain("rpc('give_palace_praise'");
    expect(data).toContain("rpc('record_palace_share'");
    expect(live).toContain('LEAVE A LITTLE LIGHT');
    expect(live).toContain("['heart','♡','Heart']");
    expect(live).toContain("['crown','♕','Crown']");
    expect(live).toContain('Celestial Points');
    expect(polish).toContain('Celestial praise row · Heart Star Moon Crown');
  });

  it('keeps Tags as a room while giving Read its own deep search and member polls',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(main).toContain("['Advanced search','/reading?view=search']");
    expect(main).toContain("['Tags room','/tags']");
    expect(live).toContain('DEEP SEARCH · READER CONTROLLED');
    expect(live).toContain('Include what you crave. Exclude what you do not.');
    expect(live).toContain('Open the Tags room →');
    expect(live).toContain('Any member of the circle can ask a question.');
    expect(live).toContain('◇ Poll');
    expect(live).toContain('Voting closes');
    expect(data).toContain('p_closes_at:closesAt');
    expect(polish).toContain('.reading-mode-tabs');
    expect(polish).toContain('.advanced-tag-builder');
  });

  it('keeps badge and gift artwork display-only in the normal Palace UI',()=>{
    const badge=read('src/PalaceBadge.jsx');
    const gift=read('src/PalaceGift.jsx');
    const collectibles=read('src/PalaceCollectibles.jsx');
    const treasuryCss=read('src/treasury.css');
    for(const source of [badge,gift,collectibles]){
      expect(source).toContain('onContextMenu:e=>e.preventDefault()');
      expect(source).toContain('onDragStart:e=>e.preventDefault()');
      expect(source).toContain('onCopy:e=>e.preventDefault()');
      expect(source).toContain('protected-palace-art');
    }
    expect(collectibles).toContain('draggable="false"');
    expect(treasuryCss).toContain('-webkit-touch-callout:none!important');
    expect(treasuryCss).toContain('-webkit-user-drag:none!important');
    expect(treasuryCss).toContain('.protected-palace-art img');
  });

  it('recovers blank routes and keeps both Palace themes intentionally rich',()=>{
    const polish=read('src/polish.css');
    expect(main).toContain('function BlankScreenWatchdog()');
    expect(main).toContain('data-palace-frame="ready"');
    expect(main).toContain("palace-blank-screen-reload:");
    expect(main).toContain('blank-screen-recovery');
    expect(polish).toContain('.nightfall .full-sidebar');
    expect(polish).toContain('.full-palace-shell.daylight');
    expect(polish).toContain('linear-gradient(135deg,#8259ad 0%,#a8669c 58%,#cb7f75 100%)');
    expect(polish).toContain('transform:scale(.62)!important');
  });

  it('keeps Commons composing visible and the cultural calendar rich but searchable',()=>{
    const polish=read('src/polish.css');
    const calendar=read('src/PalaceCalendar.jsx');
    const data=read('src/palaceData.js');
    expect(live).toContain("block:'start'");
    expect(live).toContain('heritageQuery');
    expect(live).toContain('FESTIVALS · HERITAGE · HISTORY');
    expect(live).toContain('heritage-type-');
    expect(live).toContain('Christmas, Carnival, Diwali, July 4, New Year…');
    expect(polish).toContain('.palace-social-column{');
    expect(polish).toContain('overflow:visible!important');
    expect(polish).toContain('scroll-margin-top:200px');
    expect(polish).toContain('.heritage-type-festival');
    expect(polish).toContain('.calendar-heritage-legend');
    expect(calendar).toContain('calendar-kind-dots');
    expect(calendar).toContain("['festival','Festival']");
    expect(data).toContain(".order('month').order('day').limit(250)");
  });

  it('keeps 3,000-tag discovery member-extensible and searchable',()=>{
    const data=read('src/palaceData.js');
    expect(data).toContain("rpc('search_palace_tags'");
    expect(data).toContain("rpc('create_community_tag'");
    expect(live).toContain('3,000+ TAGS · MEMBER-EXTENSIBLE');
    expect(live).toContain('Can’t find it? Name it.');
    expect(live).toContain('Add & attach tag ✦');
    expect(live).toContain('COMIC CONSTELLATION');
  });

  it('keeps the writer desk richer than a plain textarea',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain("exec('undo')");
    expect(live).toContain("exec('redo')");
    expect(live).toContain("exec('strikeThrough')");
    expect(live).toContain("exec('insertUnorderedList')");
    expect(live).toContain("exec('insertOrderedList')");
    expect(live).toContain('⌖ Typewriter');
    expect(live).toContain('Draft font');
    expect(live).toContain('Spacing');
    expect(polish).toContain('.writer-view-controls');
    expect(polish).toContain('.writing-page-stage.typewriter-mode');
  });

  it('keeps prism glass selective and Palace navigation iconography custom',()=>{
    const polish=read('src/polish.css');
    expect(main).toContain('function PalaceRoomIcon');
    expect(main).toContain('room-sigil room-sigil-');
    expect(live).toContain('prism-glass prism-story');
    expect(live).toContain('prism-glass prism-comic');
    expect(live).toContain('heritage-prism');
    expect(polish).toContain('Prism personality + expanded writer desk + Palace sigils');
  });

  it('keeps the Prompt Orrery playful and zero-stakes',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('PROMPT ORRERY · 1,012 CONSTELLATIONS · ZERO STAKES');
    expect(live).toContain('Pull the lever');
    expect(live).toContain('More than one thousand curated prompt constellations');
    expect(live).toContain('GENRE / VIBE');
    expect(live).toContain('RANDOM OBJECT');
    expect(live).toContain('TWIST');
    expect(polish).toContain('Prompt Orrery · creative three-reel generator');
  });

  it('uses the live ranking preference column for public opt-out',()=>{
    expect(live).toContain("{opted_out:!rankings?.preferences?.opted_out}");
    expect(live).toContain("checked={!!rankings.preferences?.opted_out}");
    expect(live).not.toContain('public_opt_out');
  });

  it('keeps empty Series shelves actionable instead of dead-ended',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('series-empty-state');
    expect(live).toContain('Create the first series ✦');
    expect(live).toContain('Browse the Reading Rooms →');
    expect(polish).toContain('.series-empty-actions');
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

  it('keeps Activity grouped, metadata-aware and exact about unread notices',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain('metadata,action_label,unread,saved,created_at');
    expect(data).toContain("select('id',{count:'exact',head:true}).eq('user_id',userId).eq('dismissed',false).eq('unread',true)");
    expect(live).toContain("const[noticeGroup,setNoticeGroup]=useState('all')");
    expect(live).toContain('activity-category-tabs');
    expect(live).toContain("const bucketOrder=['Today','Yesterday','This week','Earlier']");
    expect(live).toContain("n.action_label||'Open →'");
    expect(live).toContain('type="button" className="activity-notice-copy"');
    expect(polish).toContain('/* Activity notification centre grouping */');
    expect(polish).toContain('.activity-time-group');
    expect(polish).toContain('.activity-notice-copy:focus-visible');
  });

  it('keeps Activity searchable and saved counts exact in-session',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain(".eq('dismissed',false).eq('saved',true)");
    expect(data).toContain('saved:savedCount.count||0');
    expect(live).toContain("const[noticeQuery,setNoticeQuery]=useState('')");
    expect(live).toContain('Search notifications…');
    expect(live).toContain('const nq=noticeQuery.trim().toLowerCase()');
    expect(live).toContain("saved:Math.max(0,(d.metrics?.saved||0)+(next?1:-1))");
    expect(live).toContain("saved:item.saved?Math.max(0,(d.metrics?.saved||0)-1):(d.metrics?.saved||0)");
    expect(polish).toContain('/* Searchable Activity inbox */');
    expect(polish).toContain('.activity-search');
  });

  it('keeps Activity count Promise results aligned',()=>{
    const data=read('src/palaceData.js');
    expect(data).toContain('const [notices,unreadCount,savedCount,progress,works,clubs]=await Promise.all([');
    expect(data).toContain(".eq('dismissed',false).eq('unread',true),\n  needClient().from('notifications').select('id',{count:'exact',head:true}).eq('user_id',userId).eq('dismissed',false).eq('saved',true)");
  });

  it('keeps story and blocked-writing notices pointed at the exact destination',()=>{
    expect(live).toContain("item.metadata?.chapter_id?'/chapter/'");
    expect(live).toContain("item.route_name==='writing'&&item.route_param");
    expect(live).toContain("'?chapter='+encodeURIComponent(item.metadata.chapter_id)");
    expect(live).toContain("const requestedChapter=new URLSearchParams(window.location.search).get('chapter')");
    expect(live).toContain("d.chapters.find(ch=>ch.id===requestedChapter)");
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

  it('keeps the Writing Studio comfortable for long-form work',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('writing-studio-grid');
    expect(live).toContain('writing-studio-rail');
    expect(live).toContain('writing-editor-workspace');
    expect(live).toContain('Work settings');
    expect(live).toContain('writing-goal-ring');
    expect(live).toContain('Quick word goals');
    expect(live).toContain("e.key==='Escape'&&focusMode");
    expect(live).toContain('writing-page-stage');
    expect(live).toContain('PRIVATE REVISION NOTE');
    expect(polish).toContain('.chic-work-studio-head');
    expect(polish).toContain('.writing-studio-grid');
    expect(polish).toContain('.writing-page-stage .legacy-writing-canvas');
    expect(polish).toContain('.chic-studio-buttons');
    expect(polish).toContain('.focus-editor .writing-studio-rail');
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
    expect(live).toContain('Ctrl/⌘ S · save · Ctrl/⌘ Z · undo');
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
    expect(main).toContain('palace-room-css-nonblocking');
    expect(main).toContain("Palace room '+name+' is unavailable in this build.");
    expect(main).toContain('ROOM_IMPORT_TIMEOUT_MS=12000');
    expect(main).toContain("new Error('Palace room load timeout')");
    expect(main).toContain("schedulePalaceReload('palace-script-error-reload'");
    expect(main).not.toContain('return new Promise(()=>{})');
    expect(live).toContain('PALACE_ROOM_CSS_VERSION=2026100605');
    expect(polish).toContain('--palace-room-css-version:2026100605');
    expect(polish).toContain('padding-top:calc(10px + env(safe-area-inset-top))');
    expect(polish).toContain('min-height:calc(62px + env(safe-area-inset-top))');
    expect(polish).toContain('scroll-padding-top:calc(64px + env(safe-area-inset-top))');
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

  it('keeps scheduled comic releases easy to review and reschedule',()=>{
    const data=read('src/palaceData.js');
    const polish=read('src/polish.css');
    expect(data).toContain("neq('status','published').select().maybeSingle()");
    expect(live).toContain('upcomingComicReleases');
    expect(live).toContain('UPCOMING RELEASES');
    expect(live).toContain('The Palace checks this queue every minute.');
    expect(live).toContain("episode.scheduled_for?'Reschedule':'Schedule'");
    expect(live).toContain("window.addEventListener('hashchange',sync)");
    expect(polish).toContain('.comic-release-queue');
  });

  it('shows creator-facing episode release health and precise schedule recovery links',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain('episodeMissingDescriptions');
    expect(live).toContain('episodeReadyForRelease');
    expect(live).toContain('Ready to publish');
    expect(live).toContain('Needs work');
    expect(live).toContain("item.route_name==='comic_studio'");
    expect(live).toContain("'#comic-'+encodeURIComponent(item.metadata.comic_id)");
    expect(polish).toContain('.episode-health');
    expect(polish).toContain('.episode-health span.scheduled');
  });

  it('keeps large Comic Studio episode libraries searchable and safely filterable',()=>{
    const polish=read('src/polish.css');
    expect(live).toContain("const[episodeQuery,setEpisodeQuery]=useState('')");
    expect(live).toContain("const[episodeView,setEpisodeView]=useState('all')");
    expect(live).toContain('episodeNeedsWork');
    expect(live).toContain('episodeReady');
    expect(live).toContain('shownEpisodes');
    expect(live).toContain('<option value="needs">Needs attention</option>');
    expect(live).toContain('<option value="scheduled">Scheduled</option>');
    expect(live).toContain('comic.comic_episodes.findIndex(x=>x.id===ep.id)');
    expect(live).toContain('No episodes in this view.');
    expect(polish).toContain('.episode-manager-tools');
    expect(polish).toContain('.episode-manager-empty');
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

