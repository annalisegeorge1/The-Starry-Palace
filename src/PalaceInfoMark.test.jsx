import React from 'react';
import {afterEach,describe,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import PalaceInfoMark from './PalaceInfoMark';

afterEach(cleanup);
function setup(){
 return render(<div><PalaceInfoMark title="Competition fairness" variant="warning">
  <p>No self-votes. No duplicate prizes.</p>
 </PalaceInfoMark><button>Elsewhere</button></div>);
}
describe('Contextual Palace guidance',()=>{
 it('keeps longer rules out of the page until someone requests them',()=>{
  setup();
  const button=screen.getByRole('button',{name:'Important: Competition fairness'});
  expect(button.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByText('No self-votes. No duplicate prizes.')).toBeNull();
  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByText('No self-votes. No duplicate prizes.')).toBeTruthy();
  expect(screen.getByRole('group',{name:'Competition fairness'})).toBeTruthy();
  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByText('No self-votes. No duplicate prizes.')).toBeNull();
 });
 it('reveals a hover tooltip for mouse, but not for touch until a tap',()=>{
  setup();
  const button=screen.getByRole('button',{name:'Important: Competition fairness'});
  fireEvent.pointerEnter(button,{pointerType:'mouse'});
  expect(button.getAttribute('aria-expanded')).toBe('true');
  fireEvent.pointerLeave(button,{pointerType:'mouse'});
  expect(button.getAttribute('aria-expanded')).toBe('false');
  fireEvent.pointerEnter(button,{pointerType:'touch'});
  expect(button.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('true');
 });
 it('supports keyboard focus, Escape and outside touch dismissal',()=>{
  setup();
  const button=screen.getByRole('button',{name:'Important: Competition fairness'});
  fireEvent.focus(button);
  expect(button.getAttribute('aria-expanded')).toBe('true');
  fireEvent.keyDown(button,{key:'Escape',code:'Escape'});
  expect(button.getAttribute('aria-expanded')).toBe('false');
  fireEvent.blur(button,{relatedTarget:null});
  fireEvent.click(button);
  expect(button.getAttribute('aria-expanded')).toBe('true');
  fireEvent.pointerDown(screen.getByRole('button',{name:'Elsewhere'}));
  expect(button.getAttribute('aria-expanded')).toBe('false');
 });
});
