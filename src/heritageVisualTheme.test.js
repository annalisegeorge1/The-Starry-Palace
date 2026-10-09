import {describe,it,expect} from 'vitest';
import {isLgbtqContent,heritageVisualTheme} from './heritageVisualTheme';

describe('Rainbow and holiday-themed content styling',()=>{
 it('covers explicitly LGBTQ+ labelled stories, comics and holidays',()=>{
  for(const title of ['LGBTQ+ visibility','Transgender Day of Remembrance','Sapphic love','Bisexual visibility','Queer authors','Non-binary storytellers','Intersex Awareness Day','World Pride','Same-sex romance']){
   expect(isLgbtqContent(title)).toBe(true);
  }
  expect(isLgbtqContent([{tags:{name:'LGBTQ+'}}])).toBe(true);
  expect(isLgbtqContent({name:'Queer'})).toBe(true);
 });
 it('does not treat national pride or common words as an LGBTQ classification',()=>{
  expect(isLgbtqContent('A writer is proud of their country')).toBe(false);
  expect(isLgbtqContent('National Pride and Heritage')).toBe(false);
  expect(isLgbtqContent('Transcontinental flights')).toBe(false);
 });
 it('offers named gradients for requested holidays without erasing their cultures',()=>{
  const expected=[
   ['Christmas Day','winter'],['Easter Sunday','spring'],['Carnival','carnival'],
   ['Diwali','lamplight'],['Eid al-Fitr','crescent'],['Seollal','lunar'],
   ['Halloween','twilight'],["New Year's Day",'midnight'],
   ['Palestinian Heritage Day','olive'],['Congolese Culture Day','river'],
   ['LGBTQ+ Pride Month','rainbow']
  ];
  for(const [title,theme] of expected)expect(heritageVisualTheme({title})).toBe(theme);
  expect(heritageVisualTheme({title:'History of literary arts',observance_type:'history'})).toBe('sepia');
  expect(heritageVisualTheme({title:'Languages of the World',observance_type:'language'})).toBe('sapphire');
 });
});
