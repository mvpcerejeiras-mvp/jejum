import React from 'react';
import { useParticipation } from '../../contexts/ParticipationContext';
import { StepAuth } from './StepAuth';
import { StepFasting } from './StepFasting';
import { StepClock } from './StepClock';
import { StepSuccess } from './StepSuccess';
import { ChevronLeft, X } from 'lucide-react';

export function Wizard({ onExit }: { onExit: () => void }) {
    const { step, setStep, loading, config, setJustSaved } = useParticipation();

    React.useEffect(() => {
        // When entering the wizard, assume they intend to save/update
        setJustSaved(true);
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center text-white">Carregando...</div>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white flex flex-col">
            {/* Wizard Header */}
            <header className="p-4 flex items-center justify-between backdrop-blur-md bg-white/5 sticky top-0 z-50 border-b border-white/10">
                <div className="flex items-center gap-2">
                    {step > 0 && step < 3 && (
                        <button onClick={() => setStep(step - 1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <h1 className="font-bold text-lg tracking-wide">Jejum & Oração</h1>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="flex gap-1">
                        {[0, 1, 2, 3].map(i => (
                            <div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${i <= step ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/10'}`} />
                        ))}
                    </div>
                    <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full justify-center">
                {step === 0 && <StepAuth />}
                {step === 1 && <StepFasting />}
                {step === 2 && <StepClock />}
                {step === 3 && <StepSuccess onFinish={onExit} />}
            </main>
        </div>
    );
}
