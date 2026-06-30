import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Dumbbell, UtensilsCrossed, TrendingUp, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Client = Database['public']['Tables']['clients']['Row'];
type Workout = Database['public']['Tables']['workouts']['Row'];

export default function Dashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [stats, setStats] = useState({ totalClients: 0, activeWorkouts: 0, activePlans: 0, recentAssessments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [c, w, p, a] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('workouts').select('*').eq('is_active', true),
        supabase.from('nutrition_plans').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('physical_assessments').select('id', { count: 'exact' }),
      ]);
      setClients(c.data ?? []);
      setWorkouts(w.data ?? []);
      setStats({
        totalClients: (c.data ?? []).length,
        activeWorkouts: (w.data ?? []).length,
        activePlans: p.count ?? 0,
        recentAssessments: a.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  const statCards = [
    { label: 'Total Clientes', value: stats.totalClients, icon: Users, color: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-100' },
    { label: 'Treinos Ativos', value: stats.activeWorkouts, icon: Dumbbell, color: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-100' },
    { label: 'Planos Nutricionais', value: stats.activePlans, icon: UtensilsCrossed, color: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-100' },
    { label: 'Total Avaliações', value: stats.recentAssessments, icon: TrendingUp, color: 'bg-rose-500/10', text: 'text-rose-600', border: 'border-rose-100' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-slate-200 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-64 bg-slate-200 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-1">Visão geral da sua atividade de personal training</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`bg-white rounded-xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Clientes</h2>
            <Link to="/clientes" className="text-sm text-emerald-600 font-medium hover:text-emerald-700 flex items-center gap-1">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-2">
            {clients.slice(0, 5).map((client) => (
              <Link
                key={client.id}
                to={`/clientes/${client.id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                  {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate group-hover:text-emerald-700 transition-colors">{client.name}</p>
                  <p className="text-xs text-slate-400 truncate">{client.email || client.phone || 'Sem contacto'}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors shrink-0" />
              </Link>
            ))}
            {clients.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">Sem clientes registados</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-slate-900">Treinos Ativos</h2>
          </div>
          <div className="space-y-2">
            {workouts.slice(0, 5).map((w) => (
              <Link
                key={w.id}
                to={`/clientes/${w.client_id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{w.name}</p>
                  <p className="text-xs text-slate-400 truncate">{w.description || 'Sem descrição'}</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium shrink-0">Ativo</span>
              </Link>
            ))}
            {workouts.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">Sem treinos ativos</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
