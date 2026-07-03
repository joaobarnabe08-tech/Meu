import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import {
  Calendar, Plus, X, Clock, MapPin, User, ChevronLeft, ChevronRight,
  Check, Trash2, Pencil, AlertCircle, Loader2,
} from 'lucide-react';

type Appointment = Database['public']['Tables']['appointments']['Row'];
type Client = Database['public']['Tables']['clients']['Row'];

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  scheduled: { label: 'Agendada', dot: 'bg-gold-400', badge: 'bg-gold-50 text-gold-700 border-gold-200' },
  completed: { label: 'Concluída', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelada', dot: 'bg-rose-400', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

type FormState = {
  client_id: string;
  title: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  location: string;
  notes: string;
  status: string;
};

const emptyForm: FormState = {
  client_id: '',
  title: 'Sessão de Treino',
  appointment_date: new Date().toISOString().slice(0, 10),
  start_time: '09:00',
  end_time: '10:00',
  location: '',
  notes: '',
  status: 'scheduled',
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [a, c] = await Promise.all([
      supabase.from('appointments').select('*').order('appointment_date', { ascending: true }).order('start_time', { ascending: true }),
      supabase.from('clients').select('*').order('name', { ascending: true }),
    ]);
    setAppointments(a.data ?? []);
    setClients(c.data ?? []);
    setLoading(false);
  }

  const clientMap = useMemo(() => {
    const m: Record<string, Client> = {};
    clients.forEach(c => { m[c.id] = c; });
    return m;
  }, [clients]);

  // Calendar grid
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  }, [currentMonth]);

  const apptsByDate = useMemo(() => {
    const m: Record<string, Appointment[]> = {};
    appointments.forEach(a => {
      const key = a.appointment_date;
      if (!m[key]) m[key] = [];
      m[key].push(a);
    });
    return m;
  }, [appointments]);

  const selectedAppts = selectedDate ? (apptsByDate[selectedDate] ?? []) : [];

  function openCreate(date?: string) {
    setEditAppt(null);
    setForm({
      ...emptyForm,
      appointment_date: date || new Date().toISOString().slice(0, 10),
    });
    setError('');
    setShowForm(true);
  }

  function openEdit(appt: Appointment) {
    setEditAppt(appt);
    setForm({
      client_id: appt.client_id,
      title: appt.title,
      appointment_date: appt.appointment_date,
      start_time: appt.start_time.slice(0, 5),
      end_time: appt.end_time?.slice(0, 5) || '',
      location: appt.location || '',
      notes: appt.notes || '',
      status: appt.status,
    });
    setError('');
    setShowForm(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!form.client_id) { setError('Seleciona um cliente.'); return; }
    if (!form.appointment_date) { setError('Seleciona uma data.'); return; }
    if (!form.start_time) { setError('Indica a hora de início.'); return; }

    setSaving(true);
    const payload = {
      client_id: form.client_id,
      title: form.title,
      appointment_date: form.appointment_date,
      start_time: form.start_time,
      end_time: form.end_time || null,
      location: form.location || null,
      notes: form.notes || null,
      status: form.status,
    };

    if (editAppt) {
      const { error } = await supabase.from('appointments').update(payload).eq('id', editAppt.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from('appointments').insert(payload);
      if (error) setError(error.message);
    }

    setSaving(false);
    if (!error) {
      setShowForm(false);
      load();
    }
  }

  async function deleteAppointment(id: string) {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) { setError(error.message); return; }
    setDeleteId(null);
    load();
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) return;
    load();
  }

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }
  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }
  function goToday() {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today.toISOString().slice(0, 10));
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-viper-900">Agenda</h1>
          <p className="text-sm text-viper-500 mt-0.5">Gere as marcações de sessões com clientes</p>
        </div>
        <button
          onClick={() => openCreate()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-gold-400 to-gold-500 text-viper-900 rounded-lg font-bold hover:from-gold-300 hover:to-gold-400 transition-all shadow-lg shadow-gold-500/20"
        >
          <Plus className="w-4 h-4" /> Nova Marcação
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-gold-400 animate-spin" />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-viper-200 shadow-sm overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-viper-100">
              <div className="flex items-center gap-3">
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg hover:bg-viper-50 flex items-center justify-center text-viper-600 transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-viper-900 text-lg min-w-[160px] text-center">
                  {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg hover:bg-viper-50 flex items-center justify-center text-viper-600 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium text-gold-600 hover:bg-gold-50 rounded-lg transition-colors">
                Hoje
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-viper-100">
              {WEEKDAYS.map(d => (
                <div key={d} className="text-center py-2.5 text-xs font-semibold text-viper-400 uppercase tracking-wide">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {calendarDays.map((date, i) => {
                if (!date) return <div key={i} className="min-h-[80px] border-b border-r border-viper-50 bg-viper-50/30" />;
                const dateStr = date.toISOString().slice(0, 10);
                const dayAppts = apptsByDate[dateStr] ?? [];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[80px] border-b border-r border-viper-50 p-1.5 text-left transition-colors hover:bg-gold-50/30 ${
                      isSelected ? 'bg-gold-50' : ''
                    }`}
                  >
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      isToday ? 'bg-gold-400 text-viper-900' : 'text-viper-600'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {dayAppts.slice(0, 3).map(a => {
                        const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.scheduled;
                        return (
                          <div key={a.id} className="flex items-center gap-1 text-[10px] text-viper-600 truncate">
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} shrink-0`} />
                            <span className="truncate">{a.start_time.slice(0, 5)} {clientMap[a.client_id]?.name?.split(' ')[0] || ''}</span>
                          </div>
                        );
                      })}
                      {dayAppts.length > 3 && (
                        <p className="text-[10px] text-viper-400 font-medium">+{dayAppts.length - 3} mais</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day detail / Upcoming */}
          <div className="bg-white rounded-xl border border-viper-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-viper-100">
              <h3 className="font-bold text-viper-900">
                {selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'Próximas Marcações'}
              </h3>
              <p className="text-xs text-viper-400 mt-0.5">
                {selectedAppts.length > 0 ? `${selectedAppts.length} sessão(ões)` : 'Sem sessões'}
              </p>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-viper-50">
              {(selectedDate ? selectedAppts : appointments.filter(a => a.appointment_date >= todayStr).slice(0, 10)).map(appt => {
                const client = clientMap[appt.client_id];
                const sc = STATUS_CONFIG[appt.status] || STATUS_CONFIG.scheduled;
                return (
                  <div key={appt.id} className="p-4 group">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${sc.dot} shrink-0`} />
                          <h4 className="font-semibold text-viper-900 text-sm truncate">{appt.title}</h4>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-viper-500 mb-1">
                          <User className="w-3.5 h-3.5" />
                          <span className="truncate">{client?.name || 'Cliente desconhecido'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-viper-500 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{appt.start_time.slice(0, 5)}{appt.end_time ? ` - ${appt.end_time.slice(0, 5)}` : ''}</span>
                          {!selectedDate && <span className="text-viper-400">· {new Date(appt.appointment_date + 'T00:00:00').toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })}</span>}
                        </div>
                        {appt.location && (
                          <div className="flex items-center gap-1.5 text-xs text-viper-500 mb-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">{appt.location}</span>
                          </div>
                        )}
                        {appt.notes && <p className="text-xs text-viper-400 mt-1 line-clamp-2">{appt.notes}</p>}
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${sc.badge}`}>{sc.label}</span>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(appt)} className="w-7 h-7 rounded-lg bg-viper-50 hover:bg-gold-100 flex items-center justify-center transition-colors" title="Editar">
                          <Pencil className="w-3.5 h-3.5 text-viper-500" />
                        </button>
                        <button onClick={() => setDeleteId(appt.id)} className="w-7 h-7 rounded-lg bg-viper-50 hover:bg-rose-100 flex items-center justify-center transition-colors" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5 text-viper-500 hover:text-rose-500" />
                        </button>
                      </div>
                    </div>
                    {appt.status === 'scheduled' && (
                      <div className="flex gap-1.5 mt-2">
                        <button onClick={() => updateStatus(appt.id, 'completed')} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors">
                          <Check className="w-3 h-3" /> Concluir
                        </button>
                        <button onClick={() => updateStatus(appt.id, 'cancelled')} className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors">
                          <X className="w-3 h-3" /> Cancelar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {(selectedDate ? selectedAppts : appointments.filter(a => a.appointment_date >= todayStr)).length === 0 && (
                <div className="px-5 py-10 text-center">
                  <Calendar className="w-10 h-10 text-viper-200 mx-auto mb-2" />
                  <p className="text-sm text-viper-400">Sem marcações para mostrar.</p>
                  {selectedDate && (
                    <button onClick={() => openCreate(selectedDate)} className="mt-3 text-sm text-gold-600 font-medium hover:text-gold-500">
                      + Criar marcação neste dia
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-viper-100 sticky top-0 bg-white">
              <h2 className="font-bold text-lg text-viper-900">{editAppt ? 'Editar Marcação' : 'Nova Marcação'}</h2>
              <button onClick={() => setShowForm(false)} className="text-viper-400 hover:text-viper-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-600 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-viper-700 mb-1.5">Cliente *</label>
                <select
                  required
                  value={form.client_id}
                  onChange={e => setForm({ ...form, client_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
                >
                  <option value="">Selecionar cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-viper-700 mb-1.5">Título</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
                  placeholder="Sessão de Treino, Avaliação Física..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-viper-700 mb-1.5">Data *</label>
                  <input
                    type="date"
                    required
                    value={form.appointment_date}
                    onChange={e => setForm({ ...form, appointment_date: e.target.value })}
                    className="w-full px-3 py-2.5 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-viper-700 mb-1.5">Início *</label>
                  <input
                    type="time"
                    required
                    value={form.start_time}
                    onChange={e => setForm({ ...form, start_time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-viper-700 mb-1.5">Fim</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={e => setForm({ ...form, end_time: e.target.value })}
                    className="w-full px-3 py-2.5 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-viper-700 mb-1.5">Local</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2.5 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
                  placeholder="Ginásio, Online, Parque..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-viper-700 mb-1.5">Estado</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
                >
                  <option value="scheduled">Agendada</option>
                  <option value="completed">Concluída</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-viper-700 mb-1.5">Observações</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 resize-none"
                  placeholder="Notas sobre a sessão..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-viper-200 text-viper-600 rounded-lg text-sm font-medium hover:bg-viper-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-gold-400 to-gold-500 text-viper-900 rounded-lg text-sm font-bold hover:from-gold-300 hover:to-gold-400 transition-all disabled:opacity-50 shadow-lg shadow-gold-500/20">
                  {saving ? 'A guardar...' : editAppt ? 'Guardar' : 'Criar Marcação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="font-bold text-viper-900">Eliminar marcação?</h3>
            </div>
            <p className="text-sm text-viper-500 mb-5">Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 border border-viper-200 text-viper-600 rounded-lg text-sm font-medium hover:bg-viper-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => deleteAppointment(deleteId)} className="flex-1 py-2.5 bg-rose-500 text-white rounded-lg text-sm font-semibold hover:bg-rose-600 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
