import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import ProfileTab from '../components/ProfileTab';
import AssessmentsTab from '../components/AssessmentsTab';
import WorkoutsTab from '../components/WorkoutsTab';
import NutritionTab from '../components/NutritionTab';

type Client = Database['public']['Tables']['clients']['Row'];
type Anamnese = Database['public']['Tables']['anamneses']['Row'];
type PhysicalAssessment = Database['public']['Tables']['physical_assessments']['Row'];
type Workout = Database['public']['Tables']['workouts']['Row'];
type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
type NutritionPlan = Database['public']['Tables']['nutrition_plans']['Row'];
type NutritionMeal = Database['public']['Tables']['nutrition_meals']['Row'];
type ExerciseLibItem = Database['public']['Tables']['exercises_library']['Row'];
type FoodLibItem = Database['public']['Tables']['foods_library']['Row'];

export type WorkoutWithExercises = Workout & { exercises: WorkoutExercise[] };
export type PlanWithMeals = NutritionPlan & { meals: NutritionMeal[] };

const TABS = [
  { key: 'profile', label: 'Perfil' },
  { key: 'assessments', label: 'Avaliações' },
  { key: 'workouts', label: 'Treinos' },
  { key: 'nutrition', label: 'Nutrição' },
] as const;

type Tab = typeof TABS[number]['key'];

export default function ClientDetail() {
  const { clienteId } = useParams<{ clienteId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('profile');
  const [client, setClient] = useState<Client | null>(null);
  const [anamnese, setAnamnese] = useState<Anamnese | null>(null);
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutWithExercises[]>([]);
  const [plans, setPlans] = useState<PlanWithMeals[]>([]);
  const [loading, setLoading] = useState(true);
  const [exercisesLibrary, setExercisesLibrary] = useState<ExerciseLibItem[]>([]);
  const [foodsLibrary, setFoodsLibrary] = useState<FoodLibItem[]>([]);

  useEffect(() => {
    if (!clienteId) return;
    load();
  }, [clienteId]);

  async function load() {
    if (!clienteId) return;
    setLoading(true);
    const [cr, ar, pr, wr, nr, exLib, foodLib] = await Promise.all([
      supabase.from('clients').select('*').eq('id', clienteId).single(),
      supabase.from('anamneses').select('*').eq('client_id', clienteId).maybeSingle(),
      supabase.from('physical_assessments').select('*').eq('client_id', clienteId).order('assessment_date', { ascending: true }),
      supabase.from('workouts').select('*, workout_exercises(*)').eq('client_id', clienteId).order('created_at', { ascending: true }),
      supabase.from('nutrition_plans').select('*, nutrition_meals(*)').eq('client_id', clienteId).order('created_at', { ascending: true }),
      supabase.from('exercises_library').select('*').order('name'),
      supabase.from('foods_library').select('*').order('name'),
    ]);
    setClient(cr.data ?? null);
    setAnamnese(ar.data ?? null);
    setAssessments(pr.data ?? []);
    setWorkouts(
      ((wr.data as any[]) ?? []).map(w => ({
        ...w,
        exercises: ((w.workout_exercises ?? []) as WorkoutExercise[]).sort((a, b) => a.order_index - b.order_index),
      }))
    );
    setPlans(
      ((nr.data as any[]) ?? []).map(n => ({
        ...n,
        meals: ((n.nutrition_meals ?? []) as NutritionMeal[]).sort((a, b) => a.order_index - b.order_index),
      }))
    );
    setExercisesLibrary(exLib.data ?? []);
    setFoodsLibrary(foodLib.data ?? []);
    setLoading(false);
  }

  async function saveAnamnese(updated: Anamnese) {
    const { data } = await supabase.from('anamneses').update({
      health_history: updated.health_history,
      goals: updated.goals,
      notes: updated.notes,
      parq_heart_condition: updated.parq_heart_condition,
      parq_chest_pain_activity: updated.parq_chest_pain_activity,
      parq_chest_pain_rest: updated.parq_chest_pain_rest,
      parq_dizziness: updated.parq_dizziness,
      parq_bone_joint: updated.parq_bone_joint,
      parq_medication: updated.parq_medication,
      parq_other_reason: updated.parq_other_reason,
      parq_notes: updated.parq_notes,
      updated_at: new Date().toISOString(),
    }).eq('id', updated.id).select().single();
    if (data) setAnamnese(data);
  }

  async function addAssessment(payload: Record<string, any>) {
    const { data } = await supabase.from('physical_assessments').insert(payload).select().single();
    if (data) setAssessments(prev => [...prev, data].sort((a, b) => new Date(a.assessment_date).getTime() - new Date(b.assessment_date).getTime()));
  }

  async function addWorkout(payload: { name: string; description: string }) {
    if (!clienteId) return;
    const id = 'wk_' + Math.random().toString(36).slice(2, 9).toUpperCase();
    const { data } = await supabase.from('workouts').insert({
      id,
      client_id: clienteId,
      name: payload.name,
      description: payload.description || null,
      is_active: true,
    }).select().single();
    if (data) setWorkouts(prev => [...prev, { ...data, exercises: [] }]);
  }

  async function addExercise(workoutId: string, payload: { exercise_name: string; sets: number; reps: string; rest_seconds: number | null; video_url: string | null; notes: string | null }) {
    const currentExercises = workouts.find(w => w.id === workoutId)?.exercises ?? [];
    const order_index = currentExercises.length + 1;
    const { data } = await supabase.from('workout_exercises').insert({
      workout_id: workoutId,
      exercise_name: payload.exercise_name,
      sets: payload.sets,
      reps: payload.reps,
      rest_seconds: payload.rest_seconds,
      video_url: payload.video_url,
      notes: payload.notes,
      order_index,
    }).select().single();
    if (data) {
      setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, exercises: [...w.exercises, data] } : w));
    }
  }

  async function deleteExercise(workoutId: string, exerciseId: string) {
    await supabase.from('workout_exercises').delete().eq('id', exerciseId);
    setWorkouts(prev => prev.map(w => w.id === workoutId ? { ...w, exercises: w.exercises.filter(e => e.id !== exerciseId) } : w));
  }

  async function deleteWorkout(workoutId: string) {
    await supabase.from('workouts').delete().eq('id', workoutId);
    setWorkouts(prev => prev.filter(w => w.id !== workoutId));
  }

  async function addPlan(payload: { name: string; daily_calories: number | null }) {
    if (!clienteId) return;
    const id = 'np_' + Math.random().toString(36).slice(2, 9).toUpperCase();
    const { data } = await supabase.from('nutrition_plans').insert({
      id,
      client_id: clienteId,
      name: payload.name,
      daily_calories: payload.daily_calories,
      is_active: true,
    }).select().single();
    if (data) setPlans(prev => [...prev, { ...data, meals: [] }]);
  }

  async function addMeal(planId: string, payload: { meal_name: string; time: string; foods: string; calories: number | null; proteins: number | null; carbs: number | null; fats: number | null }) {
    const order_index = (plans.find(p => p.id === planId)?.meals.length ?? 0) + 1;
    const { data } = await supabase.from('nutrition_meals').insert({
      nutrition_plan_id: planId,
      meal_name: payload.meal_name,
      time: payload.time,
      foods: payload.foods,
      calories: payload.calories,
      proteins: payload.proteins,
      carbs: payload.carbs,
      fats: payload.fats,
      order_index,
    }).select().single();
    if (data) {
      setPlans(prev => prev.map(p => p.id === planId ? { ...p, meals: [...p.meals, data] } : p));
    }
  }

  async function deleteMeal(planId: string, mealId: string) {
    await supabase.from('nutrition_meals').delete().eq('id', mealId);
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, meals: p.meals.filter(m => m.id !== mealId) } : p));
  }

  async function deletePlan(planId: string) {
    await supabase.from('nutrition_plans').delete().eq('id', planId);
    setPlans(prev => prev.filter(p => p.id !== planId));
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-20 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-12 bg-slate-200 rounded-xl animate-pulse" />
        <div className="h-96 bg-slate-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 font-medium">Cliente não encontrado</p>
        <button onClick={() => navigate('/clientes')} className="mt-4 inline-flex items-center gap-2 text-emerald-600 font-medium hover:text-emerald-700">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/clientes')} className="mt-1 p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xl shrink-0">
            {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
              {client.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{client.email}</span>}
              {client.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{client.phone}</span>}
              {client.birth_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{client.birth_date}</span>}
              {client.gender && <span className="flex items-center gap-1 capitalize"><User className="w-3.5 h-3.5" />{client.gender}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white rounded-xl border border-slate-200 p-1 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.key ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <ProfileTab client={client} anamnese={anamnese} onSaveAnamnese={saveAnamnese} />
      )}
      {tab === 'assessments' && (
        <AssessmentsTab assessments={assessments} onAdd={addAssessment} clientId={clienteId} />
      )}
      {tab === 'workouts' && (
        <WorkoutsTab
          workouts={workouts}
          onAddWorkout={addWorkout}
          onAddExercise={addExercise}
          onDeleteExercise={deleteExercise}
          onDeleteWorkout={deleteWorkout}
          exercisesLibrary={exercisesLibrary}
        />
      )}
      {tab === 'nutrition' && (
        <NutritionTab
          plans={plans}
          onAddPlan={addPlan}
          onAddMeal={addMeal}
          onDeleteMeal={deleteMeal}
          onDeletePlan={deletePlan}
          foodsLibrary={foodsLibrary}
        />
      )}
    </div>
  );
}
