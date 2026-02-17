import React, { useEffect, useState } from 'react';
import { getParticipants } from '../services/db';
import { Participant } from '../types';
import { ArrowLeft, Calendar, User, Clock, CheckCircle2 } from 'lucide-react';

interface WeeklyScheduleProps {
    onBack: () => void;
    fastDays: string[];
}

const WeeklySchedule: React.FC<WeeklyScheduleProps> = ({ onBack, fastDays }) => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const data = await getParticipants();
            setParticipants(data);
            setLoading(false);
        };
        loadData();
    }, []);

    // Helper to get current day of week (0-6) mapped to our day strings if possible
    const getCurrentDayIndex = () => {
        const day = new Date().getDay(); // 0 = Sunday, 1 = Monday...
        // Adjust logic based on your custom day order.
        // Assuming standard order in fastDays: Mon, Tue, Wed, Thu, Fri, Sat, Sun
        // But fastDays might be customized.
        // Let's rely on string matching "Segunda", "Terça", etc.
        const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return weekDays[day];
    };

    const currentDaySlug = getCurrentDayIndex();

    const isToday = (dayString: string) => {
        return dayString.toLowerCase().includes(currentDaySlug.toLowerCase());
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 animate-pulse">
                <Calendar size={48} className="mb-4 opacity-50" />
                <p>Carregando escala...</p>
            </div>
        );
    }

    // Count total participants per day
    const getCountForDay = (day: string) => {
        return participants.filter(p => p.days.includes(day)).length;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="font-medium">Voltar</span>
                </button>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="text-indigo-600 dark:text-indigo-400" />
                    Escala Semanal
                </h2>
            </div>

            {/* Intro Text */}
            <div className="text-center md:text-left">
                <p className="text-slate-600 dark:text-slate-400 italic">
                    "Um ao outro ajudou, e ao seu irmão disse: Esforça-te." — Isaías 41:6
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {fastDays.map((day) => {
                    const isCurrentDay = isToday(day);
                    const dayParticipants = participants.filter(p => p.days.includes(day));

                    return (
                        <div
                            key={day}
                            className={`
                relative rounded-xl border p-5 transition-all
                ${isCurrentDay
                                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700 shadow-md ring-1 ring-indigo-500/30'
                                    : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-sm'
                                }
              `}
                        >
                            {isCurrentDay && (
                                <div className="absolute -top-3 left-4 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow-sm flex items-center gap-1">
                                    <CheckCircle2 size={12} /> HOJE
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <h3 className={`font-bold text-lg ${isCurrentDay ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {day.split(' – ')[0].split('-')[0].substring(0, 1).toUpperCase() + day.split(' – ')[0].split('-')[0].substring(1, 3).toLowerCase()}
                                </h3>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isCurrentDay ? 'bg-white/50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'}`}>
                                    {dayParticipants.length}
                                </span>
                            </div>

                            <div className="space-y-3">
                                {dayParticipants.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 dark:text-slate-600 text-sm italic">
                                        Ninguém inscrito para este dia ainda. <br /> Seja o primeiro!
                                    </div>
                                ) : (
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                        {dayParticipants.map(participant => (
                                            <div key={participant.id} className="flex flex-col border-b border-slate-100 dark:border-slate-700/50 last:border-0 pb-2 last:pb-0">
                                                <div className="flex items-center gap-2">
                                                    <User size={14} className="text-slate-400 dark:text-slate-500" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {participant.name}
                                                    </span>
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WeeklySchedule;
