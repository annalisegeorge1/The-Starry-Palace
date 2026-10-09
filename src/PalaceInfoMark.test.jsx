import React from 'react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {act,cleanup,fireEvent,render,screen} from '@testing-library/react';
import PalaceInfoMark from './PalaceInfoMark';

afterEach(()=>{cleanup();vi.useRealTimers()});
function setup(){
 return render(<section style={{overflow:'hidden',transform:'translateX(80px)'}}>
  <div className="palace-shell daylight">
   <PalaceInfoMark title="Competition fairness" variant="warning">
    <p>No self-votes. No duplicate prizes.</p>
   </PalaceInfoMark>
  </div>
  <button>Elsewhere</button>
 </section>);
}
describe('Contextual Palace guidance',()=>{
 it('keeps long rules hidden, portals them outside clipped page cards and closes on repeat taps',()=>{
  setup();
  const button=screen.getByRole('button',{name:'Important: Competition fairness'});
  expect(button.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByText('No self-votes. No duplicate prizes.')).toBeNull();
  fireEvent.click(button);
  const popover=screen.getByRole('group',{name:'Competition fairness'});
  expect(button.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByText('No self-votes. No duplicate prizes.')).toBeTruthy();
  expect(popover.parentElement).toBe(document.body);
  expect(popover.classList.contains('daylight')).toBe(true);
  expect(popover.style.position).toBe('');
  expect(popover.style.left).not.toBe('');
  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByText('No self-votes. No duplicate prizes.')).toBeNull();
 });
 it('reveals hover only for mouse and allows moving into the help bubble',()=>{
  vi.useFakeTimers();
  setup();
  const button=screen.getByRole('button',{name:'Important: Competition fairness'});
  fireEvent.pointerEnter(button,{pointerType:'mouse'});
  expect(button.getAttribute('aria-expanded')).toBe('true');
  const popover=screen.getByRole('group',{name:'Competition fairness'});
  fireEvent.pointerLeave(button,{pointerType:'mouse'});
  fireEvent.pointerEnter(popover,{pointerType:'mouse'});
  act(()=>vi.advanceTimersByTime(160));
  expect(button.getAttribute('aria-expanded')).toBe('true');
  fireEvent.pointerLeave(popover,{pointerType:'mouse'});
  act(()=>vi.advanceTimersByTime(160));
  expect(button.getAttribute('aria-expanded')).toBe('false');
  fireEvent.pointerEnter(button,{pointerType:'touch'});
  expect(button.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('true');
 });
 it('supports keyboard focus, Escape, close button and outside touch dismissal',()=>{
  setup();
  const button=screen.getByRole('button',{name:'Important: Competition fairness'});
  fireEvent.focus(button);
  expect(button.getAttribute('aria-expanded')).toBe('true');
  fireEvent.keyDown(document,{key:'Escape',code:'Escape'});
  expect(button.getAttribute('aria-expanded')).toBe('false');
  fireEvent.blur(button,{relatedTarget:null});
  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('true');
  fireEvent.pointerDown(screen.getByRole('button',{name:'Elsewhere'}));
  expect(button.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(button);
  fireEvent.click(screen.getByRole('button',{name:'Close Competition fairness'}));
  expect(button.getAttribute('aria-expanded')).toBe('false');
 });
 it('repositions a portal bubble when the viewport size changes',()=>{
  setup();
  const button=screen.getByRole('button',{name:'Important: Competition fairness'});
  button.getBoundingClientRect=()=>({left:1,width:38,top:200,bottom:238});
  fireEvent.click(button);
  const p=screen.getByRole('group',{name:'Competition fairness'});
  fireEvent.resize(window);
  expect(Number.parseFloat(p.style.left)).toBeGreaterThanOrEqual(0);
  expect(Number.parseFloat(p.style.top)).toBeGreaterThanOrEqual(0);
  expect(Number.parseFloat(p.style.maxHeight)).toBeGreaterThan(0);
 });
});
