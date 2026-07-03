import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell, UtensilsCrossed, Ruler, Camera, Calendar, ClipboardList,
  Bell, LogOut, ChevronRight, TrendingUp, Activity, Clock, Play, X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import Logo from '../components/Logo';
import { BRANDING } from '../lib/branding';
import type { Database } from '../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];
type Workout = Database['public']['Tables']['workouts']['Row'];
type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
type NutritionPlan = Database['public']['Tables']['nutrition_plans']['Row'];
type NutritionMeal = Database['public']['Tables']['nutrition_meals']['Row'];
type PhysicalAssessment = Database['public']['Tables']['physical_assessments']['Row'];
type Anamnese = Database['public']['Tables']['anamneses']['Row'];

type Tab = 'treino' | 'nutricao' | 'medidas' | 'fotos' | 'calendario' | 'avaliacoes' | 'notificacoes';

export default function ClientArea() {
  const { clientProfile, user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('treino');
  const [client, setClient] = useState<Client | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Record<string, WorkoutExercise[]>>({});
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [meals, setMeals] = useState<Record<string, NutritionMeal[]>>({});
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([]);
  const [anamnese, setAnamnese] = useState<Anamnese | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [videoModal, setVideoModal] = useState<{ url: string; name: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login-cliente');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (clientProfile) loadData();
  }, [clientProfile]);

  async function loadData() {
    if (!clientProfile) return;
    setDataLoading(true);
    const clientId = clientProfile.id;

    const [c, w, p, a, an] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clientId).maybeSingle(),
      supabase.from('workouts').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('nutrition_plans').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      supabase.from('physical_assessments').select('*').eq('client_id', clientId).order('assessment_date', { ascending: true }),
      supabase.from('anamneses').select('*').eq('client_id', clientId).maybeSingle(),
    ]);

    setClient(c.data as Client | null);
    setWorkouts(w.data ?? []);
    setPlans(p.data ?? []);
    setAssessments(a.data ?? []);
    setAnamnese(an.data as Anamnese | null);

    // Load exercises for each workout
    const exResults: Record<string, WorkoutExercise[]> = {};
    for (const workout of w.data ?? []) {
      const { data: exData } = await supabase
        .from('workout_exercises')
        .select('*')
        .eq('workout_id', workout.id)
        .order('created_at', { ascending: true });
      exResults[workout.id] = exData ?? [];
    }
    setExercises(exResults);

    // Load meals for each plan
    const mealResults: Record<string, NutritionMeal[]> = {};
    for (const plan of p.data ?? []) {
      const { data: mealData } = await supabase
        .from('nutrition_meals')
        .select('*')
        .eq('nutrition_plan_id', plan.id)
        .order('time', { ascending: true });
      mealResults[plan.id] = mealData ?? [];
    }
    setMeals(mealResults);

    setDataLoading(false);
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-viper-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!clientProfile || !client) {
    return (
      <div className="min-h-screen bg-viper-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-viper-500 mb-4">A tua conta ainda não está associada a um perfil de cliente.</p>
          <button onClick={() => signOut()} className="text-gold-600 font-medium">Sair</button>
        </div>
      </div>
    );
  }

  const activePlan = plans.find(p => p.is_active) ?? plans[0];
  const latest = assessments.at(-1);
  const activeWorkouts = workouts.filter(w => w.is_active);

  const tabs: { id: Tab; label: string; icon: typeof Dumbbell }[] = [
    { id: 'treino', label: 'Treino', icon: Dumbbell },
    { id: 'nutricao', label: 'Nutrição', icon: UtensilsCrossed },
    { id: 'medidas', label: 'Medidas', icon: Ruler },
    { id: 'fotos', label: 'Fotos', icon: Camera },
    { id: 'calendario', label: 'Calendário', icon: Calendar },
    { id: 'avaliacoes', label: 'Avaliações', icon: ClipboardList },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
  ];

  return (
    <div className="min-h-screen bg-viper-50">
      {/* Header */}
      <header className="bg-viper-900 border-b border-viper-700 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-viper-200 hover:bg-viper-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-white border-b border-viper-200 sticky top-[57px] z-30">
        <div className="max-w-5xl mx-auto px-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    tab === t.id
                      ? 'border-gold-400 text-gold-600'
                      : 'border-transparent text-viper-400 hover:text-viper-600'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
        {tab === 'treino' && <WorkoutTab workouts={workouts} exercises={exercises} onPlay={setVideoModal} />}
        {tab === 'nutricao' && <NutritionTab plans={plans} meals={meals} activePlan={activePlan} />}
        {tab === 'medidas' && <MeasurementsTab assessments={assessments} latest={latest} />}
        {tab === 'fotos' && <PhotosTab clientId={clientProfile.id} />}
        {tab === 'calendario' && <CalendarTab workouts={activeWorkouts} />}
        {tab === 'avaliacoes' && <AssessmentsTab assessments={assessments} anamnese={anamnese} />}
        {tab === 'notificacoes' && <NotificationsTab />}
      </main>

      {videoModal && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setVideoModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-viper-100">
              <h3 className="font-bold text-viper-900">{videoModal.name}</h3>
              <button onClick={() => setVideoModal(null)} className="p-1.5 rounded-lg hover:bg-viper-100 text-viper-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <iframe src={`${videoModal.url}?autoplay=1&rel=0`} title={videoModal.name} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WorkoutTab({ workouts, exercises, onPlay }: { workouts: Workout[]; exercises: Record<string, WorkoutExercise[]>; onPlay: (v: { url: string; name: string }) => void }) {
  if (workouts.length === 0) return <EmptyState icon={Dumbbell} title="Sem treinos" subtitle="O teu treinador ainda não criou planos de treino." />;
  return (
    <div className="space-y-4">
      {workouts.map(w => (
        <div key={w.id} className="bg-white rounded-xl border border-viper-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-viper-100">
            <div className="w-10 h-10 rounded-lg bg-gold-100 flex items-center justify-center shrink-0">
              <Dumbbell className="w-5 h-5 text-gold-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-viper-900">{w.name}</h3>
              <p className="text-sm text-viper-500">{w.description || 'Sem descrição'}</p>
            </div>
            {w.is_active && <span className="px-2 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-medium">Ativo</span>}
          </div>
          <div className="divide-y divide-slate-100">
            {(exercises[w.id] ?? []).map((ex, i) => (
              <div key={ex.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-6 h-6 rounded-full bg-viper-100 flex items-center justify-center text-xs font-bold text-viper-500 shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-viper-900 text-sm">{ex.exercise_name}</p>
                  {ex.notes && <p className="text-xs text-viper-400 mt-0.5">{ex.notes}</p>}
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-viper-500">
                    <span>{ex.sets} séries</span>
                    <span>· {ex.reps} reps</span>
                    {ex.rest_seconds && <span>· {ex.rest_seconds}s descanso</span>}
                  </div>
                </div>
                {ex.video_url && (
                  <button onClick={() => onPlay({ url: ex.video_url!, name: ex.exercise_name })} className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gold-50 text-gold-700 text-xs font-medium hover:bg-gold-100 transition-colors">
                    <Play className="w-3 h-3" /> Ver
                  </button>
                )}
              </div>
            ))}
            {(exercises[w.id] ?? []).length === 0 && <p className="px-5 py-6 text-center text-sm text-viper-400">Sem exercícios neste treino.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function NutritionTab({ plans, meals, activePlan }: { plans: NutritionPlan[]; meals: Record<string, NutritionMeal[]>; activePlan?: NutritionPlan }) {
  if (plans.length === 0) return <EmptyState icon={UtensilsCrossed} title="Sem planos nutricionais" subtitle="O teu treinador ainda não criou planos alimentares." />;
  const planMeals = activePlan ? (meals[activePlan.id] ?? []) : [];
  const totalCal = planMeals.reduce((s, m) => s + (m.calories ?? 0), 0);
  const totalProt = planMeals.reduce((s, m) => s + (m.proteins ?? 0), 0);
  const totalCarbs = planMeals.reduce((s, m) => s + (m.carbs ?? 0), 0);
  const totalFats = planMeals.reduce((s, m) => s + (m.fats ?? 0), 0);

  return (
    <div className="space-y-4">
      {activePlan && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Calorias', value: `${totalCal}`, unit: 'kcal', color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Proteínas', value: `${totalProt}g`, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Carboidratos', value: `${totalCarbs}g`, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Gorduras', value: `${totalFats}g`, color: 'text-gold-600', bg: 'bg-gold-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-viper-200 p-4 shadow-sm">
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <Activity className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xs text-viper-500 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-xl font-bold text-viper-900 mt-1">{s.value}</p>
              {s.unit && <p className="text-xs text-viper-400">{s.unit}</p>}
            </div>
          ))}
        </div>
      )}

      {plans.map(plan => (
        <div key={plan.id} className="bg-white rounded-xl border border-viper-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-viper-100">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-viper-900">{plan.name}</h3>
              <p className="text-sm text-viper-500">{plan.daily_calories ? `${plan.daily_calories} kcal/dia` : 'Calorias não definidas'} · {(meals[plan.id] ?? []).length} refeições</p>
            </div>
            {plan.is_active && <span className="px-2 py-1 rounded-full bg-gold-100 text-gold-700 text-xs font-medium">Ativo</span>}
          </div>
          <div className="divide-y divide-slate-100">
            {(meals[plan.id] ?? []).map(meal => (
              <div key={meal.id} className="flex items-start gap-3 px-5 py-3">
                <div className="w-10 h-10 rounded-lg bg-white border border-viper-200 flex flex-col items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold text-viper-700 leading-none mt-0.5">{meal.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-viper-900 text-sm">{meal.meal_name}</h4>
                  <p className="text-sm text-viper-600 mt-0.5">{meal.foods}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {meal.calories != null && <span className="text-xs text-viper-500 bg-white px-2 py-1 rounded-md border border-viper-200">{meal.calories} kcal</span>}
                    {meal.proteins != null && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{meal.proteins}g prot.</span>}
                    {meal.carbs != null && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">{meal.carbs}g carbs</span>}
                    {meal.fats != null && <span className="text-xs text-gold-600 bg-gold-50 px-2 py-1 rounded-md border border-gold-100">{meal.fats}g gord.</span>}
                  </div>
                </div>
              </div>
            ))}
            {(meals[plan.id] ?? []).length === 0 && <p className="px-5 py-6 text-center text-sm text-viper-400">Sem refeições neste plano.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function MeasurementsTab({ assessments, latest }: { assessments: PhysicalAssessment[]; latest?: PhysicalAssessment }) {
  if (!latest) return <EmptyState icon={Ruler} title="Sem medidas" subtitle="Ainda não foram registadas avaliações corporais." />;
  const measures = [
    { label: 'Peso', value: latest.weight, unit: 'kg' },
    { label: 'Altura', value: latest.height, unit: 'cm' },
    { label: 'IMC', value: latest.imc, unit: '' },
    { label: 'Gordura Corporal', value: latest.body_fat_percentage, unit: '%' },
    { label: 'Massa Muscular', value: latest.muscle_mass, unit: 'kg' },
    { label: 'Gordura Visceral', value: latest.visceral_fat, unit: '' },
    { label: 'TMB', value: latest.basal_metabolic_rate, unit: 'kcal' },
    { label: 'Idade Metabólica', value: latest.metabolic_age, unit: 'anos' },
    { label: 'Cintura', value: latest.waist_circumference, unit: 'cm' },
    { label: 'Anca', value: latest.hip_circumference, unit: 'cm' },
    { label: 'Ombros', value: latest.shoulder_circumference, unit: 'cm' },
    { label: 'Peito', value: latest.chest_circumference, unit: 'cm' },
  ].filter(m => m.value != null);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-viper-200 p-5 shadow-sm">
        <h3 className="font-bold text-viper-900 mb-1">Medidas Corporais</h3>
        <p className="text-sm text-viper-500 mb-4">Última avaliação: {latest.assessment_date}</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {measures.map(m => (
            <div key={m.label} className="p-3 rounded-lg bg-viper-50 border border-viper-100">
              <p className="text-xs text-viper-500 font-medium">{m.label}</p>
              <p className="text-lg font-bold text-viper-900 mt-0.5">{m.value}{m.unit && <span className="text-sm font-normal text-viper-400 ml-1">{m.unit}</span>}</p>
            </div>
          ))}
        </div>
      </div>
      {assessments.length > 1 && (
        <div className="bg-white rounded-xl border border-viper-200 p-5 shadow-sm">
          <h3 className="font-bold text-viper-900 mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-gold-500" /> Evolução do Peso</h3>
          <div className="space-y-2">
            {[...assessments].reverse().map(a => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-viper-50 last:border-0">
                <span className="text-sm text-viper-500">{a.assessment_date}</span>
                <span className="font-semibold text-viper-900">{a.weight ? `${a.weight} kg` : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PhotosTab({ clientId }: { clientId: string }) {
  return (
    <div className="bg-white rounded-xl border border-viper-200 p-8 shadow-sm text-center">
      <Camera className="w-12 h-12 text-viper-200 mx-auto mb-3" />
      <p className="text-viper-500 font-medium">Fotografias de Progresso</p>
      <p className="text-sm text-viper-400 mt-1">As tuas fotografias de progresso aparecerão aqui.</p>
    </div>
  );
}

function CalendarTab({ workouts }: { workouts: Workout[] }) {
  if (workouts.length === 0) return <EmptyState icon={Calendar} title="Sem calendário" subtitle="Não há treinos ativos para mostrar no calendário." />;
  return (
    <div className="space-y-3">
      <h3 className="font-bold text-viper-900">Calendário de Treinos</h3>
      {workouts.map(w => (
        <div key={w.id} className="bg-white rounded-xl border border-viper-200 p-4 shadow-sm flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gold-100 flex items-center justify-center shrink-0">
            <Dumbbell className="w-5 h-5 text-gold-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-viper-900">{w.name}</h4>
            <p className="text-sm text-viper-500">{w.description || 'Sem descrição'}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-viper-300" />
        </div>
      ))}
    </div>
  );
}

function AssessmentsTab({ assessments, anamnese }: { assessments: PhysicalAssessment[]; anamnese: Anamnese | null }) {
  if (assessments.length === 0 && !anamnese) return <EmptyState icon={ClipboardList} title="Sem avaliações" subtitle="O teu histórico de avaliações aparecerá aqui." />;
  return (
    <div className="space-y-4">
      {assessments.length > 0 && (
        <div className="bg-white rounded-xl border border-viper-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-viper-100">
            <h3 className="font-semibold text-viper-900">Histórico de Avaliações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-viper-50 text-viper-600">
                <tr>
                  {['Data', 'Peso', 'IMC', 'Gordura', 'Muscular', 'TMB'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...assessments].reverse().map(a => (
                  <tr key={a.id} className="hover:bg-viper-50">
                    <td className="px-4 py-3 font-medium text-viper-900 whitespace-nowrap">{a.assessment_date}</td>
                    <td className="px-4 py-3 text-viper-600">{a.weight != null ? `${a.weight} kg` : '—'}</td>
                    <td className="px-4 py-3 text-viper-600">{a.imc ?? '—'}</td>
                    <td className="px-4 py-3 text-viper-600">{a.body_fat_percentage != null ? `${a.body_fat_percentage}%` : '—'}</td>
                    <td className="px-4 py-3 text-viper-600">{a.muscle_mass != null ? `${a.muscle_mass} kg` : '—'}</td>
                    <td className="px-4 py-3 text-viper-600">{a.basal_metabolic_rate != null ? `${a.basal_metabolic_rate} kcal` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {anamnese && (
        <div className="bg-white rounded-xl border border-viper-200 p-5 shadow-sm">
          <h3 className="font-bold text-viper-900 mb-3">Anamnese</h3>
          <div className="space-y-3 text-sm">
            {anamnese.goals && <div><p className="text-viper-500 font-medium">Objetivos</p><p className="text-viper-700 mt-0.5">{anamnese.goals}</p></div>}
            {anamnese.health_history && <div><p className="text-viper-500 font-medium">Histórico de Saúde</p><p className="text-viper-700 mt-0.5">{anamnese.health_history}</p></div>}
            {anamnese.notes && <div><p className="text-viper-500 font-medium">Notas</p><p className="text-viper-700 mt-0.5">{anamnese.notes}</p></div>}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsTab() {
  return (
    <div className="bg-white rounded-xl border border-viper-200 p-8 shadow-sm text-center">
      <Bell className="w-12 h-12 text-viper-200 mx-auto mb-3" />
      <p className="text-viper-500 font-medium">Sem notificações</p>
      <p className="text-sm text-viper-400 mt-1">As notificações do teu treinador aparecerão aqui.</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }: { icon: typeof Dumbbell; title: string; subtitle: string }) {
  return (
    <div className="text-center py-14 bg-white rounded-xl border border-viper-200">
      <Icon className="w-12 h-12 text-viper-200 mx-auto mb-3" />
      <p className="text-viper-500 font-medium">{title}</p>
      <p className="text-sm text-viper-400 mt-1">{subtitle}</p>
    </div>
  );
}
