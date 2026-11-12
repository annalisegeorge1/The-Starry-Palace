import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';

const css=readFileSync('src/daybreak-treasury-settings-tablet-finish.css','utf8');
const main=readFileSync('src/main.jsx','utf8');
const treasury=readFileSync('src/liveRooms.jsx','utf8');
const settings=readFileSync('src/SettingsRoom.jsx','utf8');

describe('Daybreak badges, Settings and tablet navigation',()=>{
 it('loads after earlier Treasury refinement while leaving night themes alone',()=>{
  const next="import './daybreak-treasury-settings-tablet-finish.css';";
  const earlier="import './daybreak-treasury-desktop-refinement.css';";
  expect(main).toContain(next);
  expect(main.indexOf(next)).toBeGreaterThan(main.indexOf(earlier));
  expect(css).toContain('.palace-shell.full-palace-shell.daylight');
 });
 it('removes Daybreak active neon throughout the sidebar',()=>{
  expect(css).toContain('#palace-sidebar .full-nav-room>a.active');
  expect(css).toContain('background:#e7e0f3!important');
  expect(css).toContain('background-image:none!important');
  expect(css).toContain('#palace-sidebar .full-subnav>a.active');
 });
 it('keeps the header opaque above scrolling Settings content',()=>{
  expect(css).toContain('.full-stage>header.topbar.full-topbar');
  expect(css).toContain('background:#faf9ff!important');
  expect(css).toContain('isolation:isolate!important');
  expect(css).toContain('z-index:965!important');
 });
 it('renders readable badge descriptions and accessible chamber actions',()=>{
  expect(treasury).toContain('Display on chamber');
  expect(treasury).toContain('Remove from chamber');
  expect(css).toContain('.badge-grid.refined .achievement-copy>p');
  expect(css).toContain('color:#4b5164!important');
  expect(css).toContain('.achievement-copy>button.showcase-toggle.is-showcased');
  expect(css).toContain('min-height:42px!important');
  expect(css).toContain('background:#7053a8!important');
 });
 it('shows separate collectible title, court and catalogue metadata',()=>{
  expect(treasury).toContain('className="draw-preview-copy"');
  expect(treasury).toContain('<strong>{p.name}</strong><small>{p.court_name}</small>');
  expect(treasury).toContain("Catalogue #{String(p.catalogue_number).padStart(3,'0')}");
  expect(css).toContain('grid-template-columns:repeat(auto-fit,minmax(255px,1fr))!important');
  expect(css).toContain('.draw-preview-copy>strong');
  expect(css).toContain('white-space:normal!important');
  expect(css).toContain('color:#176d40!important');
 });
 it('keeps all Settings tabs reachable and compacts native select fields',()=>{
  expect(settings).toContain('Testing room');
  expect(settings).toContain('Presets save immediately');
  expect(css).toContain('.settings-tabs.settings-desktop-tabs::-webkit-scrollbar');
  expect(css).toContain('scroll-padding-right:40px!important');
  expect(css).toContain('height:40px!important');
  expect(css).toContain('.settings-preset-head>span');
 });
 it('switches from permanent sidebar to existing drawer through 1120px',()=>{
  expect(main).toContain("window.matchMedia?.('(min-width:1121px)').matches");
  expect(main).toContain('setNavOpen(v=>!v)');
  expect(css).toContain('@media (min-width:981px) and (max-width:1120px)');
  expect(css).toContain('.palace-shell.full-palace-shell.nav-open #palace-sidebar.full-sidebar');
  expect(css).toContain('transform:translateX(0)!important');
  expect(css).toContain('.palace-shell.full-palace-shell.nav-open>.nav-scrim');
 });
});
