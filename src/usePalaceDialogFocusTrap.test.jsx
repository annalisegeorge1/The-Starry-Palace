import React,{useState} from 'react';
import {describe,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach} from 'vitest';
import {usePalaceDialogFocusTrap} from './usePalaceDialogFocusTrap';

function TestOverlay(){
 const[open,setOpen]=useState(false);
 usePalaceDialogFocusTrap(open,'palace-test-dialog');
 return <><button onClick={()=>setOpen(true)}>Open Palace menu</button>{open&&<section role="dialog" id="palace-test-dialog" tabIndex={-1}><button onClick={()=>setOpen(false)}>Close Palace menu</button><input aria-label="Search rooms"/><button>Last action</button></section>}</>;
}

function AutoFocusOverlay(){
 const[open,setOpen]=useState(false);
 usePalaceDialogFocusTrap(open,'autofocus-dialog','.autofocus-trigger');
 return <><button className="autofocus-trigger" onClick={()=>setOpen(true)}>Open search</button>{open&&<section role="dialog" id="autofocus-dialog"><input autoFocus aria-label="Quick find"/><button onClick={()=>setOpen(false)}>Dismiss search</button></section>}</>;
}

afterEach(cleanup);

describe('Palace overlay keyboard access',()=>{
 it('focuses the first control and returns to the triggering button',()=>{
  render(<TestOverlay/>);
  const open=screen.getByRole('button',{name:'Open Palace menu'});
  open.focus();fireEvent.click(open);
  expect(document.activeElement).toBe(screen.getByRole('button',{name:'Close Palace menu'}));
  fireEvent.click(screen.getByRole('button',{name:'Close Palace menu'}));
  expect(document.activeElement).toBe(open);
 });
 it('wraps keyboard focus forwards and backwards inside the open overlay',()=>{
  render(<TestOverlay/>);fireEvent.click(screen.getByRole('button',{name:'Open Palace menu'}));
  const first=screen.getByRole('button',{name:'Close Palace menu'});
  const last=screen.getByRole('button',{name:'Last action'});
  last.focus();fireEvent.keyDown(document,{key:'Tab'});
  expect(document.activeElement).toBe(first);
  first.focus();fireEvent.keyDown(document,{key:'Tab',shiftKey:true});
  expect(document.activeElement).toBe(last);
 });
 it('restores focus even when React autoFocus runs before the focus effect',()=>{
  render(<AutoFocusOverlay/>);
  const trigger=screen.getByRole('button',{name:'Open search'});
  trigger.focus();fireEvent.click(trigger);
  expect(document.activeElement).toBe(screen.getByRole('textbox',{name:'Quick find'}));
  fireEvent.click(screen.getByRole('button',{name:'Dismiss search'}));
  expect(document.activeElement).toBe(trigger);
 });
 it('does not steal focus while the overlay is closed',()=>{
  render(<TestOverlay/>);
  const open=screen.getByRole('button',{name:'Open Palace menu'});
  open.focus();
  fireEvent.keyDown(document,{key:'Tab'});
  expect(document.activeElement).toBe(open);
 });
});
