import React, { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import { configured, supabase } from './supabase';
import { safePalaceReturnPath } from './palaceReturnPath';
import { palaceDoorDestinationMessage } from './palaceDoorway';
import {
  googleLoginEnabled, palaceAuthRedirect, palaceOAuthOptions,
  rememberPalaceAuthDestination, recallPalaceAuthDestination,
  clearPalaceAuthDestination, readableAuthError,
} from './palaceOAuth';
import './palace-auth-gates.css';

const GoogleLogo = () => (
  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48" focusable="false">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 5.38 6.51 13.22 2.56l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.88 46.98 24.55z"/>
    <path fill="#FBBC05" d="M10.53 28.54A14.3 14.3 0 0 1 9.75 24c0-1.57.27-3.09.76-4.54l-7.98-6.2C.91 16.51 0 20.15 0 24s.91 7.49 2.56 10.74l7.97-6.2z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.96l-7.97 6.2C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export function PalaceLogin({ Frame }) {
  const { session, loading, error: sessionError } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState(() => new URLSearchParams(location.search).get('mode') === 'signup' ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const requested = location.state?.from || new URLSearchParams(location.search).get('next');
  const destination = safePalaceReturnPath(requested);
  useEffect(() => {
    setMode(new URLSearchParams(location.search).get('mode') === 'signup' ? 'signup' : 'login');
  }, [location.search]);

  async function submit(event) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setMessage('');
    try {
      if (mode === 'signup') rememberPalaceAuthDestination(window.sessionStorage, destination);
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: palaceAuthRedirect(window.location.origin) } })
        : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
      if (mode === 'signup' && !result.data?.session)
        setMessage('Check your inbox for the confirmation link, then return to the Palace.');
    } catch (error) {
      setMessage(readableAuthError(error));
    } finally { setBusy(false); }
  }

  async function magic() {
    if (!email.trim()) { setMessage('Enter your email address first to request a magic link.'); return; }
    if (!supabase || busy) return;
    setBusy(true); setMessage('');
    try {
      rememberPalaceAuthDestination(window.sessionStorage, destination);
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: palaceAuthRedirect(window.location.origin), shouldCreateUser: true },
      });
      if (error) throw error;
      setMessage('A passwordless entrance link has been sent. Check your inbox to enter the Palace.');
    } catch (error) {
      setMessage(readableAuthError(error));
    } finally { setBusy(false); }
  }

  async function google() {
    if (!supabase || busy) return;
    setBusy(true); setMessage('');
    try {
      rememberPalaceAuthDestination(window.sessionStorage, destination);
      const { error } = await supabase.auth.signInWithOAuth(palaceOAuthOptions(window.location.origin));
      if (error) throw error;
      // Supabase redirects this browser to Google. Do not keep the button locked if it does not.
    } catch (error) {
      clearPalaceAuthDestination(window.sessionStorage);
      setMessage(readableAuthError(error));
    } finally { setBusy(false); }
  }

  if (!loading && session) return <Navigate to={destination} replace />;

  return <Frame><section className="gate">
    <div className="gate-copy">
      <p className="eyebrow">THE PALACE GATES</p>
      <h1>{mode === 'signup' ? 'A place among the stars.' : 'Welcome home.'}</h1>
      <p>Choose the doorway that suits you. Your Palace password should be different from your email password.</p>
      {requested && palaceDoorDestinationMessage(destination) && <p className="gate-destination-note">✧ {palaceDoorDestinationMessage(destination)}</p>}
    </div>
    <div className="auth-panel palace-login-panel">
      {!configured ? <p role="alert">Sign-in is not configured.</p> : <>
        {googleLoginEnabled() && <>
          <button type="button" className="palace-google-login" disabled={busy || loading} onClick={google}>
            <GoogleLogo /> <span>Continue with Google</span>
          </button>
          <div className="auth-divider"><span>or enter with email</span></div>
        </>}
        <label htmlFor="palace-email">Email</label>
        <input id="palace-email" type="email" autoComplete="email" value={email}
          onChange={event => setEmail(event.target.value)} placeholder="you@example.com" required />
        <button type="button" className="magic-button" disabled={busy || loading} onClick={magic}>
          Email me a passwordless entrance link
        </button>
        <div className="auth-divider"><span>or use a Palace password</span></div>
        <form onSubmit={submit}>
          <label htmlFor="palace-password">Password</label>
          <div className="password-field">
            <input id="palace-password" type={showPassword ? 'text' : 'password'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={mode === 'signup' ? 8 : undefined} required value={password}
              onChange={event => setPassword(event.target.value)} />
            <button type="button" onClick={() => setShowPassword(value => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {mode === 'signup' && <small className="password-note">Use at least 8 characters. Never use your inbox password.</small>}
          <button disabled={busy || loading}>{busy ? 'Please wait…' : mode === 'signup' ? 'Create my chamber' : 'Enter the Palace'}</button>
        </form>
        <button type="button" className="secondary" disabled={busy}
          onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage(''); setPassword(''); }}>
          {mode === 'signup' ? 'Already a member? Sign in' : 'New beneath these stars? Create an account'}
        </button>
        {googleLoginEnabled() && <p className="palace-google-note">Already a member? Choose the same verified email on Google to return to your account.</p>}
      </>}
      {(message || sessionError) && <p className="status palace-auth-message" role="status" aria-live="polite">{message || sessionError}</p>}
    </div>
  </section></Frame>;
}

export function PalaceAuthCallback({ Frame }) {
  const { session, loading, error } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const pending = recallPalaceAuthDestination(window.sessionStorage);
  const [waiting, setWaiting] = useState(params.has('code'));
  useEffect(() => {
    if (session || !params.has('code')) return;
    const timeout = window.setTimeout(() => setWaiting(false), 12000);
    return () => window.clearTimeout(timeout);
  }, [session]);
  useEffect(() => {
    if (session && !loading) clearPalaceAuthDestination(window.sessionStorage);
  }, [session, loading]);

  const oauthError = params.get('error_description') || params.get('error');
  if (oauthError || error || (!session && !loading && !waiting)) {
    if (!oauthError && !error && !params.has('code'))
      return <Navigate to="/login" replace />;
    const feedback = oauthError || error || 'We could not complete your sign-in. Please try again.';
    return <Frame><section className="room-title palace-auth-callback-error">
      <h1>Sign-in could not finish</h1><p role="alert">{feedback}</p>
      <Link to="/login">Return to the Palace gates</Link>
    </section></Frame>;
  }
  if (loading || (waiting && !session)) return <Frame><p role="status" className="palace-auth-pending">Completing your Palace sign-in…</p></Frame>;
  return <Navigate to={session ? pending : '/login'} replace />;
}
