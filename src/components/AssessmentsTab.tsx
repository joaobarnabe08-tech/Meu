import { useState, useEffect } from 'react';
import { Plus, X, TrendingDown, Activity, Zap, Timer, Heart, Droplets, Gauge, Award, Ruler, HeartPulse, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { Database } from '../lib/database.types';
import { useAppMode } from '../App';

type PhysicalAssessment = Database['public']['Tables']['physical_assessments']['Row'];

const IC = "w-full px-3 py-2 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400";

const STATS = [
  { label: 'Peso', key: 'weight', unit: 'kg', icon: TrendingDown, color: 'text-gold-600', bg: 'bg-gold-50' },
  { label: 'IMC', key: 'imc', unit: '', icon: Gauge, color: 'text-viper-600', bg: 'bg-viper-100' },
  { label: 'Gordura Corporal', key: 'body_fat_percentage', unit: '%', icon: Droplets, color: 'text-rose-600', bg: 'bg-rose-50' },
  { label: 'Massa Muscular', key: 'muscle_mass', unit: 'kg', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Gordura Visceral', key: 'visceral_fat', unit: '', icon: Heart, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'TMB', key: 'basal_metabolic_rate', unit: 'kcal', icon: Zap, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Idade Metabólica', key: 'metabolic_age', unit: 'anos', icon: Timer, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { label: 'Pontuação', key: 'inbody_score', unit: 'pts', icon: Award, color: 'text-teal-600', bg: 'bg-teal-50' },
];

// All body data fields merged into one section, Minerais (kg) removed
const BODY_DATA_FIELDS = [
  // Dados Corporais
  { label: 'Peso (kg)', key: 'weight', group: 'Dados Corporais' },
  { label: 'Altura (cm)', key: 'height', group: 'Dados Corporais' },
  { label: 'IMC', key: 'imc', group: 'Dados Corporais' },
  // Composição Corporal
  { label: 'Gordura Corporal (%)', key: 'body_fat_percentage', group: 'Composição Corporal' },
  { label: 'Massa Gorda (kg)', key: 'fat_mass', group: 'Composição Corporal' },
  { label: 'Massa Livre de Gordura (kg)', key: 'fat_free_mass', group: 'Composição Corporal' },
  { label: 'Massa Muscular (kg)', key: 'muscle_mass', group: 'Composição Corporal' },
  { label: 'Taxa Muscular (%)', key: 'muscle_rate', group: 'Composição Corporal' },
  { label: 'Músculo Esquelético (kg)', key: 'skeletal_muscle_mass', group: 'Composição Corporal' },
  { label: 'Músculo Esquelético (%)', key: 'skeletal_muscle_percentage', group: 'Composição Corporal' },
  { label: 'Massa Óssea (kg)', key: 'bone_mass', group: 'Composição Corporal' },
  { label: 'Massa Proteíca (kg)', key: 'protein', group: 'Composição Corporal' },
  { label: 'Proteína (%)', key: 'protein_percentage', group: 'Composição Corporal' },
  { label: 'Água Corporal (kg)', key: 'body_water', group: 'Composição Corporal' },
  { label: 'Água Corporal (%)', key: 'body_water_percentage', group: 'Composição Corporal' },
  { label: 'Gordura Subcutânea (%)', key: 'subcutaneous_fat', group: 'Composição Corporal' },
  { label: 'Grau de Gordura Visceral', key: 'visceral_fat', group: 'Composição Corporal' },
  // Indicadores Metabólicos
  { label: 'TMB (kcal)', key: 'basal_metabolic_rate', group: 'Indicadores Metabólicos' },
  { label: 'Idade do Corpo', key: 'metabolic_age', group: 'Indicadores Metabólicos' },
  { label: 'SMI (kg/m²)', key: 'smi', group: 'Indicadores Metabólicos' },
  { label: 'WHR (Cintura/Anca)', key: 'waist_hip_ratio', group: 'Indicadores Metabólicos' },
  { label: 'Pontuação', key: 'inbody_score', group: 'Indicadores Metabólicos' },
  // Medidas Corporais
  { label: 'Ombros (cm)', key: 'shoulder_circumference', group: 'Medidas Corporais' },
  { label: 'Peito (cm)', key: 'chest_circumference', group: 'Medidas Corporais' },
  { label: 'Braço Direito (cm)', key: 'right_arm_circumference', group: 'Medidas Corporais' },
  { label: 'Braço Esquerdo (cm)', key: 'left_arm_circumference', group: 'Medidas Corporais' },
  { label: 'Cintura (cm)', key: 'waist_circumference', group: 'Medidas Corporais' },
  { label: 'Anca (cm)', key: 'hip_circumference', group: 'Medidas Corporais' },
  { label: 'Coxa Direita (cm)', key: 'right_thigh_circumference', group: 'Medidas Corporais' },
  { label: 'Coxa Esquerda (cm)', key: 'left_thigh_circumference', group: 'Medidas Corporais' },
  { label: 'Gémeo Direito (cm)', key: 'right_calf_circumference', group: 'Medidas Corporais' },
  { label: 'Gémeo Esquerdo (cm)', key: 'left_calf_circumference', group: 'Medidas Corporais' },
  // Cardiovascular
  { label: 'Pressão Sistólica (mmHg)', key: 'systolic_bp', group: 'Cardiovascular' },
  { label: 'Pressão Diastólica (mmHg)', key: 'diastolic_bp', group: 'Cardiovascular' },
  { label: 'FC Repouso (bpm)', key: 'resting_hr', group: 'Cardiovascular' },
  { label: 'FC Máx. Tanaka (bpm)', key: 'max_hr_tanaka', group: 'Cardiovascular' },
];

const ALL_FORM_KEYS = BODY_DATA_FIELDS.map(f => f.key);

// Group label styles
const GROUP_STYLES: Record<string, string> = {
  'Dados Corporais': 'bg-gold-50 border-gold-200 text-gold-800',
  'Composição Corporal': 'bg-blue-50 border-blue-200 text-blue-800',
  'Indicadores Metabólicos': 'bg-violet-50 border-violet-200 text-violet-800',
  'Medidas Corporais': 'bg-amber-50 border-amber-200 text-amber-800',
  'Cardiovascular': 'bg-rose-50 border-rose-200 text-rose-800',
};

// FITDAYS_GROUPS still used for display panel (without Minerais)
const FITDAYS_GROUPS = [
  {
    label: 'Dados Corporais',
    color: 'bg-gold-50 border-gold-200 text-gold-800',
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
      // Minerais (kg) removed as requested
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

function calcAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const dob = new Date(birthDate);
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}

function calcFCmaxTanaka(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  const age = calcAge(birthDate);
  if (age == null) return null;
  return Math.round(208 - 0.7 * age);
}

// Blood pressure classification per ESC guidelines
function bpClassification(systolic: number | null, diastolic: number | null): { label: string; color: string } | null {
  if (systolic == null && diastolic == null) return null;
  const sys = systolic ?? 0;
  const dia = diastolic ?? 0;
  if (sys < 120 && dia < 80) return { label: 'Ótima', color: 'text-gold-700 bg-gold-50 border-gold-200' };
  if (sys < 130 && dia < 85) return { label: 'Normal', color: 'text-gold-600 bg-gold-50 border-gold-200' };
  if (sys < 140 && dia < 90) return { label: 'Normal Alta', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  if (sys >= 180 || dia >= 110) return { label: 'Hipertensão Grau 3', color: 'text-red-700 bg-red-100 border-red-300' };
  if (sys >= 160 || dia >= 100) return { label: 'Hipertensão Grau 2', color: 'text-red-600 bg-red-50 border-red-200' };
  if (sys >= 140 || dia >= 90) return { label: 'Hipertensão Grau 1', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  if (sys < 90 || dia < 60) return { label: 'Baixa', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  return { label: 'Normal', color: 'text-gold-600 bg-gold-50 border-gold-200' };
}

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
    <div className="bg-gradient-to-b from-slate-50 to-white rounded-xl border border-viper-200 p-6">
      <h4 className="font-semibold text-viper-700 mb-4 flex items-center gap-2">
        <Ruler className="w-4 h-4" /> Mapa Corporal
      </h4>
      <div className="flex gap-4 items-stretch">
        <div className="flex flex-col justify-around gap-2 flex-1">
          {left.map(b => (
            <div key={b.key} className={`flex items-center gap-2 justify-end px-3 py-2 rounded-lg border text-right ${b.active ? 'bg-blue-50 border-blue-200' : 'bg-viper-50 border-viper-200'}`}>
              <div>
                <p className={`text-xs font-medium ${b.active ? 'text-blue-700' : 'text-viper-400'}`}>{b.label}</p>
                <p className={`text-sm font-bold ${b.active ? 'text-blue-900' : 'text-viper-300'}`}>{b.active ? `${b.value} cm` : '—'}</p>
              </div>
              <div className={`w-2 h-2 rounded-full shrink-0 ${b.active ? 'bg-blue-500' : 'bg-viper-200'}`} />
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center shrink-0 w-40">
          <svg viewBox="0 0 120 340" className="w-full max-h-72" fill="none">
            <ellipse cx="60" cy="20" rx="16" ry="18" fill="#cbd5e1" />
            <rect x="54" y="36" width="12" height="10" rx="3" fill="#cbd5e1" />
            <line x1="15" y1="52" x2="105" y2="52" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
            <path d="M30 46 Q20 48 18 58 L14 120 Q16 126 28 130 L92 130 Q104 126 106 120 L102 58 Q100 48 90 46 Z" fill="#e2e8f0" />
            <line x1="14" y1="72" x2="106" y2="72" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
            <line x1="14" y1="105" x2="106" y2="105" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
            <path d="M28 130 Q20 134 18 145 L22 175 L98 175 L102 145 Q100 134 92 130 Z" fill="#e2e8f0" />
            <line x1="18" y1="150" x2="102" y2="150" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" />
            <path d="M18 58 Q8 62 6 80 L8 118 Q10 124 18 122 L24 80 Z" fill="#cbd5e1" />
            <path d="M102 58 Q112 62 114 80 L112 118 Q110 124 102 122 L96 80 Z" fill="#cbd5e1" />
            <path d="M28 175 Q24 178 22 190 L22 280 Q22 288 30 290 L42 290 Q48 288 48 280 L44 190 Z" fill="#cbd5e1" />
            <path d="M72 190 L68 280 Q68 288 78 290 L90 290 Q98 288 98 280 L98 190 Q96 178 92 175 Z" fill="#cbd5e1" />
            <line x1="18" y1="255" x2="50" y2="255" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="70" y1="255" x2="104" y2="255" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="18" y1="210" x2="52" y2="210" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="68" y1="210" x2="104" y2="210" stroke="#64748b" strokeWidth="1" strokeDasharray="3 2" />
            <circle cx="60" cy="52" r="3" fill={val('shoulder_circumference') ? '#3b82f6' : '#94a3b8'} />
            <circle cx="60" cy="72" r="3" fill={val('chest_circumference') ? '#3b82f6' : '#94a3b8'} />
            <circle cx="60" cy="105" r="3" fill={val('waist_circumference') ? '#10b981' : '#94a3b8'} />
            <circle cx="60" cy="150" r="3" fill={val('hip_circumference') ? '#10b981' : '#94a3b8'} />
            <circle cx="12" cy="90" r="2.5" fill={val('left_arm_circumference') ? '#8b5cf6' : '#94a3b8'} />
            <circle cx="108" cy="90" r="2.5" fill={val('right_arm_circumference') ? '#8b5cf6' : '#94a3b8'} />
            <circle cx="35" cy="210" r="2.5" fill={val('left_thigh_circumference') ? '#f59e0b' : '#94a3b8'} />
            <circle cx="85" cy="210" r="2.5" fill={val('right_thigh_circumference') ? '#f59e0b' : '#94a3b8'} />
            <circle cx="34" cy="255" r="2.5" fill={val('left_calf_circumference') ? '#ef4444' : '#94a3b8'} />
            <circle cx="86" cy="255" r="2.5" fill={val('right_calf_circumference') ? '#ef4444' : '#94a3b8'} />
          </svg>
          <div className="w-full space-y-1 mt-2">
            {center.map(b => (
              <div key={b.key} className={`flex items-center justify-between px-2 py-1 rounded text-xs ${b.active ? 'bg-gold-50 text-gold-700' : 'text-viper-400'}`}>
                <span>{b.label}</span>
                <span className="font-bold">{b.active ? `${b.value}cm` : '—'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-around gap-2 flex-1">
          {right.map(b => (
            <div key={b.key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${b.active ? 'bg-blue-50 border-blue-200' : 'bg-viper-50 border-viper-200'}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${b.active ? 'bg-blue-500' : 'bg-viper-200'}`} />
              <div>
                <p className={`text-xs font-medium ${b.active ? 'text-blue-700' : 'text-viper-400'}`}>{b.label}</p>
                <p className={`text-sm font-bold ${b.active ? 'text-blue-900' : 'text-viper-300'}`}>{b.active ? `${b.value} cm` : '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={`mt-4 flex items-center justify-between px-4 py-3 rounded-xl border ${latest.waist_hip_ratio ? 'bg-violet-50 border-violet-200' : 'bg-viper-50 border-viper-200'}`}>
        <span className={`text-sm font-medium ${latest.waist_hip_ratio ? 'text-violet-700' : 'text-viper-400'}`}>Índice Cintura/Anca (WHR)</span>
        <span className={`text-2xl font-bold ${latest.waist_hip_ratio ? 'text-violet-700' : 'text-viper-300'}`}>
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
  clientBirthDate,
}: {
  assessments: PhysicalAssessment[];
  onAdd: (payload: Record<string, any>) => Promise<void>;
  clientId: string | undefined;
  clientBirthDate?: string | null;
}) {
  const { isTrainer } = useAppMode();
  const canEdit = isTrainer;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Auto-fill FCmax Tanaka when form opens
  useEffect(() => {
    if (showForm && clientBirthDate) {
      const fcmax = calcFCmaxTanaka(clientBirthDate);
      if (fcmax != null) {
        setForm(prev => ({ ...prev, max_hr_tanaka: String(fcmax) }));
      }
    }
  }, [showForm, clientBirthDate]);

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

  const fcmaxPreview = clientBirthDate ? calcFCmaxTanaka(clientBirthDate) : null;

  const historyRows = showAllHistory ? assessments : assessments.slice(-5);

  // Group BODY_DATA_FIELDS by group for the form
  const formGroups = Array.from(new Set(BODY_DATA_FIELDS.map(f => f.group))).map(g => ({
    label: g,
    fields: BODY_DATA_FIELDS.filter(f => f.group === g),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-viper-900">Avaliações Físicas</h2>
        {canEdit && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors shadow-sm"
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
              <div key={s.key} className="bg-white rounded-xl border border-viper-200 p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-xs text-viper-500 font-medium uppercase tracking-wide leading-none">{s.label}</p>
                <p className="text-xl font-bold text-viper-900 mt-1">
                  {val != null ? val : <span className="text-viper-300">—</span>}
                  {val != null && s.unit && <span className="text-sm font-normal text-viper-400 ml-0.5">{s.unit}</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Latest Fitdays composition breakdown */}
      {latest && (
        <div className="bg-white rounded-xl border border-viper-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-viper-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-viper-900">Composição Corporal — Última Avaliação</h3>
            <span className="ml-auto text-xs text-viper-400">{latest.assessment_date}</span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            {FITDAYS_GROUPS.map(group => (
              <div key={group.label}>
                <p className={`text-xs font-semibold uppercase tracking-wide px-2 py-1 rounded mb-2 border ${group.color}`}>{group.label}</p>
                <div className="space-y-1">
                  {group.fields.map(f => {
                    const v = (latest as any)[f.key];
                    return (
                      <div key={f.key} className="flex items-center justify-between py-1.5 border-b border-viper-50 last:border-0">
                        <span className="text-xs text-viper-500">{f.label}</span>
                        <span className={`text-sm font-semibold ${v != null ? 'text-viper-900' : 'text-viper-200'}`}>
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
          <h3 className="font-semibold text-viper-700">Evolução</h3>
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
                <Line type="monotone" dataKey="imc" name="IMC" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 4, fill: '#0ea5e9' }} />
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

      {/* Cardiovascular with BP classification */}
      {latest && (latest.systolic_bp || latest.diastolic_bp || latest.resting_hr || latest.max_hr_tanaka) && (
        <div className="bg-white rounded-xl border border-viper-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-viper-100 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <h3 className="font-semibold text-viper-900">Dados Cardiovasculares</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { key: 'systolic_bp', label: 'Pressão Sistólica', unit: 'mmHg', color: 'rose' },
                { key: 'diastolic_bp', label: 'Pressão Diastólica', unit: 'mmHg', color: 'blue' },
                { key: 'resting_hr', label: 'FC Repouso', unit: 'bpm', color: 'gold' },
                { key: 'max_hr_tanaka', label: 'FC Máx (Tanaka)', unit: 'bpm', color: 'amber' },
              ].map(c => {
                const v = (latest as any)[c.key];
                const colors: Record<string, string> = {
                  rose: 'bg-rose-50 text-rose-600 border-rose-200',
                  blue: 'bg-blue-50 text-blue-600 border-blue-200',
                  gold: 'bg-gold-50 text-gold-600 border-gold-200',
                  amber: 'bg-amber-50 text-amber-600 border-amber-200',
                };
                const boldColors: Record<string, string> = {
                  rose: 'text-rose-800', blue: 'text-blue-800', gold: 'text-gold-800', amber: 'text-amber-800',
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

            {/* BP Classification badge */}
            {(() => {
              const cls = bpClassification(latest.systolic_bp, latest.diastolic_bp);
              if (!cls) return null;
              return (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${cls.color}`}>
                  <HeartPulse className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-xs font-medium opacity-70">Classificação da Pressão Arterial</span>
                    <p className="font-bold text-sm">{cls.label}</p>
                  </div>
                  <div className="ml-auto text-xs font-medium opacity-70">
                    {latest.systolic_bp != null && latest.diastolic_bp != null
                      ? `${latest.systolic_bp}/${latest.diastolic_bp} mmHg`
                      : latest.systolic_bp != null
                      ? `PAS: ${latest.systolic_bp} mmHg`
                      : `PAD: ${latest.diastolic_bp} mmHg`}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* History table */}
      <div className="bg-white rounded-xl border border-viper-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-viper-100 flex items-center justify-between">
          <h3 className="font-semibold text-viper-900">Histórico de Avaliações</h3>
          {assessments.length > 5 && (
            <button onClick={() => setShowAllHistory(v => !v)} className="text-xs text-gold-600 hover:text-gold-700 flex items-center gap-1">
              {showAllHistory ? <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</> : <><ChevronDown className="w-3.5 h-3.5" /> Ver todas ({assessments.length})</>}
            </button>
          )}
        </div>
        {/* Desktop: table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-viper-50 text-viper-600">
              <tr>
                {['Data', 'Peso', 'IMC', 'Gordura', 'Muscular', 'Taxa Musc.', 'TMB', 'Idade Corp.', 'WHR', 'Pontuação'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...historyRows].reverse().map(a => (
                <tr key={a.id} className="hover:bg-viper-50">
                  <td className="px-4 py-3 font-medium text-viper-900 whitespace-nowrap">{a.assessment_date}</td>
                  <td className="px-4 py-3 text-viper-600">{a.weight != null ? `${a.weight} kg` : '—'}</td>
                  <td className="px-4 py-3 text-viper-600">{a.imc ?? '—'}</td>
                  <td className="px-4 py-3 text-viper-600">{a.body_fat_percentage != null ? `${a.body_fat_percentage}%` : '—'}</td>
                  <td className="px-4 py-3 text-viper-600">{a.muscle_mass != null ? `${a.muscle_mass} kg` : '—'}</td>
                  <td className="px-4 py-3 text-viper-600">{a.muscle_rate != null ? `${a.muscle_rate}%` : '—'}</td>
                  <td className="px-4 py-3 text-viper-600">{a.basal_metabolic_rate != null ? `${a.basal_metabolic_rate} kcal` : '—'}</td>
                  <td className="px-4 py-3 text-viper-600">{a.metabolic_age ?? '—'}</td>
                  <td className="px-4 py-3 text-viper-600">{a.waist_hip_ratio ?? '—'}</td>
                  <td className="px-4 py-3 font-semibold text-teal-700">{a.inbody_score ?? '—'}</td>
                </tr>
              ))}
              {assessments.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-viper-400">Nenhuma avaliação registada.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile: cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {[...historyRows].reverse().map(a => (
            <div key={a.id} className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-viper-900 text-sm">{a.assessment_date}</span>
                {a.inbody_score != null && <span className="text-xs font-semibold text-teal-700">{a.inbody_score} pts</span>}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-viper-400">Peso: </span><span className="text-viper-700 font-medium">{a.weight != null ? `${a.weight}kg` : '—'}</span></div>
                <div><span className="text-viper-400">IMC: </span><span className="text-viper-700 font-medium">{a.imc ?? '—'}</span></div>
                <div><span className="text-viper-400">Gordura: </span><span className="text-viper-700 font-medium">{a.body_fat_percentage != null ? `${a.body_fat_percentage}%` : '—'}</span></div>
                <div><span className="text-viper-400">Musc: </span><span className="text-viper-700 font-medium">{a.muscle_mass != null ? `${a.muscle_mass}kg` : '—'}</span></div>
                <div><span className="text-viper-400">TMB: </span><span className="text-viper-700 font-medium">{a.basal_metabolic_rate ?? '—'}</span></div>
                <div><span className="text-viper-400">WHR: </span><span className="text-viper-700 font-medium">{a.waist_hip_ratio ?? '—'}</span></div>
              </div>
            </div>
          ))}
          {assessments.length === 0 && (
            <div className="px-4 py-10 text-center text-viper-400">Nenhuma avaliação registada.</div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-viper-100 sticky top-0 bg-white rounded-t-xl z-10">
              <h2 className="font-bold text-lg text-viper-900">Nova Avaliação</h2>
              <button onClick={() => setShowForm(false)} className="text-viper-400 hover:text-viper-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              {/* Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-viper-700 mb-1">Data da Avaliação *</label>
                <input
                  required
                  type="date"
                  value={form['assessment_date'] ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, assessment_date: e.target.value }))}
                  className="w-full sm:w-56 px-3 py-2 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400"
                />
              </div>

              {/* All fields in one unified form, grouped by section */}
              <div className="space-y-8">
                {formGroups.map(group => (
                  <div key={group.label}>
                    <div className={`inline-block text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-lg border mb-4 ${GROUP_STYLES[group.label] ?? 'bg-viper-50 border-viper-200 text-viper-700'}`}>
                      {group.label}
                    </div>

                    {group.label === 'Cardiovascular' && fcmaxPreview != null && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                        <HeartPulse className="w-4 h-4 shrink-0" />
                        <span>FC Máx. Tanaka calculada automaticamente a partir da data de nascimento: <strong>{fcmaxPreview} bpm</strong></span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {group.fields.map(f => (
                        <div key={f.key}>
                          <label className="block text-xs font-medium text-viper-600 mb-1">{f.label}</label>
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

                    {group.label === 'Medidas Corporais' && whrPreview !== null && (
                      <div className="mt-3 flex items-center gap-3 p-3 bg-violet-50 rounded-xl border border-violet-200">
                        <span className="text-sm font-medium text-violet-700">Índice Cintura/Anca calculado:</span>
                        <span className="text-2xl font-bold text-violet-700">{whrPreview}</span>
                      </div>
                    )}

                    {group.label === 'Cardiovascular' && (form.systolic_bp || form.diastolic_bp) && (() => {
                      const sys = form.systolic_bp ? parseFloat(form.systolic_bp) : null;
                      const dia = form.diastolic_bp ? parseFloat(form.diastolic_bp) : null;
                      const cls = bpClassification(sys, dia);
                      if (!cls) return null;
                      return (
                        <div className={`mt-3 flex items-center gap-3 px-4 py-3 rounded-xl border ${cls.color}`}>
                          <HeartPulse className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-semibold">Classificação: {cls.label}</span>
                          {sys != null && dia != null && (
                            <span className="ml-auto text-xs font-medium opacity-70">{sys}/{dia} mmHg</span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-viper-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-viper-700 hover:bg-viper-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={saving || !form['assessment_date']} className="px-4 py-2 text-sm font-medium bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50">
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
    <div className="bg-white rounded-xl border border-viper-200 p-5 shadow-sm">
      <h3 className="font-semibold text-viper-900 mb-4 text-sm">{title}</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
