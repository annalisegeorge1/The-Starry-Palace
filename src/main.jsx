import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, ProtectedRoute, useAuth } from './auth';
import { configured, supabase } from './supabase';
import './style.css';
function Home() { return <section><p className="eyebrow">A home for stories</p><h1>The Starry Palace</h1><p>Gather. Have a cup of tea. Write and read with me.</p><Link className="button" to="/account">Enter the Palace</Link></section>; }
function Login() {
  const { session, loading, error: sessionError } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState('');
  const location = useLocation();
  const requested = location.state?.from;
  const destination = typeof requested === 'string' && requested.startsWith('/') && !requested.startsWith('//') && requested !== '/login' ? requested : '/account';
  if (!loading && session) return <Navigate to={destination} replace />;
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/auth/callback' } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (mode === 'signup' && !result.data.session) setMessage('Check your email to confirm your account, then sign in.');
    } catch (error) { setMessage(error.message || 'Sign-in failed. Please try again.'); }
    finally { setBusy(false); }
  }
  return <section className="panel"><h1>{mode === 'signup' ? 'Join the Palace' : 'Welcome back'}</h1>
    {!configured ? <p role="alert">Sign-in is not configured. Follow docs/SETUP.md to connect the application.</p> : <>
      <form onSubmit={submit}><label>Email<input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label>
      <label>Password<input type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={mode === 'signup' ? 8 : undefined} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <button disabled={busy || loading}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}</button></form>
      <button className="secondary" disabled={busy} onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage(''); }}>{mode === 'signup' ? 'Already a member? Sign in' : 'Create an account'}</button></>}
    {(message || sessionError) && <p role="status">{message || sessionError}</p>}</section>;
}
function Account() {
  const { session } = useAuth(); const navigate = useNavigate();
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function signOut() { setBusy(true); setError(''); try { const { error } = await supabase.auth.signOut(); if (error) throw error; navigate('/', { replace: true }); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <section className="panel"><h1>Your Palace account</h1><p>Signed in as {session.user.email}</p><p>Your session is saved on this device until you sign out.</p><button onClick={signOut} disabled={busy}>{busy ? 'Signing out…' : 'Sign out'}</button>{error && <p role="alert">{error}</p>}</section>;
}
function Callback() {
  const { session, loading, error } = useAuth();
  const params = new URLSearchParams(window.location.search);
  if (params.has('error') || error) return <section><h1>Sign-in could not finish</h1><p role="alert">{params.get('error_description') || error || 'Please try signing in again.'}</p><Link to="/login">Return to sign in</Link></section>;
  if (loading) return <p role="status">Completing sign-in…</p>;
  return <Navigate to={session ? '/account' : '/login'} replace />;
}
function App() { return <AuthProvider><header><Link className="brand" to="/">☾ The Starry Palace</Link><nav aria-label="Main navigation"><Link to="/">Explore</Link><Link to="/account">My account</Link></nav></header><main><Routes><Route path="/" element={<Home />} /><Route path="/login" element={<Login />} /><Route path="/auth/callback" element={<Callback />} /><Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} /><Route path="*" element={<section><h1>You left palace grounds.</h1><Link to="/">Return to the Palace</Link></section>} /></Routes></main></AuthProvider>; }
createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>);
