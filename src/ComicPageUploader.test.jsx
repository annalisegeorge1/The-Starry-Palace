import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {uploadComicPage} from './palaceData';
import ComicPageUploader from './ComicPageUploader';

vi.mock('./palaceData',()=>({uploadComicPage:vi.fn()}));
const props={userId:'writer-1',comicId:'comic-1',episodeId:'episode-1',episodeTitle:'The First Gate'};
const image=(name)=>new File(['painted panels'],name,{type:'image/png',lastModified:1});
function selectFiles(files){
 const input=document.querySelector('.comic-upload-launch input[type="file"]');
 fireEvent.change(input,{target:{files}});
}
beforeEach(()=>{vi.clearAllMocks();uploadComicPage.mockResolvedValue({id:'page'})});
afterEach(cleanup);

describe('Comic Studio multi-page upload',()=>{
 it('previews files in natural order and waits for descriptions before uploading',async()=>{
  render(<ComicPageUploader {...props}/>);
  selectFiles([image('panel10.png'),image('panel2.png')]);
  expect(screen.getByRole('dialog',{name:'Add pages to this episode'})).toBeTruthy();
  const fields=screen.getAllByPlaceholderText('Describe the artwork for readers using assistive technology');
  expect(fields).toHaveLength(2);
  expect(screen.getByText(/01 · panel2.png/)).toBeTruthy();
  expect(screen.getByRole('button',{name:'Upload 2 pages'}).disabled).toBe(true);
  fireEvent.change(fields[0],{target:{value:'The hero enters.'}});
  fireEvent.change(fields[1],{target:{value:'An open gate.'}});
  fireEvent.click(screen.getByRole('button',{name:'Upload 2 pages'}));
  await waitFor(()=>expect(uploadComicPage).toHaveBeenCalledTimes(2));
  expect(uploadComicPage.mock.calls.map(call=>call[3].name)).toEqual(['panel2.png','panel10.png']);
  await waitFor(()=>expect(screen.getByText(/All 2 remaining pages uploaded/)).toBeTruthy());
 });
 it('stops after a failed image and retries only unfinished pages',async()=>{
  uploadComicPage.mockResolvedValueOnce({id:'one'}).mockRejectedValueOnce(new Error('Network lost')).mockResolvedValueOnce({id:'two'});
  render(<ComicPageUploader {...props}/>);
  selectFiles([image('page1.png'),image('page2.png')]);
  screen.getAllByPlaceholderText('Describe the artwork for readers using assistive technology').forEach((input,i)=>fireEvent.change(input,{target:{value:'Panel '+(i+1)}}));
  fireEvent.click(screen.getByRole('button',{name:'Upload 2 pages'}));
  await waitFor(()=>expect(screen.getByText(/Upload stopped at page2.png/)).toBeTruthy());
  expect(uploadComicPage).toHaveBeenCalledTimes(2);
  fireEvent.click(screen.getByRole('button',{name:'Retry remaining'}));
  await waitFor(()=>expect(uploadComicPage).toHaveBeenCalledTimes(3));
  expect(uploadComicPage.mock.calls.map(x=>x[3].name)).toEqual(['page1.png','page2.png','page2.png']);
 });
 it('requires an explicit acknowledgement for uploads into published episodes',()=>{
  render(<ComicPageUploader {...props} episodePublished/>);
  selectFiles([image('published.png')]);
  fireEvent.change(screen.getByPlaceholderText('Describe the artwork for readers using assistive technology'),{target:{value:'A painted moon.'}});
  const button=screen.getByRole('button',{name:'Upload 1 page'});
  expect(button.disabled).toBe(true);
  fireEvent.click(screen.getByRole('checkbox',{name:/This episode is already published/}));
  expect(button.disabled).toBe(false);
 });
});
