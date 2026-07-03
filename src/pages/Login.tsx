import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle, User, Users, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';
import { BRANDING } from '../lib/branding';

type Mode = 'login' | 'activate' | 'register-trainer';

export default function Login() {
  const { signIn, signUp, user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [trainerName, setTrainerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [trainerRegistered, setTrainerRegistered] = useState(false);

  useEffect(() => {
    if (token) setMode('activate');
  }, [token]);

  useEffect(() => {
    if (!loading && user && role) {
      if (role === 'trainer') navigate('/dashboard');
      else if (role === 'client') navigate('/area-cliente');
    }
  }, [user, role, loading, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'activate') {
      if (password.length < 6) {
        setError('A palavra-passe deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As palavras-passe não coincidem.');
        return;
      }
      setSubmitting(true);
      const { error } = await signUp(email, password);
      setSubmitting(false);
      if (error) {
        setError(error);
        return;
      }
    } else if (mode === 'register-trainer') {
      if (password.length < 6) {
        setError('A palavra-passe deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As palavras-passe não coincidem.');
        return;
      }
      setSubmitting(true);
      try {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-trainer`;
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name: trainerName }),
        });
        const data = await response.json();
        setSubmitting(false);
        if (!response.ok || data.error) {
          setError(data.error || `Erro ${response.status}`);
          return;
        }
        setTrainerRegistered(true);
        setTimeout(() => {
          signIn(email, password).then(({ error }) => {
            if (error) {
              setMode('login');
              setError(null);
            }
          });
        }, 1500);
      } catch (err: any) {
        setSubmitting(false);
        setError(err.message || 'Erro ao registar treinador');
      }
    } else {
      setSubmitting(true);
      const { error } = await signIn(email, password);
      setSubmitting(false);
      if (error) setError(error);
    }
  }

  const showTrainerInfo = mode === 'login';

  return (
    <div className="min-h-screen bg-viper-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gold glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{BRANDING.name}</h1>
          <p className="text-gold-400 mt-1 text-sm font-medium tracking-wide">
            {mode === 'activate' && 'Ativa a tua conta'}
            {mode === 'register-trainer' && 'Registo de Treinador'}
            {mode === 'login' && BRANDING.tagline}
          </p>
        </div>

        <div className="bg-viper-800 rounded-2xl shadow-2xl border border-viper-700 p-8">
          {token && mode === 'activate' && (
            <div className="mb-6 p-4 bg-gold-400/10 border border-gold-400/30 rounded-xl">
              <p className="text-sm text-gold-300 font-medium">
                Bem-vindo(a)! Define a tua palavra-passe para ativar a conta.
              </p>
            </div>
          )}

          {showTrainerInfo && (
            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-gold-400/10 border border-gold-400/20">
                <Users className="w-5 h-5 text-gold-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-gold-300">Treinador</p>
                  <p className="text-[11px] text-gold-400/70">Gestão completa</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-viper-700 border border-viper-600">
                <User className="w-5 h-5 text-viper-200 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-viper-100">Cliente</p>
                  <p className="text-[11px] text-viper-300">A tua área</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {trainerRegistered && (
            <div className="mb-4 flex flex-col items-center py-6">
              <CheckCircle2 className="w-12 h-12 text-gold-400 mb-3" />
              <p className="font-semibold text-white mb-1">Conta criada com sucesso!</p>
              <p className="text-sm text-viper-300 mb-3">A iniciar sessão...</p>
              <Loader2 className="w-5 h-5 text-gold-400 animate-spin" />
            </div>
          )}

          {!trainerRegistered && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register-trainer' && (
                <div>
                  <label className="block text-sm font-medium text-viper-200 mb-1.5">Nome</label>
                  <input
                    type="text"
                    required
                    value={trainerName}
                    onChange={e => setTrainerName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-viper-700 border border-viper-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 placeholder-viper-400"
                    placeholder="O teu nome"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-viper-200 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-viper-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-viper-700 border border-viper-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 placeholder-viper-400"
                    placeholder="o.teu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-viper-200 mb-1.5">Palavra-passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-viper-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-viper-700 border border-viper-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 placeholder-viper-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {(mode === 'activate' || mode === 'register-trainer') && (
                <div>
                  <label className="block text-sm font-medium text-viper-200 mb-1.5">Confirmar palavra-passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-viper-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 bg-viper-700 border border-viper-600 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 placeholder-viper-400"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-gold-400 to-gold-500 text-viper-900 rounded-lg text-sm font-bold hover:from-gold-300 hover:to-gold-400 transition-all disabled:opacity-50 shadow-lg shadow-gold-500/20"
              >
                {submitting ? 'A processar...' : mode === 'activate' ? 'Ativar Conta' : mode === 'register-trainer' ? 'Criar Conta de Treinador' : 'Entrar'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {!trainerRegistered && (
            <div className="mt-6 pt-6 border-t border-viper-700 space-y-2 text-center">
              {mode === 'login' && (
                <>
                  <p className="text-sm text-viper-300">
                    Recebeste um convite?{' '}
                    <button onClick={() => setMode('activate')} className="text-gold-400 font-medium hover:text-gold-300">
                      Ativar conta
                    </button>
                  </p>
                  <p className="text-sm text-viper-300">
                    És personal trainer?{' '}
                    <button onClick={() => setMode('register-trainer')} className="text-gold-400 font-medium hover:text-gold-300">
                      Criar conta de treinador
                    </button>
                  </p>
                </>
              )}
              {mode === 'activate' && (
                <p className="text-sm text-viper-300">
                  Já tens conta?{' '}
                  <button onClick={() => setMode('login')} className="text-gold-400 font-medium hover:text-gold-300">
                    Iniciar sessão
                  </button>
                </p>
              )}
              {mode === 'register-trainer' && (
                <p className="text-sm text-viper-300">
                  Já tens conta?{' '}
                  <button onClick={() => setMode('login')} className="text-gold-400 font-medium hover:text-gold-300">
                    Iniciar sessão
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-viper-500 mt-6">
          © 2025 {BRANDING.name} · {BRANDING.tagline}
        </p>
      </div>
    </div>
  );
}
