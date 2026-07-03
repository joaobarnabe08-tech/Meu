import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, User, Phone, Mail, ArrowRight, X, Pencil, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];

const emptyForm = { name: '', email: '', phone: '', birth_date: '', gender: '', notes: '' };

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [inviteModal, setInviteModal] = useState<Client | null>(null);
  const [inviteStatus, setInviteStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [inviteError, setInviteError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    setClients(data ?? []);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email?.toLowerCase() || '').includes(q) ||
      (c.phone || '').includes(q)
    );
  }, [clients, search]);

  function openCreate() {
    setEditClient(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  }

  function openInvite(client: Client) {
    setInviteModal(client);
    setInviteStatus('idle');
    setInviteError('');
    setInviteUrl('');
  }

  async function sendInvite(client: Client) {
    setInviteStatus('sending');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-invite`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: client.id,
          email: client.email,
          client_name: client.name,
        }),
      });
      if (!response.ok) throw new Error(`Erro ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setInviteUrl(data.activation_url || '');
      setInviteStatus('sent');
      load();
    } catch (err: any) {
      setInviteError(err.message || 'Erro ao enviar convite');
      setInviteStatus('error');
    }
  }

  function openEdit(e: React.MouseEvent, client: Client) {
    e.preventDefault();
    e.stopPropagation();
    setEditClient(client);
    setForm({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      birth_date: client.birth_date ?? '',
      gender: client.gender ?? '',
      notes: client.notes ?? '',
    });
    setError('');
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('O nome é obrigatório'); return; }
    setSaving(true);

    if (editClient) {
      const { data, error: err } = await supabase.from('clients').update({
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        notes: form.notes.trim() || null,
      }).eq('id', editClient.id).select().single();
      if (err) { setError(err.message); setSaving(false); return; }
      setClients(prev => prev.map(c => c.id === editClient.id ? data : c));
    } else {
      const id = 'cl_' + Math.random().toString(36).slice(2, 9).toUpperCase();
      const { data, error: err } = await supabase.from('clients').insert({
        id,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        birth_date: form.birth_date || null,
        gender: form.gender || null,
        notes: form.notes.trim() || null,
      }).select().single();
      if (err) { setError(err.message); setSaving(false); return; }
      await supabase.from('anamneses').insert({ client_id: id, health_history: '', goals: '', notes: '' });
      setClients(prev => [data, ...prev]);
    }

    setShowForm(false);
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-500 mt-1">{clients.length} clientes registados</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
        <Send className="w-4 h-4 shrink-0" />
        <span>Envia um convite para cada cliente aceder à sua área pessoal na app.</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Procurar por nome, email ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(client => (
            <Link
              key={client.id}
              to={`/clientes/${client.id}`}
              className="group bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all relative"
            >
              <div className="absolute top-3 right-3 flex items-center gap-1.5">
                {client.auth_user_id && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium border border-emerald-100" title="Conta ativada">
                    <CheckCircle2 className="w-3 h-3" /> Ativa
                  </span>
                )}
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); openInvite(client); }}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-blue-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  title="Enviar convite"
                >
                  <Send className="w-3.5 h-3.5 text-slate-500 hover:text-blue-600" />
                </button>
                <button
                  onClick={e => openEdit(e, client)}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                  title="Editar cliente"
                >
                  <Pencil className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-600" />
                </button>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-lg shrink-0">
                  {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 truncate group-hover:text-emerald-700 transition-colors pr-6">
                    {client.name}
                  </h3>
                  <div className="mt-2 space-y-1">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {!client.email && !client.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <User className="w-3.5 h-3.5 shrink-0" />
                        <span>Sem contacto registado</span>
                      </div>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Nenhum cliente encontrado</p>
          <p className="text-sm text-slate-400 mt-1">Ajuste a pesquisa ou adicione um novo cliente.</p>
        </div>
      )}

      {inviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-900">Enviar Convite</h2>
              <button onClick={() => { setInviteModal(null); setInviteStatus('idle'); setInviteError(''); setInviteUrl(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                  {inviteModal.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{inviteModal.name}</p>
                  <p className="text-sm text-slate-500 truncate">{inviteModal.email || 'Sem email'}</p>
                </div>
              </div>

              {inviteStatus === 'idle' && (
                <>
                  <p className="text-sm text-slate-600">
                    O cliente receberá um email com um link para ativar a conta e definir a palavra-passe. Depois de ativar, terá acesso à sua área pessoal (apenas leitura).
                  </p>
                  {!inviteModal.email && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>Este cliente não tem email registado. Adiciona um email antes de enviar o convite.</span>
                    </div>
                  )}
                  <button
                    onClick={() => sendInvite(inviteModal)}
                    disabled={!inviteModal.email}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> Enviar Convite
                  </button>
                </>
              )}

              {inviteStatus === 'sending' && (
                <div className="flex flex-col items-center py-6">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
                  <p className="text-sm text-slate-500">A enviar convite...</p>
                </div>
              )}

              {inviteStatus === 'sent' && (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 mb-1">Convite enviado!</p>
                  <p className="text-sm text-slate-500 mb-4">O email foi enviado para <strong>{inviteModal.email}</strong></p>
                  {inviteUrl && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500 mb-1">Link de ativação (partilha manual se necessário):</p>
                      <div className="flex items-center gap-2">
                        <input readOnly value={inviteUrl} className="flex-1 px-2 py-1.5 text-xs bg-white border border-slate-200 rounded text-slate-600" />
                        <button onClick={() => navigator.clipboard.writeText(inviteUrl)} className="px-2 py-1.5 text-xs bg-slate-200 rounded hover:bg-slate-300 transition-colors">Copiar</button>
                      </div>
                    </div>
                  )}
                  <button onClick={() => { setInviteModal(null); setInviteStatus('idle'); setInviteUrl(''); }} className="mt-4 text-sm text-emerald-600 font-medium hover:text-emerald-700">
                    Fechar
                  </button>
                </div>
              )}

              {inviteStatus === 'error' && (
                <div className="text-center py-4">
                  <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                  <p className="font-semibold text-slate-900 mb-1">Erro ao enviar</p>
                  <p className="text-sm text-rose-500 mb-4">{inviteError}</p>
                  <button onClick={() => setInviteStatus('idle')} className="text-sm text-emerald-600 font-medium hover:text-emerald-700">
                    Tentar novamente
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-900">
                {editClient ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="px-4 py-3 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-100">{error}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="Ex: Ana Silva"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="ana@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    placeholder="912345678"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
                  <input
                    type="date"
                    value={form.birth_date}
                    onChange={e => setForm({ ...form, birth_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Género</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="">Selecionar</option>
                    <option value="feminino">Feminino</option>
                    <option value="masculino">Masculino</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  rows={3}
                  placeholder="Objetivos, observações, etc."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'A guardar...' : editClient ? 'Guardar Alterações' : 'Criar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
