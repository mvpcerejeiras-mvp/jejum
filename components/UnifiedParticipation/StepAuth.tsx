import React, { useState } from 'react';
import { useParticipation } from '../../contexts/ParticipationContext';
import { Phone, User, ArrowRight, Loader } from 'lucide-react';

export function StepAuth() {
    const { login, register, setStep } = useParticipation();
    const [phone, setPhone] = useState('');
    const [name, setName] = useState('');
    const [welcomeName, setWelcomeName] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatPhone = (v: string) => {
        return v.replace(/\D/g, '')
            .replace(/^(\d{2})(\d)/g, '($1) $2')
            .replace(/(\d)(\d{4})$/, '$1-$2');
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phone.length < 14) {
            setError('Digite um número válido.');
            return;
        }

        setLoading(true);
        setError('');

        const res = await login(phone);
        setLoading(false);

        if (res.success) {
            if (res.isNewUser) {
                setIsRegistering(true);
            } else {
                if (res.member) {
                    setWelcomeName(res.member.name);
                    setTimeout(() => {
                        const nextStep = (useParticipation() as any).config?.eventMode === 'prayer_clock' ? 2 : 1;
                        setStep(nextStep);
                    }, 1500);
                } else {
                    const nextStep = (useParticipation() as any).config?.eventMode === 'prayer_clock' ? 2 : 1;
                    setStep(nextStep);
                }
            }
        } else {
            setError(res.message || 'Erro ao verificar.');
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Digite seu nome.');
            return;
        }

        setLoading(true);
        const res = await register(name, phone);
        setLoading(false);

        if (res.success) {
            const nextStep = (useParticipation() as any).config?.eventMode === 'prayer_clock' ? 2 : 1;
            setStep(nextStep);
        } else {
            setError(res.message || 'Erro ao cadastrar.');
        }
    };

    if (welcomeName) {
        return (
            <div className="animate-fade-in-up flex flex-col items-center justify-center py-10 space-y-6">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50 p-4 animate-bounce">
                    <User size={40} className="text-green-400" />
                </div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo(a) de volta!</h2>
                    <p className="text-xl text-indigo-300 font-semibold">{welcomeName}</p>
                </div>
                <Loader className="animate-spin text-slate-500" size={24} />
            </div>
        );
    }

    if (isRegistering) {
        return (
            <div className="animate-fade-in-up space-y-6">
                <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                        <User size={32} className="text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Quase lá!</h2>
                    <p className="text-slate-300 mt-2">Não encontramos seu cadastro. Digite seu nome para continuar.</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Seu Nome Completo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600"
                            placeholder="Ex: João da Silva"
                            autoFocus
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? <Loader className="animate-spin" /> : <>Continuar <ArrowRight size={20} /></>}
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsRegistering(false)}
                        className="w-full text-slate-500 text-sm py-2 hover:text-white transition-colors"
                    >
                        Voltar
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo(a)!</h2>
                <p className="text-slate-300">Digite seu WhatsApp para acessar a área de jejum e oração.</p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Phone className="text-slate-500" size={20} />
                    </div>
                    <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(formatPhone(e.target.value))}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                        autoFocus
                    />
                </div>

                {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded border border-red-900/50">{error}</p>}

                <button
                    type="submit"
                    disabled={loading || phone.length < 14}
                    className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl shadow-lg hover:bg-slate-100 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader className="animate-spin text-slate-900" /> : <>Entrar <ArrowRight size={20} /></>}
                </button>
            </form>

            <p className="text-center text-xs text-slate-500 mt-8">
                Seus dados são usados apenas para organização da igreja.
            </p>
        </div>
    );
}
