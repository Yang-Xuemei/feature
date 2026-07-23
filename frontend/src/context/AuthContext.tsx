import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentProfile, checkIsAdmin } from '../lib/api';
import type { UserProfile } from '../types';

interface AuthState {
  userId: string | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  userId: null,
  profile: null,
  isAdmin: false,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = React.useCallback(async (uid: string | null) => {
    if (!uid) {
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    try {
      const [p, a] = await Promise.all([getCurrentProfile(), checkIsAdmin()]);
      setProfile(p);
      setIsAdmin(a);
    } catch (e) {
      console.error('加载用户信息失败', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
      load(uid);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      load(uid);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [load]);

  const refresh = async () => {
    if (userId) await load(userId);
  };

  return (
    <AuthContext.Provider value={{ userId, profile, isAdmin, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
