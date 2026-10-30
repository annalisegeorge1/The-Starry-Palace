import {describe,it,expect,vi} from 'vitest';
import React from 'react';
import {cleanup,render,screen} from '@testing-library/react';
import {MemoryRouter,Routes,Route,Link} from 'react-router-dom';
import PalaceChatWorkspace from './PalaceChatWorkspace';
vi.mock('./auth',()=>({useAuth:()=>({session:{user:{id:'member-one'}}})}));
vi.mock('./PalaceChatDrawer',()=>({default:({userId,workspace,initialRoom})=><span data-testid="workspace-chat">{userId}:{String(workspace)}:{initialRoom?.roomId||'none'}</span>}));
import {afterEach} from 'vitest';
afterEach(cleanup);
describe('full Palace Messenger destination',()=>{
 it('reuses the existing chat engine inside a separate workspace',()=>{
  render(<MemoryRouter><PalaceChatWorkspace/></MemoryRouter>);
  expect(screen.getByRole('region',{name:'Palace Messenger'})).toBeTruthy();
  expect(screen.getByTestId('workspace-chat').textContent).toBe('member-one:true:none');
  expect(screen.getByRole('link',{name:'Palace Letters'}).getAttribute('href')).toBe('/letters');
  expect(screen.getByRole('link',{name:'Palace Life'}).getAttribute('href')).toBe('/palace-life');
 });
 it('receives the selected conversation via private router state',()=>{
  render(<MemoryRouter initialEntries={[{pathname:'/chat',state:{palaceChat:{tab:'direct',roomId:'direct-one'}}}]}>
   <Routes><Route path="/chat" element={<PalaceChatWorkspace/>}/></Routes>
  </MemoryRouter>);
  expect(screen.getByTestId('workspace-chat').textContent).toBe('member-one:true:direct-one');
 });
});
