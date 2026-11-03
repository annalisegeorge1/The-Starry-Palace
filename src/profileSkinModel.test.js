import {describe,it,expect} from 'vitest';
import {parsePageSkin,validatePageSkin,pageSkinStyle,contrastRatio} from './profileSkinModel';
describe('Imported member page skins',()=>{
 it('keeps every user-defined value a validated hex token',()=>{
  const skin=parsePageSkin(JSON.stringify({name:'Quiet Violet',colors:{background:'#101010',surface:'#202020',text:'#ffffff',muted:'#d0d0d0',accent:'#d6a6ff',border:'#444444'}}),'quiet.json');
  expect(skin.colors.accent).toBe('#D6A6FF');
  expect(pageSkinStyle(skin)['--member-skin-background']).toBe('#101010');
 });
 it('accepts only a safe variables-only CSS skin',()=>{
  const skin=parsePageSkin(':root{--palace-skin-background:#050505;--palace-skin-surface:#171717;--palace-skin-text:#ffffff;--palace-skin-muted:#dddddd;--palace-skin-accent:#c0a4fa;--palace-skin-border:#666666;}','minimal.css');
  expect(skin.colors.background).toBe('#050505');
  for(const unsafe of ['body {display:none}',':root{--palace-skin-background:url(https://bad.test/x)}','@import url(https://bad.test/x)','--palace-skin-background:#050505;div{color:red}']){
   expect(()=>parsePageSkin(unsafe,'danger.css')).toThrow();
  }
 });
 it('enforces text contrast and tolerates broken stored skins without rendering them',()=>{
  expect(contrastRatio('#fffFFF','#000000')).toBeGreaterThan(20);
  expect(()=>validatePageSkin({colors:{background:'#ffffff',surface:'#ffffff',text:'#fafafa'}})).toThrow(/contrast/);
  expect(pageSkinStyle({colors:{background:'url(javascript:bad)'}})).toBeUndefined();
 });
});
