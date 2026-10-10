import { safePalaceReturnPath } from './palaceReturnPath';

const KEY = 'palace-auth-return';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function googleLoginEnabled(value = import.meta.env.VITE_GOOGLE_LOGIN_ENABLED) {
  return value === 'true';
}

export function palaceAuthRedirect(origin) {
  return new URL('/auth/callback', origin).toString();
}

export function palaceOAuthOptions(origin) {
  return { provider: 'google', options: { redirectTo: palaceAuthRedirect(origin) } };
}

export function rememberPalaceAuthDestination(storage, destination, now = Date.now()) {
  try {
    storage?.setItem(KEY, JSON.stringify({ to: safePalaceReturnPath(destination), at: now }));
  } catch {
    // Incognito and hardened browsers may disable sessionStorage.
  }
}

export function recallPalaceAuthDestination(storage, now = Date.now()) {
  try {
    const saved = JSON.parse(storage?.getItem(KEY) || '{}');
    if (!Number.isFinite(saved.at) || saved.at > now || now - saved.at > MAX_AGE_MS) return '/chamber';
    return safePalaceReturnPath(saved.to);
  } catch {
    return '/chamber';
  }
}

export function clearPalaceAuthDestination(storage) {
  try { storage?.removeItem(KEY); } catch {}
}

export function readableAuthError(error) {
  const code = error?.code || '';
  if (code === 'email_not_confirmed') return 'Your account exists, but the email address has not been confirmed yet.';
  if (code === 'over_email_send_rate_limit') return 'Please wait before requesting another email.';
  if (code === 'invalid_credentials') return 'That email and password combination was not recognised.';
  if (code === 'validation_failed' || code === 'provider_disabled') return 'Google sign-in is not available yet. Please use email sign-in.';
  return error?.message || 'Sign-in failed. Please try again.';
}
