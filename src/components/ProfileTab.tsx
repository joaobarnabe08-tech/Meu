import { useState } from 'react';
import { ClipboardList, HeartPulse, Target, Save, Mail, Phone, Calendar, User, ShieldCheck, AlertTriangle } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];
type Anamnese = Database['public']['Tables']['anamneses']['Row'];

const PARQ_QUESTIONS: { key: keyof Anamnese; label: string }[] = [
  { key: 'parq_heart_condition', label: 'Um médico disse-te alguma vez que tens uma condição cardíaca e que só deves realizar atividade física supervisionada por um médico?' },
  { key: 'parq_chest_pain_activity', label: 'Sentes dor no peito quando praticas atividade física?' },
  { key: 'parq_chest_pain_rest', label: 'No último mês, sentiste dor no peito quando não estavas a fazer exercício?' },
  { key: 'parq_dizziness', label: 'Já perdeste o equilíbrio devido a tonturas ou já perdeste os sentidos?' },
  { key: 'parq_bone_joint', label: 'Tens algum problema ósseo ou articular que possa ser agravado pela prática de atividade física?' },
  { key: 'parq_medication', label: 'Estás a tomar algum medicamento prescrito pelo médico para a pressão arterial ou condição cardíaca?' },
  { key: 'parq_other_reason', label: 'Tens conhecimento de alguma outra razão pela qual não deves praticar atividade física?' },
];

export default function ProfileTab({
  client,
  anamnese,
  onSaveAnamnese,
}: {
  client: Client;
  anamnese: Anamnese | null;
  onSaveAnamnese: (a: Anamnese) => Promise<void>;
}) {
  const [form, setForm] = useState<Anamnese | null>(anamnese);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (!form) return;
    setSaving(true);
    await onSaveAnamnese(form);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const parqPositiveCount = form
    ? PARQ_QUESTIONS.filter(q => form[q.key] === true).length
    : 0;

  const parqStatus = parqPositiveCount === 0
    ? { label: 'Apto', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: ShieldCheck, iconColor: 'text-emerald-600' }
    : { label: `${parqPositiveCount} resposta${parqPositiveCount > 1 ? 's' : ''} positiva${parqPositiveCount > 1 ? 's' : ''}`, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-600' };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* PAR-Q */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-slate-900">Questionário PAR-Q</h2>
            </div>
            {form && (
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${parqStatus.bg} ${parqStatus.border} ${parqStatus.color}`}>
                <parqStatus.icon className={`w-3.5 h-3.5 ${parqStatus.iconColor}`} />
                {parqStatus.label}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 mb-5 leading-relaxed">
            O PAR-Q (Physical Activity Readiness Questionnaire) avalia a prontidão para a prática de atividade física. Responde "Sim" se a afirmação se aplicar ao cliente.
          </p>

          <div className="space-y-3">
            {PARQ_QUESTIONS.map((q, i) => {
              const value = form ? (form[q.key] as boolean | null) ?? false : false;
              return (
                <div
                  key={q.key}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    value ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-sm text-slate-700 leading-relaxed">{q.label}</p>
                  <div className="flex items-center gap-3 shrink-0 mt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={q.key}
                        checked={value === true}
                        onChange={() => setForm(f => f ? { ...f, [q.key]: true } : null)}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Sim</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name={q.key}
                        checked={value === false}
                        onChange={() => setForm(f => f ? { ...f, [q.key]: false } : null)}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className="text-sm font-medium text-slate-700">Não</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {parqPositiveCount > 0 && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Observações sobre as respostas positivas
              </label>
              <textarea
                value={form?.parq_notes ?? ''}
                onChange={e => setForm(f => f ? { ...f, parq_notes: e.target.value } : null)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                placeholder="Detalhes sobre as condições identificadas..."
              />
            </div>
          )}
        </div>

        {/* Anamnese */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <ClipboardList className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900">Anamnese</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" /> Histórico de Saúde
              </label>
              <textarea
                value={form?.health_history ?? ''}
                onChange={e => setForm(f => f ? { ...f, health_history: e.target.value } : null)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                placeholder="Doenças, cirurgias, medicamentos, hábitos de vida..."
              />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-500" /> Objetivos
              </label>
              <textarea
                value={form?.goals ?? ''}
                onChange={e => setForm(f => f ? { ...f, goals: e.target.value } : null)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                placeholder="Objetivos do cliente a curto e longo prazo..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas do Personal Trainer</label>
              <textarea
                value={form?.notes ?? ''}
                onChange={e => setForm(f => f ? { ...f, notes: e.target.value } : null)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                placeholder="Preferências, observações, limitações..."
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || !form}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                  saved ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                <Save className="w-4 h-4" />
                {saving ? 'A guardar...' : saved ? 'Guardado!' : 'Guardar Anamnese'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">Dados Pessoais</h2>
          <div className="space-y-3">
            {[
              { label: 'ID', value: client.id },
              { label: 'Nome', value: client.name, icon: User },
              { label: 'Email', value: client.email, icon: Mail },
              { label: 'Telefone', value: client.phone, icon: Phone },
              { label: 'Nascimento', value: client.birth_date, icon: Calendar },
              { label: 'Género', value: client.gender, capitalize: true },
            ].map(({ label, value, capitalize }) => (
              <div key={label} className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide shrink-0">{label}</span>
                <span className={`text-sm font-medium text-slate-800 text-right ${capitalize ? 'capitalize' : ''}`}>
                  {value || <span className="text-slate-300">—</span>}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-3">Notas Gerais</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{client.notes || <span className="text-slate-400">Sem notas registadas.</span>}</p>
        </div>

        {form && (
          <div className={`rounded-xl border p-5 shadow-sm ${parqStatus.bg} ${parqStatus.border}`}>
            <div className="flex items-center gap-2 mb-2">
              <parqStatus.icon className={`w-4 h-4 ${parqStatus.iconColor}`} />
              <h2 className={`font-bold text-sm ${parqStatus.color}`}>Estado PAR-Q</h2>
            </div>
            <p className={`text-sm ${parqStatus.color}`}>
              {parqPositiveCount === 0
                ? 'Sem contraindicações identificadas para a prática de exercício.'
                : `${parqPositiveCount} contraindicação${parqPositiveCount > 1 ? 'ões' : ''} identificada${parqPositiveCount > 1 ? 's' : ''}. Recomenda-se avaliação médica prévia.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
