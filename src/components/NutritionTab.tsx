import { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp, UtensilsCrossed, Flame, Beef, Wheat, Droplets, Trash2, Clock, Search, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { PlanWithMeals } from '../pages/ClientDetail';
import type { Database } from '../lib/database.types';

type FoodLibItem = Database['public']['Tables']['foods_library']['Row'];

const IC = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

type MealFoodEntry = {
  id: string;
  query: string;
  selectedFood: FoodLibItem | null;
  grams: string;
  calories: string;
  proteins: string;
  carbs: string;
  fats: string;
};

function newEntry(): MealFoodEntry {
  return { id: crypto.randomUUID(), query: '', selectedFood: null, grams: '100', calories: '', proteins: '', carbs: '', fats: '' };
}

function calcMacros(food: FoodLibItem, grams: number): Pick<MealFoodEntry, 'calories' | 'proteins' | 'carbs' | 'fats'> {
  const f = grams / 100;
  return {
    calories: food.calories_per_100g != null ? (food.calories_per_100g * f).toFixed(1) : '',
    proteins: food.proteins_per_100g != null ? (food.proteins_per_100g * f).toFixed(1) : '',
    carbs: food.carbs_per_100g != null ? (food.carbs_per_100g * f).toFixed(1) : '',
    fats: food.fats_per_100g != null ? (food.fats_per_100g * f).toFixed(1) : '',
  };
}

function FoodAutocomplete({
  entry,
  library,
  onChange,
}: {
  entry: MealFoodEntry;
  library: FoodLibItem[];
  onChange: (patch: Partial<MealFoodEntry>) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = entry.query.length >= 1
    ? library.filter(f => f.name.toLowerCase().includes(entry.query.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  function select(item: FoodLibItem) {
    const macros = calcMacros(item, parseFloat(entry.grams) || 100);
    onChange({ query: item.name, selectedFood: item, ...macros });
    setOpen(false);
  }

  function onGramsChange(val: string) {
    if (entry.selectedFood) {
      const macros = calcMacros(entry.selectedFood, parseFloat(val) || 0);
      onChange({ grams: val, ...macros });
    } else {
      onChange({ grams: val });
    }
  }

  return (
    <div className="grid grid-cols-[1fr_80px] gap-2 items-start">
      <div ref={ref} className="relative">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            value={entry.query}
            onChange={e => { onChange({ query: e.target.value, selectedFood: null }); setOpen(true); }}
            onFocus={() => setOpen(true)}
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            placeholder="Pesquisar alimento..."
          />
        </div>
        {open && filtered.length > 0 && (
          <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {filtered.map(item => (
              <button key={item.id} type="button" onMouseDown={() => select(item)}
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between gap-2 transition-colors border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-slate-900 truncate block">{item.name}</span>
                  {item.category && <span className="text-xs text-slate-400">{item.category}</span>}
                </div>
                <div className="shrink-0 text-xs text-slate-400 text-right space-y-0.5">
                  <div className="text-rose-500 font-semibold">{item.calories_per_100g} kcal</div>
                  <div>P:{item.proteins_per_100g}g C:{item.carbs_per_100g}g G:{item.fats_per_100g}g</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        <input
          type="number" min="1" value={entry.grams}
          onChange={e => onGramsChange(e.target.value)}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-center"
          placeholder="g"
        />
      </div>
    </div>
  );
}

type MealFormState = {
  meal_name: string;
  time: string;
  entries: MealFoodEntry[];
  extraCalories: string;
  extraProteins: string;
  extraCarbs: string;
  extraFats: string;
};

const EMPTY_FORM: MealFormState = {
  meal_name: '', time: '',
  entries: [newEntry()],
  extraCalories: '', extraProteins: '', extraCarbs: '', extraFats: '',
};

function sumEntries(entries: MealFoodEntry[]) {
  return entries.reduce((acc, e) => ({
    calories: acc.calories + (parseFloat(e.calories) || 0),
    proteins: acc.proteins + (parseFloat(e.proteins) || 0),
    carbs: acc.carbs + (parseFloat(e.carbs) || 0),
    fats: acc.fats + (parseFloat(e.fats) || 0),
  }), { calories: 0, proteins: 0, carbs: 0, fats: 0 });
}

export default function NutritionTab({
  plans,
  onAddPlan,
  onAddMeal,
  onDeleteMeal,
  onDeletePlan,
  foodsLibrary,
}: {
  plans: PlanWithMeals[];
  onAddPlan: (p: { name: string; daily_calories: number | null }) => Promise<void>;
  onAddMeal: (planId: string, p: { meal_name: string; time: string; foods: string; calories: number | null; proteins: number | null; carbs: number | null; fats: number | null }) => Promise<void>;
  onDeleteMeal: (planId: string, mealId: string) => Promise<void>;
  onDeletePlan: (planId: string) => Promise<void>;
  foodsLibrary: FoodLibItem[];
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ name: '', daily_calories: '' });
  const [savingPlan, setSavingPlan] = useState(false);
  const [addingMealTo, setAddingMealTo] = useState<string | null>(null);
  const [mealForm, setMealForm] = useState<MealFormState>(EMPTY_FORM);
  const [savingMeal, setSavingMeal] = useState(false);

  const activePlan = plans.find(p => p.is_active) ?? plans[0];
  const totalCalories = Math.round(activePlan?.meals.reduce((s, m) => s + (m.calories ?? 0), 0) ?? 0);
  const totalProtein = Math.round(activePlan?.meals.reduce((s, m) => s + (m.proteins ?? 0), 0) ?? 0);
  const totalCarbs = Math.round(activePlan?.meals.reduce((s, m) => s + (m.carbs ?? 0), 0) ?? 0);
  const totalFats = Math.round(activePlan?.meals.reduce((s, m) => s + (m.fats ?? 0), 0) ?? 0);

  const formTotals = sumEntries(mealForm.entries);

  function patchEntry(id: string, patch: Partial<MealFoodEntry>) {
    setMealForm(f => ({ ...f, entries: f.entries.map(e => e.id === id ? { ...e, ...patch } : e) }));
  }

  function addEntry() {
    setMealForm(f => ({ ...f, entries: [...f.entries, newEntry()] }));
  }

  function removeEntry(id: string) {
    setMealForm(f => ({ ...f, entries: f.entries.filter(e => e.id !== id) }));
  }

  async function handleAddPlan(e: React.FormEvent) {
    e.preventDefault();
    setSavingPlan(true);
    await onAddPlan({ name: planForm.name, daily_calories: planForm.daily_calories ? parseFloat(planForm.daily_calories) : null });
    setShowPlanForm(false);
    setPlanForm({ name: '', daily_calories: '' });
    setSavingPlan(false);
  }

  async function handleAddMeal(e: React.FormEvent, planId: string) {
    e.preventDefault();
    setSavingMeal(true);
    const totals = sumEntries(mealForm.entries);
    const foodNames = mealForm.entries.filter(e => e.query).map(e => `${e.query} (${e.grams}g)`).join(', ');
    await onAddMeal(planId, {
      meal_name: mealForm.meal_name,
      time: mealForm.time,
      foods: foodNames || '—',
      calories: totals.calories > 0 ? Math.round(totals.calories) : null,
      proteins: totals.proteins > 0 ? parseFloat(totals.proteins.toFixed(1)) : null,
      carbs: totals.carbs > 0 ? parseFloat(totals.carbs.toFixed(1)) : null,
      fats: totals.fats > 0 ? parseFloat(totals.fats.toFixed(1)) : null,
    });
    setMealForm(EMPTY_FORM);
    setAddingMealTo(null);
    setSavingMeal(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Planos Nutricionais</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/alimentos')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <BookOpen className="w-4 h-4" /> Base de Dados
          </button>
          <button
            onClick={() => setShowPlanForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Plano
          </button>
        </div>
      </div>

      {activePlan && plans.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Calorias', value: `${totalCalories}`, unit: 'kcal/dia', icon: Flame, color: 'text-rose-500', bg: 'bg-rose-50' },
            { label: 'Proteínas', value: `${totalProtein}g`, unit: `${totalCalories > 0 ? Math.round((totalProtein * 4 / totalCalories) * 100) : 0}%`, icon: Beef, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Carboidratos', value: `${totalCarbs}g`, unit: `${totalCalories > 0 ? Math.round((totalCarbs * 4 / totalCalories) * 100) : 0}%`, icon: Wheat, color: 'text-amber-500', bg: 'bg-amber-50' },
            { label: 'Gorduras', value: `${totalFats}g`, unit: `${totalCalories > 0 ? Math.round((totalFats * 9 / totalCalories) * 100) : 0}%`, icon: Droplets, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          ].map(s => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}><Icon className={`w-4 h-4 ${s.color}`} /></div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{s.value}</p>
                <p className="text-xs text-slate-400">{s.unit}</p>
              </div>
            );
          })}
        </div>
      )}

      <div className="space-y-4">
        {plans.map(plan => {
          const isOpen = expanded[plan.id] ?? true;
          const addingHere = addingMealTo === plan.id;
          return (
            <div key={plan.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => setExpanded(p => ({ ...p, [plan.id]: !isOpen }))}>
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <UtensilsCrossed className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{plan.name}</h3>
                    <p className="text-sm text-slate-500">{plan.daily_calories ? `${plan.daily_calories} kcal/dia` : 'Calorias não definidas'} · {plan.meals.length} refeições</p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  {plan.is_active && <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Ativo</span>}
                  <button onClick={() => { if (confirm('Eliminar este plano?')) onDeletePlan(plan.id); }} className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setExpanded(p => ({ ...p, [plan.id]: !isOpen }))}>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="px-5 pb-5 space-y-3">
                  {plan.meals.map(meal => (
                    <div key={meal.id} className="flex items-start gap-3 p-4 rounded-lg border border-slate-100 bg-slate-50/50 group">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-700 leading-none mt-0.5">{meal.time}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-900">{meal.meal_name}</h4>
                          <button onClick={() => onDeleteMeal(plan.id, meal.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5">{meal.foods}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {meal.calories != null && <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">{meal.calories} kcal</span>}
                          {meal.proteins != null && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">{meal.proteins}g prot.</span>}
                          {meal.carbs != null && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">{meal.carbs}g carbs</span>}
                          {meal.fats != null && <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">{meal.fats}g gord.</span>}
                        </div>
                      </div>
                    </div>
                  ))}

                  {addingHere ? (
                    <form onSubmit={e => handleAddMeal(e, plan.id)} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-4">
                      <h4 className="text-sm font-semibold text-slate-700">Adicionar Refeição</h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Nome da Refeição *</label>
                          <input required value={mealForm.meal_name} onChange={e => setMealForm(f => ({ ...f, meal_name: e.target.value }))} className={IC} placeholder="Ex: Pequeno-almoço" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Hora *</label>
                          <input required type="time" value={mealForm.time} onChange={e => setMealForm(f => ({ ...f, time: e.target.value }))} className={IC} />
                        </div>
                      </div>

                      {/* Alimentos */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-slate-600">Alimentos</label>
                          <div className="grid grid-cols-[1fr_80px] gap-2 w-1/2 sm:w-64 text-xs text-slate-400 pr-7">
                            <span>Nome</span>
                            <span className="text-center">Gramas</span>
                          </div>
                        </div>

                        {mealForm.entries.map((entry, i) => (
                          <div key={entry.id} className="flex items-start gap-2">
                            <span className="w-5 text-xs text-slate-400 pt-2.5 text-right shrink-0">{i + 1}.</span>
                            <div className="flex-1 min-w-0">
                              <FoodAutocomplete entry={entry} library={foodsLibrary} onChange={p => patchEntry(entry.id, p)} />
                              {entry.selectedFood && (parseFloat(entry.calories) > 0) && (
                                <div className="flex gap-3 mt-1 pl-1">
                                  <span className="text-xs text-rose-500 font-medium">{Math.round(parseFloat(entry.calories))} kcal</span>
                                  <span className="text-xs text-slate-400">P:{parseFloat(entry.proteins).toFixed(1)}g</span>
                                  <span className="text-xs text-slate-400">C:{parseFloat(entry.carbs).toFixed(1)}g</span>
                                  <span className="text-xs text-slate-400">G:{parseFloat(entry.fats).toFixed(1)}g</span>
                                </div>
                              )}
                            </div>
                            <button type="button" onClick={() => removeEntry(entry.id)} disabled={mealForm.entries.length === 1}
                              className="mt-2 w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors disabled:opacity-30 shrink-0">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}

                        <button type="button" onClick={addEntry}
                          className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors mt-1">
                          <Plus className="w-3.5 h-3.5" /> Adicionar alimento
                        </button>
                      </div>

                      {/* Totais calculados */}
                      {formTotals.calories > 0 && (
                        <div className="bg-white rounded-lg border border-slate-200 p-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Total da Refeição</p>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div>
                              <p className="text-base font-bold text-rose-500">{Math.round(formTotals.calories)}</p>
                              <p className="text-xs text-slate-400">kcal</p>
                            </div>
                            <div>
                              <p className="text-base font-bold text-blue-600">{formTotals.proteins.toFixed(1)}g</p>
                              <p className="text-xs text-slate-400">proteína</p>
                            </div>
                            <div>
                              <p className="text-base font-bold text-amber-600">{formTotals.carbs.toFixed(1)}g</p>
                              <p className="text-xs text-slate-400">carbs</p>
                            </div>
                            <div>
                              <p className="text-base font-bold text-emerald-600">{formTotals.fats.toFixed(1)}g</p>
                              <p className="text-xs text-slate-400">gordura</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => { setAddingMealTo(null); setMealForm(EMPTY_FORM); }} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-white rounded-lg border border-slate-200 transition-colors">Cancelar</button>
                        <button type="submit" disabled={savingMeal || !mealForm.meal_name.trim()} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                          {savingMeal ? 'A adicionar...' : 'Guardar Refeição'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setAddingMealTo(plan.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-amber-300 hover:text-amber-600 transition-colors">
                      <Plus className="w-4 h-4" /> Adicionar Refeição
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {plans.length === 0 && (
          <div className="text-center py-14 bg-white rounded-xl border border-slate-200">
            <UtensilsCrossed className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Sem planos nutricionais</p>
            <p className="text-sm text-slate-400 mt-1">Clique em "Novo Plano" para começar.</p>
          </div>
        )}
      </div>

      {showPlanForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-900">Novo Plano Nutricional</h2>
              <button onClick={() => setShowPlanForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddPlan} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Plano *</label>
                <input required value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} className={IC} placeholder="Ex: Plano Hipertrofia" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Calorias Diárias (kcal)</label>
                <input type="number" value={planForm.daily_calories} onChange={e => setPlanForm(f => ({ ...f, daily_calories: e.target.value }))} className={IC} placeholder="2000" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowPlanForm(false)} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={savingPlan} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {savingPlan ? 'A criar...' : 'Criar Plano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
