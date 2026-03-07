import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, ChevronRight, CheckCircle2, Clock, Settings, X, Save, RefreshCw, Moon, Sun, Users, Share2, Check } from 'lucide-react';

// Escala de Equipes por Hora
const teamSchedule: Record<number, string> = {
    6: "SHALOM",
    7: "RHEMA",
    8: "ÁGAPE",
    9: "LOGOS",
    10: "KAIRÓS",
    11: "EL SHADDAI",
    12: "ADONAI",
    13: "HOSANA",
    14: "ALELUIA",
    15: "MARANATA",
    16: "EMMANUEL",
    17: "SHEKINAH"
};

// Dados extraídos da imagem fornecida
const defaultPrayerData = [
    {
        id: 1, title: "MENTE PARA GOVERNAR, CORAÇÃO PARA SERVIR",
        block: "BLOCO 01 - RELAÇÃO COM DEUS",
        color: "#d4f0b3", blockColor: "#a3d977",
        items: [
            "Sabedoria do alto para governar com discernimento espiritual",
            "Líderes com espírito de servo, não de posição",
            "Mente renovada pela Palavra em toda a liderança",
            "Decisões ministeriais guiadas pelo Espírito Santo",
            "Geração que governa com humildade e temor ao Senhor"
        ]
    },
    {
        id: 2, title: "LEVANTAR-SE E RESPLANDECER",
        block: "BLOCO 01 - RELAÇÃO COM DEUS",
        color: "#c7e8a9", blockColor: "#a3d977",
        items: [
            "Que a igreja se levante espiritualmente nesta geração",
            "Cidade impactada pela luz do Evangelho",
            "Jovens e adolescentes como testemunhas de Cristo",
            "Famílias sendo luz em seus bairros e trabalhos",
            "Que a glória do Senhor seja vista sobre a igreja"
        ]
    },
    {
        id: 3, title: "TORNANDO SONHOS EM REALIDADE",
        block: "BLOCO 01 - RELAÇÃO COM DEUS",
        color: "#b9e09d", blockColor: "#a3d977",
        items: [
            "Deus cumpra os propósitos plantados no coração da igreja",
            "Projetos ministeriais prosperem segundo a vontade de Deus",
            "Jovens descubram seu chamado e destino em Deus",
            "Que Deus abra portas que ninguém pode fechar",
            "Sonhos gerados no Espírito se tornem realidade no tempo certo"
        ]
    },
    {
        id: 4, title: "FOCADOS NAS PROMESSAS E FIRMADOS NA VERDADE",
        block: "BLOCO 02 - RELAÇÃO CONSIGO MESMO",
        color: "#a3d9c9", blockColor: "#6abf9f",
        items: [
            "Que a igreja permaneça firme na Palavra de Deus",
            "Líderes ministrem a verdade com coragem e fidelidade",
            "Jovens guardados das mentiras deste tempo",
            "Palavra de Cristo habite abundantemente na igreja",
            "Que as promessas de Deus se cumpram sobre o povo"
        ]
    },
    {
        id: 5, title: "DE VOLTA À ESSÊNCIA (EVANGELHO)",
        block: "BLOCO 02 - RELAÇÃO CONSIGO MESMO",
        color: "#8bcba4", blockColor: "#6abf9f",
        items: [
            "Que a igreja volte ao centro do Evangelho de Cristo",
            "Vidas alcançadas pelas boas novas da salvação",
            "Que o arrependimento genuíno alcance corações",
            "Amor por Jesus renovado na igreja",
            "Evangelho pregado com poder e simplicidade"
        ]
    },
    {
        id: 6, title: "FÉ QUE MUDA CENÁRIOS",
        block: "BLOCO 02 - RELAÇÃO CONSIGO MESMO",
        color: "#a1d5c2", blockColor: "#6abf9f",
        items: [
            "Deus fortaleça a fé da igreja em tempos difíceis",
            "Milagres e intervenções sobrenaturais aconteçam",
            "Famílias restauradas pela fé em Deus",
            "Enfermidades e opressões quebradas pelo poder do Senhor",
            "Igreja vivendo uma fé ativa e ousada"
        ]
    },
    {
        id: 7, title: "DESERTO, LUGAR DE ENCONTRO",
        block: "BLOCO 03 - RELAÇÃO COM OS OUTROS",
        color: "#fabb61", blockColor: "#f29c38",
        items: [
            "Transformação de momentos difíceis em encontros com Ele",
            "Pessoas feridas encontrem cura na presença do Senhor",
            "Deus fortaleça aqueles que estão passando por provas",
            "Espírito Santo fale nos desertos da vida",
            "Maturidade espiritual produzida pelo deserto na igreja"
        ]
    },
    {
        id: 8, title: "CONHECER JESUS E SUA PALAVRA",
        block: "BLOCO 03 - RELAÇÃO COM OS OUTROS",
        color: "#f5af53", blockColor: "#f29c38",
        items: [
            "Fome profunda pela Palavra de Deus em toda a igreja",
            "Crianças do AMI crescendo conhecendo Jesus desde cedo",
            "Adolescentes e jovens apaixonados pela verdade bíblica",
            "Ensino da Palavra transformando vidas",
            "Cada membro com intimidade real com Cristo"
        ]
    },
    {
        id: 9, title: "EU CREIO",
        block: "BLOCO 03 - RELAÇÃO COM OS OUTROS",
        color: "#f2ab4b", blockColor: "#f29c38",
        items: [
            "Que a incredulidade seja quebrada no meio da igreja",
            "Espírito Santo renove a esperança das pessoas",
            "Orações antigas recebendo resposta",
            "Fé fortalecida nas famílias",
            "Igreja caminhando confiando nas promessas de Deus"
        ]
    },
    {
        id: 10, title: "VOU OUVIR O QUE O MUNDO JAMAIS OUVIU",
        block: "BLOCO 04 - RELAÇÃO COM O MUNDO",
        color: "#fbe6b3", blockColor: "#ebd083",
        items: [
            "Profetas e intercessores sensíveis à Sua voz",
            "Discernimento dos tempos espirituais pela igreja",
            "Deus revelando direção para o futuro da igreja",
            "Líderes guiados pelo Espírito Santo",
            "Povo aprendendo a ouvir a voz de Deus"
        ]
    },
    {
        id: 11, title: "A ALEGRIA DO SENHOR É NOSSA FORÇA",
        block: "BLOCO 04 - RELAÇÃO COM O MUNDO",
        color: "#fdedc7", blockColor: "#ebd083",
        items: [
            "Alegria do Espírito Santo enchendo a igreja",
            "Pessoas cansadas renovadas espiritualmente",
            "Louvor da igreja cheio da presença de Deus",
            "MVPMusic ministrando com unção e alegria",
            "Igreja vivendo uma atmosfera de celebração espiritual"
        ]
    },
    {
        id: 12, title: "CELEBRAÇÃO ANTECIPA O MILAGRE",
        block: "BLOCO 04 - RELAÇÃO COM O MUNDO",
        color: "#fcf1d4", blockColor: "#ebd083",
        items: [
            "Igreja aprendendo a celebrar antes da resposta",
            "Cultos cheios da presença de Deus",
            "Louvor preparando o ambiente para milagres",
            "Deus realizando sinais e maravilhas no meio da igreja",
            "Cada testemunho fortalecendo a fé do povo"
        ]
    }
];

// Funções utilitárias para desenhar o SVG
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", x, y,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
    ].join(" ");
};

const describeOuterArc = (x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number) => {
    const startInner = polarToCartesian(x, y, innerRadius, endAngle);
    const endInner = polarToCartesian(x, y, innerRadius, startAngle);
    const startOuter = polarToCartesian(x, y, outerRadius, endAngle);
    const endOuter = polarToCartesian(x, y, outerRadius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
        "M", startInner.x, startInner.y,
        "L", startOuter.x, startOuter.y,
        "A", outerRadius, outerRadius, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
        "L", endInner.x, endInner.y,
        "A", innerRadius, innerRadius, 0, largeArcFlag, 1, startInner.x, startInner.y,
        "Z"
    ].join(" ");
};

export default function InteractivePrayerClock({ onBack, isAdmin = false }: { onBack?: () => void, isAdmin?: boolean }) {
    const [prayerData, setPrayerData] = useState(() => {
        const saved = localStorage.getItem('prayerData');
        const data = saved ? JSON.parse(saved) : defaultPrayerData;

        // Pequena verificação: se o título do primeiro tópico for o antigo "GRATIDÃO A DEUS",
        // forçamos o reset para os novos dados fornecidos hoje.
        if (data[0]?.title === "GRATIDÃO A DEUS") {
            localStorage.removeItem('prayerData');
            return defaultPrayerData;
        }
        return data;
    });
    const [isEditing, setIsEditing] = useState(false);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            return JSON.parse(saved);
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    const [timeElapsed, setTimeElapsed] = useState(0); // Segundos passados (0 a 3600)
    const [isPlaying, setIsPlaying] = useState(false);
    const [speedMultiplier, setSpeedMultiplier] = useState(1); // Para testes rápidos
    const [isPersonalMode, setIsPersonalMode] = useState(false);

    const [currentTime, setCurrentTime] = useState(new Date());

    // Lógica de Data e Hora para o Evento Ao Vivo (Domingo 06:00 às 18:00)
    const isSunday = currentTime.getDay() === 0;
    const currentHour24 = currentTime.getHours();
    const isLive = isSunday && currentHour24 >= 6 && currentHour24 < 18;

    const getNextStartTime = (now: Date) => {
        const next = new Date(now);
        next.setHours(6, 0, 0, 0);
        if (now.getDay() === 0) {
            if (now.getHours() >= 18) {
                next.setDate(now.getDate() + 7);
            }
        } else {
            const daysUntilSunday = (7 - now.getDay()) % 7;
            next.setDate(now.getDate() + daysUntilSunday);
        }
        return next;
    };

    const nextStart = getNextStartTime(currentTime);
    const diffMs = Math.max(0, nextStart.getTime() - currentTime.getTime());
    const d = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const h = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diffMs / 1000 / 60) % 60);
    const s = Math.floor((diffMs / 1000) % 60);

    const MAX_SECONDS = 3600; // 1 Hora

    // Atualizar a hora atual a cada segundo e sincronizar se estiver Ao Vivo
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            const isSun = now.getDay() === 0;
            const hr = now.getHours();
            const live = isSun && hr >= 6 && hr < 18;

            if (live && !isPersonalMode) {
                setTimeElapsed(now.getMinutes() * 60 + now.getSeconds());
                setIsPlaying(false);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [isPersonalMode]);

    // Loop do Timer Manual
    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying && timeElapsed < MAX_SECONDS && (!isLive || isPersonalMode)) {
            interval = setInterval(() => {
                setTimeElapsed(prev => {
                    const next = prev + speedMultiplier;
                    if (next >= MAX_SECONDS) {
                        setIsPlaying(false);
                        return MAX_SECONDS;
                    }
                    return next;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, timeElapsed, speedMultiplier]);

    // Salvar dados no localStorage
    useEffect(() => {
        localStorage.setItem('prayerData', JSON.stringify(prayerData));
    }, [prayerData]);

    // Aplicar e salvar dark mode
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Pausar ao abrir configurações
    useEffect(() => {
        if (isEditing) setIsPlaying(false);
    }, [isEditing]);

    // Funções de edição
    const handleUpdateTitle = (topicIndex: number, newTitle: string) => {
        const newData = [...prayerData];
        newData[topicIndex].title = newTitle;
        setPrayerData(newData);
    };

    const handleUpdateItem = (topicIndex: number, itemIndex: number, newValue: string) => {
        const newData = [...prayerData];
        newData[topicIndex].items[itemIndex] = newValue;
        setPrayerData(newData);
    };

    const handleResetData = () => {
        if (window.confirm('Tem certeza que deseja restaurar as orações originais?')) {
            setPrayerData(defaultPrayerData);
        }
    };

    // Cálculos de tempo e posição
    const currentMinute = Math.min(Math.floor(timeElapsed / 60), 59); // 0 a 59
    const activeTopicIndex = Math.floor(currentMinute / 5); // 0 a 11
    const activeSubTopicIndex = currentMinute % 5; // 0 a 4
    const isFinished = timeElapsed >= MAX_SECONDS;

    const currentTopic = isFinished ? null : prayerData[activeTopicIndex];

    // Formatador de tempo (MM:SS)
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleWedgeClick = (index: number) => {
        setTimeElapsed(index * 5 * 60);
    };

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 font-sans text-slate-800 dark:text-slate-200 pb-12 transition-colors duration-300 absolute inset-0 z-50 overflow-y-auto w-full h-full left-0 top-0">
            {/* Header */}
            <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 transition-colors duration-300">
                <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        {isAdmin && onBack && (
                            <button
                                onClick={onBack}
                                className="p-2 mr-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        )}
                        <Clock className="w-8 h-8 text-blue-600" />
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none mb-1">
                                Relógio de Oração Pessoal
                            </h1>
                            {teamSchedule[currentHour24] ? (
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                    </span>
                                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                        Equipe {teamSchedule[currentHour24]} <span className="font-normal text-slate-500 dark:text-slate-400">({currentHour24.toString().padStart(2, '0')}h - {(currentHour24 + 1).toString().padStart(2, '0')}h)</span>
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-400"></span>
                                    </span>
                                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                        Turno Livre
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controles Principais */}
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            title="Alternar Tema"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {isAdmin && (
                            <>
                                <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`p-2 rounded-full transition-colors ${isEditing ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                                    title="Configurações"
                                >
                                    {isEditing ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                                </button>
                                <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
                            </>
                        )}

                        {isLive && !isPersonalMode ? (
                            <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full font-bold animate-pulse border border-red-200 dark:border-red-800/30 shadow-sm text-sm">
                                <div className="w-2 h-2 bg-red-600 dark:bg-red-400 rounded-full"></div>
                                AO VIVO
                            </div>
                        ) : isAdmin ? (
                            <>
                                <button
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    disabled={isFinished || isEditing}
                                    className={`flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-all ${(isFinished || isEditing) ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed' :
                                        isPlaying ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/70' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                                        }`}
                                >
                                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                                    {isPlaying ? 'Pausar' : 'Iniciar Oração'}
                                </button>
                                <button
                                    onClick={() => { setTimeElapsed(0); setIsPlaying(false); }}
                                    className="p-2 rounded-full text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                                    title="Zerar Relógio"
                                >
                                    <RotateCcw className="w-5 h-5" />
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 mt-8">
                {isEditing ? (
                    <section className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 animate-fade-in duration-200 transition-colors">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    Editar Orações
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">Personalize os tópicos e motivos de oração do seu relógio.</p>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <button
                                    onClick={handleResetData}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Restaurar Padrão
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-sm transition-colors"
                                >
                                    <Save className="w-4 h-4" />
                                    Concluir
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {prayerData.map((topic: any, tIndex: number) => (
                                <div
                                    key={topic.id}
                                    className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border-t-8 border border-slate-200/60 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                                    style={{ borderTopColor: topic.blockColor }}
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-slate-700 text-sm shrink-0" style={{ backgroundColor: topic.color }}>
                                            {topic.id}
                                        </span>
                                        <input
                                            type="text"
                                            value={topic.title}
                                            onChange={(e) => handleUpdateTitle(tIndex, e.target.value)}
                                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                            placeholder="Título do Tópico"
                                        />
                                    </div>

                                    <div className="space-y-2.5">
                                        {topic.items.map((item: string, iIndex: number) => (
                                            <div key={iIndex} className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 w-4 text-center">{iIndex + 1}</span>
                                                <input
                                                    type="text"
                                                    value={item}
                                                    onChange={(e) => handleUpdateItem(tIndex, iIndex, e.target.value)}
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                                    placeholder={`Motivo ${iIndex + 1}`}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                ) : (!isLive && !isPersonalMode) ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in duration-700">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white tracking-tight">
                                12 horas de Intercessão
                            </h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
                                Domingo, das 06:00 às 18:00
                            </p>
                        </div>

                        <div className="flex gap-3 md:gap-6">
                            {[
                                { label: 'Dias', value: d },
                                { label: 'Horas', value: h },
                                { label: 'Minutos', value: m },
                                { label: 'Segundos', value: s },
                            ].map((item, idx) => (
                                <div key={idx} className="flex flex-col items-center bg-white dark:bg-slate-800 w-20 h-24 md:w-28 md:h-32 justify-center rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <span className="text-3xl md:text-5xl font-black text-blue-600 dark:text-blue-400">
                                        {item.value.toString().padStart(2, '0')}
                                    </span>
                                    <span className="text-[10px] md:text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => setIsPersonalMode(true)}
                                className="mt-8 px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors"
                            >
                                Usar relógio no modo pessoal
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8 lg:items-start items-center animate-fade-in duration-700">
                        {/* Coluna Esquerda: Relógio Interativo SVG */}
                        <section className="flex flex-col items-center w-full lg:w-1/2 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">

                            {/* Tópico e Subtópico Atual (Mobile Friendly) */}
                            {!isFinished && currentTopic && (
                                <div className="w-full text-center mb-6 relative">
                                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">
                                        Motivo de Oração
                                    </span>
                                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">
                                        {currentTopic.title}
                                    </h3>
                                    <div className="inline-flex items-center justify-center px-6 py-3 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xl md:text-2xl font-bold rounded-2xl shadow-sm border border-blue-200 dark:border-blue-800/50 mb-6 text-center">
                                        {currentTopic.items[activeSubTopicIndex]}
                                    </div>

                                    <div className="mt-4 text-2xl font-mono font-bold text-slate-700 dark:text-slate-300 tracking-wider">
                                        {currentTime.toLocaleTimeString('pt-BR')}
                                    </div>
                                </div>
                            )}

                            <div className="relative w-full max-w-md aspect-square">
                                <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-sm">
                                    <g transform="translate(200, 200)">
                                        {/* Blocos Externos (Bloco 01, 02, etc) */}
                                        <path d={describeOuterArc(0, 0, 165, 185, 0, 90)} fill="#a3d977" opacity="0.4" />
                                        <path d={describeOuterArc(0, 0, 165, 185, 90, 180)} fill="#6abf9f" opacity="0.4" />
                                        <path d={describeOuterArc(0, 0, 165, 185, 180, 270)} fill="#f29c38" opacity="0.4" />
                                        <path d={describeOuterArc(0, 0, 165, 185, 270, 360)} fill="#ebd083" opacity="0.4" />

                                        {/* Fatias do Relógio */}
                                        {prayerData.map((topic: any, index: number) => {
                                            const startAngle = index * 30;
                                            const endAngle = (index + 1) * 30;
                                            const isActive = !isFinished && activeTopicIndex === index;

                                            const textPos = polarToCartesian(0, 0, 140, startAngle + 15);

                                            return (
                                                <g
                                                    key={topic.id}
                                                    onClick={() => handleWedgeClick(index)}
                                                    className="cursor-pointer transition-all hover:opacity-80"
                                                >
                                                    <path
                                                        d={describeArc(0, 0, 160, startAngle, endAngle)}
                                                        fill={topic.color}
                                                        stroke={isActive ? "#3b82f6" : "#ffffff"}
                                                        strokeWidth={isActive ? "3" : "2"}
                                                        className={`transition-all duration-300 ${isActive ? 'brightness-125 saturate-150 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10' : 'opacity-80'}`}
                                                    />
                                                    <text
                                                        x={textPos.x}
                                                        y={textPos.y}
                                                        textAnchor="middle"
                                                        alignmentBaseline="middle"
                                                        fill="#334155"
                                                        fontSize="14"
                                                        fontWeight="bold"
                                                        className={isActive ? 'text-lg' : ''}
                                                    >
                                                        {index + 1}
                                                    </text>
                                                    {isActive && (
                                                        <path
                                                            d={describeOuterArc(0, 0, 160, 165, startAngle, endAngle)}
                                                            fill="#3b82f6"
                                                        />
                                                    )}
                                                </g>
                                            );
                                        })}

                                        {/* Marcas de Minutos (Traces) */}
                                        {Array.from({ length: 60 }).map((_, i) => {
                                            const angle = i * 6;
                                            const isMajor = i % 5 === 0;
                                            const currentMinute = Math.floor(timeElapsed / 60);
                                            const isCurrentMinute = !isFinished && i === currentMinute;

                                            const innerRadius = isCurrentMinute ? 85 : (isMajor ? 90 : 100);
                                            const outerRadius = isCurrentMinute ? 120 : 110;

                                            const pos1 = polarToCartesian(0, 0, innerRadius, angle);
                                            const pos2 = polarToCartesian(0, 0, outerRadius, angle);

                                            return (
                                                <line
                                                    key={i}
                                                    x1={pos1.x} y1={pos1.y}
                                                    x2={pos2.x} y2={pos2.y}
                                                    stroke={isCurrentMinute ? "#ef4444" : (isDarkMode ? "#64748b" : "#475569")}
                                                    strokeWidth={isCurrentMinute ? "3" : (isMajor ? "2" : "1")}
                                                    opacity={isCurrentMinute ? "1" : (isMajor ? "0.8" : "0.3")}
                                                    className={isCurrentMinute ? "animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all duration-300" : "transition-all duration-300"}
                                                />
                                            );
                                        })}

                                        {/* Círculo Central */}
                                        <circle cx="0" cy="0" r="90" fill={isDarkMode ? "#1e293b" : "#f8fafc"} stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="3" className="transition-colors duration-300" />

                                        {/* Texto Central */}
                                        <text x="0" y="-15" textAnchor="middle" fill={isDarkMode ? "#f8fafc" : "#0f172a"} fontSize="16" fontWeight="800" className="transition-colors duration-300">RELÓGIO DE</text>
                                        <text x="0" y="5" textAnchor="middle" fill={isDarkMode ? "#f8fafc" : "#0f172a"} fontSize="16" fontWeight="800" className="transition-colors duration-300">ORAÇÃO</text>
                                        <text x="0" y="25" textAnchor="middle" fill={isDarkMode ? "#f8fafc" : "#0f172a"} fontSize="16" fontWeight="800" className="transition-colors duration-300">PESSOAL</text>

                                        {/* Ponteiro do Relógio */}
                                        {!isFinished && (
                                            <g
                                                transform={`rotate(${(timeElapsed / 3600) * 360})`}
                                                className={`transition-all duration-500 ${isPlaying ? 'drop-shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse' : 'drop-shadow-md'}`}
                                            >
                                                <line x1="0" y1="0" x2="0" y2="-120" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
                                                <circle cx="0" cy="0" r="6" fill="#ef4444" />
                                                <polygon points="-4,-110 4,-110 0,-124" fill="#ef4444" />
                                            </g>
                                        )}
                                    </g>
                                </svg>
                            </div>

                            {/* Tempo Total e Controles de Velocidade */}
                            <div className="mt-8 flex flex-col items-center w-full">
                                {teamSchedule[currentHour24] && (
                                    <div className="mb-3 px-4 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-bold tracking-wider uppercase flex items-center gap-2 border border-green-200 dark:border-green-800/50 shadow-sm">
                                        <Users className="w-4 h-4" />
                                        EQUIPE {teamSchedule[currentHour24]}
                                    </div>
                                )}
                                <div className="text-5xl font-mono font-bold text-slate-800 dark:text-white tracking-tight mb-4">
                                    {formatTime(timeElapsed)}
                                </div>

                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mb-6">
                                    <div
                                        className="bg-blue-600 h-full transition-all duration-1000 ease-linear"
                                        style={{ width: `${(timeElapsed / MAX_SECONDS) * 100}%` }}
                                    />
                                </div>

                                {isLive && !isPersonalMode ? (
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-center max-w-sm">
                                        O relógio está sincronizado automaticamente com o horário oficial da intercessão.
                                    </p>
                                ) : isAdmin ? (
                                    <>
                                        <div className="flex items-center gap-4 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-2 rounded-xl transition-colors">
                                            <span className="text-slate-500 dark:text-slate-400 font-medium px-2">Velocidade:</span>
                                            {[1, 10, 60].map(speed => (
                                                <button
                                                    key={speed}
                                                    onClick={() => setSpeedMultiplier(speed)}
                                                    className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${speedMultiplier === speed ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                                        }`}
                                                    title={speed === 1 ? "Tempo Real" : `Acelerar ${speed}x`}
                                                >
                                                    {speed > 1 && <FastForward className="w-3 h-3" />}
                                                    {speed}x
                                                </button>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center max-w-xs">
                                            Dica: Aumente a velocidade para testar o aplicativo rapidamente. Você pode clicar nas fatias do relógio para avançar.
                                        </p>

                                        {isLive && isPersonalMode && (
                                            <button
                                                onClick={() => setIsPersonalMode(false)}
                                                className="mt-6 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline underline-offset-4"
                                            >
                                                Voltar para o relógio Ao Vivo
                                            </button>
                                        )}
                                    </>
                                ) : null}
                            </div>
                        </section>

                        {/* Coluna Direita: Detalhes do Minuto Atual */}
                        <section className="w-full lg:w-1/2 flex flex-col gap-4">

                            {isFinished ? (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-8 rounded-3xl text-center flex flex-col items-center justify-center h-full transition-colors">
                                    <CheckCircle2 className="w-20 h-20 text-green-500 dark:text-green-400 mb-4" />
                                    <h2 className="text-3xl font-bold text-green-800 dark:text-green-300 mb-2">Período Concluído!</h2>
                                    <p className="text-green-700 dark:text-green-400">Você completou sua hora no Relógio de Oração Pessoal.</p>
                                    <button
                                        onClick={() => { setTimeElapsed(0); setIsPlaying(true); setSpeedMultiplier(1); }}
                                        className="mt-6 px-6 py-3 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition"
                                    >
                                        Reiniciar Oração
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Card do Tópico Atual */}
                                    {currentTopic && (
                                        <div
                                            className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-md border-t-8 transition-colors duration-500"
                                            style={{ borderColor: currentTopic.blockColor }}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                                    {currentTopic.block}
                                                </span>
                                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold">
                                                    Minuto {currentMinute + 1} de 60
                                                </span>
                                            </div>

                                            <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                                                <span
                                                    className="flex items-center justify-center w-10 h-10 rounded-full text-lg text-slate-800"
                                                    style={{ backgroundColor: currentTopic.color }}
                                                >
                                                    {currentTopic.id}
                                                </span>
                                                {currentTopic.title}
                                            </h2>

                                            {/* Sub-tópicos (1 por minuto) */}
                                            <div className="space-y-3">
                                                {currentTopic.items.map((item: string, index: number) => {
                                                    const isActive = index === activeSubTopicIndex;
                                                    const isPast = index < activeSubTopicIndex;

                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`relative overflow-hidden flex flex-col p-4 rounded-2xl transition-all duration-300 ${isActive
                                                                ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 shadow-md transform scale-[1.02] z-10'
                                                                : 'bg-slate-50 dark:bg-slate-800/50 border border-transparent'
                                                                }`}
                                                        >
                                                            {/* Progress bar for active minute */}
                                                            {isActive && (
                                                                <div
                                                                    className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-1000 ease-linear"
                                                                    style={{ width: `${((timeElapsed % 60) / 60) * 100}%` }}
                                                                />
                                                            )}

                                                            <div className="flex items-center gap-4 relative z-10">
                                                                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shrink-0 ${isActive ? 'bg-blue-600 text-white shadow-sm' :
                                                                    isPast ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                                                                    }`}>
                                                                    {index + 1}
                                                                </div>

                                                                <div className={`flex-1 text-lg font-medium ${isActive ? 'text-blue-900 dark:text-blue-100 font-bold' :
                                                                    isPast ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600' : 'text-slate-600 dark:text-slate-300'
                                                                    }`}>
                                                                    {item}
                                                                </div>

                                                                {isActive && (
                                                                    <div className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5 text-sm font-black bg-blue-100 dark:bg-blue-900/50 px-3 py-1 rounded-full shrink-0">
                                                                        <Clock className="w-4 h-4" />
                                                                        {60 - (timeElapsed % 60)}s
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Card de Próximo Tópico (Preview) */}
                                    {activeTopicIndex < 11 && prayerData[activeTopicIndex + 1] && (
                                        <div className="bg-slate-200 dark:bg-slate-700 rounded-2xl p-4 flex items-center justify-between opacity-70 mt-4 transition-colors">
                                            <div>
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Próximo Tópico (Em breve)</span>
                                                <h4 className="text-slate-700 dark:text-slate-200 font-bold flex items-center gap-2 mt-1">
                                                    <span className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-center">
                                                        {prayerData[activeTopicIndex + 1].id}
                                                    </span>
                                                    {prayerData[activeTopicIndex + 1].title}
                                                </h4>
                                            </div>
                                            <ChevronRight className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                                        </div>
                                    )}
                                </>
                            )}

                        </section>
                    </div>
                )}
            </main>
        </div>
    );
}
