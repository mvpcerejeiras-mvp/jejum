import React, { useState, useEffect } from 'react';
import { Clock, Users, Check, AlertCircle, X } from 'lucide-react';
import { getPrayerCampaigns, getPrayerSignups, addPrayerSignup, getMembers } from '../services/db';
import { PrayerCampaign, PrayerSignup, Member } from '../types';

export function PrayerClock() {
    const [activeCampaign, setActiveCampaign] = useState<PrayerCampaign | null>(null);
    const [signups, setSignups] = useState<PrayerSignup[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Modal State
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [phoneInput, setPhoneInput] = useState('');
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [members, setMembers] = useState<Member[]>([]); // Cache members for lookup or just use direct DB query logic? 
    // Better to look up on submit to avoid exposing all members data if publicly accessible, 
    // but for now we'll load them to validate locally or search. 
    // Actually, to be safe, let's just input phone and check against DB on submit or have a lightweight lookup. 
    // We'll fetch all members for now as the app seems to do that in other places.

    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    const loadData = async () => {
        setLoading(true);
        // Get active campaign
        const campaigns = await getPrayerCampaigns();
        const active = campaigns.find(c => c.isActive);
        setActiveCampaign(active || null);

        if (active) {
            const s = await getPrayerSignups(active.id);
            setSignups(s);
        }

        // Pre-fetch members for validation (optional optimization)
        const m = await getMembers();
        setMembers(m);

        setLoading(false);
    };

    const handleSlotClick = (slot: number, count: number, isPhase1Complete: boolean) => {
        // Logic Check
        if (count >= 10) return; // Maxed out
        if (count >= 7 && !isPhase1Complete) {
            alert("Este horário já atingiu a meta inicial de 7 pessoas! Para liberar vagas extras aqui, todos os outros horários também precisam ter pelo menos 7 intercessores. Ajude a preencher os outros horários!");
            return;
        }

        setSelectedSlot(slot);
        setPhoneInput('');
        setFeedback(null);
        setIsModalOpen(true);
    };

    const handleSubmitSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeCampaign || selectedSlot === null) return;

        setFeedback(null);

        // Normalize phone (simple strip)
        const cleanPhone = phoneInput.replace(/\D/g, '');

        // Find member locally first
        const member = members.find(m => m.phone.replace(/\D/g, '') === cleanPhone);

        if (!member) {
            setFeedback({ type: 'error', message: 'Número não encontrado. Por favor, cadastre-se como membro primeiro ou fale com a organização.' });
            return;
        }

        const { success, message } = await addPrayerSignup(activeCampaign.id, member.id, selectedSlot);

        if (success) {
            setFeedback({ type: 'success', message: 'Inscrição confirmada com sucesso!' });
            setTimeout(() => {
                setIsModalOpen(false);
                setRefreshTrigger(prev => prev + 1);
            }, 2000);
        } else {
            setFeedback({ type: 'error', message: message || 'Erro ao realizar inscrição.' });
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-500">Carregando Relógio de Oração...</div>;

    if (!activeCampaign) {
        return (
            <div className="text-center py-20 px-4">
                <Clock className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-600">Nenhum Relógio de Oração ativo no momento.</h2>
                <p className="text-gray-500 mt-2">Aguarde a divulgação da próxima campanha.</p>
            </div>
        );
    }

    // Calculate Data
    const duration = activeCampaign.duration;
    const slots = Array.from({ length: duration }, (_, i) => i);
    const slotCounts = slots.map(s => signups.filter(su => su.slotNumber === s).length);
    const isPhase1Complete = slotCounts.every(c => c >= 7);

    // Stats
    const totalSignups = signups.length;
    const targetSignups = duration * 7;
    const progressPercent = Math.min(100, Math.round((totalSignups / targetSignups) * 100));

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center mb-10">
                <h1 className="text-3xl md:text-5xl font-black text-indigo-900 dark:text-indigo-400 mb-4 flex items-center justify-center gap-3">
                    <Clock className="w-8 h-8 md:w-12 md:h-12 text-indigo-600 dark:text-indigo-400" />
                    {activeCampaign.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-lg mb-6">
                    Escolha seu horário de intercessão e assuma seu posto nesta batalha espiritual!
                </p>

                {/* Global Progress */}
                <div className="max-w-md mx-auto bg-gray-100 rounded-full h-4 overflow-hidden mb-2 relative">
                    <div
                        className={`h-full transition-all duration-1000 ${isPhase1Complete ? 'bg-yellow-400' : 'bg-indigo-600'}`}
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {isPhase1Complete
                        ? "FASE EXTRA ATIVADA! Vagas de reserva liberadas!"
                        : `Meta Global: ${Math.round(progressPercent)}% concluída para liberar vagas extras.`}
                </p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 content-center justify-center">
                {slots.map(slot => {
                    const count = slotCounts[slot];

                    // Visual Logic
                    let status = 'open'; // open, full, bonus, maxed
                    if (count >= 10) status = 'maxed';
                    else if (count >= 7) {
                        if (isPhase1Complete) status = 'bonus';
                        else status = 'full';
                    } else {
                        status = 'open';
                    }

                    let cardClass = "";
                    let label = "";

                    switch (status) {
                        case 'open':
                            cardClass = 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-900 hover:border-green-400 dark:hover:border-green-500 hover:shadow-lg hover:-translate-y-1 cursor-pointer';
                            label = 'Disponível';
                            break;
                        case 'full':
                            cardClass = 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 opacity-90 cursor-not-allowed'; // Soft lock
                            label = 'Lotado (7/7)';
                            break;
                        case 'bonus':
                            cardClass = 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700 ring-2 ring-yellow-200 dark:ring-yellow-900/50 hover:shadow-xl hover:-translate-y-1 cursor-pointer';
                            label = 'Vaga Extra!';
                            break;
                        case 'maxed':
                            cardClass = 'bg-gray-100 dark:bg-slate-800/50 border-gray-300 dark:border-slate-700 opacity-60 cursor-not-allowed';
                            label = 'Esgotado';
                            break;
                    }

                    // Time Formatting
                    const date = new Date(activeCampaign.startDate);
                    date.setHours(date.getHours() + slot);
                    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dayString = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' });

                    return (
                        <div
                            key={slot}
                            onClick={() => handleSlotClick(slot, count, isPhase1Complete)}
                            className={`relative p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center text-center h-28 md:h-32 group ${cardClass}`}
                        >
                            <span className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-1">{dayString}</span>
                            <h3 className="text-xl md:text-2xl font-black text-gray-800 dark:text-gray-100 leading-none mb-1">
                                {timeString}
                            </h3>

                            <div className="mt-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/5 dark:bg-white/10">
                                <Users size={12} className="text-gray-600 dark:text-gray-300" />
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{count} / {status === 'bonus' || status === 'maxed' ? '10' : '7'}</span>
                            </div>

                            {status === 'full' && (
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
                                    <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded shadow-sm border border-red-200 transform -rotate-12 translate-y-4">
                                        META BATIDA
                                    </span>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Modal Selection */}
            {isModalOpen && selectedSlot !== null && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Confirmar Presença</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700">
                                <X size={20} className="text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-xl mb-6 text-center">
                            <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">Horário Selecionado</p>
                            <p className="text-3xl font-black text-indigo-900 dark:text-indigo-100 mt-1">
                                {(() => {
                                    const d = new Date(activeCampaign.startDate);
                                    d.setHours(d.getHours() + selectedSlot);
                                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                })()}
                            </p>
                        </div>

                        {feedback ? (
                            <div className={`p-4 rounded-lg mb-4 flex items-start gap-3 ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {feedback.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                                <p className="text-sm font-medium">{feedback.message}</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmitSignup} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seu Número de WhatsApp</label>
                                    <input
                                        type="tel"
                                        autoFocus
                                        value={phoneInput}
                                        onChange={e => setPhoneInput(e.target.value)}
                                        placeholder="(11) 99999-9999"
                                        className="w-full text-lg p-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-white bg-white dark:bg-slate-700"
                                        required
                                    />
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Digite o número cadastrado no sistema.</p>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95"
                                >
                                    Confirmar Inscrição
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
