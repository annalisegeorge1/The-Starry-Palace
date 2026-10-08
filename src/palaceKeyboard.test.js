import {describe,expect,it} from 'vitest';
import {shouldOpenPalaceQuickNavigation} from './palaceKeyboard';

const shortcut=(target,extra={})=>({key:'k',ctrlKey:true,metaKey:false,target,...extra});

describe('Palace keyboard shortcut boundaries',()=>{
 it('opens the quick room menu from the page rather than overriding ordinary keys',()=>{
  const button=document.createElement('button');
  expect(shouldOpenPalaceQuickNavigation(shortcut(button))).toBe(true);
  expect(shouldOpenPalaceQuickNavigation(shortcut(button,{key:'j'}))).toBe(false);
  expect(shouldOpenPalaceQuickNavigation(shortcut(button,{ctrlKey:false}))).toBe(false);
  expect(shouldOpenPalaceQuickNavigation(shortcut(button,{metaKey:true,ctrlKey:false}))).toBe(true);
  expect(shouldOpenPalaceQuickNavigation(shortcut(button,{altKey:true}))).toBe(false);
 });
 it('preserves manuscript link shortcuts inside a nested contenteditable',()=>{
  const pad=document.createElement('div');pad.setAttribute('contenteditable','true');
  const text=document.createElement('span');pad.append(text);document.body.append(pad);
  expect(shouldOpenPalaceQuickNavigation(shortcut(text))).toBe(false);
  pad.remove();
 });
 it('does not steal shortcuts from inputs, selectors, textareas or rich text boxes',()=>{
  for(const tag of ['input','select','textarea']){
   expect(shouldOpenPalaceQuickNavigation(shortcut(document.createElement(tag)))).toBe(false);
  }
  const rich=document.createElement('section');rich.setAttribute('role','textbox');
  const child=document.createElement('span');rich.append(child);document.body.append(rich);
  expect(shouldOpenPalaceQuickNavigation(shortcut(child))).toBe(false);
  rich.remove();
 });
});
