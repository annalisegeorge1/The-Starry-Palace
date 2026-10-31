import React from 'react';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';

const mocks=vi.hoisted(()=>({download:vi.fn()}));
vi.mock('./palaceChatMedia',()=>({downloadPalaceChatPhoto:mocks.download}));

import PalaceChatPhoto from './PalaceChatPhoto';

const a='direct/70000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000001/72000000-0000-0000-0000-000000000001.webp';
const b='group/71000000-0000-0000-0000-000000000001/00000000-0000-0000-0000-000000000002/72000000-0000-0000-0000-000000000002.webp';
const photo=new Blob(['safe synthetic image bytes'],{type:'image/webp'});

beforeEach(()=>{
 mocks.download.mockReset();
 mocks.download.mockResolvedValue(photo);
 URL.createObjectURL=vi.fn(()=>'blob:synthetic-private-photo');
 URL.revokeObjectURL=vi.fn();
});
afterEach(()=>{cleanup();vi.restoreAllMocks()});

describe('private chat photo uses per-request authentication',()=>{
 it('renders an in-memory object URL and revokes it when unmounted',async()=>{
  const {unmount}=render(<PalaceChatPhoto path={a}/>);
  const image=await screen.findByAltText('Photo shared in this conversation');
  expect(image.getAttribute('src')).toBe('blob:synthetic-private-photo');
  expect(mocks.download).toHaveBeenCalledWith(a);
  expect(URL.createObjectURL).toHaveBeenCalledWith(photo);
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic-private-photo');
 });
 it('does not retain the first private photo after the conversation changes',async()=>{
  const {rerender}=render(<PalaceChatPhoto path={a}/>);
  await screen.findByAltText('Photo shared in this conversation');
  rerender(<PalaceChatPhoto path={b}/>);
  await waitFor(()=>expect(mocks.download).toHaveBeenLastCalledWith(b));
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:synthetic-private-photo');
 });
 it('does not create a URL when an access-denied request resolves after unmount',async()=>{
  let finish;
  mocks.download.mockImplementation(()=>new Promise(resolve=>{finish=resolve}));
  const {unmount}=render(<PalaceChatPhoto path={a}/>);
  unmount();
  finish(photo);
  await Promise.resolve();
  expect(URL.createObjectURL).not.toHaveBeenCalled();
 });
 it('displays a retry control after permission or network failure',async()=>{
  mocks.download.mockRejectedValueOnce(new Error('Access denied'));
  const {container}=render(<PalaceChatPhoto path={a}/>);
  expect(await screen.findByText('Photo unavailable')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Retry'}));
  await screen.findByAltText('Photo shared in this conversation');
  expect(mocks.download).toHaveBeenCalledTimes(2);
  expect(container.querySelector('img')?.getAttribute('src')).toBe('blob:synthetic-private-photo');
 });
});
