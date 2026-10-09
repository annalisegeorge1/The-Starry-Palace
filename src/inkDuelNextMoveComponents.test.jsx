import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import InkDuelSpotlight from './InkDuelSpotlight';
import DuelTreasurePreview,{duelMissingLine} from './DuelTreasurePreview';

describe('Duel next step and transparent treasure previews',()=>{
 it('does not show a needless next-move panel in an empty arena',()=>{
  expect(renderToStaticMarkup(<InkDuelSpotlight duels={[]}/>)).toBe('');
 });
 it('provides exactly one focused next move with an actual destination',()=>{
  const html=renderToStaticMarkup(<InkDuelSpotlight duels={[{id:'the-challenge',phase:'waiting',my_participation:'pending'}]}/>);
  expect(html).toContain('Review challenge');
  expect(html).toContain('YOUR NEXT MOVE');
  expect(html.match(/palace-duel-spotlight-action/g)).toHaveLength(1);
 });
 it('shows short, truthful Bronze progress rather than promising gifts',()=>{
  expect(duelMissingLine([{key:'outside',remaining:2}])).toBe('2 more outside ballots');
  const html=renderToStaticMarkup(<DuelTreasurePreview duel={{match_type:'group',entry_count:3,vote_count:4,external_vote_count:1}}/>);
  expect(html).toContain('1 more outside ballots');
  expect(html).toContain('Treasure qualification by tier');
  expect(html).not.toContain('Treasure awarded');
 });
});
