import {describe,it,expect} from 'vitest';
import {storyRatingInfo,storyRatingMark} from './storyRatingModel';
import {gutenbergEditionId,classicBookCoverInfo,classicCoverPalette} from './classicBookCoverModel';
describe('Story content rating palette',()=>{
 it('has five unique categories and never mislabels absent ratings',()=>{
  const keys=['general','teen','mature','explicit','not_rated'];
  expect(new Set(keys.map(key=>storyRatingInfo(key).key)).size).toBe(5);
  expect(storyRatingInfo(null)).toEqual({key:'not_rated',label:'Not rated'});
  expect(storyRatingInfo('not rated').key).toBe('not_rated');
  expect(storyRatingInfo('unknown').key).toBe('not_rated');
  expect(['general','teen','mature','explicit','not_rated'].map(storyRatingMark)).toEqual(['G','T','M','E','NR']);
  expect(storyRatingMark(null)).toBe('NR');
 });
});
describe('Genuine source-edition classic covers',()=>{
 it('resolves an exact Gutenberg book ID from original citation formats',()=>{
  expect(gutenbergEditionId('https://www.gutenberg.org/ebooks/1342')).toBe(1342);
  expect(gutenbergEditionId('https://github.com/GITenberg/Pride-and-Prejudice_1342/blob/master/1342-0.txt')).toBe(1342);
  expect(gutenbergEditionId('https://evil.com/ebooks/1342')).toBeNull();
 });
 it('does not display a collection cover as the original short story',()=>{
  expect(classicBookCoverInfo({slug:'the-painted-skin-pu-songling',source_url:'https://github.com/GITenberg/Strange-Stories_43629/blob/master/43629-0.txt'})).toBeNull();
  expect(classicBookCoverInfo({slug:'a-scandal-in-bohemia-arthur-conan-doyle',source_url:'https://www.gutenberg.org/ebooks/1661'})).toBeNull();
 });
 it('preserves owned cover data and avoids unknown rights or sources',()=>{
  expect(classicBookCoverInfo({slug:'pride-and-prejudice-jane-austen',source_url:'https://www.gutenberg.org/ebooks/1342'}))
    .toMatchObject({id:1342,source:'Project Gutenberg'});
  expect(classicBookCoverInfo({rights_status:'rights_unclear',source_url:'https://www.gutenberg.org/ebooks/1342'})).toBeNull();
  expect(classicBookCoverInfo({cover_url:'https://assets.example/cover.png',source_url:'https://www.gutenberg.org/ebooks/1342'}))
    .toMatchObject({source:'catalogue',url:'https://assets.example/cover.png'});
  expect(classicCoverPalette('Jane Eyre')).toBe(classicCoverPalette('Jane Eyre'));
 });
});
