import { createContext, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let active = true;
    let authChanged = false;
    const sessionTimeout = window.setTimeout(() => {
      if (active && !authChanged) {
        setError('Session restoration timed out. You can keep using the Palace or sign in again.');
        setLoading(false);
      }
    }, 8000);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      authChanged = true;
      window.clearTimeout(sessionTimeout);
      if (active) { setSession(next); setError(''); setLoading(false); }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && !authChanged) {
        window.clearTimeout(sessionTimeout);
        setSession(data.session);
        setError(error?.message || '');
        setLoading(false);
      }
    }).catch(() => {
      window.clearTimeout(sessionTimeout);
      if (active && !authChanged) { setError('Unable to restore your session. Please sign in again.'); setLoading(false); }
    });
    return () => { active = false; window.clearTimeout(sessionTimeout); subscription.unsubscribe(); };
  }, []);
  return <AuthContext.Provider value={{ session, loading, error }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
export function ProtectedRoute({ children }) {
  const { session, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p role="status">Restoring your session…</p>;
  if (!session) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}
