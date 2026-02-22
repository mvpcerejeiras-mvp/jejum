import React, { useState } from 'react';
import { TIME_OPTIONS, TYPE_DESCRIPTIONS } from '../constants';
import { saveParticipant } from '../services/db';
import { FastTime, FastType } from '../types';
import {
  Check,
  Loader2,
  AlertCircle,
  Clock,
  Droplets,
  Coffee,
  Utensils,
  Leaf,
  Ban,
  BookOpen,
  ChevronDown,
  Cross,
  ArrowLeft
} from 'lucide-react';

interface RegistrationFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  fastDays: string[];
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess, onCancel, fastDays }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    days: [] as string[], // Changed to array
    time: '' as FastTime,
    type: '' as FastType,
  });

  const [expandedDesc, setExpandedDesc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMode, setSuccessMode] = useState(false);

  const formatPhone = (value: string) => {
    // Basic Brazil Phone Mask (XX) XXXXX-XXXX
    let v = value.replace(/\D/g, '');
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d)(\d{4})$/, '$1-$2');
    return v.substring(0, 15);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: formatPhone(e.target.value) });
  };

  const toggleDay = (day: string) => {
    setFormData(prev => {
      const exists = prev.days.includes(day);
      if (exists) {
        return { ...prev, days: prev.days.filter(d => d !== day) };
      } else {
        return { ...prev, days: [...prev.days, day] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validations
    if (!formData.name || !formData.phone || formData.days.length === 0 || !formData.time || !formData.type) {
      setError('Por favor, preencha todos os campos obrigatórios. Selecione pelo menos um dia.');
      return;
    }

    if (formData.phone.length < 14) {
      setError('Por favor, insira um número de WhatsApp válido.');
      return;
    }

    setIsSubmitting(true);

    // Simulate network delay for better UX feel
    await new Promise(r => setTimeout(r, 800));

    const result = await saveParticipant(formData);

    if (result.success) {
      setSuccessMode(true);
      // Wait a moment before redirecting to home to show success message
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } else {
      setError(result.message || 'Erro ao salvar.');
      setIsSubmitting(false);
    }
  };

  const getIconForText = (text: string) => {
    const lower = text.toLowerCase();
    // Hydration
    if (lower.includes('água')) return <Droplets className="w-4 h-4 text-blue-400 dark:text-blue-300" />;

    // Liquid Fasting
    if (lower.includes('chá') || lower.includes('café')) return <Coffee className="w-4 h-4 text-amber-700 dark:text-amber-500" />;

    // Plant based
    if (lower.includes('legumes') || lower.includes('frutas') || lower.includes('verduras') || lower.includes('grãos')) return <Leaf className="w-4 h-4 text-green-500 dark:text-green-400" />;

    // Food/Meals
    if (lower.includes('alimentação') || lower.includes('refeição')) return <Utensils className="w-4 h-4 text-orange-400" />;

    // Spiritual Practices - Check before 'Ban' to ensure positive actions get their specific icon
    if (lower.includes('bíblia') || lower.includes('leitura')) return <BookOpen className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />;
    if (lower.includes('oração') || lower.includes('espiritual') || lower.includes('renúncia') || lower.includes('consagração')) return <Cross className="w-4 h-4 text-purple-600 dark:text-purple-400" />;

    // Restrictions
    if (lower.includes('sem ') || lower.includes('evite') || lower.includes('abstenha') || lower.includes('não')) return <Ban className="w-4 h-4 text-red-400" />;

    // Time/General
    if (lower.includes('horário') || lower.includes('jejum')) return <Clock className="w-4 h-4 text-slate-400" />;

    // Default
    return <Check className="w-4 h-4 text-slate-300" />;
  };

  // Helper to map color strings to dark mode equivalents
  const getDarkModeClasses = (colorString: string) => {
    if (colorString.includes('green')) return 'dark:bg-green-900/40 dark:text-green-300 dark:border-green-800';
    if (colorString.includes('blue')) return 'dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800';
    if (colorString.includes('orange')) return 'dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-800';
    if (colorString.includes('red')) return 'dark:bg-red-900/40 dark:text-red-300 dark:border-red-800';
    return '';
  }

  if (successMode) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Jejum Confirmado!</h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          Glória a Deus! Sua participação foi registrada. <br />
          <span className="text-sm text-slate-400 dark:text-slate-500 mt-2 block">Retornando ao painel...</span>
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <button
        onClick={onCancel}
        className="flex items-center text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 text-sm font-medium"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Início
      </button>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Name */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">1️⃣ Nome Completo</label>
          <input
            type="text"
            className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            placeholder="Seu nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">2️⃣ WhatsApp</label>
          <input
            type="tel"
            className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            placeholder="(99) 99999-9999"
            value={formData.phone}
            onChange={handlePhoneChange}
          />
        </div>

        {/* Day - UPDATED TO MULTI-SELECT GRID LAYOUT */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            3️⃣ Escolha o(s) Dia(s) do Jejum <span className="text-slate-400 font-normal ml-1 text-xs">(Pode marcar mais de um)</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fastDays.map((dayOption) => {
              const [dayName, dayTheme] = dayOption.split(' – ');
              const isSelected = formData.days.includes(dayOption);

              return (
                <div
                  key={dayOption}
                  onClick={() => toggleDay(dayOption)}
                  className={`
                    relative cursor-pointer p-4 rounded-xl border transition-all duration-200 group select-none
                    ${isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 dark:border-indigo-400 ring-1 ring-indigo-500 dark:ring-indigo-400 shadow-md'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-700 dark:text-slate-300'}`}>
                        {dayName}
                      </span>
                      {dayTheme && (
                        <span className={`text-xs mt-0.5 font-medium ${isSelected ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                          Tema: {dayTheme}
                        </span>
                      )}
                    </div>

                    <div className={`
                      w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                      ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'}
                    `}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-right text-xs text-slate-400 dark:text-slate-500 min-h-[1.5em]">
            {formData.days.length > 0 ? `${formData.days.length} dia(s) selecionado(s)` : 'Nenhum dia selecionado'}
          </div>
        </div>

        {/* Time */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">4️⃣ Horário de Início</label>
          <div className="space-y-2">
            {TIME_OPTIONS.map((time) => {
              return (
                <label key={time} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${formData.time === time ? 'border-green-500 bg-green-50 dark:bg-green-900/20 dark:border-green-600 ring-1 ring-green-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 bg-white dark:bg-slate-800'}`}>
                  <input
                    type="radio"
                    name="fastTime"
                    value={time}
                    checked={formData.time === time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value as FastTime })}
                    className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 dark:bg-slate-700 dark:border-slate-500"
                  />
                  <span className={`ml-3 text-sm ${formData.time === time ? 'text-slate-800 dark:text-green-100' : 'text-slate-700 dark:text-slate-300'}`}>{time}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Type */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">5️⃣ Escolha do Tipo de Jejum</label>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {TYPE_DESCRIPTIONS.map((typeDesc) => {
              const isSelected = formData.type === typeDesc.id;

              // Existing Light Mode Classes from Constant
              const colorParts = typeDesc.color.split(' ');
              const bgClass = colorParts.find(c => c.startsWith('bg-')) || 'bg-slate-50';
              const textClass = colorParts.find(c => c.startsWith('text-')) || 'text-slate-800';
              const borderClass = colorParts.find(c => c.startsWith('border-')) || 'border-slate-300';
              const ringClass = borderClass.replace('border-', 'ring-');

              // Derived Dark Mode Classes
              const darkClasses = getDarkModeClasses(typeDesc.color);

              // Dot color
              const dotBgClass = textClass.replace('text-', 'bg-');

              return (
                <label
                  key={typeDesc.id}
                  className={`
                    relative flex flex-col border rounded-xl cursor-pointer transition-all duration-300 h-full overflow-hidden
                    ${isSelected
                      ? `ring-2 ${ringClass} dark:ring-opacity-60 bg-white dark:bg-slate-800 ring-offset-1 dark:ring-offset-slate-900 scale-[1.02] shadow-xl z-10 ${borderClass} dark:border-opacity-50`
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="fastType"
                    value={typeDesc.id}
                    checked={isSelected}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as FastType })}
                    className="sr-only"
                  />

                  {/* Colored Header */}
                  <div className={`px-4 py-3 border-b flex items-start gap-3 transition-colors ${isSelected ? `${bgClass} ${darkClasses}` : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
                    }`}>
                    {/* Custom Radio/Check */}
                    <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${isSelected
                      ? 'border-transparent bg-white shadow-sm'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700'
                      }`}>
                      {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${dotBgClass}`} />}
                    </div>

                    <span className={`text-sm font-bold leading-tight ${isSelected ? `${textClass} dark:text-current` : 'text-slate-700 dark:text-slate-300'}`}>
                      {typeDesc.title}
                    </span>
                  </div>

                  <div className="p-4 flex-1">
                    <ul className={`space-y-3 ${isSelected ? 'opacity-100' : 'opacity-80'}`}>
                      {typeDesc.description.map((descItem, idx) => {
                        const itemKey = `${typeDesc.id}-${idx}`;
                        const isExpanded = expandedDesc === itemKey;
                        const Icon = getIconForText(descItem.text);

                        return (
                          <li
                            key={idx}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedDesc(isExpanded ? null : itemKey);
                            }}
                            className="group"
                          >
                            <div className="flex items-start text-sm text-slate-600 dark:text-slate-300 leading-relaxed cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
                              <div className="mt-0.5 mr-2.5 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                                {Icon}
                              </div>
                              <span className="flex-1 border-b border-dashed border-slate-300 dark:border-slate-600 pb-0.5 group-hover:border-slate-500 dark:group-hover:border-slate-400 transition-colors">
                                {descItem.text}
                              </span>
                              <ChevronDown
                                className={`w-3 h-3 ml-1 mt-1.5 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </div>

                            {/* Expandable Detail */}
                            <div className={`
                               overflow-hidden transition-all duration-300 ease-in-out
                               ${isExpanded ? 'max-h-20 opacity-100 mt-1.5' : 'max-h-0 opacity-0'}
                             `}>
                              <p className="text-xs font-medium text-slate-700 dark:text-slate-200 ml-7 bg-white dark:bg-slate-900/50 p-3 rounded-md border border-slate-200 dark:border-slate-600 shadow-sm">
                                {descItem.detail}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transform transition active:scale-[0.98] flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Registrando...
            </>
          ) : (
            "Confirmar minha participação no Jejum"
          )}
        </button>

      </form>
    </div>
  );
};

export default RegistrationForm;