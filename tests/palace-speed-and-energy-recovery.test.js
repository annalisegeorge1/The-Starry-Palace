import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read=path=>readFileSync(resolve(process.cwd(),path),'utf8');
const shell=read('src/main.jsx');
const life=read('src/liveRooms.jsx');
const chat=read('src/PalaceChatDrawer.jsx');
const home=read('src/PalaceHomeWelcome.jsx');
const nav=read('src/palace-calm-layout.css');

describe('Palace responsiveness and personality recovery',()=>{
 it('restores rich rooms instead of repeatedly folding the writing, reading and Palace Life tools',()=>{
  expect(life).toContain('className="reading-mood-doors"');
  expect(life).toContain('className="reading-classics-hall"');
  expect(life).toContain('className="prompt-orrery"');
  expect(life).toContain('className="community-pulse-row restored social-pulse"');
  expect(life).toContain('legacy-showcase-wall chamber-atelier-gallery gallery-layout-');
  expect(life).not.toContain('palace-calm-prompt-fold');
  expect(life).not.toContain('palace-calm-wardrobe');
 });
 it('removes the redundant presentation layers while keeping the cleaner nav',()=>{
  for(const layer of ['palace-calm-inner-rooms.css','palace-calm-treasury-chambers.css','palace-unified-rhythm.css']){
   expect(shell).not.toContain(layer);
  }
  expect(shell).toContain("import PalaceSidebarNavigation from './PalaceSidebarNavigation'");
  expect(shell).toContain('<PalaceHomeMore>');
  expect(nav).toContain('.room-sigil-reading');
  expect(nav).toContain('.room-sigil-writing');
  expect(nav).toContain('.room-sigil-life');
  expect(nav).toContain('.room-sigil-palace');
  expect(nav).toContain('.palace-shell.daylight');
 });
 it('does not continuously poll direct/group chats while launcher is closed',()=>{
  expect(chat).toContain('const timer=open?window.setInterval');
  expect(chat).not.toContain('open?16000:60000');
  expect(chat).not.toContain('},12000)');
  expect(chat).toContain('watchPalaceChatRoom(supabase');
  expect(chat).toContain('getPalaceGroupChatOverview(userId)');
 });
 it('defers hidden home discovery without removing the event and story rooms',()=>{
  expect(home).toContain('const [visited,setVisited]=React.useState(false)');
  expect(home).toContain('{visited?children:null}');
  expect(home).toContain('PalaceHomeCulturePaths');
  expect(home).toContain('PalaceRoomDirectory');
 });
});
