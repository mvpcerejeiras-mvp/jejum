import { FastDay, FastTime, FastType, FastTypeDescription } from './types';

export const DEFAULT_THEME = "Santificação e Unidade";
export const DEFAULT_INSTRUCTION = "Escolha o dia, defina o horário e o tipo de jejum, e permaneça fiel durante toda a semana.\nO valor do jejum está no alinhamento do coração.";
export const DEFAULT_APP_TITLE = "Jejum Congregacional";
export const DEFAULT_LOGO = "flame";
export const DEFAULT_PRAYER_CLOCK_TITLE = "Relógio de Oração";

// Default days list based on the Enum, but editable in the future
export const DEFAULT_DAYS = Object.values(FastDay);

// Keep for backward compatibility if needed, but app should use settings.fastDays
export const DAYS_OPTIONS = DEFAULT_DAYS;
export const TIME_OPTIONS = Object.values(FastTime);

export const TYPE_DESCRIPTIONS: FastTypeDescription[] = [
  {
    id: FastType.STANDARD,
    title: 'Opção 1 – Jejum Parcial Padrão',
    color: 'border-green-500 bg-green-50 text-green-800',
    description: [
      { text: 'Início do Jejum (00h00)', detail: 'A consagração começa à meia-noite.' },
      { text: 'Jejum até o horário escolhido', detail: 'Abstenha-se de alimentos sólidos até o horário definido (12h, 15h ou 18h).' },
      { text: 'Água liberada', detail: 'A hidratação é importante. Beba água livremente.' },
      { text: 'Chá ou café sem açúcar (opcional)', detail: 'Líquidos claros e sem calorias são permitidos.' },
      { text: 'Alimentação normal após o término do jejum', detail: 'Retome sua alimentação com equilíbrio após o período.' }
    ]
  },
  {
    id: FastType.DANIEL,
    title: 'Opção 2 – Jejum de Daniel',
    color: 'border-blue-500 bg-blue-50 text-blue-800',
    description: [
      { text: 'Início do Jejum (00h00)', detail: 'A consagração começa à meia-noite.' },
      { text: 'Legumes, verduras, frutas e grãos', detail: 'Alimente-se apenas de produtos da terra, evitando alimentos processados.' },
      { text: 'Água liberada', detail: 'Mantenha-se bem hidratado.' },
      { text: 'Sem carnes, doces, frituras ou industrializados', detail: 'Evite alimentos que despertam o prazer da carne para focar no Espírito.' }
    ]
  },
  {
    id: FastType.INTENSIFIED,
    title: 'Opção 3 – Jejum Parcial Intensificado',
    color: 'border-orange-500 bg-orange-50 text-orange-800',
    description: [
      { text: 'Início do Jejum (00h00)', detail: 'A consagração começa à meia-noite.' },
      { text: 'Apenas uma refeição após o horário escolhido', detail: 'Após entregar o jejum, faça apenas uma refeição simples no dia.' },
      { text: 'Água liberada durante o período do jejum', detail: 'Beba água sempre que sentir necessidade.' }
    ]
  },
  {
    id: FastType.RENUNCIATION,
    title: 'Opção 4 – Jejum com Renúncia Espiritual',
    color: 'border-red-500 bg-red-50 text-red-800',
    description: [
      { text: 'Início do Jejum (00h00)', detail: 'A consagração começa à meia-noite.' },
      { text: 'Jejum parcial até o horário escolhido', detail: 'Siga o horário de consagração definido.' },
      { text: 'Sem redes sociais', detail: 'Desconecte-se de Facebook, Instagram, TikTok e afins.' },
      { text: 'Sem entretenimento secular', detail: 'Evite filmes, séries, jogos e músicas não cristãs.' },
      { text: 'Aumentar tempo de oração e leitura bíblica', detail: 'Invista o tempo livre em comunhão profunda com Deus.' }
    ]
  },
  {
    id: FastType.DEEP_SEARCH,
    title: 'Opção 5 – Jejum Busca Profunda (24h)',
    color: 'border-purple-500 bg-purple-50 text-purple-800',
    description: [
      { text: 'Jejum total de 24 horas', detail: 'Abstenha-se de alimentos sólidos por um ciclo completo de 24h.' },
      { text: 'Início do Jejum (18h ou 19h)', detail: 'Flexível: comece em um destes horários e entregue no dia seguinte.' },
      { text: 'Foco em Busca Espiritual', detail: 'Tempo dedicado à oração intensa, leitura bíblica e silêncio.' },
      { text: 'Água e líquidos claros liberados', detail: 'Mantenha a hidratação com água, chá ou café sem açúcar.' }
    ]
  }
];