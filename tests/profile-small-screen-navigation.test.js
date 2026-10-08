import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const read=(name)=>readFileSync(resolve(process.cwd(),name),'utf8');
const css=read('src/profile-grid-restoration.css');
const rooms=read('src/liveRooms.jsx');

describe('Small-screen Chamber tab polish',()=>{
 it('shows every existing Chamber door rather than hiding or scrolling the final doors offscreen',()=>{
  for(const title of ['Palace</a>','About</a>','Notes</a>','Gallery</a>','Worlds</a>']){
   expect(rooms).toContain(title);
  }
  expect(css).toContain('@media(max-width:460px)');
  expect(css).toContain('grid-template-columns:repeat(6,minmax(0,1fr))!important;');
  expect(css).toContain('grid-column:span 2!important;');
  expect(css).toContain('a:nth-child(n+4)');
  expect(css).toContain('grid-column:span 3!important;');
  expect(css).toContain('min-height:52px!important;');
  expect(css).toContain('scroll-margin-top:194px');
 });
 it('keeps the tab bar out of the way when the display is short',()=>{
  expect(css).toContain('@media(max-width:460px) and (max-height:550px)');
  expect(css).toContain('position:static!important');
  expect(css).toContain('scroll-margin-top:80px');
 });
 it('does not change photographs, cover proportions or member data',()=>{
  const polish=css.split('Small-phone Chamber navigation:')[1];
  expect(polish).toBeTruthy();
  for(const banned of ['aspect-ratio','background-image','object-fit','display:none']){
   expect(polish).not.toContain(banned);
  }
 });
});
