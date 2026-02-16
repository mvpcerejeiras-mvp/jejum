import React, { createContext, useContext, useState, useEffect } from 'react';
import { Member, SystemConfig } from '../types';
import { getSystemConfig, checkMemberByPhone, saveMember, getSettings } from '../services/db';

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
    appSettings: any; // visual settings
    fastingData: any;
    setFastingData: (data: any) => void;
    clockData: any;
    setClockData: (data: any) => void;
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
        } catch (error) {
            console.error("Failed to load config", error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (phone: string): Promise<{ success: boolean; message?: string; isNewUser?: boolean; member?: Member }> => {
        try {
            const member = await checkMemberByPhone(phone);
            if (member) {
                setUser(member);
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
                // Fetch the newly created member to get the ID
                const member = await checkMemberByPhone(phone);
                if (member) {
                    setUser(member);
                    return { success: true };
                }
            }
            return { success: false, message: res.message || "Erro ao cadastrar." };
        } catch (error) {
            return { success: false, message: "Erro interno no cadastro." };
        }
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
            clockData, setClockData
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
