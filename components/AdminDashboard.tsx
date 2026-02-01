import React, { useState, useEffect } from 'react';
import { getParticipants, getSettings, saveSettings } from '../services/db';
import { Participant, AppSettings, FastTime } from '../types';
import { Download, Save, Search, LogOut, Settings, Users, BarChart3, PieChart, Activity, Clock, List, Flame, Cross, BookOpen, Heart, Sun, Mountain, Star, Trash2, Plus, GripVertical } from 'lucide-react';
import { TIME_OPTIONS, TYPE_DESCRIPTIONS, DEFAULT_DAYS } from '../constants';

interface AdminDashboardProps {
  onLogout: () => void;
  onSettingsChange: () => void;
}

const LOGO_OPTIONS = [
  { id: 'flame', component: <Flame size={20} />, label: 'Chama' },
  { id: 'cross', component: <Cross size={20} />, label: 'Cruz' },
  { id: 'book', component: <BookOpen size={20} />, label: 'Bíblia' },
  { id: 'heart', component: <Heart size={20} />, label: 'Coração' },
  { id: 'sun', component: <Sun size={20} />, label: 'Luz' },
  { id: 'mountain', component: <Mountain size={20} />, label: 'Monte' },
  { id: 'star', component: <Star size={20} />, label: 'Estrela' },
];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState<'participants' | 'settings' | 'analytics'>('participants');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ theme: '', instruction: '', appTitle: '', logoId: '', fastDays: [] });

  // Filters
  const [filterDay, setFilterDay] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Analytics State
  const [typeChartMode, setTypeChartMode] = useState<'bar' | 'pie'>('bar');

  useEffect(() => {
    const loadData = async () => {
      const parts = await getParticipants();
      setParticipants(parts);
      const sets = await getSettings();
      setSettings(sets);
    };
    loadData();
  }, [onSettingsChange]); // Reload when settings change trigger happens (e.g. parent refresh, though here we trigger parent)

  const handleSaveSettings = async () => {
    await saveSettings(settings);
    onSettingsChange();
    alert('Configurações salvas!');
  };

  const handleDayChange = (index: number, value: string) => {
    const newDays = [...settings.fastDays];
    newDays[index] = value;
    setSettings({ ...settings, fastDays: newDays });
  };

  const removeDay = (index: number) => {
    if (confirm('Tem certeza? Dados antigos associados a este nome de dia permanecerão no banco, mas o dia não aparecerá mais para novos cadastros.')) {
      const newDays = settings.fastDays.filter((_, i) => i !== index);
      setSettings({ ...settings, fastDays: newDays });
    }
  };

  const addDay = () => {
    setSettings({ ...settings, fastDays: [...settings.fastDays, 'Novo Dia – Tema'] });
  };

  const resetDays = () => {
    if (confirm('Restaurar os dias padrões?')) {
      setSettings({ ...settings, fastDays: [...DEFAULT_DAYS] });
    }
  };

  const exportCSV = () => {
    const headers = ['Nome', 'WhatsApp', 'Dias', 'Horário', 'Tipo', 'Data Cadastro'];
    const rows = participants.map(p => [
      `"${p.name}"`,
      `"${p.phone}"`,
      `"${p.days.join(', ')}"`,
      `"${p.time}"`,
      `"${p.type}"`,
      `"${new Date(p.createdAt).toLocaleString('pt-BR')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "participantes_jejum.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredParticipants = participants.filter(p => {
    const matchesDay = filterDay ? p.days.includes(filterDay) : true;
    const matchesType = filterType ? p.type === filterType : true;
    const matchesSearch = searchTerm ?
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) : true;
    return matchesDay && matchesType && matchesSearch;
  });

  // --- Statistics Helpers ---

  // Custom counter for Days since it is now an array
  const countDays = (options: string[]) => {
    const counts: Record<string, number> = {};
    options.forEach(opt => counts[opt] = 0);

    participants.forEach(p => {
      p.days.forEach(day => {
        // Initialize if day was removed from settings but exists in data
        if (counts[day] === undefined) {
          counts[day] = 1;
        } else {
          counts[day]++;
        }
      });
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const countByKey = (key: keyof Pick<Participant, 'time' | 'type'>, options: string[]) => {
    const counts: Record<string, number> = {};
    options.forEach(opt => counts[opt] = 0);
    participants.forEach(p => {
      // @ts-ignore
      if (counts[p[key]] === undefined) {
        // @ts-ignore
        counts[p[key]] = 1;
      } else {
        // @ts-ignore
        counts[p[key]]++;
      }
    });

    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const dayCounts = countDays(settings.fastDays);
  const timeCounts = countByKey('time', TIME_OPTIONS);
  const typeCounts = countByKey('type', TYPE_DESCRIPTIONS.map(t => t.id));

  const maxDayCount = Math.max(...dayCounts.map(([_, c]) => c), 1);
  const maxTimeCount = Math.max(...timeCounts.map(([_, c]) => c), 1);
  const maxTypeCount = Math.max(...typeCounts.map(([_, c]) => c), 1);

  const getDayLabel = (day: string) => day.split(' – ')[0]; // Extract just "Segunda-feira"

  const getTypeColor = (typeId: string) => {
    const desc = TYPE_DESCRIPTIONS.find(t => t.id === typeId);
    if (!desc) return 'bg-slate-500';
    if (desc.color.includes('green')) return 'bg-green-500';
    if (desc.color.includes('blue')) return 'bg-blue-500';
    if (desc.color.includes('orange')) return 'bg-orange-500';
    if (desc.color.includes('red')) return 'bg-red-500';
    return 'bg-slate-500';
  };

  const getHexColor = (typeId: string) => {
    const desc = TYPE_DESCRIPTIONS.find(t => t.id === typeId);
    if (!desc) return '#64748b'; // slate-500
    if (desc.color.includes('green')) return '#22c55e'; // green-500
    if (desc.color.includes('blue')) return '#3b82f6'; // blue-500
    if (desc.color.includes('orange')) return '#f97316'; // orange-500
    if (desc.color.includes('red')) return '#ef4444'; // red-500
    return '#64748b';
  };

  // SVG Pie Chart Helper
  const renderPieChart = (counts: [string, number][]) => {
    const total = counts.reduce((sum, item) => sum + item[1], 0);
    if (total === 0) return <div className="text-center text-slate-400 dark:text-slate-500 py-8">Sem dados para exibir</div>;

    let cumulativePercent = 0;
    const r = 40;
    const c = 2 * Math.PI * r; // Circumference

    return (
      <div className="flex flex-col md:flex-row items-center gap-8 justify-center py-4">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {counts.map(([id, count], i) => {
              if (count === 0) return null;
              const percent = count / total;
              const dashArray = `${c * percent} ${c}`;
              const dashOffset = -1 * c * cumulativePercent;
              const color = getHexColor(id);
              cumulativePercent += percent;

              return (
                <circle
                  key={id}
                  r={r}
                  cx="50"
                  cy="50"
                  fill="transparent"
                  stroke={color}
                  strokeWidth="20"
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <title>{`${TYPE_DESCRIPTIONS.find(t => t.id === id)?.title}: ${count} (${Math.round(percent * 100)}%)`}</title>
                </circle>
              );
            })}
            {/* Center Text */}
            <text x="50%" y="50%" textAnchor="middle" dy=".3em" transform="rotate(90 50 50)" className="fill-slate-700 dark:fill-slate-200 font-bold text-xs">
              {total} Total
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 max-w-xs">
          {counts.map(([id, count]) => {
            if (count === 0) return null;
            const percent = Math.round((count / total) * 100);
            const desc = TYPE_DESCRIPTIONS.find(t => t.id === id);
            const color = getHexColor(id);

            return (
              <div key={id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-slate-600 dark:text-slate-300 truncate max-w-[150px]" title={desc?.title}>
                    {desc?.title.split('–')[1] || desc?.title || id}
                  </span>
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-200">{percent}% ({count})</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden min-h-[600px] flex flex-col transition-colors">
      {/* Admin Header */}
      <div className="bg-slate-800 dark:bg-black text-white p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
          Painel Administrativo
        </h2>
        <button onClick={onLogout} className="text-slate-300 hover:text-white text-sm flex items-center gap-1">
          <LogOut size={16} /> Sair
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto bg-slate-50 dark:bg-slate-900/50">
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 min-w-[140px] transition-colors ${activeTab === 'participants' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <Users size={18} /> Participantes
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 min-w-[140px] transition-colors ${activeTab === 'analytics' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <BarChart3 size={18} /> Estatísticas
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center gap-2 min-w-[140px] transition-colors ${activeTab === 'settings' ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
        >
          <Settings size={18} /> Configurações
        </button>
      </div>

      <div className="p-6 flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">

        {/* --- PARTICIPANTS TAB --- */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-3 justify-between bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col md:flex-row gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar nome ou telefone..."
                    className="pl-9 w-full p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="p-2 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={filterDay}
                  onChange={e => setFilterDay(e.target.value)}
                >
                  <option value="">Todos os Dias</option>
                  {settings.fastDays.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <button
                onClick={exportCSV}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
              >
                <Download size={16} /> Exportar CSV
              </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">Dia(s)</th>
                      <th className="px-4 py-3">Tipo</th>
                      <th className="px-4 py-3">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                          Nenhum participante encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{p.name}</div>
                            <div className="text-slate-500 dark:text-slate-400 text-xs">{p.phone}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                            <div className="flex flex-wrap gap-1">
                              {p.days.map((day, idx) => (
                                <span key={idx} className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs whitespace-nowrap">
                                  {day.split(' – ')[0]}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                              {p.type.split('–')[0]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                            {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
              Total: {filteredParticipants.length} registros
            </div>
          </div>
        )}

        {/* --- ANALYTICS TAB --- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total de Inscritos</p>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{participants.length}</h3>
                </div>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center">
                  <Users className="text-indigo-600 dark:text-indigo-400 w-6 h-6" />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Dia com Maior Adesão</p>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate max-w-[200px]">
                    {dayCounts.length > 0 && dayCounts[0][1] > 0 ? getDayLabel(dayCounts[0][0]) : '-'}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    {dayCounts.length > 0 && dayCounts[0][1] > 0 ? `${dayCounts[0][1]} compromissos` : 'Sem dados'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center">
                  <Activity className="text-green-600 dark:text-green-400 w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Days Chart */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Adesão por Dia
                </h3>
                <div className="space-y-4">
                  {dayCounts.map(([day, count]) => (
                    <div key={day} className="space-y-1">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span>{getDayLabel(day)}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 dark:bg-indigo-400 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${(count / maxDayCount) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Times Chart */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500 dark:text-orange-400" /> Preferência de Horário
                </h3>
                <div className="space-y-4">
                  {timeCounts.map(([time, count]) => {
                    const shortTime = time.split('–')[0].trim();
                    return (
                      <div key={time} className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>{shortTime}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-orange-400 dark:bg-orange-500 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${(count / maxTimeCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Types Chart with Toggle */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex flex-row justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-purple-500 dark:text-purple-400" /> Tipos de Jejum
                </h3>

                {/* Chart Type Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                  <button
                    onClick={() => setTypeChartMode('bar')}
                    className={`p-1.5 rounded-md transition-all ${typeChartMode === 'bar' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600'}`}
                    title="Gráfico de Barras"
                  >
                    <List size={16} />
                  </button>
                  <button
                    onClick={() => setTypeChartMode('pie')}
                    className={`p-1.5 rounded-md transition-all ${typeChartMode === 'pie' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-400 hover:text-slate-600'}`}
                    title="Gráfico de Pizza"
                  >
                    <PieChart size={16} />
                  </button>
                </div>
              </div>

              {typeChartMode === 'bar' ? (
                <div className="space-y-3 animate-fade-in">
                  {typeCounts.map(([typeId, count]) => {
                    const desc = TYPE_DESCRIPTIONS.find(t => t.id === typeId);
                    const label = desc ? desc.title : typeId;
                    const colorClass = getTypeColor(typeId);

                    return (
                      <div key={typeId} className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs md:text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${colorClass}`}></span>
                            {label}
                          </span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{count}</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`${colorClass} h-2 rounded-full transition-all duration-500 opacity-80`}
                            style={{ width: `${(count / maxTypeCount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="animate-fade-in">
                  {renderPieChart(typeCounts)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b dark:border-slate-700 pb-2">Dias de Jejum</h3>
              <div className="space-y-3">
                {settings.fastDays.map((day, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="cursor-move text-slate-300 dark:text-slate-600">
                      <GripVertical size={16} />
                    </div>
                    <input
                      type="text"
                      value={day}
                      onChange={(e) => handleDayChange(index, e.target.value)}
                      className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                      placeholder="Nome do dia e tema"
                    />
                    <button
                      onClick={() => removeDay(index)}
                      className="text-red-400 hover:text-red-600 p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                      title="Remover dia"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={addDay}
                    className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-3 py-1.5 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition"
                  >
                    <Plus size={14} /> Adicionar Dia
                  </button>
                  <button
                    onClick={resetDays}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-1.5"
                  >
                    Restaurar Padrão
                  </button>
                </div>
              </div>

              <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b dark:border-slate-700 pb-2 pt-6">Identidade Visual</h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Título do Aplicativo</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                  value={settings.appTitle}
                  onChange={e => setSettings({ ...settings, appTitle: e.target.value })}
                  placeholder="Ex: Jejum Congregacional"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Ícone Principal</label>
                <div className="flex flex-wrap gap-2">
                  {LOGO_OPTIONS.map((logo) => (
                    <button
                      key={logo.id}
                      onClick={() => setSettings({ ...settings, logoId: logo.id })}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all w-20 h-20 ${settings.logoId === logo.id
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-200 dark:ring-indigo-800'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                    >
                      {logo.component}
                      <span className="text-xs mt-2 font-medium">{logo.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <h3 className="font-semibold text-slate-800 dark:text-slate-200 border-b dark:border-slate-700 pb-2 pt-4">Conteúdo</h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Tema da Semana</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                  value={settings.theme}
                  onChange={e => setSettings({ ...settings, theme: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Texto de Instrução</label>
                <textarea
                  rows={4}
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                  value={settings.instruction}
                  onChange={e => setSettings({ ...settings, instruction: e.target.value })}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">Este texto aparece no topo do formulário de inscrição.</p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm font-medium"
                >
                  <Save size={16} /> Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;