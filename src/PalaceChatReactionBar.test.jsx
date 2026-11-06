import React from 'react';
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react';
import {afterEach,describe,it,expect,vi} from 'vitest';
import PalaceChatReactionBar from './PalaceChatReactionBar';
import {rankPalaceConversationReactions} from './palaceChatReactionRanking';
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
 it('shows a single most-used emoji beside the bubble and prioritizes chat choices',()=>{
  const rows=[
   {direct_message_id:'m',user_id:'a',reaction:'moon'},
   {direct_message_id:'m',user_id:'b',reaction:'moon'},
   {direct_message_id:'m2',user_id:'c',reaction:'laugh'},
   {direct_message_id:'m3',user_id:'a',reaction:'moon'}
  ];
  const onReact=vi.fn();
  render(<PalaceChatReactionBar message={{id:'m'}} rows={rows} userId="a" onReact={onReact} rankedReactions={rankPalaceConversationReactions(rows)}/>);
  const quick=screen.getByRole('button',{name:/Quick react with Moon/});
  expect(quick.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(quick);
  expect(onReact).toHaveBeenCalledWith('m','moon','moon');
  fireEvent.click(screen.getByLabelText('React to message'));
  const buttons=within(screen.getByRole('group',{name:'Choose a reaction'})).getAllByRole('button');
  expect(buttons.slice(0,2).map(button=>button.getAttribute('aria-label'))).toEqual(['React with Moon','React with Laugh']);
 });
 it('does not invent a popular quick button when no reactions have been loaded',()=>{
  const onReact=vi.fn();
  render(<PalaceChatReactionBar message={{id:'m'}} rows={[]} userId="a" onReact={onReact} rankedReactions={rankPalaceConversationReactions([])}/>);
  expect(screen.queryByRole('button',{name:/Quick react with/})).toBeNull();
  fireEvent.click(screen.getByLabelText('React to message'));
  expect(within(screen.getByRole('group',{name:'Choose a reaction'})).getAllByRole('button').map(x=>x.getAttribute('aria-label')).slice(0,2)).toEqual(['React with Heart','React with Star']);
 });
 it('does not submit a quick reaction when chat actions are disabled',()=>{
  const onReact=vi.fn();
  const ranked=rankPalaceConversationReactions([{direct_message_id:'m2',user_id:'a',reaction:'star'}]);
  render(<PalaceChatReactionBar message={{id:'m'}} rows={[]} userId="a" disabled onReact={onReact} rankedReactions={ranked}/>);
  const quick=screen.getByRole('button',{name:/Quick react with Star/});
  expect(quick.disabled).toBe(true);
  fireEvent.click(quick);
  expect(onReact).not.toHaveBeenCalled();
 });
});
