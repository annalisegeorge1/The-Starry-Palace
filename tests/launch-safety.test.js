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
    const css=read('src/style.css');
    expect(css).toContain('@media(min-width:721px) and (max-width:1120px)');
    expect(css).toContain('min-height:118px');
    expect(css).toContain('grid-template-rows:44px 48px');
    expect(css).toContain('overflow:visible!important');
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

