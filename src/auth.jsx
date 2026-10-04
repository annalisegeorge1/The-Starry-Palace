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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      authChanged = true;
      if (active) { setSession(next); setError(''); setLoading(false); }
    });
    supabase.auth.getSession().then(({ data, error }) => {
      if (active && !authChanged) { setSession(data.session); setError(error?.message || ''); setLoading(false); }
    }).catch(() => { if (active && !authChanged) { setError('Unable to restore your session. Please sign in again.'); setLoading(false); } });
    return () => { active = false; subscription.unsubscribe(); };
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
