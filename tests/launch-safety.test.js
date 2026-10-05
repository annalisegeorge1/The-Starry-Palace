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
    expect(main).toContain("React.lazy(()=>import('./liveRooms')");
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
