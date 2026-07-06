import { useState, useEffect } from 'react';
import { Bell, Send, Trash2, Check, Dumbbell, UtensilsCrossed, Calendar, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];

const TYPE_META: Record<string, { icon: typeof Bell; color: string; bg: string; label: string }> = {
  workout: { icon: Dumbbell, color: 'text-gold-600', bg: 'bg-gold-100', label: 'Treino' },
  plan: { icon: UtensilsCrossed, color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Plano' },
  appointment: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Consulta' },
  custom: { icon: MessageSquare, color: 'text-viper-600', bg: 'bg-viper-100', label: 'Mensagem' },
};

export default function NotificationsTab({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'custom' as Notification['type'], title: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [clientId]);

  async function loadNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    setNotifications(data || []);
    setLoading(false);
  }

  async function sendNotification() {
    if (!form.title.trim() || !form.message.trim()) return;
    setSending(true);
    const { error } = await supabase.from('notifications').insert({
      client_id: clientId,
      type: form.type,
      title: form.title.trim(),
      message: form.message.trim(),
    });
    if (!error) {
      setForm({ type: 'custom', title: '', message: '' });
      setShowForm(false);
      await loadNotifications();
    }
    setSending(false);
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-viper-900">Notificações</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" /> Nova Notificação
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-viper-200 p-5 shadow-sm space-y-4">
          <h3 className="font-semibold text-viper-900">Enviar notificação para {clientName}</h3>
          <div>
            <label className="block text-xs font-medium text-viper-500 mb-1.5">Tipo</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(TYPE_META).map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setForm(f => ({ ...f, type: key as Notification['type'] }))}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                      form.type === key
                        ? 'border-gold-400 bg-gold-50 text-gold-700'
                        : 'border-viper-200 text-viper-500 hover:border-viper-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-viper-500 mb-1.5">Título</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Ex: Lembrete de treino"
              className="w-full px-3 py-2 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-viper-500 mb-1.5">Mensagem</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Escreve a mensagem..."
              rows={3}
              className="w-full px-3 py-2 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-viper-500 hover:text-viper-700">Cancelar</button>
            <button
              onClick={sendNotification}
              disabled={sending || !form.title.trim() || !form.message.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-viper-900 text-gold-400 rounded-lg text-sm font-medium hover:bg-viper-800 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" /> {sending ? 'A enviar...' : 'Enviar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-sm text-viper-400">A carregar notificações...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-viper-200 p-8 shadow-sm text-center">
          <Bell className="w-12 h-12 text-viper-200 mx-auto mb-3" />
          <p className="text-viper-500 font-medium">Sem notificações</p>
          <p className="text-sm text-viper-400 mt-1">As notificações enviadas a este cliente aparecerão aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => {
            const meta = TYPE_META[n.type] || TYPE_META.custom;
            const Icon = meta.icon;
            return (
              <div key={n.id} className={`bg-white rounded-xl border p-4 shadow-sm flex items-start gap-3 ${n.is_read ? 'border-viper-100' : 'border-gold-300 bg-gold-50/30'}`}>
                <div className={`w-10 h-10 rounded-lg ${meta.bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-viper-900 text-sm">{n.title}</h4>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-gold-500 shrink-0" />}
                  </div>
                  <p className="text-sm text-viper-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-viper-400 mt-1">
                    {new Date(n.created_at).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!n.is_read && (
                    <button onClick={() => markAsRead(n.id)} className="w-8 h-8 rounded-lg hover:bg-viper-50 flex items-center justify-center text-viper-400 hover:text-emerald-600" title="Marcar como lida">
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => deleteNotification(n.id)} className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-viper-400 hover:text-rose-500" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
