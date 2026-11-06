import React from 'react';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import PalaceChatReactionBar from './PalaceChatReactionBar';
afterEach(cleanup);
describe('message reaction control',()=>{
 it('opens choices, sends a reaction and closes the picker',()=>{
  const onReact=vi.fn();render(<PalaceChatReactionBar message={{id:'m'}} rows={[]} userId="u" onReact={onReact}/>);
  fireEvent.click(screen.getByLabelText('React to message'));
  fireEvent.click(screen.getByLabelText('React with Heart'));
  expect(onReact).toHaveBeenCalledWith('m','heart',null);
  expect(screen.queryByLabelText('Choose a reaction')).toBeNull();
 });
 it('lets members toggle their existing reaction and disables blocked sending',()=>{
  const onReact=vi.fn();const {rerender}=render(<PalaceChatReactionBar message={{id:'m'}} rows={[{direct_message_id:'m',user_id:'u',reaction:'heart'}]} userId="u" onReact={onReact}/>);
  fireEvent.click(screen.getByLabelText('Heart reaction, 1'));expect(onReact).toHaveBeenCalledWith('m','heart','heart');
  rerender(<PalaceChatReactionBar message={{id:'m'}} rows={[]} userId="u" disabled onReact={onReact}/>);
  expect(screen.getByLabelText('React to message').disabled).toBe(true);
 });
});
