import React from 'react';
import {describe,it,expect,afterEach} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import {renderToStaticMarkup} from 'react-dom/server';
import ClassicBookCover from './ClassicBookCover';
import StoryRatingBadge from './StoryRatingBadge';
afterEach(cleanup);
describe('Book art and story content ratings',()=>{
 it('shows a cited Gutenberg edition book jacket and a rating in the cover',()=>{
  const record={title:'Pride and Prejudice',creator_name:'Jane Austen',slug:'pride-and-prejudice-jane-austen',rights_status:'public_domain_verified',archive_source_url:'https://www.gutenberg.org/ebooks/1342'};
  const markup=renderToStaticMarkup(<ClassicBookCover record={record} showRating/>);
  expect(markup).toContain('pg1342.cover.medium.jpg');
  expect(markup).toContain('Pride and Prejudice — Project Gutenberg edition');
  expect(markup).toContain('rating-not_rated');
  expect(markup).toContain('Content rating: Not rated');
  expect(markup).toContain('>NR</span>');
 });
 it('shows a tasteful book-specific fallback when external art cannot load',()=>{
  const record={title:'Dracula',creator_name:'Bram Stoker',rights_status:'public_domain_verified',source_url:'https://www.gutenberg.org/ebooks/345'};
  render(<ClassicBookCover record={record}/>);
  fireEvent.error(screen.getByRole('img',{name:/Cover of Dracula/}));
  expect(screen.getByText('Dracula',{selector:'strong'})).toBeTruthy();
  expect(screen.getByText('Bram Stoker')).toBeTruthy();
 });
 it('does not misrepresent a collected short story as another book',()=>{
  render(<ClassicBookCover record={{title:'The Painted Skin',slug:'the-painted-skin-pu-songling',source_url:'https://www.gutenberg.org/ebooks/43629'}}/>);
  expect(screen.queryByRole('img')).toBeNull();
  expect(screen.getByText('The Painted Skin',{selector:'strong'})).toBeTruthy();
 });
 it('distinguishes general, teen, mature, explicit and missing content ratings',()=>{
  const markup=renderToStaticMarkup(<>{['general','teen','mature','explicit','not_rated'].map(r=><StoryRatingBadge key={r} rating={r}/>)}</>);
  for(const kind of ['general','teen','mature','explicit','not_rated'])expect(markup).toContain('rating-'+kind);
  expect(markup).toContain('Content rating: Explicit');
  for(const mark of ['G','T','M','E','NR'])expect(markup).toContain('>'+mark+'</span>');
  expect(markup).not.toContain('>General</span>');
  expect(markup).not.toContain('>Explicit</span>');
  expect(markup).toContain('Content rating: Not rated');
 });
});
