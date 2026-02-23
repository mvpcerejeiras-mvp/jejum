import React, { useEffect, useState } from 'react';
import { getParticipants } from '../services/db';
import { Participant, AppSettings } from '../types';
import { TYPE_DESCRIPTIONS, TIME_OPTIONS } from '../constants';
import { Users, ArrowRight, Activity, PieChart, Clock, Zap } from 'lucide-react';

interface HomeDashboardProps {
  onJoin: () => void;
  onViewSchedule: () => void;
  onViewClock: () => void;
  fastDays: string[];
  appSettings: AppSettings;
}

const HomeDashboard: React.FC<HomeDashboardProps> = ({ onJoin, onViewSchedule, onViewClock, fastDays, appSettings }) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [animateBars, setAnimateBars] = useState(false);

  useEffect(() => {
    const fetchParticipants = async () => {
      const data = await getParticipants();
      setParticipants(data);
      setTimeout(() => setAnimateBars(true), 100);
    };
    fetchParticipants();
  }, []);

  // Calculate stats
  const totalParticipants = participants.length;

  // 1. Weekly Stats - Updated for multiple days
  const dayCounts = fastDays.map(dayOption => {
    const count = participants.filter(p => p.days && p.days.includes(dayOption)).length;
    const dayPart = dayOption.split(' – ')[0].split('-')[0];
    const shortLabel = dayPart.substring(0, 1).toUpperCase() + dayPart.substring(1, 3).toLowerCase();
    return { fullLabel: dayOption, shortLabel, count };
  });
  const maxDayCount = Math.max(...dayCounts.map(d => d.count), 1);

  // 2. Type Stats
  const typeCounts = TYPE_DESCRIPTIONS.map(type => {
    const count = participants.filter(p => p.type === type.id).length;
    const percentage = totalParticipants > 0 ? Math.round((count / totalParticipants) * 100) : 0;

    // Determine color based on type configuration
    let colorClass = 'bg-slate-500';
    if (type.color.includes('green')) colorClass = 'bg-green-500';
    if (type.color.includes('blue')) colorClass = 'bg-blue-500';
    if (type.color.includes('orange')) colorClass = 'bg-orange-500';
    if (type.color.includes('red')) colorClass = 'bg-red-500';

    return { ...type, count, percentage, colorClass };
  }).sort((a, b) => b.count - a.count); // Sort by most popular

  // 3. Time Stats
  const timeCounts = TIME_OPTIONS.map(time => {
    const count = participants.filter(p => p.time === time).length;
    const shortLabel = time;
    const percentage = totalParticipants > 0 ? Math.round((count / totalParticipants) * 100) : 0;
    return { label: shortLabel, count, percentage };
  }).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6 animate-fade-in pb-4">

      {/* 1. Header Card (Total) */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
        <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/20 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              Unidos no Propósito
            </h2>
            <div className="flex items-baseline justify-center md:justify-start gap-1">
              <span className="text-4xl md:text-5xl font-extrabold text-indigo-900 dark:text-indigo-300 tracking-tight">
                {totalParticipants}
              </span>
              <span className="text-slate-400 dark:text-slate-500 font-medium text-sm">irmãos unidos</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onViewSchedule}
              className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 px-5 py-2.5 rounded-xl font-medium border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-slate-600 transition-all hover:scale-105 active:scale-95"
            >
              <Activity size={18} />
              <span>Ver Escala</span>
            </button>
            <button
              onClick={onViewClock}
              className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 px-5 py-2.5 rounded-xl font-medium border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-50 dark:hover:bg-slate-600 transition-all hover:scale-105 active:scale-95"
            >
              <Clock size={18} />
              <span>{appSettings.prayerClockTitle || 'Relógio'}</span>
            </button>
            <button
              onClick={onJoin}
              className="flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-400 transition-all hover:scale-105 active:scale-95"
            >
              <Users size={18} />
              <span>Participar Agora</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Weekly Bar Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm col-span-1 lg:col-span-2 transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md text-green-600 dark:text-green-400">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Termômetro da Semana</h3>
          </div>

          <div className="flex items-end justify-between gap-3 h-48 pt-10 overflow-x-auto pb-4 px-2 scrollbar-hide">
            {dayCounts.map((data, idx) => {
              const heightPercent = (data.count / maxDayCount) * 85; // Reduzido para dar espaço ao número
              const isToday = new Date().getDay() === (idx + 1);

              return (
                <div key={idx} className="flex flex-col items-center justify-end flex-1 min-w-[45px] group h-full relative">
                  {/* Tooltip */}
                  <div className="absolute -top-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 bg-slate-800 dark:bg-slate-700 text-white text-[10px] py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-30 shadow-xl border border-white/10">
                    {data.fullLabel}: {data.count}
                  </div>

                  {/* Bar Container */}
                  <div className="w-full h-full flex items-end justify-center relative transition-colors">
                    {/* Background track */}
                    <div className="absolute inset-0 w-full bg-slate-100/50 dark:bg-slate-700/30 rounded-xl -z-10"></div>

                    {/* Actual Bar */}
                    <div
                      className={`w-full max-w-[32px] rounded-xl transition-all duration-1000 ease-out relative shadow-sm group-hover:shadow-indigo-500/20
                        ${isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 dark:from-indigo-500 dark:to-indigo-300'
                          : 'bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-600 dark:to-slate-500'
                        } group-hover:from-indigo-500 group-hover:to-indigo-300`}
                      style={{ height: animateBars ? `${heightPercent}%` : '0%' }}
                    >
                      {/* Floating Number Label */}
                      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                        <span className={`text-[11px] font-black transition-colors ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {data.count}
                        </span>
                        <div className={`w-1 h-1 rounded-full mt-1 ${isToday ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                      </div>

                      {/* Glass Shine Effect */}
                      <div className="absolute inset-0 bg-white/10 w-1/2 rounded-l-xl pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Day Label */}
                  <div className={`mt-3 text-[10px] md:text-xs font-black uppercase tracking-widest text-center transition-all ${isToday ? 'text-indigo-600 dark:text-indigo-400 scale-110' : 'text-slate-400 dark:text-slate-500'}`}>
                    {data.shortLabel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fasting Types Distribution */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-md text-purple-600 dark:text-purple-400">
              <PieChart className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Modalidades Escolhidas</h3>
          </div>

          <div className="space-y-4">
            {typeCounts.slice(0, 4).map((type) => (
              <div key={type.id} className="space-y-1">
                <div className="flex justify-between text-xs items-end">
                  <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[70%]">
                    {type.title.split('–')[1].trim()}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                    {type.count} ({type.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden transition-colors">
                  <div
                    className={`h-2 rounded-full transition-all duration-1000 ease-out ${type.colorClass}`}
                    style={{ width: animateBars ? `${type.percentage}%` : '0%' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time Preference */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-md text-orange-600 dark:text-orange-400">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Horário de Início</h3>
          </div>

          <div className="space-y-3">
            {timeCounts.map((time, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="text-xs font-bold text-slate-400 dark:text-slate-500 w-8 text-right font-mono">
                  {time.percentage}%
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    {time.label}
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden transition-colors">
                    <div
                      className="bg-orange-400 dark:bg-orange-500 h-1.5 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: animateBars ? `${time.percentage}%` : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CTA Footer */}
      <div className="pt-2 text-center">
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          Jejum não é sobre fome, é sobre foco em Deus.
        </p>
        <button
          onClick={onJoin}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          <span>Definir meu propósito</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

export default HomeDashboard;