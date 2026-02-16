import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, Pause, Clock, Users, Calendar } from 'lucide-react';
import { createPrayerCampaign, getPrayerCampaigns, toggleCampaignStatus, deleteCampaign, getPrayerSignups } from '../services/db';
import { PrayerCampaign, PrayerSignup } from '../types';

export function PrayerCampaignManager() {
    const [campaigns, setCampaigns] = useState<PrayerCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // New Campaign Form
    const [newTitle, setNewTitle] = useState('');
    const [newStartDate, setNewStartDate] = useState('');
    const [newStartTime, setNewStartTime] = useState('00:00');
    const [newDuration, setNewDuration] = useState<12 | 48>(12);
    const [error, setError] = useState('');

    // Selected Campaign Details
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [selectedSignups, setSelectedSignups] = useState<PrayerSignup[]>([]);

    useEffect(() => {
        loadCampaigns();
    }, [refreshTrigger]);

    useEffect(() => {
        if (selectedCampaignId) {
            loadSignups(selectedCampaignId);
        } else {
            setSelectedSignups([]);
        }
    }, [selectedCampaignId, refreshTrigger]);

    const loadCampaigns = async () => {
        setLoading(true);
        const data = await getPrayerCampaigns();
        setCampaigns(data);
        setLoading(false);
    };

    const loadSignups = async (id: string) => {
        const data = await getPrayerSignups(id);
        setSelectedSignups(data);
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle || !newStartDate || !newStartTime) {
            setError('Preencha todos os campos obrigatórios.');
            return;
        }

        const startDateTime = new Date(`${newStartDate}T${newStartTime}:00`).toISOString();

        const { success, message } = await createPrayerCampaign({
            title: newTitle,
            startDate: startDateTime,
            duration: newDuration
        });

        if (success) {
            setShowNewModal(false);
            setNewTitle('');
            setNewStartDate('');
            setNewStartTime('00:00');
            setError('');
            setRefreshTrigger(prev => prev + 1);
        } else {
            setError(message || 'Erro ao criar campanha.');
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        await toggleCampaignStatus(id, !currentStatus);
        setRefreshTrigger(prev => prev + 1);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza? Isso apagará todas as inscrições desta campanha.')) {
            await deleteCampaign(id);
            if (selectedCampaignId === id) setSelectedCampaignId(null);
            setRefreshTrigger(prev => prev + 1);
        }
    };

    // Helper to render grid preview
    const renderGridPreview = (campaign: PrayerCampaign) => {
        const signups = selectedSignups;
        const slots = Array.from({ length: campaign.duration }, (_, i) => i);

        // Calculate total fill
        const totalSlots = campaign.duration;

        // Check Phase 1 (all >= 7)
        const slotCounts = slots.map(s => signups.filter(su => su.slotNumber === s).length);
        const isPhase1Complete = slotCounts.every(c => c >= 7);

        return (
            <div className="mt-4 border-t pt-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Users size={16} /> Status da Escala
                    {isPhase1Complete && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-300">Fase Extra Ativa! (Vagas de 8 a 10 liberadas)</span>}
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1">
                    {slots.map(slot => {
                        const count = slotCounts[slot];
                        let bgColor = 'bg-green-100 text-green-800 border-green-200'; // < 7
                        if (count >= 7 && count < 10) {
                            if (isPhase1Complete) bgColor = 'bg-yellow-100 text-yellow-800 border-yellow-300'; // Bonus open
                            else bgColor = 'bg-red-100 text-red-800 border-red-200'; // Full (waiting for others)
                        } else if (count >= 10) {
                            bgColor = 'bg-gray-800 text-white border-gray-600'; // Maxed out
                        }

                        return (
                            <div key={slot} className={`text-center p-1 rounded border text-xs flex flex-col items-center justify-center ${bgColor}`} title={`Horário ${slot}h - ${count} pessoas`}>
                                <span className="font-bold">{slot}h</span>
                                <span>{count}</span>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4">
                    <h5 className="font-semibold text-sm mb-2">Lista de Inscritos</h5>
                    <div className="max-h-60 overflow-y-auto border rounded bg-gray-50 p-2">
                        {selectedSignups.length === 0 ? (
                            <p className="text-gray-500 text-sm text-center">Nenhum inscrito ainda.</p>
                        ) : (
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b">
                                        <th className="py-1">Hora</th>
                                        <th className="py-1">Nome</th>
                                        <th className="py-1">WhatsApp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedSignups.sort((a, b) => a.slotNumber - b.slotNumber).map(s => (
                                        <tr key={s.id} className="border-b last:border-0 hover:bg-gray-100">
                                            <td className="py-1 font-mono">{s.slotNumber}h</td>
                                            <td className="py-1">{s.member?.name || 'Desconhecido'}</td>
                                            <td className="py-1">{s.member?.phone || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Clock className="w-6 h-6" />
                    Relógio de Oração
                </h2>
                <button
                    onClick={() => setShowNewModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Nova Campanha
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Carregando...</div>
            ) : (
                <div className="grid gap-4">
                    {campaigns.map(campaign => (
                        <div key={campaign.id} className={`bg-white p-4 rounded-lg shadow border ${selectedCampaignId === campaign.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'}`}>
                            <div className="flex justify-between items-start">
                                <div
                                    className="cursor-pointer flex-1"
                                    onClick={() => setSelectedCampaignId(selectedCampaignId === campaign.id ? null : campaign.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-lg">{campaign.title}</h3>
                                        {campaign.isActive ? (
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Ativa</span>
                                        ) : (
                                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full">Encerrada</span>
                                        )}
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">{campaign.duration} Horas</span>
                                    </div>
                                    <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                                        <Calendar size={14} />
                                        Início: {new Date(campaign.startDate).toLocaleDateString()} às {new Date(campaign.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleStatus(campaign.id, campaign.isActive)}
                                        className={`p-2 rounded hover:bg-gray-100 ${campaign.isActive ? 'text-orange-600' : 'text-green-600'}`}
                                        title={campaign.isActive ? "Pausar/Encerrar" : "Reativar"}
                                    >
                                        {campaign.isActive ? <Pause size={18} /> : <Play size={18} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(campaign.id)}
                                        className="p-2 rounded hover:bg-red-50 text-red-600"
                                        title="Excluir"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            {selectedCampaignId === campaign.id && renderGridPreview(campaign)}
                        </div>
                    ))}

                    {campaigns.length === 0 && (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded border border-dashed text-sm">
                            Nenhuma campanha de oração criada. Clique em "Nova Campanha" para começar.
                        </div>
                    )}
                </div>
            )}

            {/* Modal Nova Campanha */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md shadow-xl animate-fade-in-up">
                        <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">Criar Novo Relógio de Oração</h3>

                        {error && (
                            <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Título</label>
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    className="w-full border rounded p-2 text-slate-800 dark:text-white bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Ex: Relógio de Poder - Março"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Data de Início</label>
                                    <input
                                        type="date"
                                        value={newStartDate}
                                        onChange={e => setNewStartDate(e.target.value)}
                                        className="w-full border rounded p-2 text-slate-800 dark:text-white bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Hora de Início</label>
                                    <input
                                        type="time"
                                        value={newStartTime}
                                        onChange={e => setNewStartTime(e.target.value)}
                                        className="w-full border rounded p-2 text-slate-800 dark:text-white bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Duração</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setNewDuration(12)}
                                        className={`p-3 rounded border text-center transition-colors ${newDuration === 12 ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600'}`}
                                    >
                                        12 Horas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewDuration(48)}
                                        className={`p-3 rounded border text-center transition-colors ${newDuration === 48 ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold' : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-600'}`}
                                    >
                                        48 Horas
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowNewModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Criar Relógio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
