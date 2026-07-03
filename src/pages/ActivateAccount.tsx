import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import Logo from '../components/Logo';
import { BRANDING } from '../lib/branding';

export default function ActivateAccount() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const { user, clientProfile } = useAuth();

  const [step, setStep] = useState<'loading' | 'form' | 'success' | 'error' | 'expired'>('loading');
  const [invite, setInvite] = useState<{ client_id: string; email: string; client_name: string } | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStep('error');
      return;
    }
    verifyToken();
  }, [token]);

  async function verifyToken() {
    const { data, error } = await supabase
      .from('invites')
      .select('client_id, email, status, expires_at, clients(name)')
      .eq('token', token!)
      .maybeSingle();

    if (error || !data) {
      setStep('error');
      return;
    }

    if (data.status === 'accepted') {
      // Already activated, redirect to login
      navigate('/login');
      return;
    }

    if (new Date(data.expires_at) < new Date()) {
      setStep('expired');
      return;
    }

    const clientData = data.clients as unknown as { name: string } | null;
    setInvite({
      client_id: data.client_id,
      email: data.email,
      client_name: clientData?.name ?? 'atleta',
    });
    setStep('form');
  }

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }

    setSubmitting(true);

    // Sign up the user with the invite email
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: invite!.email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setSubmitting(false);
      return;
    }

    // Link the auth account to the client profile
    if (signUpData.user) {
      // Update the client profile with the auth_user_id
      // This needs to be done via the service role (edge function) or direct update
      // Since the client just signed up, we use the service role through an edge function
      // But for simplicity, we can use the anon key since the RLS allows anon updates to clients
      const { error: updateError } = await supabase
        .from('clients')
        .update({ auth_user_id: signUpData.user.id })
        .eq('id', invite!.client_id);

      if (updateError) {
        console.error('Failed to link client profile:', updateError);
      }

      // Mark invite as accepted
      await supabase
        .from('invites')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('client_id', invite!.client_id)
        .eq('token', token!);
    }

    setSubmitting(false);
    setStep('success');
    setTimeout(() => navigate('/login'), 3000);
  }

  // If already logged in and linked, redirect
  useEffect(() => {
    if (user && clientProfile) navigate('/area-cliente');
  }, [user, clientProfile, navigate]);

  return (
    <div className="min-h-screen bg-viper-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="text-2xl font-bold text-viper-900">{BRANDING.name}</h1>
          <p className="text-viper-500 mt-1 text-sm">Ativação de Conta</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-viper-200 p-8">
          {step === 'loading' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-3" />
              <p className="text-sm text-viper-500">A verificar convite...</p>
            </div>
          )}

          {step === 'error' && (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-viper-900 mb-2">Convite inválido</h2>
              <p className="text-sm text-viper-500 mb-6">O link de convite não é válido ou foi removido.</p>
              <button onClick={() => navigate('/login')} className="text-sm text-gold-600 font-medium hover:text-gold-500">
                Ir para início de sessão
              </button>
            </div>
          )}

          {step === 'expired' && (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-viper-900 mb-2">Convite expirado</h2>
              <p className="text-sm text-viper-500 mb-6">Este convite expirou. Contacta o teu treinador para receber um novo.</p>
            </div>
          )}

          {step === 'form' && invite && (
            <>
              <div className="mb-6 p-4 bg-gold-400/10 border border-gold-400/30 rounded-xl">
                <p className="text-sm text-gold-700">
                  Olá <strong>{invite.client_name}</strong>! Define a tua palavra-passe para ativar a conta associada a <strong>{invite.email}</strong>.
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleActivate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-viper-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      disabled
                      value={invite.email}
                      className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-viper-50 text-viper-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-viper-700 mb-1.5">Palavra-passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-viper-700 mb-1.5">Confirmar palavra-passe</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-gold-400 to-gold-500 text-viper-900 rounded-lg text-sm font-bold hover:from-gold-300 hover:to-gold-400 transition-all disabled:opacity-50 shadow-lg shadow-gold-500/20"
                >
                  {submitting ? 'A ativar...' : 'Ativar Conta'}
                </button>
              </form>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-gold-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-viper-900 mb-2">Conta ativada!</h2>
              <p className="text-sm text-viper-500 mb-6">A tua conta foi criada com sucesso. Vais ser redirecionado para iniciar sessão.</p>
              <Loader2 className="w-5 h-5 text-gold-400 animate-spin mx-auto" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
