import React from 'react';
import {afterEach,describe,it,expect} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import ArchiveClassicReader from './ArchiveClassicReader';

afterEach(cleanup);
const record={id:'classic-reader-test',title:'The Moonlit Garden',creator_name:'An Earlier Writer',host_mode:'full',rights_status:'public_domain_verified',original_language:'English'};
function textFor(count){
 return {body_text:Array.from({length:count},(_,i)=>'Paragraph '+(i+1)+' of a public-domain source text.').join('\n\n'),word_count:count*8,source_title:'Early text edition',source_url:'https://example.org/source',source_license:'Public domain'};
}
describe('long-form classic reader',()=>{
 it('shows only one reading page, allows forward and back, and remembers the reading page locally',()=>{
  const text=textFor(88);
  const view=render(<ArchiveClassicReader record={record} text={text}/>);
  expect(screen.getByText('Paragraph 1 of a public-domain source text.')).toBeTruthy();
  expect(screen.queryByText('Paragraph 88 of a public-domain source text.')).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Next page →'}));
  expect(screen.getByText('Reading page 2 of 3')).toBeTruthy();
  view.unmount();
  const resumed=render(<ArchiveClassicReader record={record} text={text}/>);
  expect(screen.getByText('Reading page 2 of 3')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'← Previous page'}));
  expect(screen.getByText('Reading page 1 of 3')).toBeTruthy();
  resumed.unmount();
 });
 it('uses authentic source chapter headings and never hides translation credit',()=>{
  const text={...textFor(4),body_text:'CHAPTER I\n\nThe story begins.\n\nCHAPTER II\n\nA second chapter begins.',translations:[{translator_name:'The Translator',language:'English',scope:'complete',notes:'Historical translation'}]};
  render(<ArchiveClassicReader record={record} text={text}/>);
  expect(screen.getByLabelText('Jump to source chapter or section')).toBeTruthy();
  expect(screen.getByRole('heading',{name:'CHAPTER I'})).toBeTruthy();
  expect(screen.getByText(/Recorded translators:/)).toBeTruthy();
  fireEvent.click(screen.getByText('Edition, translation & source details'));
  expect(screen.getByText(/associated translation records/)).toBeTruthy();
 });
 it('retains an explicit excerpt warning and supports font-size adjustments',()=>{
  render(<ArchiveClassicReader record={{...record,host_mode:'excerpt',id:'short-excerpt'}} text={textFor(2)}/>);
  expect(screen.getByText(/Only the hosted excerpt/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Increase classic text size'}));
  expect(screen.getByText('20px')).toBeTruthy();
 });
});
