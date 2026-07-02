import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Dumbbell, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/auth';

export default function ClientLogin() {
  const { signIn, signUp, user, clientProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  const [mode, setMode] = useState<'login' | 'activate'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) setMode('activate');
  }, [token]);

  useEffect(() => {
    if (!loading && user && clientProfile) {
      navigate('/area-cliente');
    }
  }, [user, clientProfile, loading, navigate]);

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
      // After signup, link the auth account to the client profile via edge function
      // The client will be redirected to their area after session is established
    } else {
      setSubmitting(true);
      const { error } = await signIn(email, password);
      setSubmitting(false);
      if (error) setError(error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30 mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">FitPro</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {mode === 'activate' ? 'Ativa a tua conta' : 'Área do Cliente'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {token && mode === 'activate' && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm text-emerald-700 font-medium">
                Bem-vindo(a)! Define a tua palavra-passe para ativar a conta.
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="o.teu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                {mode === 'activate' ? 'Palavra-passe' : 'Palavra-passe'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {mode === 'activate' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirmar palavra-passe</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'A processar...' : mode === 'activate' ? 'Ativar Conta' : 'Entrar'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            {mode === 'login' ? (
              <p className="text-sm text-slate-500">
                Recebeste um convite?{' '}
                <button onClick={() => setMode('activate')} className="text-emerald-600 font-medium hover:text-emerald-700">
                  Ativar conta
                </button>
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Já tens conta?{' '}
                <button onClick={() => setMode('login')} className="text-emerald-600 font-medium hover:text-emerald-700">
                  Iniciar sessão
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2025 FitPro · Plataforma de Personal Training
        </p>
      </div>
    </div>
  );
}
