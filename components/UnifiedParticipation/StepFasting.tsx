import React, { useState } from 'react';
import { useParticipation } from '../../contexts/ParticipationContext';
import { FastType, FastTime } from '../../types';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

const FAST_TYPES = [
    { id: FastType.STANDARD, label: 'Jejum Parcial Padrão', icon: '🍞' },
    { id: FastType.DANIEL, label: 'Jejum de Daniel', icon: '🥗' },
    { id: FastType.INTENSIFIED, label: 'Jejum Parcial Intensificado', icon: '🔥' },
    { id: FastType.RENUNCIATION, label: 'Jejum com Renúncia', icon: '❌' },
];

const FAST_TIMES = [
    { id: FastTime.TWELVE_AM_PM, label: '12h (00h - 12h)' },
    { id: FastTime.NINE_HOURS, label: '9h (06h - 15h)' },
    { id: FastTime.TWELVE_HOURS, label: '12h (06h - 18h)' },
    { id: FastTime.CUSTOM, label: 'Personalizado' },
];

export function StepFasting() {
    const { setStep, appSettings, setFastingData, user } = useParticipation() as any;

    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [selectedType, setSelectedType] = useState<FastType | ''>('');
    const [selectedTime, setSelectedTime] = useState<FastTime | ''>('');

    const activeDays = appSettings.fastDays || [];

    const handleDayToggle = (day: string) => {
        setSelectedDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const handleNext = () => {
        if (selectedDays.length === 0 || !selectedType || !selectedTime) return;

        setFastingData({
            days: selectedDays,
            type: selectedType,
            time: selectedTime
        });

        // Skip to success if only fasting mode
        const config = (useParticipation() as any).config;
        if (config?.eventMode === 'fasting') {
            setStep(3);
        } else {
            setStep(2); // Go to Clock Upsell
        }
    };

    const isFormValid = selectedDays.length > 0 && selectedType !== '' && selectedTime !== '';

    return (
        <div className="animate-fade-in-up space-y-6 pb-24">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-white">Escolha seu Jejum</h2>
                <p className="text-slate-300">Olá, <span className="text-indigo-400 font-bold">{user?.name}</span>! Como você vai participar?</p>
            </div>

            {/* Days Selection */}
            <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dias da Semana</h3>
                <div className="grid grid-cols-2 gap-2">
                    {activeDays.length > 0 ? activeDays.map((day: string) => {
                        const isSelected = selectedDays.includes(day);
                        const label = day.split('–')[0].trim(); // "Segunda-feira"
                        const subLabel = day.split('–')[1]?.trim(); // "Ágape"

                        return (
                            <button
                                key={day}
                                onClick={() => handleDayToggle(day)}
                                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
                            >
                                <div className="font-bold text-sm">{label}</div>
                                <div className="text-xs opacity-70">{subLabel}</div>
                                {isSelected && <div className="absolute top-2 right-2 bg-white text-indigo-600 rounded-full p-0.5"><Check size={10} /></div>}
                            </button>
                        );
                    }) : <p className="text-slate-500 text-sm">Nenhum dia de jejum configurado.</p>}
                </div>
            </div>

            {/* Fast Type */}
            <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipo de Jejum</h3>
                <div className="space-y-2">
                    {FAST_TYPES.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${selectedType === type.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'}`}
                        >
                            <span className="text-2xl">{type.icon}</span>
                            <div>
                                <div className="font-bold text-sm">{type.label}</div>
                            </div>
                            {selectedType === type.id && <Check className="ml-auto" size={16} />}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fast Time */}
            <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Período</h3>
                <div className="grid grid-cols-2 gap-2">
                    {FAST_TIMES.map((time) => (
                        <button
                            key={time.id}
                            onClick={() => setSelectedTime(time.id)}
                            className={`p-3 rounded-xl border text-sm font-medium transition-all ${selectedTime === time.id ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-300'}`}
                        >
                            {time.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent z-50 backdrop-blur-sm">
                <div className="max-w-lg mx-auto flex gap-3">
                    <button
                        onClick={() => setStep(0)}
                        className="px-4 py-4 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={!isFormValid}
                        className="flex-1 bg-white text-indigo-900 font-bold py-4 rounded-xl shadow-lg hover:bg-slate-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Continuar <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
