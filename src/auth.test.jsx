import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
const mocks = vi.hoisted(() => ({ getSession: vi.fn(), onAuthStateChange: vi.fn() }));
vi.mock('./supabase', () => ({ supabase: { auth: mocks } }));
import { AuthProvider, ProtectedRoute } from './auth';
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function setup() { mocks.onAuthStateChange.mockReturnValue({data:{subscription:{unsubscribe:vi.fn()}}}); render(<MemoryRouter initialEntries={['/account']}><AuthProvider><Routes><Route path='/account' element={<ProtectedRoute><p>Private account</p></ProtectedRoute>}/><Route path='/login' element={<p>Login page</p>}/></Routes></AuthProvider></MemoryRouter>); }
test('waits for restoration then redirects signed-out visitors', async () => { let resolve; mocks.getSession.mockReturnValue(new Promise(r => { resolve=r; }));setup();expect(screen.getByRole('status').textContent).toContain('Restoring');resolve({data:{session:null},error:null});await screen.findByText('Login page');expect(screen.queryByText('Private account')).toBeNull(); });
test('restored session opens protected route', async () => {mocks.getSession.mockResolvedValue({data:{session:{user:{id:'member'}}},error:null});setup();await screen.findByText('Private account');});
test('a newer sign-out event wins over stale initialization', async () => { let resolve; mocks.getSession.mockReturnValue(new Promise(r=>{resolve=r;}));setup();mocks.onAuthStateChange.mock.calls[0][0]('SIGNED_OUT',null);resolve({data:{session:{user:{id:'old'}}},error:null});await screen.findByText('Login page');expect(screen.queryByText('Private account')).toBeNull(); });

function LoginDestinationProbe(){const location=useLocation();return <p>Return destination: {location.state?.from||'none'}</p>}
test('keeps the exact chapter address during an authentication redirect',async()=>{
 mocks.onAuthStateChange.mockReturnValue({data:{subscription:{unsubscribe:vi.fn()}}});
 mocks.getSession.mockResolvedValue({data:{session:null},error:null});
 render(<MemoryRouter initialEntries={['/writing/my-story?chapter=part-1']}><AuthProvider><Routes>
  <Route path='/writing/:slug' element={<ProtectedRoute><p>Private manuscript</p></ProtectedRoute>}/>
  <Route path='/login' element={<LoginDestinationProbe/>}/>
 </Routes></AuthProvider></MemoryRouter>);
 expect(await screen.findByText('Return destination: /writing/my-story?chapter=part-1')).toBeTruthy();
});
