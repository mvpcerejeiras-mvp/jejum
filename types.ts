export enum FastDay {
  MONDAY = 'Segunda-feira – Ágape',
  TUESDAY = 'Terça-feira – Shalom',
  WEDNESDAY = 'Quarta-feira – Logos',
  THURSDAY = 'Quinta-feira – Rhema',
  FRIDAY = 'Sexta-feira – Zoe',
  SATURDAY = 'Sábado – Consagração',
  SUNDAY = 'Domingo – Celebração',
}

export enum FastTime {
  TWELVE_AM_PM = '12 horas – da meia-noite (00h) ao meio-dia (12h)',
  NINE_HOURS = '9 horas – das 06h às 15h',
  TWELVE_HOURS = '12 horas – das 06h às 18h',
  CUSTOM = 'Jejum diário personalizado',
}

export enum FastType {
  STANDARD = 'Opção 1 – Jejum Parcial Padrão',
  DANIEL = 'Opção 2 – Jejum de Daniel',
  INTENSIFIED = 'Opção 3 – Jejum Parcial Intensificado',
  RENUNCIATION = 'Opção 4 – Jejum com Renúncia Espiritual',
}

export interface Participant {
  id: string;
  name: string;
  phone: string;
  member_id?: string; // Link to members table
  days: string[]; // Changed to string array to support multiple days
  time: FastTime;
  type: FastType;
  createdAt: string;
}

export interface AppSettings {
  theme: string;
  instruction: string;
  appTitle?: string;
  logoId?: string;
  fastDays: string[]; // List of active fasting days
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

export interface FastingHistory {
  id: string;
  memberId: string;
  eventName: string;
  days: string[];
  type: string;
  archivedAt: string;
}

export interface FastTypeDescription {
  id: FastType;
  title: string;
  color: string;
  description: { text: string; detail: string }[];
}

export interface PrayerCampaign {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  duration: 12 | 48;
  isActive: boolean;
  createdAt: string;
}

export interface PrayerSignup {
  id: string;
  campaignId: string;
  memberId: string;
  slotNumber: number;
  createdAt: string;
  member?: {
    name: string;
    phone: string;
  };
}

export interface SystemConfig {
  id?: string;
  eventMode: 'fasting' | 'prayer_clock' | 'combined'; // Modes: only fasting, only clock, or both
  activeCampaignId?: string; // Optional: Force a specific campaign if multiple active
}