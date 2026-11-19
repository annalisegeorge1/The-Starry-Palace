import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/member-chamber-compact-stats.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const rooms=readFileSync('src/liveRooms.jsx','utf8');

describe('compact public Chamber statistics',()=>{
  it('loads after the earlier profile and theme layers',()=>{
    const current="import './member-chamber-compact-stats.css';";
    expect(main).toContain(current);
    for(const prior of [
      "import './profile-grid-restoration.css';",
      "import './member-profile-mobile-refinement.css';",
      "import './palace-prism-letter-contrast.css';"
    ]) expect(main.indexOf(current)).toBeGreaterThan(main.indexOf(prior));
  });
  it('preserves all six actual stat labels without altering member data',()=>{
    expect(rooms).toContain('className="legacy-profile-stats"');
    for(const label of ['FOLLOWERS','STORIES','COMICS','SERIES','CLUBS','DISPLAYED HONOURS'])
      expect(rooms).toContain('<span>'+label+'</span>');
  });
  it('uses one slim six-column row, or two three-column rows on phones',()=>{
    expect(css).toContain('grid-template-columns:repeat(6,minmax(0,1fr))!important');
    expect(css).toContain('@media(max-width:760px)');
    expect(css).toContain('grid-template-columns:repeat(3,minmax(0,1fr))!important');
    expect(css).not.toContain('repeat(2,minmax(0,1fr))');
    expect(css).toContain('overflow:visible!important');
    expect(css).toContain('min-width:0!important');
    expect(css).toContain('min-height:32px!important');
  });
  it('avoids oversized tiles and keeps themed palette backgrounds intact',()=>{
    expect(css).toContain('background:transparent!important');
    expect(css).toContain('border-radius:0!important');
    expect(css).toContain('border-inline-start:1px solid');
    expect(css).toContain('font:600 clamp(.92rem,1.2vw,1rem)');
    expect(css).not.toMatch(/\.legacy-profile-stats\s*\{[^}]*background:/s);
    expect(css).not.toMatch(/aspect-ratio|object-fit|cover_url|avatar_url/);
  });
});
