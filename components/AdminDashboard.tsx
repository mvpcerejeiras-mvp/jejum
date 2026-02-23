import React, { useState, useEffect } from 'react';
import { PrayerCampaignManager } from './PrayerCampaignManager';
import { getParticipants, getSettings, saveSettings, uploadLogo, updateParticipant, deleteParticipant, getMembers, saveMember, updateMember, deleteMember, migrateParticipantsToMembers, deleteAllMembers, archiveCurrentFast, getMemberHistory, getSystemConfig, saveSystemConfig } from '../services/db';
import { Participant, AppSettings, FastTime, Member, FastingHistory, SystemConfig } from '../types';
import { Download, Save, Search, LogOut, Settings, Users, BarChart3, PieChart, Activity, Clock, List, Flame, Cross, BookOpen, Heart, Sun, Mountain, Star, Trash2, Plus, GripVertical, Pencil, Trash, X, RefreshCw, Archive, History, Sparkles, MessageCircle, Share2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { processReminders } from '../services/reminders';
import { sendWhatsAppMessage } from '../services/whatsapp';
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
  const [activeTab, setActiveTab] = useState<'participants' | 'settings' | 'analytics' | 'members' | 'prayer-clock' | 'prayer-campaigns' | 'reminders'>('participants');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ theme: '', instruction: '', appTitle: '', logoId: '', fastDays: [] });
  const [reminderLogs, setReminderLogs] = useState<any[]>([]);
  const [isProcessingReminders, setIsProcessingReminders] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewMessage, setPreviewMessage] = useState('');
  const [previewRecipient, setPreviewRecipient] = useState<Participant | null>(null);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

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
      const mems = await getMembers();
      setMembers(mems);
      const sets = await getSettings();
      setSettings(sets);
      const config = await getSystemConfig();
      setSystemConfig(config as SystemConfig);

      const { data: logs } = await supabase
        .from('reminder_logs')
        .select('*, members(name, phone)')
        .order('sent_at', { ascending: false })
        .limit(50);
      setReminderLogs(logs || []);
    };
    loadData();
  }, [onSettingsChange]); // Reload when settings change trigger happens (e.g. parent refresh, though here we trigger parent)

  const handleSaveSettings = async () => {
    const res = await saveSettings(settings);
    if (res.success) {
      onSettingsChange();
      alert('Configurações salvas!');
    } else {
      alert('Erro ao salvar as configurações. Verifique a conexão ou se o campo é suportado.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const publicUrl = await uploadLogo(file);
      if (publicUrl) {
        setSettings({ ...settings, logoId: publicUrl });
      } else {
        alert('Erro ao enviar imagem. Tente novamente.');
      }
    }
  };

  // CRUD State
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  const handleSendWhatsApp = async (p: Participant) => {
    // Pegar apenas o primeiro nome
    const firstName = p.name.split(' ')[0];

    // Buscar horários de oração e informações da campanha
    let prayerInfo = "";
    if (p.member_id) {
      const { data: signups } = await supabase
        .from('prayer_signups')
        .select(`
          slot_number,
          campaign:prayer_campaigns(start_date)
        `)
        .eq('member_id', p.member_id)
        .order('slot_number', { ascending: true });

      if (signups && signups.length > 0) {
        prayerInfo = "\n\n🕗 *Relógio de Oração (08/03)*";
        signups.forEach(s => {
          // Calcular a hora exata baseada no start_date da campanha e no slot_number
          const campaign = Array.isArray(s.campaign) ? s.campaign[0] : s.campaign;
          if (campaign && campaign.start_date) {
            const baseDate = new Date(campaign.start_date);
            baseDate.setHours(baseDate.getHours() + s.slot_number);
            const hour = baseDate.getHours().toString().padStart(2, '0');
            prayerInfo += `\n${hour}:00 – Intercessão na igreja`;
          }
        });
      }
    }

    // Configurar informações de tempo e dias
    const isFullWeek = p.days.length === settings.fastDays.length && settings.fastDays.length > 0;
    const daysStr = isFullWeek ? "Semana toda de Jejum (Segunda a Sexta)" : p.days.map(d => d.split(' – ')[0]).join(', ');

    // Buscar detalhes do tipo de jejum nas constantes
    const typeObj = TYPE_DESCRIPTIONS.find(t => t.id === p.type);
    const details = typeObj?.description.map(d => `* ${d.text}: ${d.detail}`).join('\n') || "";

    // Lógica de horários (Mantendo o padrão do exemplo do usuário)
    let timeInfo = "";
    if (p.type.includes('Opção 5')) {
      timeInfo = `⏰ Início do Jejum: 02/03 às 18h ou 19h\n🏁 Entrega do Jejum: 03/03 às 18h ou 19h (24h depois)`;
    } else {
      const endTime = p.time === 'Personalizado' ? 'horário escolhido' : p.time;
      timeInfo = `⏰ Início do Jejum: 02/03 às 00:00h\n🏁 Entrega do Jejum: 06/03 às ${endTime}`;
    }

    const msg = `Graça e paz ${firstName}!

✅ Seu Propósito de Jejum e Oração foi Confirmado!

Que Deus abençoe sua consagração 🙏🔥

🗓 Jejum – ${daysStr}
🚀 ${p.type}

${timeInfo}

Detalhes do Jejum:
${details}${prayerInfo}

Permaneça firme. Seu posicionamento gera resposta no céu. ✨`;

    setPreviewMessage(msg);
    setPreviewRecipient(p);
    setIsPreviewModalOpen(true);
  };

  const confirmSendWhatsApp = async () => {
    if (!previewRecipient || !previewMessage) return;

    setIsSendingWhatsApp(true);
    const res = await sendWhatsAppMessage(previewRecipient.phone, previewMessage);
    setIsSendingWhatsApp(false);

    if (res.success) {
      alert(`Mensagem enviada com sucesso!`);
      setIsPreviewModalOpen(false);
      setPreviewRecipient(null);
      setPreviewMessage('');
    } else {
      alert(`Erro ao enviar: ${res.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esse participante?')) {
      console.log(`[Admin] Iniciando exclusão do participante ID: ${id}`);
      const res = await deleteParticipant(id);

      if (res.success) {
        console.log(`[Admin] Exclusão confirmada pelo servidor para ID: ${id}`);
        // Optimistic remove is enough, we don't need to refetch immediately 
        // which might trigger a race condition if Supabase hasn't fully propagated the delete
        setParticipants(prev => prev.filter(p => p.id !== id));
      } else {
        console.error(`[Admin] Erro ao excluir: ${res.message}`, res);
        alert(res.message || 'Erro ao excluir');
      }
    }
  };

  const handleEditClick = (participant: Participant) => {
    setEditingParticipant({ ...participant });
  };

  const handleUpdate = async () => {
    if (!editingParticipant) return;

    // Optimistic Update
    const res = await updateParticipant(editingParticipant.id!, editingParticipant);
    if (res.success) {
      setParticipants(participants.map(p => p.id === editingParticipant.id ? editingParticipant : p));
      setEditingParticipant(null);
    } else {
      alert(res.message || 'Erro ao atualizar');
    }
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

  const handleArchiveFast = async () => {
    const eventName = prompt('Digite o nome deste evento para salvar no histórico (ex: "Jejum Março 2026"):');
    if (!eventName) return;

    if (confirm(`ATENÇÃO: Você está prestes a encerrar o evento "${eventName}".\n\n1. Todos os participantes atuais serão salvos no histórico.\n2. Quem não for membro será cadastrado automaticamente.\n3. A lista de participantes atual será LIMPA.\n\nDeseja continuar?`)) {
      const res = await archiveCurrentFast(eventName);
      if (res.success) {
        alert(res.message);
        setParticipants([]); // Clear local state
        // Refresh members to get any new ones
        const mems = await getMembers();
        setMembers(mems);
        return true;
      } else {
        alert(res.message);
        return false;
      }
    }
    return false;
  };

  const handlePrepareNextMonth = async () => {
    const success = await handleArchiveFast();
    if (success) {
      if (confirm('Deseja ser levado para a aba de Campanhas para criar o Relógio de Oração do próximo mês?')) {
        setActiveTab('prayer-campaigns');
      }
    }
  };

  // --- Member History Helpers ---
  const [historyMember, setHistoryMember] = useState<Member | null>(null);
  const [memberHistory, setMemberHistory] = useState<FastingHistory[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const openHistoryModal = async (member: Member) => {
    setHistoryMember(member);
    setIsHistoryModalOpen(true);
    const history = await getMemberHistory(member.id);
    setMemberHistory(history);
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

  // --- Member CRUD Helpers ---
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberForm, setMemberForm] = useState<{ name: string; phone: string }>({ name: '', phone: '' });

  const openMemberModal = (member?: Member) => {
    if (member) {
      setEditingMember(member);
      setMemberForm({ name: member.name, phone: member.phone });
    } else {
      setEditingMember(null);
      setMemberForm({ name: '', phone: '' });
    }
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async () => {
    if (!memberForm.name || !memberForm.phone) return alert('Preencha nome e telefone');

    if (editingMember) {
      const res = await updateMember(editingMember.id, memberForm);
      if (res.success) {
        setMembers(members.map(m => m.id === editingMember.id ? { ...m, ...memberForm } as Member : m));
        setIsMemberModalOpen(false);
      } else alert(res.message);
    } else {
      const res = await saveMember(memberForm);
      if (res.success) {
        const updated = await getMembers();
        setMembers(updated);
        setIsMemberModalOpen(false);
      } else alert(res.message || 'Erro ao salvar');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este membro?')) {
      const res = await deleteMember(id);
      if (res.success) {
        setMembers(members.filter(m => m.id !== id));
      } else alert(res.message);
    }
  };

  const handleSyncMembers = async () => {
    if (confirm('Deseja importar todos os participantes atuais para a lista de membros? Isso não criará duplicatas.')) {
      const res = await migrateParticipantsToMembers();
      if (res.success) {
        alert(res.message + (res.count ? ` (${res.count} adicionados)` : ''));
        const updated = await getMembers();
        setMembers(updated);
      } else {
        alert(res.message);
      }
    }
  };

  const handleDeleteAllMembers = async () => {
    if (confirm('ATENÇÃO: Tem certeza absoluta que deseja excluir TODOS os membros cadastrados? Esta ação não pode ser desfeita.')) {
      if (confirm('Confirmação final: Deseja realmente apagar todo o banco de membros?')) {
        const res = await deleteAllMembers();
        if (res.success) {
          alert(res.message);
          setMembers([]);
        } else {
          alert(res.message);
        }
      }
    }
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm)
  );

  const handleRunReminders = async () => {
    setIsProcessingReminders(true);
    try {
      const results = await processReminders();
      alert(`Processamento finalizado!\nLembretes de Jejum: ${results.fastingReminders}\nLembretes de Oração: ${results.prayerReminders}\nErros: ${results.errors.length}`);

      // Atualizar logs
      const { data: logs } = await supabase
        .from('reminder_logs')
        .select('*, members(name, phone)')
        .order('sent_at', { ascending: false })
        .limit(50);
      setReminderLogs(logs || []);
    } catch (error) {
      console.error(error);
      alert('Erro ao processar lembretes.');
    } finally {
      setIsProcessingReminders(false);
    }
  };

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden min-h-[700px] flex flex-col transition-all border border-white/20 dark:border-slate-700">
      {/* Admin Header - Premium Gradient */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex justify-between items-center relative overflow-hidden">
        {/* Abstract background accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="relative z-10">
          <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight">
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping opacity-75"></div>
            </div>
            <span>Painel Administrativo</span>
          </h2>
          <p className="text-slate-400 text-sm font-bold mt-1 ml-6 uppercase tracking-widest opacity-60">Sistema de Gestão & Ciclos</p>
        </div>

        <button
          onClick={onLogout}
          className="relative z-10 group flex items-center gap-2 text-slate-300 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-sm backdrop-blur-sm border border-white/10"
        >
          <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Sair</span>
        </button>
      </div>

      {/* Tabs - Modern Navigation - Refactored to Pills */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-20">
        <div className="flex overflow-x-auto gap-2 scrollbar-hide bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl max-w-fit">
          {[
            { id: 'participants', icon: <Users size={16} />, label: 'Participantes' },
            { id: 'members', icon: <BookOpen size={16} />, label: 'Membros' },
            { id: 'prayer-clock', icon: <Clock size={16} />, label: 'Relógio' },
            { id: 'prayer-campaigns', icon: <List size={16} />, label: 'Campanhas' },
            { id: 'analytics', icon: <BarChart3 size={16} />, label: 'Estatísticas' },
            { id: 'reminders', icon: <Activity size={16} />, label: 'Lembretes' },
            { id: 'settings', icon: <Settings size={16} />, label: 'Configurações' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-semibold flex items-center gap-2 transition-all rounded-lg whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 flex-1 overflow-auto bg-slate-50 dark:bg-slate-900">

        {/* --- PARTICIPANTS TAB --- */}
        {activeTab === 'participants' && (
          <div className="space-y-6 animate-fade-in">
            {/* Toolbar - Single Line on Desktop */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 backdrop-blur-md bg-white/80 dark:bg-slate-800/80">
              <div className="flex flex-col md:flex-row gap-3 flex-1">
                <div className="relative flex-1 group max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all focus:max-w-full"
                  />
                </div>

                {/* Filter Dropdowns */}
                <div className="flex gap-2">
                  <select
                    value={filterDay}
                    onChange={(e) => setFilterDay(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all min-w-[140px]"
                  >
                    <option value="">Todos os Dias</option>
                    {settings.fastDays.map((day, i) => (
                      <option key={i} value={day}>{day}</option>
                    ))}
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer transition-all min-w-[140px]"
                  >
                    <option value="">Todos os Tipos</option>
                    {TYPE_DESCRIPTIONS.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons - More Compact on Desktop */}
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handlePrepareNextMonth}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Sparkles size={16} />
                  <span className="hidden sm:inline">Próximo Mês</span>
                </button>
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                  <button
                    onClick={handleArchiveFast}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-all"
                    title="Encerrar Jejum"
                  >
                    <Archive size={18} />
                  </button>
                  <button
                    onClick={exportCSV}
                    className="p-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-600 rounded-md transition-all"
                    title="Exportar CSV"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Table - Optimized for Desktop with Sticky Header */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden transition-all">
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md z-10 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Participante</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Compromisso</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Categoria</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Inscrição</th>
                      <th className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Controle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 dark:text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-4">
                            <Search size={48} className="opacity-10" />
                            <p className="font-medium">Nenhum registro encontrado para estes filtros.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map(p => (
                        <tr key={p.id} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-300">
                          <td className="px-8 py-5">
                            <div className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{p.name}</div>
                            <div className="text-slate-500 dark:text-slate-400 text-xs font-semibold">{p.phone}</div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex flex-wrap gap-2">
                              {p.days.length === settings.fastDays.length && settings.fastDays.length > 0 ? (
                                <span className="bg-indigo-100 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                  Semana Toda
                                </span>
                              ) : (
                                p.days.map((day, idx) => {
                                  const dayName = day.split(' – ')[0];
                                  return (
                                    <span key={idx} className="bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 transition-colors">
                                      {dayName}
                                    </span>
                                  );
                                })
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-widest shadow-sm border ${p.type.includes('Água') ? 'bg-blue-50 text-blue-700 border-blue-100' :
                              p.type.includes('Parcial') ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                p.type.includes('Total') ? 'bg-red-50 text-red-700 border-red-100' :
                                  'bg-indigo-50 text-indigo-700 border-indigo-100'
                              }`}>
                              {p.type.split('–')[0]}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-slate-500 dark:text-slate-400 text-xs font-bold">
                            {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => handleSendWhatsApp(p)}
                                className="p-2 text-slate-400 hover:text-green-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                                title="Enviar para WhatsApp"
                              >
                                <MessageCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleEditClick(p)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                                title="Editar"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id!)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                                title="Excluir"
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-xs font-medium text-slate-400 dark:text-slate-500 text-right px-2">
              Total: {filteredParticipants.length} registros
            </div>
          </div>
        )}

        {/* --- ANALYTICS TAB --- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Dashboard Grid - Optimized for Desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-slate-700 shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Inscritos</p>
                  <h3 className="text-4xl font-black text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{participants.length}</h3>
                </div>
                <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                  <Users className="text-indigo-600 dark:text-indigo-400 w-7 h-7" />
                </div>
              </div>

              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-slate-700 shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Maior Adesão</p>
                  <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
                    {dayCounts.length > 0 && dayCounts[0][1] > 0 ? getDayLabel(dayCounts[0][0]) : '-'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-green-600 dark:text-green-400 font-bold text-xs uppercase">
                    <Activity size={12} />
                    <span>{dayCounts.length > 0 && dayCounts[0][1] > 0 ? `${dayCounts[0][1]} Pessoas` : '0'}</span>
                  </div>
                </div>
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform">
                  <Flame className="text-green-600 dark:text-green-400 w-7 h-7" />
                </div>
              </div>

              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-slate-700 shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Membros</p>
                  <h3 className="text-4xl font-black text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{members.length}</h3>
                </div>
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
                  <BookOpen className="text-blue-600 dark:text-blue-400 w-7 h-7" />
                </div>
              </div>

              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-2xl border border-white/20 dark:border-slate-700 shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-all duration-300">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mb-1">Atividade</p>
                  <h3 className="text-4xl font-black text-slate-800 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">7d</h3>
                </div>
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform">
                  <Sparkles className="text-purple-600 dark:text-purple-400 w-7 h-7" />
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

        {/* --- PRAYER CLOCK TAB --- */}
        {activeTab === 'prayer-clock' && (
          <div className="max-w-4xl mx-auto">
            <PrayerCampaignManager />
          </div>
        )}

        {/* --- REMINDERS TAB --- */}
        {activeTab === 'reminders' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Activity size={24} className="text-indigo-500" />
                  Sistema de Lembretes Automáticos
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  O sistema envia notificações às 20h da véspera (Jejum) e 30min antes (Oração).
                </p>
              </div>
              <button
                onClick={handleRunReminders}
                disabled={isProcessingReminders}
                className={`flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 ${isProcessingReminders ? 'animate-pulse' : ''}`}
              >
                {isProcessingReminders ? <RefreshCw size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                {isProcessingReminders ? 'Processando...' : 'Processar Agora'}
              </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                  <List size={14} /> últimos Envios
                </h4>
                <span className="text-[10px] font-bold text-slate-400">Total: {reminderLogs.length} logs recentes</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/30">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Membro</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Referência</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Data Envio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {reminderLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400 text-sm italic">
                          Nenhum lembrete enviado recentemente.
                        </td>
                      </tr>
                    ) : (
                      reminderLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{log.members?.name}</div>
                            <div className="text-[10px] text-slate-500">{log.members?.phone}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${log.type === 'fasting'
                              ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800'
                              }`}>
                              {log.type === 'fasting' ? 'Jejum' : 'Oração'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {log.target_date}
                          </td>
                          <td className="px-6 py-4 text-right text-xs text-slate-500">
                            {new Date(log.sent_at).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-2xl mx-auto pb-12">

            {/* NOVO: Configuração do Modo do Evento */}
            <div className="bg-indigo-600 dark:bg-indigo-700 p-6 rounded-xl shadow-lg border border-indigo-500 text-white animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-indigo-200" />
                <h3 className="text-xl font-bold">Modo de Participação</h3>
              </div>
              <p className="text-indigo-100 text-sm mb-6">Selecione como os membros devem participar do evento atual.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={async () => {
                    const res = await saveSystemConfig('fasting');
                    if (res.success) {
                      const config = await getSystemConfig();
                      setSystemConfig(config as any);
                      alert('Modo "Apenas Jejum" ativado!');
                    }
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${systemConfig?.eventMode === 'fasting' ? 'border-white bg-white/20 shadow-inner' : 'border-indigo-400 bg-white/5 hover:bg-white/10'}`}
                >
                  <div className="font-bold text-sm">Apenas Jejum</div>
                </button>

                <button
                  onClick={async () => {
                    const res = await saveSystemConfig('prayer_clock');
                    if (res.success) {
                      const config = await getSystemConfig();
                      setSystemConfig(config as any);
                      alert('Modo "Apenas Relógio" ativado!');
                    }
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${systemConfig?.eventMode === 'prayer_clock' ? 'border-white bg-white/20 shadow-inner' : 'border-indigo-400 bg-white/5 hover:bg-white/10'}`}
                >
                  <div className="font-bold text-sm">Apenas Relógio</div>
                </button>

                <button
                  onClick={async () => {
                    const res = await saveSystemConfig('combined');
                    if (res.success) {
                      const config = await getSystemConfig();
                      setSystemConfig(config as any);
                      alert('Modo "Combo" ativado!');
                    }
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${systemConfig?.eventMode === 'combined' ? 'border-white bg-white shadow-md text-indigo-700 font-black' : 'border-indigo-300 bg-white/10 hover:bg-white/20'}`}
                >
                  <div className="text-xs uppercase opacity-80 mb-1">Recomendado</div>
                  <div className="font-bold text-sm">Modo Combo</div>
                </button>
              </div>
            </div>

            {/* Configurações Visuais Existentes */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
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
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Título do Relógio de Oração</label>
                <input
                  type="text"
                  className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
                  value={settings.prayerClockTitle || ''}
                  onChange={e => setSettings({ ...settings, prayerClockTitle: e.target.value })}
                  placeholder="Padrão: Relógio de Oração"
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

                  {/* Upload Option */}
                  <label className="cursor-pointer flex flex-col items-center justify-center p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all w-20 h-20">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <span className="text-2xl text-slate-400 dark:text-slate-500">+</span>
                    <span className="text-xs mt-1 font-medium text-slate-500 dark:text-slate-400">Upload</span>
                  </label>
                </div>

                {/* Preview custom logo text */}
                {settings.logoId?.startsWith('http') && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Logo personalizada selecionada.
                  </div>
                )}
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

        {/* --- MEMBERS TAB --- */}
        {activeTab === 'members' && (
          <div className="space-y-6 animate-fade-in">
            {/* Toolbar - Modern Card */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="relative flex-1 group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors h-4 w-4" />
                <input
                  type="text"
                  placeholder="Buscar membro..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteAllMembers}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                  title="Excluir todos os membros"
                >
                  <Trash2 size={16} /> <span className="hidden sm:inline">Excluir Todos</span>
                </button>
                <button
                  onClick={handleSyncMembers}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-all shadow-sm hover:shadow"
                  title="Importar participantes da lista de jejum para membros"
                >
                  <RefreshCw size={16} /> <span className="hidden sm:inline">Sincronizar</span>
                </button>
                <button
                  onClick={() => openMemberModal()}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-0.5"
                >
                  <Plus size={16} /> Novo Membro
                </button>
              </div>
            </div>

            {/* Table - Glass/Clean Look */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">WhatsApp</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data Cadastro</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredMembers.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400">Nenhum membro encontrado.</td></tr>
                  ) : (
                    filteredMembers.map(m => (
                      <tr key={m.id} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{m.name}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{m.phone}</td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">{new Date(m.createdAt).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openHistoryModal(m)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all" title="Ver Histórico"><History size={16} /></button>
                            <button onClick={() => openMemberModal(m)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all" title="Editar"><Pencil size={16} /></button>
                            <button onClick={() => handleDeleteMember(m.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all" title="Excluir"><Trash size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}


      </div>

      {/* History Modal */}
      {isHistoryModalOpen && historyMember && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Histórico de Participação</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{historyMember.name} • {historyMember.phone}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <div className="p-0 overflow-y-auto flex-1">
              {memberHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  Nenhum histórico encontrado para este membro.
                </div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 font-semibold uppercase text-xs sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Evento</th>
                      <th className="px-6 py-3">Tipo</th>
                      <th className="px-6 py-3">Dias</th>
                      <th className="px-6 py-3 text-right">Data Arquivamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {memberHistory.map(h => (
                      <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">{h.eventName}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                            {h.type.split('–')[0]}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs">
                          {h.days.map(d => {
                            const dayName = d.split(' – ')[0].split('-')[0];
                            return dayName.substring(0, 1).toUpperCase() + dayName.substring(1, 3).toLowerCase();
                          }).join(', ')}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500 dark:text-slate-400 text-xs">
                          {new Date(h.archivedAt).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button onClick={() => setIsHistoryModalOpen(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Member Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{editingMember ? 'Editar Membro' : 'Novo Membro'}</h3>
              <button onClick={() => setIsMemberModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                <input type="text" className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={memberForm.name} onChange={e => setMemberForm({ ...memberForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
                <input type="text" className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={memberForm.phone} onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
              <button onClick={() => setIsMemberModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-sm">Cancelar</button>
              <button onClick={handleSaveMember} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingParticipant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Editar Participante</h3>
              <button onClick={() => setEditingParticipant(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={editingParticipant.name}
                  onChange={e => setEditingParticipant({ ...editingParticipant, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Telefone</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={editingParticipant.phone}
                  onChange={e => setEditingParticipant({ ...editingParticipant, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jejum</label>
                <select
                  className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                  value={editingParticipant.type}
                  onChange={e => setEditingParticipant({ ...editingParticipant, type: e.target.value })}
                >
                  {TYPE_DESCRIPTIONS.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-2">
              <button
                onClick={() => setEditingParticipant(null)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Preview Modal */}
      {isPreviewModalOpen && previewRecipient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 dark:border-slate-700 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight">Revisar Mensagem</h3>
                    <p className="text-green-100 text-xs font-bold uppercase tracking-widest opacity-80">WhatsApp para {previewRecipient.name.split(' ')[0]}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-black/10 hover:bg-black/20 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between px-1">
                <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Conteúdo da Mensagem</label>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                  {previewRecipient.phone}
                </span>
              </div>

              <textarea
                className="w-full h-80 p-4 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-4 focus:ring-green-500/10 focus:border-green-500 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 text-sm outline-none transition-all resize-none font-medium leading-relaxed scrollbar-hide"
                value={previewMessage}
                onChange={(e) => setPreviewMessage(e.target.value)}
                placeholder="Digite sua mensagem aqui..."
              />

              <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 px-1 italic">
                <Sparkles size={12} className="text-green-500" />
                <span>Você pode editar o texto acima antes de enviar.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex gap-3">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="flex-1 px-6 py-3 text-slate-600 dark:text-slate-400 font-bold text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={confirmSendWhatsApp}
                disabled={isSendingWhatsApp}
                className="flex-3 px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {isSendingWhatsApp ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Share2 size={18} />
                )}
                {isSendingWhatsApp ? 'Enviando...' : 'Enviar Agora'}
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

export default AdminDashboard;