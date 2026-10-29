import {describe,it,expect,vi} from 'vitest';
import React from 'react';
import {cleanup,render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PalaceChatWorkspace from './PalaceChatWorkspace';
vi.mock('./auth',()=>({useAuth:()=>({session:{user:{id:'member-one'}}})}));
vi.mock('./PalaceChatDrawer',()=>({default:({userId,workspace})=><span data-testid="workspace-chat">{userId}:{String(workspace)}</span>}));
import {afterEach} from 'vitest';
afterEach(cleanup);
describe('full Palace Messenger destination',()=>{
 it('reuses the existing chat engine inside a separate workspace',()=>{
  render(<MemoryRouter><PalaceChatWorkspace/></MemoryRouter>);
  expect(screen.getByRole('main',{name:'Palace Messenger'})).toBeTruthy();
  expect(screen.getByTestId('workspace-chat').textContent).toBe('member-one:true');
  expect(screen.getByRole('link',{name:'Palace Letters'}).getAttribute('href')).toBe('/letters');
  expect(screen.getByRole('link',{name:'Palace Life'}).getAttribute('href')).toBe('/palace-life');
 });
});
