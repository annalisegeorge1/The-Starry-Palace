import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {contrastRatio} from './profileSkinModel';
import {prismAppearance} from './prismAppearance';

const css=readFileSync('src/palace-prism-letter-contrast.css','utf8');
const main=readFileSync('src/main.jsx','utf8');

describe('Chosen Prism colour contrast across Palace Letters',()=>{
 it('picks independently readable ink for the primary ground, secondary panel, and accent',()=>{
  const seeds=['chamber-prism-atelier-colours','chamber-prism-seasonal-collections','prism-jewel-court-gemstone-frames','jewel-court-collectible-expansion'];
  const palettes=seeds.flatMap(seed=>Array.from(
   readFileSync('database/'+seed+'.sql','utf8').matchAll(/'(#[a-f0-9]{6})'\s*,\s*'(#[a-f0-9]{6})'\s*,\s*'(#[a-f0-9]{6})'/gi),
   ([,primary,secondary,accent])=>({primary,secondary,accent})
  ));
  expect(palettes.length).toBeGreaterThanOrEqual(85);
  for(const palette of palettes){
   const appearance=prismAppearance({prism_colour_chosen:true,prism_palette_data:{slug:'example',...palette}});
   expect(appearance?.kind).toBe('palette');
   const values=appearance.style;
   for(const [colour,ink] of [
    ['--appearance-primary','--palette-ground-ink'],
    ['--appearance-secondary','--palette-panel-ink'],
    ['--appearance-accent','--palette-accent-ink']
   ])expect(contrastRatio(values[colour],values[ink])).toBeGreaterThanOrEqual(4.5);
  }
 });
 it('keeps viewer tokens outside the shell and private correspondence',()=>{
  expect(main).not.toContain('data-viewer-appearance');
  expect(css).not.toContain('data-viewer-appearance');
  expect(readFileSync('src/liveRooms.jsx','utf8')).toContain('className="legacy-home-dashboard palace-command-centre" data-viewer-appearance=');
 });
 it('provides readable text, controls and outgoing letters for every mode',()=>{
  for(const mode of ['daylight','nightfall','midnight']){
   const block=css.split('.'+mode+' #palace-content')[1].split('}')[0];
   const token=key=>block.match(new RegExp('--letters-'+key+':(#[a-f0-9]{6})'))[1];
   for(const surface of ['surface','raised']){
    for(const ink of ['ink','muted'])expect(contrastRatio(token(surface),token(ink))).toBeGreaterThanOrEqual(4.5);
   }
   expect(contrastRatio(token('action'),'#ffffff')).toBeGreaterThanOrEqual(4.5);
  }
 });
});
