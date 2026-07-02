import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type ClientProfile = {
  id: string;
  name: string;
  email: string | null;
  auth_user_id: string | null;
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
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
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadClientProfile(uid: string) {
    const { data } = await supabase
      .from('clients')
      .select('id, name, email, auth_user_id')
      .eq('auth_user_id', uid)
      .maybeSingle();
    setClientProfile(data as ClientProfile | null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        (async () => {
          await loadClientProfile(data.session!.user.id);
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
          await loadClientProfile(newSession.user.id);
        } else {
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
    setClientProfile(null);
  }

  const isClient = !!user && !!clientProfile;
  const isTrainer = !user;

  return (
    <AuthContext.Provider
      value={{ session, user, clientProfile, loading, isTrainer, isClient, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
