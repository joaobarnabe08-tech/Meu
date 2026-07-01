import { useState } from 'react';
import { Plus, X, TrendingDown, Activity, Zap, Timer, Heart, Droplets, Gauge, Smile, Ruler, HeartPulse, Eye } from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Database } from '../lib/database.types';
import { useAppMode } from '../App';

type PhysicalAssessment = Database['public']['Tables']['physical_assessments']['Row'];

const IC = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";
const NUM_IC = "w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

const STATS = [
  { label: 'Peso', key: 'weight', unit: 'kg', icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'IMC', key: 'imc', unit: '', icon: Gauge, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { label: 'Gordura', key: 'body_fat_percentage', unit: '%', icon: Droplets, color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'Massa Muscular', key: 'muscle_mass', unit: 'kg', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Gordura Visceral', key: 'visceral_fat', unit: '', icon: Heart, color: 'text-amber-600', bg: 'bg-amber-50' },
  { label: 'TMB', key: 'basal_metabolic_rate', unit: 'kcal', icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Idade Metabólica', key: 'metabolic_age', unit: 'anos', icon: Timer, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { label: 'Score', key: 'inbody_score', unit: '', icon: Smile, color: 'text-teal-600', bg: 'bg-teal-50' },
];

const BODY_PARTS = [
  { key: 'shoulder_circumference', label: 'Ombros', side: 'center', position: { top: '5%', left: '50%', transform: 'translateX(-50%)' } },
  { key: 'chest_circumference', label: 'Peito', side: 'center', position: { top: '18%', left: '50%', transform: 'translateX(-50%)' } },
  { key: 'right_arm_circumference', label: 'Braço D', side: 'right', position: { top: '22%', right: '12%' } },
  { key: 'left_arm_circumference', label: 'Braço E', side: 'left', position: { top: '22%', left: '12%' } },
  { key: 'waist_circumference', label: 'Cintura', side: 'center', position: { top: '38%', left: '50%', transform: 'translateX(-50%)' } },
  { key: 'hip_circumference', label: 'Anca', side: 'center', position: { top: '48%', left: '50%', transform: 'translateX(-50%)' } },
  { key: 'right_thigh_circumference', label: 'Coxa D', side: 'right', position: { top: '58%', right: '18%' } },
  { key: 'left_thigh_circumference', label: 'Coxa E', side: 'left', position: { top: '58%', left: '18%' } },
  { key: 'right_calf_circumference', label: 'Gémeo D', side: 'right', position: { top: '78%', right: '18%' } },
  { key: 'left_calf_circumference', label: 'Gémeo E', side: 'left', position: { top: '78%', left: '18%' } },
];

const FITDAYS_FIELDS: { label: string; key: string; unit?: string; section?: string }[] = [
  { label: 'Data *', key: 'assessment_date', section: 'date' },
  { label: 'Peso (kg)', key: 'weight', section: 'body' },
  { label: 'Altura (cm)', key: 'height', section: 'body' },
  { label: 'IMC', key: 'imc', section: 'body' },
  { label: 'Gordura Corporal (%)', key: 'body_fat_percentage', section: 'composition' },
  { label: 'Massa Gorda (kg)', key: 'fat_mass', section: 'composition' },
  { label: 'Massa Livre Gordura (kg)', key: 'fat_free_mass', section: 'composition' },
  { label: 'Massa Muscular (kg)', key: 'muscle_mass', section: 'composition' },
  { label: 'Massa Musc. Esquelética (kg)', key: 'skeletal_muscle_mass', section: 'composition' },
  { label: 'Água Corporal (kg)', key: 'body_water', section: 'composition' },
  { label: 'Proteína (kg)', key: 'protein', section: 'composition' },
  { label: 'Minerais (kg)', key: 'minerals', section: 'composition' },
  { label: 'Massa Óssea (kg)', key: 'bone_mass', section: 'composition' },
  { label: 'Gordura Visceral', key: 'visceral_fat', section: 'composition' },
  { label: 'TMB (kcal)', key: 'basal_metabolic_rate', section: 'metabolic' },
  { label: 'Gordura Subcutânea (%)', key: 'subcutaneous_fat', section: 'composition' },
  { label: 'Idade Metabólica', key: 'metabolic_age', section: 'metabolic' },
  { label: 'Score', key: 'inbody_score', section: 'metabolic' },
];

const MEASUREMENT_FIELDS: { label: string; key: string }[] = [
  { label: 'Ombros (cm)', key: 'shoulder_circumference' },
  { label: 'Peito (cm)', key: 'chest_circumference' },
  { label: 'Braço Direito (cm)', key: 'right_arm_circumference' },
  { label: 'Braço Esquerdo (cm)', key: 'left_arm_circumference' },
  { label: 'Cintura (cm)', key: 'waist_circumference' },
  { label: 'Anca (cm)', key: 'hip_circumference' },
  { label: 'Coxa Direita (cm)', key: 'right_thigh_circumference' },
  { label: 'Coxa Esquerda (cm)', key: 'left_thigh_circumference' },
  { label: 'Gémeo Direito (cm)', key: 'right_calf_circumference' },
  { label: 'Gémeo Esquerdo (cm)', key: 'left_calf_circumference' },
];

const CARDIO_FIELDS: { label: string; key: string; unit: string }[] = [
  { label: 'Pressão Sistólica', key: 'systolic_bp', unit: 'mmHg' },
  { label: 'Pressão Diastólica', key: 'diastolic_bp', unit: 'mmHg' },
  { label: 'FC Repouso', key: 'resting_hr', unit: 'bpm' },
  { label: 'FC Máx (Tanaka)', key: 'max_hr_tanaka', unit: 'bpm' },
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
  const { isTrainer } = useAppMode();
  const canEdit = isTrainer;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'fitdays' | 'measurements' | 'cardio'>('fitdays');

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
    waistHip: a.waist_hip_ratio,
    systolic: a.systolic_bp,
    diastolic: a.diastolic_bp,
    restingHr: a.resting_hr,
  }));

  const latest = assessments.at(-1);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) return;
    setSaving(true);
    const payload: Record<string, any> = { client_id: clientId };

    [...FITDAYS_FIELDS, ...MEASUREMENT_FIELDS, ...CARDIO_FIELDS].forEach(f => {
      const v = form[f.key];
      if (!v) payload[f.key] = null;
      else if (f.key === 'assessment_date') payload[f.key] = v;
      else payload[f.key] = parseFloat(v);
    });

    // Calculate waist/hip ratio
    const waist = payload.waist_circumference;
    const hip = payload.hip_circumference;
    if (waist && hip && hip > 0) {
      payload.waist_hip_ratio = Math.round((waist / hip) * 100) / 100;
    }

    // Calculate Tanaka max HR if age can be derived (formula: 208 - 0.7 * age)
    // We'll calculate it client-side if resting HR is provided

    await onAdd(payload);
    setShowForm(false);
    setForm({});
    setSaving(false);
  }

  function calculateWaistHipRatio(): number | null {
    const waist = form.waist_circumference ? parseFloat(form.waist_circumference) : null;
    const hip = form.hip_circumference ? parseFloat(form.hip_circumference) : null;
    if (waist && hip && hip > 0) {
      return Math.round((waist / hip) * 100) / 100;
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Avaliações Físicas</h2>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Avaliação
          </button>
        )}
      </div>

      {!isTrainer && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
          <Eye className="w-4 h-4" />
          Modo de visualização - As alterações estão desativadas
        </div>
      )}

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

          <ChartCard title="Índice Cintura/Anca">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[0.6, 1]} />
              <Tooltip />
              <Line type="monotone" dataKey="waistHip" name="W/H Ratio" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} />
            </LineChart>
          </ChartCard>

          <ChartCard title="Pressão Arterial e FC">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="systolic" name="Sistólica" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} />
              <Line type="monotone" dataKey="diastolic" name="Diastólica" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
              <Line type="monotone" dataKey="restingHr" name="FC Repouso" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
            </LineChart>
          </ChartCard>
        </div>
      )}

      {chartData.length <= 1 && assessments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          Adicione pelo menos 2 avaliações para visualizar os gráficos de evolução.
        </div>
      )}

      {/* Latest Body Measurements */}
      {latest && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Ruler className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-900">Medidas Corporais (Última Avaliação)</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Body Diagram */}
              <div className="relative bg-slate-50 rounded-xl p-4 min-h-[400px]">
                <div className="absolute inset-4 flex items-center justify-center">
                  {/* Simple human silhouette */}
                  <svg viewBox="0 0 100 200" className="h-full max-h-[350px] opacity-20">
                    {/* Head */}
                    <ellipse cx="50" cy="12" rx="10" ry="12" fill="currentColor" />
                    {/* Neck */}
                    <rect x="45" y="22" width="10" height="8" fill="currentColor" />
                    {/* Torso */}
                    <path d="M30 30 L70 30 L75 90 L25 90 Z" fill="currentColor" />
                    {/* Arms */}
                    <path d="M30 30 L20 35 L15 80 L20 82 L28 40 L30 30" fill="currentColor" />
                    <path d="M70 30 L80 35 L85 80 L80 82 L72 40 L70 30" fill="currentColor" />
                    {/* Legs */}
                    <path d="M25 90 L30 180 L40 180 L45 95 L25 90" fill="currentColor" />
                    <path d="M75 90 L70 180 L60 180 L55 95 L75 90" fill="currentColor" />
                  </svg>
                </div>
                {/* Measurement indicators */}
                {BODY_PARTS.map(part => {
                  const val = (latest as any)[part.key];
                  return (
                    <div
                      key={part.key}
                      className={`absolute ${part.side === 'center' ? '' : ''}`}
                      style={part.position as any}
                    >
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                        val ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-400'
                      }`}>
                        <span>{part.label}</span>
                        {val && <span className="font-bold">{val}cm</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Measurements Table */}
              <div className="grid grid-cols-2 gap-3">
                {MEASUREMENT_FIELDS.map(f => {
                  const val = (latest as any)[f.key];
                  return (
                    <div key={f.key} className="flex items-center justify-between py-2 border-b border-slate-100">
                      <span className="text-sm text-slate-600">{f.label}</span>
                      <span className="text-sm font-semibold text-slate-900">
                        {val ? `${val} cm` : <span className="text-slate-300">—</span>}
                      </span>
                    </div>
                  );
                })}
                <div className="col-span-2 flex items-center justify-between py-2 border-b border-slate-100 bg-violet-50 -mx-2 px-2 rounded">
                  <span className="text-sm font-medium text-violet-700">Índice Cintura/Anca</span>
                  <span className="text-sm font-bold text-violet-700">
                    {latest.waist_hip_ratio ?? <span className="text-slate-300">—</span>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Latest Cardiovascular */}
      {latest && (latest.systolic_bp || latest.diastolic_bp || latest.resting_hr) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <h3 className="font-semibold text-slate-900">Dados Cardiovasculares</h3>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-rose-50 rounded-lg">
              <p className="text-xs text-rose-600 font-medium mb-1">Pressão Sistólica</p>
              <p className="text-2xl font-bold text-rose-700">{latest.systolic_bp ?? '—'}<span className="text-sm font-normal ml-1">mmHg</span></p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Pressão Diastólica</p>
              <p className="text-2xl font-bold text-blue-700">{latest.diastolic_bp ?? '—'}<span className="text-sm font-normal ml-1">mmHg</span></p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-lg">
              <p className="text-xs text-emerald-600 font-medium mb-1">FC Repouso</p>
              <p className="text-2xl font-bold text-emerald-700">{latest.resting_hr ?? '—'}<span className="text-sm font-normal ml-1">bpm</span></p>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-xs text-amber-600 font-medium mb-1">FC Máx (Tanaka)</p>
              <p className="text-2xl font-bold text-amber-700">{latest.max_hr_tanaka ?? '—'}<span className="text-sm font-normal ml-1">bpm</span></p>
            </div>
          </div>
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
                {['Data','Peso','IMC','Gordura','Muscular','W/H','FC','TMB','Score'].map(h => (
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
                  <td className="px-4 py-3 text-slate-600">{a.waist_hip_ratio ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.resting_hr ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.basal_metabolic_rate ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.inbody_score ?? '—'}</td>
                </tr>
              ))}
              {assessments.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-slate-400">Nenhuma avaliação registada. Clique em "Nova Avaliação" para começar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="font-bold text-lg text-slate-900">Nova Avaliação</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {/* Section Tabs */}
              <div className="flex gap-2 mb-6">
                {[
                  { key: 'fitdays', label: 'Dados Composição' },
                  { key: 'measurements', label: 'Medidas Corporais' },
                  { key: 'cardio', label: 'Cardiovascular' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveSection(tab.key as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeSection === tab.key ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Date field always visible */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Data da Avaliação *</label>
                <input
                  required
                  type="date"
                  value={form['assessment_date'] ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, assessment_date: e.target.value }))}
                  className={IC}
                />
              </div>

              {activeSection === 'fitdays' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FITDAYS_FIELDS.filter(f => f.key !== 'assessment_date').map(f => (
                    <div key={f.key}>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                      <input
                        type="number"
                        step={f.key.includes('rate') || f.key.includes('age') || f.key.includes('score') ? '1' : '0.1'}
                        value={form[f.key] ?? ''}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        className={IC}
                      />
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'measurements' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {MEASUREMENT_FIELDS.map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{f.label}</label>
                        <input
                          type="number"
                          step="0.1"
                          value={form[f.key] ?? ''}
                          onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className={IC}
                        />
                      </div>
                    ))}
                  </div>
                  {calculateWaistHipRatio() && (
                    <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg">
                      <span className="text-sm font-medium text-violet-700">Índice Cintura/Anca calculado:</span>
                      <span className="text-lg font-bold text-violet-700">{calculateWaistHipRatio()}</span>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'cardio' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {CARDIO_FIELDS.map(f => (
                      <div key={f.key}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{f.label} ({f.unit})</label>
                        <input
                          type="number"
                          value={form[f.key] ?? ''}
                          onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className={IC}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-amber-50 rounded-lg text-sm text-amber-700">
                    <strong>Nota:</strong> A FC Máx (Tanaka) é calculada automaticamente com a fórmula: 208 - (0.7 × idade). Opcionalmente pode introduzir o valor manualmente.
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={saving || !form['assessment_date']} className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
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
