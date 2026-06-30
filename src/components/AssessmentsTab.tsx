import { useState } from 'react';
import { Plus, X, TrendingDown, Activity, Zap, Timer, Heart, Droplets, Gauge, Smile } from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Database } from '../lib/database.types';

type PhysicalAssessment = Database['public']['Tables']['physical_assessments']['Row'];

const IC = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

const STATS = [
  { label: 'Peso', key: 'weight', unit: 'kg', icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'IMC', key: 'imc', unit: '', icon: Gauge, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Gordura', key: 'body_fat_percentage', unit: '%', icon: Droplets, color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'Massa Muscular', key: 'muscle_mass', unit: 'kg', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Gordura Visceral', key: 'visceral_fat', unit: '', icon: Heart, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'TMB', key: 'basal_metabolic_rate', unit: 'kcal', icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Idade Metabólica', key: 'metabolic_age', unit: 'anos', icon: Timer, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { label: 'InBody Score', key: 'inbody_score', unit: '', icon: Smile, color: 'text-teal-600', bg: 'bg-teal-50' },
];

const ASSESSMENT_FIELDS: { label: string; key: string; unit?: string }[] = [
  { label: 'Data *', key: 'assessment_date' },
  { label: 'Peso (kg)', key: 'weight' },
  { label: 'Altura (cm)', key: 'height' },
  { label: 'Gordura Corporal (%)', key: 'body_fat_percentage' },
  { label: 'IMC', key: 'imc' },
  { label: 'Massa Gorda (kg)', key: 'fat_mass' },
  { label: 'Massa Livre Gordura (kg)', key: 'fat_free_mass' },
  { label: 'Massa Muscular (kg)', key: 'muscle_mass' },
  { label: 'Massa Musc. Esquelética (kg)', key: 'skeletal_muscle_mass' },
  { label: 'Água Corporal (kg)', key: 'body_water' },
  { label: 'Proteína (kg)', key: 'protein' },
  { label: 'Minerais (kg)', key: 'minerals' },
  { label: 'Massa Óssea (kg)', key: 'bone_mass' },
  { label: 'Gordura Visceral', key: 'visceral_fat' },
  { label: 'TMB (kcal)', key: 'basal_metabolic_rate' },
  { label: 'Gordura Subcutânea (%)', key: 'subcutaneous_fat' },
  { label: 'Idade Metabólica', key: 'metabolic_age' },
  { label: 'InBody Score', key: 'inbody_score' },
];

export default function AssessmentsTab({
  assessments,
  onAdd,
  clientId,
}: {
  assessments: PhysicalAssessment[];
  onAdd: (payload: Record<string, any>) => Promise<void>;
  clientId: string | undefined;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const chartData = assessments.map(a => ({
    date: new Date(a.assessment_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
    weight: a.weight,
    bodyFat: a.body_fat_percentage,
    muscleMass: a.muscle_mass,
    imc: a.imc,
    visceralFat: a.visceral_fat,
    bmr: a.basal_metabolic_rate,
    metabolicAge: a.metabolic_age,
    inbodyScore: a.inbody_score,
  }));

  const latest = assessments.at(-1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    setSaving(true);
    const payload: Record<string, any> = { client_id: clientId };
    ASSESSMENT_FIELDS.forEach(f => {
      const v = form[f.key];
      if (!v) payload[f.key] = null;
      else if (f.key === 'assessment_date') payload[f.key] = v;
      else payload[f.key] = parseFloat(v);
    });
    await onAdd(payload);
    setShowForm(false);
    setForm({});
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Avaliações Físicas</h2>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Nova Avaliação
        </button>
      </div>

      {latest && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map(s => {
            const Icon = s.icon;
            const val = (latest as any)[s.key];
            return (
              <div key={s.key} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide leading-none">{s.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  {val != null ? val : <span className="text-slate-300">—</span>}
                  {val != null && s.unit && <span className="text-sm font-normal text-slate-400 ml-0.5">{s.unit}</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {chartData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <ChartCard title="Evolução do Peso">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
              <Tooltip />
              <Area type="monotone" dataKey="weight" name="Peso (kg)" stroke="#10b981" strokeWidth={2.5} fill="url(#wg)" dot={{ r: 4, fill: '#10b981' }} />
            </AreaChart>
          </ChartCard>

          <ChartCard title="Gordura vs Massa Muscular">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bodyFat" name="Gordura (%)" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: '#f43f5e' }} />
              <Line type="monotone" dataKey="muscleMass" name="Muscular (kg)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
            </LineChart>
          </ChartCard>

          <ChartCard title="IMC e Gordura Visceral">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="imc" name="IMC" stroke="#6366f1" strokeWidth={2.5} fill="url(#ig)" dot={{ r: 4, fill: '#6366f1' }} />
              <Line type="monotone" dataKey="visceralFat" name="Gordura Visceral" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
            </AreaChart>
          </ChartCard>

          <ChartCard title="TMB e Idade Metabólica">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="bmr" name="TMB (kcal)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="metabolicAge" name="Idade Metabólica" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartCard>
        </div>
      )}

      {chartData.length <= 1 && assessments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          Adicione pelo menos 2 avaliações para visualizar os gráficos de evolução.
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">Histórico de Avaliações</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {['Data','Peso','IMC','Gordura','Muscular','TMB','Score'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessments.map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{a.assessment_date}</td>
                  <td className="px-4 py-3 text-slate-600">{a.weight ?? '—'} {a.weight ? 'kg' : ''}</td>
                  <td className="px-4 py-3 text-slate-600">{a.imc ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.body_fat_percentage ?? '—'}{a.body_fat_percentage ? '%' : ''}</td>
                  <td className="px-4 py-3 text-slate-600">{a.muscle_mass ?? '—'} {a.muscle_mass ? 'kg' : ''}</td>
                  <td className="px-4 py-3 text-slate-600">{a.basal_metabolic_rate ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.inbody_score ?? '—'}</td>
                </tr>
              ))}
              {assessments.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Nenhuma avaliação registada. Clique em "Nova Avaliação" para começar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="font-bold text-lg text-slate-900">Nova Avaliação</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ASSESSMENT_FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                    <input
                      required={f.key === 'assessment_date'}
                      type={f.key === 'assessment_date' ? 'date' : 'number'}
                      step={f.key === 'basal_metabolic_rate' || f.key === 'metabolic_age' ? '1' : '0.1'}
                      value={form[f.key] ?? ''}
                      onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className={IC}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {saving ? 'A guardar...' : 'Guardar Avaliação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <h3 className="font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
