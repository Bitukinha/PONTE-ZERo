// Domínio do Ponte Zero — compartilhado entre o app (src/) e a API (server/).

export type Stage = "identificado" | "escuta" | "encaminhado" | "acompanhamento" | "concluido";
export type Need = "renda" | "perspectiva" | "estudos" | "acolhimento";
export type Risk = "alto" | "medio" | "baixo";
export type ReferralStatus = "sugerido" | "quero_tentar" | "em_andamento" | "enviado" | "concluido";

export interface Note { id: number; stage: Stage; text: string; created_at: string }

export interface Student {
  id: number;
  name: string;
  turma: string;
  attendance: number;
  prev_attendance: number | null;
  grade: number;
  low_subjects: number;
  stage: Stage;
  need: Need | null;
  identified: string | null;
  responsible: string | null;
  return_date: string | null;
  signal_since: string;
  created_at: string;
}

export interface Support {
  id: number;
  need: Need;
  kind: string;
  title: string;
  schedule: string;
  description: string;
  deadline: string | null;
}

export interface Referral {
  id: number;
  student_id: number;
  support_id: number;
  status: ReferralStatus;
  created_at: string;
  support: Support;
}

export interface HelpRequest { id: number; student_id: number; message: string; resolved: boolean; created_at: string; student_name?: string; turma?: string }

export interface StudentDetail extends Student {
  notes: Note[];
  referrals: Referral[];
  help: HelpRequest[];
}

/** Fluxo de atendimento (slide 09): Dados → Sinal → Conversa → Encaminhar → Acompanhar. */
export const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: "identificado", label: "Sinal identificado", hint: "Padrão de frequência ou desempenho que chamou atenção." },
  { id: "escuta", label: "Conversa", hint: "A equipe escuta o estudante e registra a dificuldade relatada." },
  { id: "encaminhado", label: "Encaminhado", hint: "Apoios compatíveis com a rotina e com a necessidade." },
  { id: "acompanhamento", label: "Acompanhamento", hint: "Retorno e evolução do caso." },
  { id: "concluido", label: "Concluído", hint: "Estudante seguiu estudando." },
];

/** Do problema ao apoio (slide 04). */
export const NEEDS: Record<Need, { label: string; short: string; tag: string; hint: string }> = {
  renda: { label: "Se o problema é dinheiro", short: "Renda", tag: "TRABALHO  •  RENDA FAMILIAR", hint: "Bolsas, auxílios, cursos gratuitos e trabalho com horário compatível com os estudos." },
  perspectiva: { label: "Se falta perspectiva", short: "Perspectiva", tag: "PERSPECTIVA  •  CARREIRA", hint: "Orientação profissional, trilhas de carreira e conexão entre cursos, habilidades e oportunidades reais." },
  estudos: { label: "Se a dificuldade é acadêmica", short: "Estudos", tag: "ESTUDOS  •  APRENDIZAGEM", hint: "Reforço, materiais de estudo, organização da rotina e encaminhamento para o apoio da instituição." },
  acolhimento: { label: "Se falta apoio ou acolhimento", short: "Acolhimento", tag: "ACOLHIMENTO  •  APOIO", hint: "Rede de mentoria, serviços de apoio estudantil e onde buscar ajuda, inclusive em casos de bullying." },
};

export const REFERRAL_STATUS: Record<ReferralStatus, string> = {
  sugerido: "Sugerido pela equipe",
  quero_tentar: "Quero tentar",
  em_andamento: "Em andamento",
  enviado: "Enviado",
  concluido: "Concluído",
};

/** Regra interna de prioridade: frequência < 75% ou nota < 5 = alto; < 85% ou < 6,5 = médio. */
export function riskOf(s: { attendance: number; grade: number }): Risk {
  if (s.attendance < 75 || s.grade < 5) return "alto";
  if (s.attendance < 85 || s.grade < 6.5) return "medio";
  return "baixo";
}

/** Sem rótulos: a interface mostra o sinal e o próximo passo, nunca "aluno de risco". */
export const ATTENTION_LABEL: Record<Risk, string> = {
  alto: "Pede atenção",
  medio: "Observar",
  baixo: "Em dia",
};

export interface Signal { kind: "frequencia" | "notas"; title: string; detail: string }

function weeksSince(date: string, now = new Date()) {
  const d = new Date(date + (date.length === 10 ? "T00:00:00" : ""));
  return Math.max(1, Math.round((now.getTime() - d.getTime()) / (7 * 86400000)));
}

/** Transforma os números do estudante em sinais legíveis (slide 07 — Sinais recentes). */
export function signalsOf(s: Student, now = new Date()): Signal[] {
  const out: Signal[] = [];
  const w = weeksSince(s.signal_since, now);
  const since = `${w} ${w === 1 ? "semana" : "semanas"}`;
  if (s.prev_attendance != null && s.prev_attendance - s.attendance >= 10) {
    const drop = Math.round(((s.prev_attendance - s.attendance) / s.prev_attendance) * 100);
    out.push({ kind: "frequencia", title: `Frequência caiu ${drop}%`, detail: `Estudante do ${s.turma}  •  ${since}` });
  } else if (s.attendance < 75) {
    out.push({ kind: "frequencia", title: `Frequência em ${s.attendance}%`, detail: `Estudante do ${s.turma}  •  ${since}` });
  }
  if (s.grade < 6 || s.low_subjects > 0) {
    const n = Math.max(1, s.low_subjects);
    out.push({ kind: "notas", title: "Notas abaixo da média", detail: `Estudante do ${s.turma}  •  ${n} ${n === 1 ? "disciplina" : "disciplinas"}` });
  }
  return out;
}

export function isOpen(s: Pick<Student, "stage">) {
  return s.stage !== "concluido";
}

/** Precisa de atenção agora: caso aberto, sem conversa ainda, com sinais. */
export function needsAttention(s: Student) {
  return s.stage === "identificado" && (riskOf(s) !== "baixo" || signalsOf(s).length > 0);
}

/** Acompanhamento em dia: já houve conversa e o retorno não está atrasado. */
export function isOnTrack(s: Student, today = new Date().toISOString().slice(0, 10)) {
  if (!isOpen(s) || s.stage === "identificado") return false;
  return !s.return_date || s.return_date.slice(0, 10) >= today;
}

export function formatDate(d: string | null | undefined) {
  if (!d) return "";
  const [y, m, day] = d.slice(0, 10).split("-");
  const months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return `${Number(day)} ${months[Number(m) - 1]}${y !== String(new Date().getFullYear()) ? ` ${y}` : ""}`;
}

/** Progresso do estudante no caminho (slide 08). */
export function progressOf(s: StudentDetail) {
  const steps = [
    s.stage !== "identificado",
    s.referrals.length > 0,
    ...s.referrals.map((r) => r.status === "enviado" || r.status === "concluido"),
    s.stage === "concluido",
  ];
  const done = steps.filter(Boolean).length;
  return Math.round((done / steps.length) * 100);
}

export function achievementsOf(s: StudentDetail) {
  const list: { title: string; done: boolean }[] = [
    { title: "Primeira conversa com a equipe", done: s.stage !== "identificado" },
    { title: "Primeiro apoio escolhido", done: s.referrals.some((r) => r.status !== "sugerido") },
    { title: "Inscrição enviada", done: s.referrals.some((r) => r.status === "enviado" || r.status === "concluido") },
    { title: "Frequência acima de 85%", done: s.attendance >= 85 },
    { title: "Seguiu estudando", done: s.stage === "concluido" },
  ];
  return list;
}

/** Chave local (só conveniência) para lembrar qual estudante abriu o "Meu caminho". */
export const ME_KEY = "ponte-zero-me";
