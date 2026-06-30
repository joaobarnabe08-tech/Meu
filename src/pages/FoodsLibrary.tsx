import { useEffect, useState } from 'react';
import { Plus, X, Pencil, Check, Search, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type FoodItem = Database['public']['Tables']['foods_library']['Row'];

const CATEGORIES = [
  'Proteína Animal', 'Laticínios', 'Cereais', 'Tubérculos', 'Fruta',
  'Vegetais', 'Gorduras', 'Leguminosas', 'Suplementos', 'Outro',
];

const IC = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";
const NUM_IC = "w-full px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

type EditState = {
  name: string;
  category: string;
  calories: string;
  proteins: string;
  carbs: string;
  fats: string;
};

const EMPTY_EDIT: EditState = { name: '', category: 'Outro', calories: '', proteins: '', carbs: '', fats: '' };

function toEdit(f: FoodItem): EditState {
  return {
    name: f.name,
    category: f.category ?? 'Outro',
    calories: f.calories_per_100g?.toString() ?? '',
    proteins: f.proteins_per_100g?.toString() ?? '',
    carbs: f.carbs_per_100g?.toString() ?? '',
    fats: f.fats_per_100g?.toString() ?? '',
  };
}

export default function FoodsLibrary() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>(EMPTY_EDIT);
  const [saving, setSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addState, setAddState] = useState<EditState>(EMPTY_EDIT);
  const [addSaving, setAddSaving] = useState(false);

  useEffect(() => { loadFoods(); }, []);

  async function loadFoods() {
    setLoading(true);
    const { data } = await supabase.from('foods_library').select('*').order('name');
    setFoods(data ?? []);
    setLoading(false);
  }

  const filtered = foods.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || f.category === filterCategory;
    return matchSearch && matchCat;
  });

  async function saveEdit(id: string) {
    setSaving(true);
    const { data } = await supabase.from('foods_library').update({
      name: editState.name,
      category: editState.category,
      calories_per_100g: editState.calories ? parseFloat(editState.calories) : null,
      proteins_per_100g: editState.proteins ? parseFloat(editState.proteins) : null,
      carbs_per_100g: editState.carbs ? parseFloat(editState.carbs) : null,
      fats_per_100g: editState.fats ? parseFloat(editState.fats) : null,
    }).eq('id', id).select().single();
    if (data) setFoods(prev => prev.map(f => f.id === id ? data : f));
    setEditingId(null);
    setSaving(false);
  }

  async function deleteFood(id: string) {
    if (!confirm('Eliminar este alimento da biblioteca?')) return;
    await supabase.from('foods_library').delete().eq('id', id);
    setFoods(prev => prev.filter(f => f.id !== id));
  }

  async function addFood(e: React.FormEvent) {
    e.preventDefault();
    if (!addState.name.trim()) return;
    setAddSaving(true);
    const { data } = await supabase.from('foods_library').insert({
      name: addState.name,
      category: addState.category,
      calories_per_100g: addState.calories ? parseFloat(addState.calories) : null,
      proteins_per_100g: addState.proteins ? parseFloat(addState.proteins) : null,
      carbs_per_100g: addState.carbs ? parseFloat(addState.carbs) : null,
      fats_per_100g: addState.fats ? parseFloat(addState.fats) : null,
    }).select().single();
    if (data) setFoods(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setAddState(EMPTY_EDIT);
    setShowAdd(false);
    setAddSaving(false);
  }

  const categories = [...new Set(foods.map(f => f.category).filter(Boolean))].sort() as string[];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Base de Dados de Alimentos</h1>
              <p className="text-sm text-slate-500">{foods.length} alimentos · valores nutricionais por 100g</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setAddState(EMPTY_EDIT); setShowAdd(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Adicionar Alimento
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" placeholder="Pesquisar alimento..." />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
          <option value="">Todas as categorias</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">A carregar...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600">Nome</th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Categoria</th>
                  <th className="text-center px-3 py-3 font-semibold text-slate-600">kcal</th>
                  <th className="text-center px-3 py-3 font-semibold text-blue-600">Prot.</th>
                  <th className="text-center px-3 py-3 font-semibold text-amber-600">Carbs</th>
                  <th className="text-center px-3 py-3 font-semibold text-emerald-600">Gord.</th>
                  <th className="w-20 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(food => {
                  const isEditing = editingId === food.id;
                  return (
                    <tr key={food.id} className={`hover:bg-slate-50 group transition-colors ${isEditing ? 'bg-emerald-50/50' : ''}`}>
                      {isEditing ? (
                        <>
                          <td className="px-4 py-2">
                            <input value={editState.name} onChange={e => setEditState(s => ({ ...s, name: e.target.value }))} className={IC} />
                          </td>
                          <td className="px-4 py-2 hidden sm:table-cell">
                            <select value={editState.category} onChange={e => setEditState(s => ({ ...s, category: e.target.value }))} className={IC}>
                              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2"><input type="number" step="0.1" value={editState.calories} onChange={e => setEditState(s => ({ ...s, calories: e.target.value }))} className={NUM_IC} /></td>
                          <td className="px-3 py-2"><input type="number" step="0.1" value={editState.proteins} onChange={e => setEditState(s => ({ ...s, proteins: e.target.value }))} className={NUM_IC} /></td>
                          <td className="px-3 py-2"><input type="number" step="0.1" value={editState.carbs} onChange={e => setEditState(s => ({ ...s, carbs: e.target.value }))} className={NUM_IC} /></td>
                          <td className="px-3 py-2"><input type="number" step="0.1" value={editState.fats} onChange={e => setEditState(s => ({ ...s, fats: e.target.value }))} className={NUM_IC} /></td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <button onClick={() => saveEdit(food.id)} disabled={saving} className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 hover:bg-emerald-200 transition-colors">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setEditingId(null)} className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium text-slate-900">{food.name}</td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            {food.category && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">{food.category}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center font-semibold text-rose-500">{food.calories_per_100g ?? '—'}</td>
                          <td className="px-3 py-3 text-center text-blue-600">{food.proteins_per_100g ?? '—'}g</td>
                          <td className="px-3 py-3 text-center text-amber-600">{food.carbs_per_100g ?? '—'}g</td>
                          <td className="px-3 py-3 text-center text-emerald-600">{food.fats_per_100g ?? '—'}g</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setEditingId(food.id); setEditState(toEdit(food)); }} className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => deleteFood(food.id)} className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">Nenhum alimento encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-900">Novo Alimento</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={addFood} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                  <input required value={addState.name} onChange={e => setAddState(s => ({ ...s, name: e.target.value }))} className={IC} placeholder="Ex: Frango (peito cozido)" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select value={addState.category} onChange={e => setAddState(s => ({ ...s, category: e.target.value }))} className={IC}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Valores por 100g</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Calorias</label>
                  <input type="number" step="0.1" value={addState.calories} onChange={e => setAddState(s => ({ ...s, calories: e.target.value }))} className={IC} placeholder="165" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Proteínas (g)</label>
                  <input type="number" step="0.1" value={addState.proteins} onChange={e => setAddState(s => ({ ...s, proteins: e.target.value }))} className={IC} placeholder="31" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Carboidratos (g)</label>
                  <input type="number" step="0.1" value={addState.carbs} onChange={e => setAddState(s => ({ ...s, carbs: e.target.value }))} className={IC} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Gorduras (g)</label>
                  <input type="number" step="0.1" value={addState.fats} onChange={e => setAddState(s => ({ ...s, fats: e.target.value }))} className={IC} placeholder="3.6" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={addSaving} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {addSaving ? 'A guardar...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
