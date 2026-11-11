import React, {useEffect, useState} from 'react';
import {Link, useLocation} from 'react-router-dom';
import {configured, supabase} from './supabase';
import {palaceAuthRedirect} from './palaceOAuth';
import './palace-auth-gates.css';

const ACTIONS = {
  email: {title:'Confirm your Palace email',detail:'Confirm your address to finish creating your chamber.',button:'Confirm my email',success:'Your email is confirmed. Welcome to The Starry Palace!'},
  magiclink: {title:'Enter The Starry Palace',detail:'Use your one-time invitation to sign in securely.',button:'Sign in to the Palace',success:'Your Palace sign-in is complete.'},
  invite: {title:'Accept your Palace invitation',detail:'Accept the invitation to join The Starry Palace.',button:'Accept invitation',success:'Your invitation has been accepted.'},
  email_change: {title:'Confirm your new email',detail:'Verify this email address to finish updating your Palace account.',button:'Confirm new email',success:'Your email address has been confirmed.'},
  recovery: {title:'Recover your Palace account',detail:'Verify this one-time recovery link before choosing a new password.',button:'Continue to new password'},
};

export function readPalaceEmailAction(hash) {
  const params = new URLSearchParams((hash || '').replace(/^#/, ''));
  const type = params.get('type');
  const token = params.get('token_hash');
  // Supabase's current passwordless magic-link flow verifies with OTP
  // type "email". A separate non-security "intent" controls the display copy.
  const intent = type === 'email' && params.get('intent') === 'magiclink' ? 'magiclink' : null;
  return type && Object.prototype.hasOwnProperty.call(ACTIONS,type) && token && /^[A-Za-z0-9_-]+$/.test(token)
    ? {type,token,...(intent ? {intent} : {})} : null;
}

function AuthRoom({Frame,children,title,subtitle}) {
  return <Frame><section className="gate palace-recovery-gate">
    <div className="gate-copy">
      <p className="eyebrow">THE PALACE GATES</p>
      <h1>{title}</h1><p>{subtitle}</p>
    </div>
    <div className="auth-panel palace-login-panel palace-recovery-panel">{children}</div>
  </section></Frame>;
}

export function PalaceForgotPassword({Frame}) {
  const [email,setEmail] = useState('');
  const [busy,setBusy] = useState(false);
  const [submitted,setSubmitted] = useState(false);

  async function requestReset(event) {
    event.preventDefault();
    if (!supabase || busy || submitted || !email.trim()) return;
    setBusy(true);
    try {
      // Keep the existing approved callback URL for legacy templates. The new
      // token-hash template sends users directly to /auth/verify instead.
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: palaceAuthRedirect(window.location.origin),
      });
    } catch {
      // Do not reveal whether an account exists, including provider error cases.
    } finally {
      setSubmitted(true); setBusy(false);
    }
  }

  return <AuthRoom Frame={Frame} title="Find your way back." subtitle="Forgotten your Palace password? We'll help you return securely.">
    {submitted ? <div role="status" aria-live="polite" className="palace-recovery-status">
      <h2>Check your inbox</h2>
      <p>If this email belongs to a Palace account, you'll receive a password-reset link. Check your spam folder too.</p>
      <p>If the message doesn't arrive, you may request another link later.</p>
    </div> : <form onSubmit={requestReset}>
      <label htmlFor="palace-recover-email">Account email</label>
      <input id="palace-recover-email" type="email" autoComplete="email" required
        value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com"/>
      <p className="palace-recovery-hint">We'll send a private, one-time link if this address has an account.</p>
      <button type="submit" disabled={!configured || busy}>{busy?'Requesting link…':'Email me a reset link'}</button>
    </form>}
    <p className="palace-recovery-back"><Link to="/login">Return to sign in</Link></p>
  </AuthRoom>;
}

// The default hosted Supabase recovery template still sends an authorization
// code to /auth/callback. Supabase emits PASSWORD_RECOVERY after exchanging
// that code in the original PKCE browser; give members a password form instead
// of incorrectly redirecting them to their chamber.
export function PalaceLegacyRecovery({Frame,onFinish}) {
  const [password,setPassword] = useState('');
  const [confirm,setConfirm] = useState('');
  const [visible,setVisible] = useState(false);
  const [busy,setBusy] = useState(false);
  const [updated,setUpdated] = useState(false);
  const [message,setMessage] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy || updated || !supabase) return;
    if (password.length<8) {setMessage('Use at least 8 characters for your new password.');return;}
    if (password!==confirm) {setMessage('Your passwords do not match.');return;}
    setBusy(true);setMessage('');
    try {
      const {error}=await supabase.auth.updateUser({password});
      if (error) throw error;
      // Signal success before signing out; the auth provider may immediately
      // rerender the callback when SIGNED_OUT arrives.
      setPassword('');setConfirm('');setUpdated(true);
      onFinish?.();
      try {await supabase.auth.signOut({scope:'local'});} catch {}
    } catch {
      setMessage('We could not update your password. Request another recovery email if the link has expired.');
    } finally {setBusy(false);}
  }
  return <AuthRoom Frame={Frame} title={updated?'Your Palace key is renewed.':'Choose a new password.'}
    subtitle={updated?'Sign in again with your new password.':'Your recovery link was accepted. Choose a new password for your Palace account.'}>
    {updated ? <p role="status">Your password was changed. <Link to="/login">Sign in with your new password</Link>.</p>
      : <form onSubmit={submit}>
        <label htmlFor="palace-legacy-password">New password</label>
        <div className="password-field">
          <input id="palace-legacy-password" type={visible?'text':'password'} autoComplete="new-password" minLength={8} required value={password}
            onChange={e=>setPassword(e.target.value)} />
          <button type="button" aria-label={visible?'Hide password':'Show password'} onClick={()=>setVisible(v=>!v)}>{visible?'Hide':'Show'}</button>
        </div>
        <label htmlFor="palace-legacy-confirm">Confirm new password</label>
        <input id="palace-legacy-confirm" type={visible?'text':'password'} autoComplete="new-password" minLength={8} required value={confirm}
          onChange={e=>setConfirm(e.target.value)}/>
        <button disabled={busy}>{busy?'Updating password…':'Save new password'}</button>
      </form>}
    {message && <p className="palace-auth-message" role="alert">{message}</p>}
    <p className="palace-recovery-back"><Link to="/login">Return to the Palace gates</Link></p>
  </AuthRoom>;
}

export function PalaceEmailAction({Frame}) {
  const location=useLocation();
  const [action] = useState(() => readPalaceEmailAction(location.hash || window.location.hash));
  const [mode,setMode] = useState('ready');
  const [message,setMessage] = useState('');
  const [password,setPassword] = useState('');
  const [confirmation,setConfirmation] = useState('');
  const [showPassword,setShowPassword] = useState(false);

  useEffect(() => {
    // Fragment-only links keep the one-time token out of HTTP requests and
    // referrer headers. Clear it from browser history after reading it.
    if (action && window.location.hash.includes('token_hash=')) {
      window.history.replaceState(window.history.state,'',window.location.pathname+window.location.search);
    }
  },[action]);

  async function verify() {
    if (!supabase || !action || mode!=='ready') return;
    setMessage('');setMode('verifying');
    try {
      const {error}=await supabase.auth.verifyOtp({token_hash:action.token,type:action.type});
      if (error) throw error;
      setMode(action.type==='recovery'?'password':'done');
    } catch {
      setMessage('This link has expired, has already been used, or could not be verified. Request a fresh link if needed.');
      setMode('failed');
    }
  }

  async function updatePassword(event) {
    event.preventDefault();
    if (!supabase || mode!=='password') return;
    if (password.length<8) {setMessage('Use at least 8 characters for your new password.');return;}
    if (password!==confirmation) {setMessage('Your passwords do not match.');return;}
    setMode('updating');setMessage('');
    try {
      const {error}=await supabase.auth.updateUser({password});
      if (error) throw error;
      // End the local recovery session; the new password is used for a fresh login.
      try {await supabase.auth.signOut({scope:'local'});} catch {}
      setPassword('');setConfirmation('');setMode('updated');
    } catch {
      setMessage('We could not change your password. Please try again or request a new recovery link.');
      setMode('password');
    }
  }

  const actionInfo=action ? ACTIONS[action.intent || action.type] : null;
  const isConfirmedEmail=mode==='done' && action?.type==='email' && !action?.intent;
  return <div className={isConfirmedEmail?'palace-email-confirmed':''}><AuthRoom Frame={Frame}
    title={isConfirmedEmail?'Your place among the stars is secured.':mode==='password'?'Choose a new password.':mode==='updated'?'Your Palace key is renewed.':(actionInfo?.title || 'This Palace link cannot be opened.')}
    subtitle={isConfirmedEmail?'Your email is confirmed. Welcome home to The Starry Palace.':mode==='updated'?'Your password was changed. Sign in again with your new password.':(actionInfo?.detail || 'The link is incomplete or invalid. Request a fresh one from The Starry Palace.')}>
    {!action && <p role="alert">This link is missing its secure verification information.</p>}
    {mode==='ready' && action && <>
      <p className="palace-recovery-hint">For your security, this one-time link is only used when you press the button below.</p>
      <button type="button" onClick={verify} disabled={!configured}>{actionInfo.button}</button>
    </>}
    {mode==='verifying' && <p role="status">Verifying your one-time Palace link…</p>}
    {mode==='done' && <div role="status" className="palace-recovery-status">
      <h2>{isConfirmedEmail?'Welcome to the Palace':'All set'}</h2><p>{actionInfo.success}</p>
      <Link className="button palace-recovery-link" to="/chamber">Continue to your chamber</Link>
    </div>}
    {(mode==='password'||mode==='updating') && <form onSubmit={updatePassword}>
      <label htmlFor="palace-new-password">New password</label>
      <div className="password-field">
        <input id="palace-new-password" type={showPassword?'text':'password'} autoComplete="new-password" required minLength={8}
          value={password} onChange={event=>setPassword(event.target.value)} />
        <button type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(v=>!v)}>{showPassword?'Hide':'Show'}</button>
      </div>
      <label htmlFor="palace-confirm-password">Confirm new password</label>
      <input id="palace-confirm-password" type={showPassword?'text':'password'} autoComplete="new-password" required minLength={8}
        value={confirmation} onChange={event=>setConfirmation(event.target.value)}/>
      <p className="palace-recovery-hint">Use at least 8 characters and a password you haven't used elsewhere.</p>
      <button type="submit" disabled={mode==='updating'}>{mode==='updating'?'Updating password…':'Save new password'}</button>
    </form>}
    {mode==='updated' && <p className="palace-recovery-back"><Link to="/login">Sign in with your new password</Link></p>}
    {(mode==='failed'||!action) && <p className="palace-recovery-back"><Link to="/auth/forgot-password">Request a new recovery link</Link></p>}
    {message && <p role="alert" className="palace-auth-message">{message}</p>}
    {mode!=='updated' && <p className="palace-recovery-back"><Link to="/login">Return to the Palace gates</Link></p>}
  </AuthRoom></div>;
}
