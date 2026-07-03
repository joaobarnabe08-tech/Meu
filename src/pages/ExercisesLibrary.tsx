import { useEffect, useState } from 'react';
import { Plus, X, Pencil, Check, Search, Trash2, Dumbbell, Play, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type ExerciseItem = Database['public']['Tables']['exercises_library']['Row'];

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Antebraço',
  'Core', 'Quadríceps', 'Posterior Coxa', 'Glúteos', 'Gémeos',
  'Full Body', 'Cardio', 'Outro',
];

const IC = "w-full px-3 py-2 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400";

type EditState = {
  name: string;
  muscle_group: string;
  video_url: string;
  description: string;
};

const EMPTY_EDIT: EditState = { name: '', muscle_group: 'Outro', video_url: '', description: '' };

function toEdit(e: ExerciseItem): EditState {
  return {
    name: e.name,
    muscle_group: e.muscle_group ?? 'Outro',
    video_url: e.video_url ?? '',
    description: e.description ?? '',
  };
}

function VideoPreview({ url }: { url: string }) {
  if (!url) return null;
  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
  const embedUrl = isYoutube
    ? url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
    : url;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-medium hover:bg-rose-100 transition-colors"
    >
      <Play className="w-3 h-3" /> Ver vídeo
    </a>
  );
}

export default function ExercisesLibrary() {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMuscle, setFilterMuscle] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>(EMPTY_EDIT);
  const [saving, setSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addState, setAddState] = useState<EditState>(EMPTY_EDIT);
  const [addSaving, setAddSaving] = useState(false);

  useEffect(() => { loadExercises(); }, []);

  async function loadExercises() {
    setLoading(true);
    const { data } = await supabase.from('exercises_library').select('*').order('name');
    setExercises(data ?? []);
    setLoading(false);
  }

  const filtered = exercises.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchMuscle = !filterMuscle || e.muscle_group === filterMuscle;
    return matchSearch && matchMuscle;
  });

  async function saveEdit(id: string) {
    setSaving(true);
    const { data } = await supabase.from('exercises_library').update({
      name: editState.name,
      muscle_group: editState.muscle_group,
      video_url: editState.video_url || null,
      description: editState.description || null,
    }).eq('id', id).select().single();
    if (data) setExercises(prev => prev.map(e => e.id === id ? data : e));
    setEditingId(null);
    setSaving(false);
  }

  async function deleteExercise(id: string) {
    if (!confirm('Eliminar este exercício da biblioteca?')) return;
    await supabase.from('exercises_library').delete().eq('id', id);
    setExercises(prev => prev.filter(e => e.id !== id));
  }

  async function addExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!addState.name.trim()) return;
    setAddSaving(true);
    const { data } = await supabase.from('exercises_library').insert({
      name: addState.name,
      muscle_group: addState.muscle_group,
      video_url: addState.video_url || null,
      description: addState.description || null,
    }).select().single();
    if (data) setExercises(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setAddState(EMPTY_EDIT);
    setShowAdd(false);
    setAddSaving(false);
  }

  const muscleGroups = [...new Set(exercises.map(e => e.muscle_group).filter(Boolean))].sort() as string[];

  const groupByMuscle = filtered.reduce((acc, ex) => {
    const group = ex.muscle_group || 'Outro';
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {} as Record<string, ExerciseItem[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-100 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-viper-900">Base de Dados de Exercícios</h1>
              <p className="text-sm text-viper-500">{exercises.length} exercícios · com vídeos demonstrativos</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => { setAddState(EMPTY_EDIT); setShowAdd(true); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gold-500 text-white rounded-lg text-sm font-medium hover:bg-gold-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Adicionar Exercício
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-viper-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-3 py-2.5 border border-viper-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400" placeholder="Pesquisar exercício..." />
        </div>
        <select value={filterMuscle} onChange={e => setFilterMuscle(e.target.value)} className="px-3 py-2.5 border border-viper-200 rounded-xl text-sm bg-white text-viper-700 focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400">
          <option value="">Todos os grupos</option>
          {muscleGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {/* List by muscle group */}
      {loading ? (
        <div className="p-8 text-center text-viper-400 text-sm">A carregar...</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupByMuscle).map(([group, exs]) => (
            <div key={group} className="bg-white rounded-xl border border-viper-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 bg-viper-50 border-b border-viper-100">
                <h3 className="font-semibold text-viper-700">{group}</h3>
                <p className="text-xs text-viper-400">{exs.length} exercício{exs.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="divide-y divide-slate-100">
                {exs.map(ex => {
                  const isEditing = editingId === ex.id;
                  return (
                    <div key={ex.id} className={`px-5 py-3 hover:bg-viper-50 group transition-colors ${isEditing ? 'bg-gold-50/50' : ''}`}>
                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-viper-600 mb-1">Nome</label>
                            <input value={editState.name} onChange={e => setEditState(s => ({ ...s, name: e.target.value }))} className={IC} />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-viper-600 mb-1">Grupo Muscular</label>
                            <select value={editState.muscle_group} onChange={e => setEditState(s => ({ ...s, muscle_group: e.target.value }))} className={IC}>
                              {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-viper-600 mb-1">URL do Vídeo</label>
                            <input value={editState.video_url} onChange={e => setEditState(s => ({ ...s, video_url: e.target.value }))} className={IC} placeholder="https://youtube.com/..." />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-viper-600 mb-1">Descrição</label>
                            <input value={editState.description} onChange={e => setEditState(s => ({ ...s, description: e.target.value }))} className={IC} placeholder="Instruções..." />
                          </div>
                          <div className="sm:col-span-2 lg:col-span-4 flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm text-viper-600 hover:bg-white rounded-lg border border-viper-200 transition-colors">Cancelar</button>
                            <button onClick={() => saveEdit(ex.id)} disabled={saving || !editState.name.trim()} className="px-3 py-1.5 text-sm bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50">
                              {saving ? 'A guardar...' : 'Guardar'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-viper-900">{ex.name}</span>
                              {ex.video_url && <VideoPreview url={ex.video_url} />}
                            </div>
                            {ex.description && (
                              <p className="text-sm text-viper-500 mt-0.5 truncate">{ex.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(ex.id); setEditState(toEdit(ex)); }} className="w-8 h-8 rounded-lg hover:bg-blue-50 flex items-center justify-center text-viper-400 hover:text-blue-600 transition-colors">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteExercise(ex.id)} className="w-8 h-8 rounded-lg hover:bg-rose-50 flex items-center justify-center text-viper-400 hover:text-rose-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {Object.keys(groupByMuscle).length === 0 && (
            <div className="text-center py-14 bg-white rounded-xl border border-viper-200">
              <Dumbbell className="w-12 h-12 text-viper-200 mx-auto mb-3" />
              <p className="text-viper-500 font-medium">Nenhum exercício encontrado</p>
              <p className="text-sm text-viper-400 mt-1">Adicione exercícios à biblioteca para começar.</p>
            </div>
          )}
        </div>
      )}

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-viper-100">
              <h2 className="font-bold text-lg text-viper-900">Novo Exercício</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5 text-viper-400" /></button>
            </div>
            <form onSubmit={addExercise} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-viper-700 mb-1">Nome *</label>
                <input required value={addState.name} onChange={e => setAddState(s => ({ ...s, name: e.target.value }))} className={IC} placeholder="Ex: Supino com barra" />
              </div>
              <div>
                <label className="block text-sm font-medium text-viper-700 mb-1">Grupo Muscular</label>
                <select value={addState.muscle_group} onChange={e => setAddState(s => ({ ...s, muscle_group: e.target.value }))} className={IC}>
                  {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-viper-700 mb-1">URL do Vídeo (YouTube)</label>
                <input value={addState.video_url} onChange={e => setAddState(s => ({ ...s, video_url: e.target.value }))} className={IC} placeholder="https://youtube.com/watch?v=..." />
                <p className="text-xs text-viper-400 mt-1">Cole aqui o link do YouTube para o vídeo demonstrativo</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-viper-700 mb-1">Descrição / Instruções</label>
                <textarea
                  value={addState.description}
                  onChange={e => setAddState(s => ({ ...s, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-viper-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-400/30 focus:border-gold-400 resize-none"
                  placeholder="Dicas de execução, variações..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-viper-700 hover:bg-viper-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={addSaving || !addState.name.trim()} className="px-4 py-2 text-sm bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors disabled:opacity-50">
                  {addSaving ? 'A adicionar...' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
