import { useState } from 'react';
import { Plus, X, TrendingDown, Activity, Zap, Timer, Heart, Droplets, Gauge, Award, Ruler, HeartPulse, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Database } from '../lib/database.types';
import { useAppMode } from '../App';

type PhysicalAssessment = Database['public']['Tables']['physical_assessments']['Row'];

const IC = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

const STATS = [
  { label: 'Peso', key: 'weight', unit: 'kg', icon: TrendingDown, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'IMC', key: 'imc', unit: '', icon: Gauge, color: 'text-slate-600', bg: 'bg-slate-100' },
  { label: 'Gordura Corporal', key: 'body_fat_percentage', unit: '%', icon: Droplets, color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'Massa Muscular', key: 'muscle_mass', unit: 'kg', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Gordura Visceral', key: 'visceral_fat', unit: '', icon: Heart, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'TMB', key: 'basal_metabolic_rate', unit: 'kcal', icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Idade Metabólica', key: 'metabolic_age', unit: 'anos', icon: Timer, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { label: 'Pontuação', key: 'inbody_score', unit: 'pts', icon: Award, color: 'text-teal-600', bg: 'bg-teal-50' },
];

// Fitdays fields grouped by section matching their app exactly
const FITDAYS_GROUPS = [
  {
    label: 'Dados Corporais',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    fields: [
      { label: 'Peso (kg)', key: 'weight' },
      { label: 'Altura (cm)', key: 'height' },
      { label: 'IMC', key: 'imc' },
    ],
  },
  {
    label: 'Composição Corporal',
    color: 'bg-blue-50 border-blue-200 text-blue-800',
    fields: [
      { label: 'Gordura Corporal (%)', key: 'body_fat_percentage' },
      { label: 'Massa Gorda (kg)', key: 'fat_mass' },
      { label: 'Massa Livre de Gordura (kg)', key: 'fat_free_mass' },
      { label: 'Massa Muscular (kg)', key: 'muscle_mass' },
      { label: 'Taxa Muscular (%)', key: 'muscle_rate' },
      { label: 'Músculo Esquelético (kg)', key: 'skeletal_muscle_mass' },
      { label: 'Músculo Esquelético (%)', key: 'skeletal_muscle_percentage' },
      { label: 'Massa Óssea (kg)', key: 'bone_mass' },
      { label: 'Massa Proteíca (kg)', key: 'protein' },
      { label: 'Proteína (%)', key: 'protein_percentage' },
      { label: 'Água Corporal (kg)', key: 'body_water' },
      { label: 'Água Corporal (%)', key: 'body_water_percentage' },
      { label: 'Gordura Subcutânea (%)', key: 'subcutaneous_fat' },
      { label: 'Grau de Gordura Visceral', key: 'visceral_fat' },
      { label: 'Minerais (kg)', key: 'minerals' },
    ],
  },
  {
    label: 'Indicadores Metabólicos',
    color: 'bg-violet-50 border-violet-200 text-violet-800',
    fields: [
      { label: 'TMB (kcal)', key: 'basal_metabolic_rate' },
      { label: 'Idade do Corpo', key: 'metabolic_age' },
      { label: 'SMI (kg/m²)', key: 'smi' },
      { label: 'WHR (Cintura/Anca)', key: 'waist_hip_ratio' },
      { label: 'Pontuação', key: 'inbody_score' },
    ],
  },
];

const MEASUREMENT_FIELDS = [
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

const CARDIO_FIELDS = [
  { label: 'Pressão Sistólica (mmHg)', key: 'systolic_bp' },
  { label: 'Pressão Diastólica (mmHg)', key: 'diastolic_bp' },
  { label: 'FC Repouso (bpm)', key: 'resting_hr' },
  { label: 'FC Máx. Tanaka (bpm)', key: 'max_hr_tanaka' },
];

const ALL_FORM_KEYS = [
  ...FITDAYS_GROUPS.flatMap(g => g.fields.map(f => f.key)),
  ...MEASUREMENT_FIELDS.map(f => f.key),
  ...CARDIO_FIELDS.map(f => f.key),
];

function BodyDiagram({ latest }: { latest: PhysicalAssessment }) {
  const val = (key: string) => (latest as any)[key] as number | null;
  const badge = (key: string, label: string) => {
    const v = val(key);
    return { key, label, value: v, active: v != null };
  };

  const left = [
    badge('left_arm_circumference', 'Braço E'),
    badge('left_thigh_circumference', 'Coxa E'),
    badge('left_calf_circumference', 'Gémeo E'),
  ];
  const right = [
    badge('right_arm_circumference', 'Braço D'),
    badge('right_thigh_circumference', 'Coxa D'),
    badge('right_calf_circumference', 'Gémeo D'),
  ];
  const center = [
    badge('shoulder_circumference', 'Ombros'),
    badge('chest_circumference', 'Peito'),
    badge('waist_circumference', 'Cintura'),
    badge('hip_circumference', 'Anca'),
  ];

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white rounded-xl border border-slate-200 p-6">
      <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
        <Ruler className="w-4 h-4" /> Mapa Corporal
      </h4>
      <div className="flex gap-4 items-stretch">
        {/* Left column */}
        <div className="flex flex-col justify-around gap-2 flex-1">
          {left.map(b => (
            <div key={b.key} className={`flex items-center gap-2 justify-end px-3 py-2 rounded-lg border text-right ${b.active ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <p className={`text-xs font-medium ${b.active ? 'text-blue-700' : 'text-slate-400'}`}>{b.label}</p>
                <p className={`text-sm font-bold ${b.active ? 'text-blue-900' : 'text-slate-300'}`}>{b.active ? `${b.value} cm` : '—'}</p>
              </div>
              <div className={`w-2 h-2 rounded-full shrink-0 ${b.active ? 'bg-blue-500' : 'bg-slate-200'}`} />
            </div>
          ))}
        </div>

        {/* Center body SVG */}
        <div className="flex flex-col items-center shrink-0 w-40">
          <svg viewBox="0 0 120 340" className="w-full max-h-72" fill="none">
            {/* Head */}
            <ellipse cx="60" cy="20" rx="16" ry="18" fill="#cbd5e1" />
            {/* Neck */}
            <rect x="54" y="36" width="12" height="10" rx="3" fill="#cbd5e1" />
            {/* Shoulders line indicator */}
            <line x1="15" y1="52" x2="105" y2="52" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
            {/* Torso */}
            <path d="M30 46 Q20 48 18 58 L14 120 Q16 126 28 130 L92 130 Q104 126 106 120 L102 58 Q100 48 90 46 Z" fill="#e2e8f0" />
            {/* Chest line indicator */}
            <line x1="14" y1="72" x2="106" y2="72" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
            {/* Waist line indicator */}
            <line x1="14" y1="105" x2="106" y2="105" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
            {/* Hips */}
            <path d="M28 130 Q20 134 18 145 L22 175 L98 175 L102 145 Q100 134 92 130 Z" fill="#e2e8f0" />
            {/* Hip line indicator */}
            <line x1="18" y1="150" x2="102" y2="150" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
            {/* Left arm */}
            <path d="M18 58 Q8 62 6 80 L8 118 Q10 124 18 122 L24 80 Z" fill="#cbd5e1" />
            {/* Right arm */}
            <path d="M102 58 Q112 62 114 80 L112 118 Q110 124 102 122 L96 80 Z" fill="#cbd5e1" />
            {/* Left leg */}
            <path d="M28 175 Q24 178 22 190 L22 280 Q22 288 30 290 L42 290 Q48 288 48 280 L44 190 Z" fill="#cbd5e1" />
            {/* Right leg */}
            <path d="M72 190 L68 280 Q68 288 78 290 L90 290 Q98 288 98 280 L98 190 Q96 178 92 175 Z" fill="#cbd5e1" />
            {/* Left calf line indicator */}
            <line x1="18" y1="255" x2="50" y2="255" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
            {/* Right calf line indicator */}
            <line x1="70" y1="255" x2="104" y2="255" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
            {/* Left thigh line indicator */}
            <line x1="18" y1="210" x2="52" y2="210" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
            {/* Right thigh line indicator */}
            <line x1="68" y1="210" x2="104" y2="210" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />

            {/* Shoulder dots */}
            <circle cx="60" cy="52" r="3" fill={val('shoulder_circumference') ? '#3b82f6' : '#94a3b8'} />
            {/* Chest dots */}
            <circle cx="60" cy="72" r="3" fill={val('chest_circumference') ? '#3b82f6' : '#94a3b8'} />
            {/* Waist dot */}
            <circle cx="60" cy="105" r="3" fill={val('waist_circumference') ? '#10b981' : '#94a3b8'} />
            {/* Hip dot */}
            <circle cx="60" cy="150" r="3" fill={val('hip_circumference') ? '#10b981' : '#94a3b8'} />
            {/* Arm dots */}
            <circle cx="12" cy="90" r="2.5" fill={val('left_arm_circumference') ? '#8b5cf6' : '#94a3b8'} />
            <circle cx="108" cy="90" r="2.5" fill={val('right_arm_circumference') ? '#8b5cf6' : '#94a3b8'} />
            {/* Thigh dots */}
            <circle cx="35" cy="210" r="2.5" fill={val('left_thigh_circumference') ? '#f59e0b' : '#94a3b8'} />
            <circle cx="85" cy="210" r="2.5" fill={val('right_thigh_circumference') ? '#f59e0b' : '#94a3b8'} />
            {/* Calf dots */}
            <circle cx="34" cy="255" r="2.5" fill={val('left_calf_circumference') ? '#ef4444' : '#94a3b8'} />
            <circle cx="86" cy="255" r="2.5" fill={val('right_calf_circumference') ? '#ef4444' : '#94a3b8'} />
          </svg>

          {/* Center labels (shoulders, chest, waist, hip) */}
          <div className="w-full space-y-1 mt-2">
            {center.map(b => (
              <div key={b.key} className={`flex items-center justify-between px-2 py-1 rounded text-xs ${b.active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'}`}>
                <span>{b.label}</span>
                <span className="font-bold">{b.active ? `${b.value}cm` : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col justify-around gap-2 flex-1">
          {right.map(b => (
            <div key={b.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${b.active ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${b.active ? 'bg-blue-500' : 'bg-slate-200'}`} />
              <div>
                <p className={`text-xs font-medium ${b.active ? 'text-blue-700' : 'text-slate-400'}`}>{b.label}</p>
                <p className={`text-sm font-bold ${b.active ? 'text-blue-900' : 'text-slate-300'}`}>{b.active ? `${b.value} cm` : '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waist-Hip Ratio */}
      <div className={`mt-4 flex items-center justify-between px-4 py-3 rounded-xl border ${latest.waist_hip_ratio ? 'bg-violet-50 border-violet-200' : 'bg-slate-50 border-slate-200'}`}>
        <span className={`text-sm font-medium ${latest.waist_hip_ratio ? 'text-violet-700' : 'text-slate-400'}`}>Índice Cintura/Anca (WHR)</span>
        <span className={`text-2xl font-bold ${latest.waist_hip_ratio ? 'text-violet-700' : 'text-slate-300'}`}>
          {latest.waist_hip_ratio ?? '—'}
        </span>
      </div>
    </div>
  );
}

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
  const [showAllHistory, setShowAllHistory] = useState(false);

  const chartData = assessments.map(a => ({
    date: new Date(a.assessment_date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
    weight: a.weight,
    bodyFat: a.body_fat_percentage,
    muscleMass: a.muscle_mass,
    muscleRate: a.muscle_rate,
    imc: a.imc,
    visceralFat: a.visceral_fat,
    bmr: a.basal_metabolic_rate,
    metabolicAge: a.metabolic_age,
    score: a.inbody_score,
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

    ALL_FORM_KEYS.forEach(key => {
      const v = form[key];
      if (!v) payload[key] = null;
      else payload[key] = parseFloat(v);
    });
    if (form.assessment_date) payload.assessment_date = form.assessment_date;

    // Auto-calculate waist/hip ratio
    const waist = payload.waist_circumference;
    const hip = payload.hip_circumference;
    if (waist && hip && hip > 0) {
      payload.waist_hip_ratio = Math.round((waist / hip) * 100) / 100;
    }

    await onAdd(payload);
    setShowForm(false);
    setForm({});
    setSaving(false);
  }

  const whrPreview = (() => {
    const w = form.waist_circumference ? parseFloat(form.waist_circumference) : null;
    const h = form.hip_circumference ? parseFloat(form.hip_circumference) : null;
    return w && h && h > 0 ? Math.round((w / h) * 100) / 100 : null;
  })();

  const historyRows = showAllHistory ? assessments : assessments.slice(-5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Avaliações Físicas</h2>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nova Avaliação
          </button>
        )}
      </div>

      {!isTrainer && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
          <Eye className="w-4 h-4" />
          Modo de visualização — as alterações estão desativadas
        </div>
      )}

      {/* Latest stats cards */}
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

      {/* Latest Fitdays composition breakdown */}
      {latest && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-slate-900">Composição Corporal — Última Avaliação</h3>
            <span className="ml-auto text-xs text-slate-400">{latest.assessment_date}</span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {FITDAYS_GROUPS.map(group => (
              <div key={group.label}>
                <p className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded mb-2 border ${group.color}`}>{group.label}</p>
                <div className="space-y-1">
                  {group.fields.map(f => {
                    const v = (latest as any)[f.key];
                    return (
                      <div key={f.key} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <span className="text-xs text-slate-500">{f.label}</span>
                        <span className={`text-sm font-semibold ${v != null ? 'text-slate-900' : 'text-slate-200'}`}>
                          {v != null ? v : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evolution Charts */}
      {chartData.length > 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-700">Evolução</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Peso (kg)">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
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

            <ChartCard title="Gordura Corporal (%) vs Massa Muscular (kg)">
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
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="imc" name="IMC" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#6366f1' }} />
                <Line type="monotone" dataKey="visceralFat" name="Gordura Visceral" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
              </LineChart>
            </ChartCard>

            <ChartCard title="TMB (kcal) e Idade Metabólica">
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

            <ChartCard title="Índice Cintura/Anca (WHR)">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="whrg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0.6, 1.1]} />
                <Tooltip />
                <Area type="monotone" dataKey="waistHip" name="WHR" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#whrg)" dot={{ r: 4, fill: '#8b5cf6' }} />
              </AreaChart>
            </ChartCard>

            <ChartCard title="Pressão Arterial e FC Repouso">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="systolic" name="Sistólica (mmHg)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} />
                <Line type="monotone" dataKey="diastolic" name="Diastólica (mmHg)" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} />
                <Line type="monotone" dataKey="restingHr" name="FC Repouso (bpm)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} />
              </LineChart>
            </ChartCard>
          </div>
        </div>
      )}

      {chartData.length <= 1 && assessments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          Adicione pelo menos 2 avaliações para visualizar os gráficos de evolução.
        </div>
      )}

      {/* Body measurements diagram */}
      {latest && <BodyDiagram latest={latest} />}

      {/* Cardiovascular */}
      {latest && (latest.systolic_bp || latest.diastolic_bp || latest.resting_hr || latest.max_hr_tanaka) && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <h3 className="font-semibold text-slate-900">Dados Cardiovasculares</h3>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: 'systolic_bp', label: 'Pressão Sistólica', unit: 'mmHg', color: 'rose' },
              { key: 'diastolic_bp', label: 'Pressão Diastólica', unit: 'mmHg', color: 'blue' },
              { key: 'resting_hr', label: 'FC Repouso', unit: 'bpm', color: 'emerald' },
              { key: 'max_hr_tanaka', label: 'FC Máx (Tanaka)', unit: 'bpm', color: 'amber' },
            ].map(c => {
              const v = (latest as any)[c.key];
              const colors: Record<string, string> = {
                rose: 'bg-rose-50 text-rose-600 border-rose-200',
                blue: 'bg-blue-50 text-blue-600 border-blue-200',
                emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                amber: 'bg-amber-50 text-amber-600 border-amber-200',
              };
              const boldColors: Record<string, string> = {
                rose: 'text-rose-800', blue: 'text-blue-800', emerald: 'text-emerald-800', amber: 'text-amber-800',
              };
              return (
                <div key={c.key} className={`text-center p-3 rounded-xl border ${colors[c.color]}`}>
                  <p className="text-xs font-medium mb-1 leading-tight">{c.label}</p>
                  <p className={`text-2xl font-bold ${boldColors[c.color]}`}>{v ?? '—'}</p>
                  <p className="text-xs mt-0.5 font-medium">{c.unit}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Histórico de Avaliações</h3>
          {assessments.length > 5 && (
            <button onClick={() => setShowAllHistory(v => !v)} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              {showAllHistory ? <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</> : <><ChevronDown className="w-3.5 h-3.5" /> Ver todas ({assessments.length})</>}
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {['Data', 'Peso', 'IMC', 'Gordura', 'Muscular', 'Taxa Musc.', 'TMB', 'Idade Corp.', 'WHR', 'Pontuação'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...historyRows].reverse().map(a => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{a.assessment_date}</td>
                  <td className="px-4 py-3 text-slate-600">{a.weight != null ? `${a.weight} kg` : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.imc ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.body_fat_percentage != null ? `${a.body_fat_percentage}%` : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.muscle_mass != null ? `${a.muscle_mass} kg` : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.muscle_rate != null ? `${a.muscle_rate}%` : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.basal_metabolic_rate != null ? `${a.basal_metabolic_rate} kcal` : '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.metabolic_age ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{a.waist_hip_ratio ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-teal-700">{a.inbody_score ?? '—'}</td>
                </tr>
              ))}
              {assessments.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-slate-400">Nenhuma avaliação registada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="font-bold text-lg text-slate-900">Nova Avaliação</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {/* Date */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-slate-700 mb-1">Data da Avaliação *</label>
                <input
                  required
                  type="date"
                  value={form['assessment_date'] ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, assessment_date: e.target.value }))}
                  className="w-full sm:w-56 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Section Tabs */}
              <div className="flex gap-2 mb-6 flex-wrap">
                {[
                  { key: 'fitdays', label: 'Composição Corporal' },
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

              {activeSection === 'fitdays' && (
                <div className="space-y-6">
                  {FITDAYS_GROUPS.map(group => (
                    <div key={group.label}>
                      <p className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded mb-3 border inline-block ${group.color}`}>{group.label}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {group.fields.map(f => (
                          <div key={f.key}>
                            <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
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
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'measurements' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {MEASUREMENT_FIELDS.map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
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
                  {whrPreview !== null && (
                    <div className="flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-200">
                      <span className="text-sm font-medium text-violet-700">Índice Cintura/Anca calculado:</span>
                      <span className="text-2xl font-bold text-violet-700">{whrPreview}</span>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'cardio' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {CARDIO_FIELDS.map(f => (
                      <div key={f.key}>
                        <label className="block text-xs font-medium text-slate-600 mb-1">{f.label}</label>
                        <input
                          type="number"
                          step="1"
                          value={form[f.key] ?? ''}
                          onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className={IC}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-sm text-amber-700">
                    <strong>Fórmula Tanaka:</strong> FC Máx = 208 − (0,7 × idade). Introduza o valor calculado ou medido diretamente.
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
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
      <h3 className="font-semibold text-slate-900 mb-4 text-sm">{title}</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
