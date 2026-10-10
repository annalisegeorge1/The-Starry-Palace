import { describe, expect, it } from 'vitest';
import {
  googleLoginEnabled, palaceAuthRedirect, palaceOAuthOptions,
  rememberPalaceAuthDestination, recallPalaceAuthDestination,
  clearPalaceAuthDestination, readableAuthError,
} from './palaceOAuth';

const store = () => {
  const data = new Map();
  return {
    setItem: (key, value) => data.set(key, value),
    getItem: key => data.get(key) ?? null,
    removeItem: key => data.delete(key),
  };
};
describe('Palace Google sign-in and return paths', () => {
  it('is hidden until explicitly enabled in the build settings', () => {
    expect(googleLoginEnabled(undefined)).toBe(false);
    expect(googleLoginEnabled('false')).toBe(false);
    expect(googleLoginEnabled('true')).toBe(true);
  });
  it('uses the public Palace callback, not a Google secret or custom OAuth endpoint', () => {
    expect(palaceAuthRedirect('https://thestarrypalace.com')).toBe('https://thestarrypalace.com/auth/callback');
    expect(palaceOAuthOptions('https://thestarrypalace.com')).toEqual({
      provider: 'google', options: { redirectTo: 'https://thestarrypalace.com/auth/callback' },
    });
  });
  it('preserves a safe destination during sign-in and clears it afterward', () => {
    const storage = store();
    rememberPalaceAuthDestination(storage, '/work/mystory/chapter/one', 10000);
    expect(recallPalaceAuthDestination(storage, 10002)).toBe('/work/mystory/chapter/one');
    clearPalaceAuthDestination(storage);
    expect(recallPalaceAuthDestination(storage, 10003)).toBe('/chamber');
  });
  it('does not follow malicious off-domain or expired redirect destinations', () => {
    const storage = store();
    rememberPalaceAuthDestination(storage, 'https://untrusted.example/login', 10000);
    expect(recallPalaceAuthDestination(storage, 10001)).toBe('/chamber');
    rememberPalaceAuthDestination(storage, '/writing', 10000);
    expect(recallPalaceAuthDestination(storage, 10000 + 25 * 60 * 60 * 1000)).toBe('/chamber');
  });
  it('translates common provider errors', () => {
    expect(readableAuthError({ code: 'provider_disabled' })).toContain('Google sign-in');
    expect(readableAuthError({ code: 'invalid_credentials' })).toContain('password');
  });
});
