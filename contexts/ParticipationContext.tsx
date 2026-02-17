import React, { createContext, useContext, useState, useEffect } from 'react';
import { Member, SystemConfig } from '../types';
import { getSystemConfig, checkMemberByPhone, saveMember, getSettings, getUserParticipation } from '../services/db';

interface ParticipationContextType {
    step: number;
    setStep: (step: number) => void;
    user: Member | null;
    setUser: (user: Member | null) => void;
    config: SystemConfig | null;
    loading: boolean;
    login: (phone: string) => Promise<{ success: boolean; message?: string; isNewUser?: boolean; member?: Member }>;
    register: (name: string, phone: string) => Promise<{ success: boolean; message?: string }>;
    direction: number; // For animation direction (1 = next, -1 = prev)
    setDirection: (dir: number) => void;
    isRegistered: boolean;
    hasParticipated: boolean;
    participationData: { fasting?: any; prayer?: any[] } | null;
    getGreeting: () => string;
    fastingData: any;
    setFastingData: (data: any) => void;
    clockData: any;
    setClockData: (data: any) => void;
    appSettings: any;
    justSaved: boolean;
    setJustSaved: (val: boolean) => void;
}

const ParticipationContext = createContext<ParticipationContextType | undefined>(undefined);

export function ParticipationProvider({ children }: { children: React.ReactNode }) {
    const [step, setStep] = useState(0);
    const [user, setUser] = useState<Member | null>(null);
    const [config, setConfig] = useState<SystemConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [direction, setDirection] = useState(1);
    const [appSettings, setAppSettings] = useState<any>({});
    const [fastingData, setFastingData] = useState<any>(null);
    const [clockData, setClockData] = useState<any>(null);
    const [participationData, setParticipationData] = useState<any>(null);
    const [justSaved, setJustSaved] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [conf, settings] = await Promise.all([
                getSystemConfig(),
                getSettings()
            ]);
            setConfig(conf as SystemConfig);
            setAppSettings(settings);

            // Auto-login persistence
            const savedPhone = localStorage.getItem('member_phone');
            if (savedPhone) {
                const member = await checkMemberByPhone(savedPhone);
                if (member) {
                    setUser(member);
                    await checkParticipation(member.id);
                }
            }
        } catch (error) {
            console.error("Failed to load config", error);
        } finally {
            setLoading(false);
        }
    };

    const checkParticipation = async (memberId: string) => {
        const data = await getUserParticipation(memberId);
        setParticipationData(data);
        // Unified data in context if they already participated
        if (data.fasting) {
            setFastingData({
                days: data.fasting.days,
                type: data.fasting.type,
                time: data.fasting.time
            });
        }
    };

    const login = async (phone: string): Promise<{ success: boolean; message?: string; isNewUser?: boolean; member?: Member }> => {
        try {
            const member = await checkMemberByPhone(phone);
            if (member) {
                setUser(member);
                localStorage.setItem('member_phone', phone);
                await checkParticipation(member.id);
                return { success: true, member };
            } else {
                return { success: true, isNewUser: true };
            }
        } catch (error) {
            return { success: false, message: "Erro ao verificar usuário." };
        }
    };

    const register = async (name: string, phone: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const res = await saveMember({ name, phone });
            if (res.success) {
                const member = await checkMemberByPhone(phone);
                if (member) {
                    setUser(member);
                    localStorage.setItem('member_phone', phone);
                    setParticipationData({ fasting: undefined, prayer: [] });
                    return { success: true };
                }
            }
            return { success: false, message: res.message || "Erro ao cadastrar." };
        } catch (error) {
            return { success: false, message: "Erro interno no cadastro." };
        }
    };

    const getGreeting = () => {
        if (!user) return "";
        const firstName = user.name.split(' ')[0];
        const nameLower = firstName.toLowerCase();

        // Simple heuristic for common Portuguese feminine names
        const isFeminine = nameLower.endsWith('a') ||
            nameLower.endsWith('ia') ||
            nameLower.endsWith('na') ||
            nameLower.endsWith('da');

        // Exceptions or specific check for 'Messias'
        const isActuallyMasculine = nameLower === 'messias' || nameLower === 'lucas' || nameLower === 'isaías';

        const greeting = (isFeminine && !isActuallyMasculine) ? "Bem-vinda" : "Bem-vindo";
        return `${greeting}, ${firstName}!`;
    };

    return (
        <ParticipationContext.Provider value={{
            step, setStep,
            user, setUser,
            config,
            loading,
            login, register,
            direction, setDirection,
            appSettings,
            fastingData, setFastingData,
            clockData, setClockData,
            isRegistered: !!user,
            hasParticipated: !!(participationData?.fasting || participationData?.prayer?.length > 0),
            participationData,
            getGreeting,
            justSaved,
            setJustSaved
        }}>
            {children}
        </ParticipationContext.Provider>
    );
}

export function useParticipation() {
    const context = useContext(ParticipationContext);
    if (context === undefined) {
        throw new Error('useParticipation must be used within a ParticipationProvider');
    }
    return context;
}
