import { useState, useRef, useEffect } from 'react';
import { Plus, X, ChevronDown, ChevronUp, Dumbbell, Clock, Trash2, Play, Search, ExternalLink, Eye } from 'lucide-react';
import type { WorkoutWithExercises } from '../pages/ClientDetail';
import type { Database } from '../lib/database.types';
import { useAppMode } from '../App';

type ExerciseLibItem = Database['public']['Tables']['exercises_library']['Row'];

const IC = "w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500";

function VideoModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900">{name}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="aspect-video bg-black">
          <iframe
            src={`${url}?autoplay=1&rel=0`}
            title={name}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <div className="px-5 py-3 flex justify-end">
          <a href={url.replace('/embed/', '/watch?v=')} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-600 transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Abrir no YouTube
          </a>
        </div>
      </div>
    </div>
  );
}

function ExerciseAutocomplete({
  value,
  onChange,
  library,
  onSelect,
}: {
  value: string;
  onChange: (v: string) => void;
  library: ExerciseLibItem[];
  onSelect: (item: ExerciseLibItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = value.length >= 1
    ? library.filter(e => e.name.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          placeholder="Pesquisar ou escrever exercício..."
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {filtered.map(item => (
            <button
              key={item.id}
              type="button"
              onMouseDown={() => { onSelect(item); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 flex items-center justify-between gap-3 transition-colors border-b border-slate-50 last:border-0"
            >
              <div>
                <span className="text-sm font-medium text-slate-900">{item.name}</span>
                {item.muscle_group && <span className="text-xs text-slate-400 ml-2">· {item.muscle_group}</span>}
              </div>
              {item.video_url && <Play className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WorkoutsTab({
  workouts,
  onAddWorkout,
  onAddExercise,
  onDeleteExercise,
  onDeleteWorkout,
  exercisesLibrary,
}: {
  workouts: WorkoutWithExercises[];
  onAddWorkout: (p: { name: string; description: string }) => Promise<void>;
  onAddExercise: (workoutId: string, p: { exercise_name: string; sets: number; reps: string; rest_seconds: number | null; video_url: string | null; notes: string | null }) => Promise<void>;
  onDeleteExercise: (workoutId: string, exerciseId: string) => Promise<void>;
  onDeleteWorkout: (workoutId: string) => Promise<void>;
  exercisesLibrary: ExerciseLibItem[];
}) {
  const { isTrainer } = useAppMode();
  const canEdit = isTrainer;

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({ name: '', description: '' });
  const [savingWorkout, setSavingWorkout] = useState(false);

  const [addingExerciseTo, setAddingExerciseTo] = useState<string | null>(null);
  const [exForm, setExForm] = useState({ exercise_name: '', sets: '', reps: '', rest_seconds: '', video_url: '', notes: '' });
  const [savingEx, setSavingEx] = useState(false);

  const [videoModal, setVideoModal] = useState<{ url: string; name: string } | null>(null);

  async function handleAddWorkout(e: React.FormEvent) {
    e.preventDefault();
    if (!workoutForm.name.trim()) return;
    setSavingWorkout(true);
    await onAddWorkout(workoutForm);
    setShowWorkoutForm(false);
    setWorkoutForm({ name: '', description: '' });
    setSavingWorkout(false);
  }

  async function handleAddExercise(e: React.FormEvent, workoutId: string) {
    e.preventDefault();
    if (!exForm.exercise_name.trim()) return;
    setSavingEx(true);
    await onAddExercise(workoutId, {
      exercise_name: exForm.exercise_name,
      sets: parseInt(exForm.sets) || 3,
      reps: exForm.reps,
      rest_seconds: exForm.rest_seconds ? parseInt(exForm.rest_seconds) : null,
      video_url: exForm.video_url || null,
      notes: exForm.notes || null,
    });
    setExForm({ exercise_name: '', sets: '', reps: '', rest_seconds: '', video_url: '', notes: '' });
    setAddingExerciseTo(null);
    setSavingEx(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-900">Programas de Treino</h2>
        {canEdit && (
          <button
            onClick={() => setShowWorkoutForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Novo Treino
          </button>
        )}
      </div>

      {!isTrainer && (
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm">
          <Eye className="w-4 h-4" />
          Modo de visualização - As alterações estão desativadas
        </div>
      )}

      <div className="space-y-4">
        {workouts.map(w => {
          const isOpen = expanded[w.id] ?? true;
          const addingHere = addingExerciseTo === w.id;
          return (
            <div key={w.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <button
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  onClick={() => setExpanded(p => ({ ...p, [w.id]: !isOpen }))}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{w.name}</h3>
                    <p className="text-sm text-slate-500 truncate">{w.description || 'Sem descrição'}</p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  {w.is_active && <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">Ativo</span>}
                  {canEdit && (
                    <button
                      onClick={() => { if (confirm('Eliminar este treino?')) onDeleteWorkout(w.id); }}
                      className="w-7 h-7 rounded-lg hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => setExpanded(p => ({ ...p, [w.id]: !isOpen }))}>
                    {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="px-5 pb-5 space-y-3">
                  {/* Mobile: cards / Desktop: table */}
                  <div className="hidden sm:block overflow-x-auto rounded-lg border border-slate-100">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="text-left px-3 py-2.5 font-medium text-slate-500 w-8">#</th>
                          <th className="text-left px-3 py-2.5 font-medium text-slate-500">Exercício</th>
                          <th className="text-left px-3 py-2.5 font-medium text-slate-500">Séries</th>
                          <th className="text-left px-3 py-2.5 font-medium text-slate-500">Reps</th>
                          <th className="text-left px-3 py-2.5 font-medium text-slate-500">Descanso</th>
                          <th className="text-left px-3 py-2.5 font-medium text-slate-500 w-16">Vídeo</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {w.exercises.map((ex, i) => (
                          <tr key={ex.id} className="hover:bg-slate-50 group">
                            <td className="px-3 py-2.5 text-slate-400 font-medium">{i + 1}</td>
                            <td className="px-3 py-2.5">
                              <div>
                                <span className="font-medium text-slate-900">{ex.exercise_name}</span>
                                {ex.notes && <p className="text-xs text-slate-400 mt-0.5">{ex.notes}</p>}
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">{ex.sets}</td>
                            <td className="px-3 py-2.5 text-slate-600">{ex.reps}</td>
                            <td className="px-3 py-2.5 text-slate-600">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {ex.rest_seconds ? `${ex.rest_seconds}s` : '—'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5">
                              {ex.video_url ? (
                                <button
                                  onClick={() => setVideoModal({ url: ex.video_url!, name: ex.exercise_name })}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                                >
                                  <Play className="w-3 h-3" /> Ver
                                </button>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5">
                              {canEdit && (
                                <button
                                  onClick={() => onDeleteExercise(w.id, ex.id)}
                                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 transition-all"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {w.exercises.length === 0 && (
                          <tr><td colSpan={7} className="px-3 py-5 text-center text-slate-400 text-sm">Sem exercícios. Adicione o primeiro abaixo.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile: card layout */}
                  <div className="sm:hidden space-y-2">
                    {w.exercises.map((ex, i) => (
                      <div key={ex.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-slate-900 text-sm">{ex.exercise_name}</span>
                            {ex.notes && <p className="text-xs text-slate-400 mt-0.5">{ex.notes}</p>}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="text-xs text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">{ex.sets} séries</span>
                              <span className="text-xs text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200">{ex.reps} reps</span>
                              {ex.rest_seconds && <span className="text-xs text-slate-600 bg-white px-2 py-1 rounded-md border border-slate-200"><Clock className="w-3 h-3 inline mr-0.5" />{ex.rest_seconds}s</span>}
                              {ex.video_url && (
                                <button onClick={() => setVideoModal({ url: ex.video_url!, name: ex.exercise_name })} className="text-xs text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 font-medium">
                                  <Play className="w-3 h-3 inline mr-0.5" />Ver
                                </button>
                              )}
                            </div>
                          </div>
                          {canEdit && (
                            <button onClick={() => onDeleteExercise(w.id, ex.id)} className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 transition-colors shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {w.exercises.length === 0 && (
                      <p className="px-3 py-5 text-center text-slate-400 text-sm">Sem exercícios. Adicione o primeiro abaixo.</p>
                    )}
                  </div>

                  {addingHere ? (
                    <form onSubmit={e => handleAddExercise(e, w.id)} className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
                      <h4 className="text-sm font-semibold text-slate-700">Adicionar Exercício</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Nome do Exercício *</label>
                          <ExerciseAutocomplete
                            value={exForm.exercise_name}
                            onChange={v => setExForm(f => ({ ...f, exercise_name: v }))}
                            library={exercisesLibrary}
                            onSelect={item => setExForm(f => ({
                              ...f,
                              exercise_name: item.name,
                              video_url: item.video_url ?? '',
                            }))}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Séries *</label>
                          <input required type="number" min="1" value={exForm.sets} onChange={e => setExForm(f => ({ ...f, sets: e.target.value }))} className={IC} placeholder="4" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Repetições *</label>
                          <input required value={exForm.reps} onChange={e => setExForm(f => ({ ...f, reps: e.target.value }))} className={IC} placeholder="10-12" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Descanso (seg)</label>
                          <input type="number" value={exForm.rest_seconds} onChange={e => setExForm(f => ({ ...f, rest_seconds: e.target.value }))} className={IC} placeholder="90" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">URL Vídeo</label>
                          <input value={exForm.video_url} onChange={e => setExForm(f => ({ ...f, video_url: e.target.value }))} className={IC} placeholder="Preenchido automaticamente" />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1">Notas / Instruções</label>
                          <input value={exForm.notes} onChange={e => setExForm(f => ({ ...f, notes: e.target.value }))} className={IC} placeholder="Ex: Cotovelos a 45°, amplitude completa" />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button type="button" onClick={() => { setAddingExerciseTo(null); setExForm({ exercise_name: '', sets: '', reps: '', rest_seconds: '', video_url: '', notes: '' }); }} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-white rounded-lg border border-slate-200 transition-colors">Cancelar</button>
                        <button type="submit" disabled={savingEx || !exForm.exercise_name.trim()} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                          {savingEx ? 'A adicionar...' : 'Adicionar'}
                        </button>
                      </div>
                    </form>
                  ) : canEdit && (
                    <button
                      onClick={() => setAddingExerciseTo(w.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Adicionar Exercício
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {workouts.length === 0 && (
          <div className="text-center py-14 bg-white rounded-xl border border-slate-200">
            <Dumbbell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Sem treinos criados</p>
            <p className="text-sm text-slate-400 mt-1">Clique em "Novo Treino" para começar.</p>
          </div>
        )}
      </div>

      {showWorkoutForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-lg text-slate-900">Novo Treino</h2>
              <button onClick={() => setShowWorkoutForm(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleAddWorkout} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input required value={workoutForm.name} onChange={e => setWorkoutForm(f => ({ ...f, name: e.target.value }))} className={IC} placeholder="Ex: Treino A - Superior" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input value={workoutForm.description} onChange={e => setWorkoutForm(f => ({ ...f, description: e.target.value }))} className={IC} placeholder="Ex: Foco em membros superiores" />
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button type="button" onClick={() => setShowWorkoutForm(false)} className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" disabled={savingWorkout} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                  {savingWorkout ? 'A criar...' : 'Criar Treino'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {videoModal && (
        <VideoModal url={videoModal.url} name={videoModal.name} onClose={() => setVideoModal(null)} />
      )}
    </div>
  );
}
