import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type UserRole = 'trainer' | 'client' | null;

type ClientProfile = {
  id: string;
  name: string;
  email: string | null;
  auth_user_id: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: UserRole;
  clientProfile: ClientProfile | null;
  loading: boolean;
  isTrainer: boolean;
  isClient: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  clientProfile: null,
  loading: true,
  isTrainer: false,
  isClient: false,
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadUserRole(uid: string) {
    // Check app_meta_data for role (set during account creation)
    // The user object from the session includes user_metadata but NOT app_metadata
    // We need to check via a database function or the user's raw_app_meta_data
    // Since is_trainer() is a SECURITY DEFINER function, we can call it via RPC
    const { data: isTrainerResult } = await supabase.rpc('is_trainer');
    if (isTrainerResult === true) {
      setRole('trainer');
      setClientProfile(null);
      return;
    }

    // Not a trainer — check if linked to a client profile
    const { data: client } = await supabase
      .from('clients')
      .select('id, name, email, auth_user_id')
      .eq('auth_user_id', uid)
      .maybeSingle();

    if (client) {
      setRole('client');
      setClientProfile(client as ClientProfile);
    } else {
      setRole(null);
      setClientProfile(null);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        (async () => {
          await loadUserRole(data.session!.user.id);
          setLoading(false);
        })();
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      (async () => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          await loadUserRole(newSession.user.id);
        } else {
          setRole(null);
          setClientProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setClientProfile(null);
  }

  const isTrainer = role === 'trainer';
  const isClient = role === 'client';

  return (
    <AuthContext.Provider
      value={{ session, user, role, clientProfile, loading, isTrainer, isClient, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
