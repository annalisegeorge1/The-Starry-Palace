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
 it('does not steal focus while the overlay is closed',()=>{
  render(<TestOverlay/>);
  const open=screen.getByRole('button',{name:'Open Palace menu'});
  open.focus();
  fireEvent.keyDown(document,{key:'Tab'});
  expect(document.activeElement).toBe(open);
 });
});
