import React from 'react';
import {it,expect,vi,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import CommonsThreadMenu from './CommonsThreadMenu';
afterEach(cleanup);
it('shows an action menu instead of muting when the ellipsis is tapped',()=>{
 const onMute=vi.fn();
 const {container}=render(<CommonsThreadMenu title="Night Letters" onMute={onMute}/>);
 const menu=container.querySelector('details');
 const trigger=screen.getByText('···');
 expect(menu.open).toBe(false);
 fireEvent.click(trigger);
 expect(menu.open).toBe(true);
 expect(onMute).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Mute conversation'}));
 expect(onMute).toHaveBeenCalledTimes(1);
 expect(menu.open).toBe(false);
});
it('offers unmute when a conversation is already muted',()=>{
 const onMute=vi.fn();
 render(<CommonsThreadMenu muted title="Night Letters" onMute={onMute}/>);
 fireEvent.click(screen.getByText('···'));
 expect(screen.getByRole('button',{name:'Unmute conversation'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Unmute conversation'}));
 expect(onMute).toHaveBeenCalledOnce();
});
