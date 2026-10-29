// Cria as tabelas do Ponte Zero no Neon e insere dados de exemplo (só se estiverem vazias).
// Uso: npm run db:setup   (lê DATABASE_URL do ambiente ou do arquivo .env)
import { neon } from "@neondatabase/serverless";
import fs from "node:fs";

if (!process.env.DATABASE_URL && fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

await sql`CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  turma TEXT NOT NULL,
  attendance INTEGER NOT NULL CHECK (attendance BETWEEN 0 AND 100),
  prev_attendance INTEGER CHECK (prev_attendance BETWEEN 0 AND 100),
  grade NUMERIC(3,1) NOT NULL CHECK (grade BETWEEN 0 AND 10),
  low_subjects INTEGER NOT NULL DEFAULT 0,
  stage TEXT NOT NULL DEFAULT 'identificado',
  need TEXT,
  identified TEXT,
  responsible TEXT,
  return_date DATE,
  signal_since DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

await sql`CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

await sql`CREATE TABLE IF NOT EXISTS supports (
  id SERIAL PRIMARY KEY,
  need TEXT NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  schedule TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

await sql`CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  support_id INTEGER NOT NULL REFERENCES supports(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'sugerido',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, support_id)
)`;

await sql`CREATE TABLE IF NOT EXISTS help_requests (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

await sql`CREATE INDEX IF NOT EXISTS notes_student_idx ON notes(student_id)`;
await sql`CREATE INDEX IF NOT EXISTS referrals_student_idx ON referrals(student_id)`;

const [{ count: supportsCount }] = await sql`SELECT count(*)::int AS count FROM supports`;
if (supportsCount === 0) {
  const supports = [
    ["renda", "TRABALHO", "Programa Jovem Aprendiz", "Contraturno", "Trabalho com carteira assinada e carga horária compatível com a escola.", "2026-11-18"],
    ["renda", "BOLSA", "Bolsa de estudos", "Inscrições abertas", "Desconto ou gratuidade na mensalidade para quem comprova renda.", null],
    ["renda", "BOLSA", "Auxílio permanência estudantil", "Mensal", "Apoio financeiro para transporte e alimentação enquanto estuda.", "2026-12-05"],
    ["renda", "ESTÁGIO", "Estágio remunerado", "Meio período", "Vagas de estágio em horário que não compete com as aulas.", "2026-11-30"],
    ["renda", "CURSO", "Curso gratuito de informática", "Sábados", "Capacitação gratuita com certificado, aos fins de semana.", "2026-11-25"],
    ["perspectiva", "CARREIRA", "Orientação profissional", "Agendamento", "Conversa individual para conhecer áreas, cursos e caminhos possíveis.", null],
    ["perspectiva", "CARREIRA", "Trilha de carreira em tecnologia", "Online", "Conecta cursos, habilidades e oportunidades reais da área.", null],
    ["estudos", "ESTUDOS", "Reforço de Matemática", "Aulas no contraturno", "Aulas em pequenos grupos para recuperar o conteúdo.", null],
    ["estudos", "ESTUDOS", "Monitoria entre colegas", "Intervalos e contraturno", "Estudantes que já passaram pela disciplina ajudam quem precisa.", null],
    ["estudos", "ESTUDOS", "Organização da rotina de estudos", "Oficina quinzenal", "Planejamento semanal para conciliar estudo, trabalho e casa.", null],
    ["acolhimento", "MENTORIA", "Rede de mentoria", "Encontros mensais", "Um mentor acompanha o estudante e ajuda a destravar dificuldades.", null],
    ["acolhimento", "APOIO", "Apoio psicológico estudantil", "Agendamento", "Escuta profissional e sigilosa na própria instituição.", null],
    ["acolhimento", "APOIO", "Canal de acolhimento contra bullying", "Sempre disponível", "Onde buscar ajuda na instituição em casos de bullying e problemas pessoais.", null],
  ];
  for (const [need, kind, title, schedule, description, deadline] of supports) {
    await sql`INSERT INTO supports (need, kind, title, schedule, description, deadline)
      VALUES (${need}, ${kind}, ${title}, ${schedule}, ${description}, ${deadline})`;
  }
  console.log(`✓ ${supports.length} apoios inseridos`);
}

const [{ count: studentsCount }] = await sql`SELECT count(*)::int AS count FROM students`;
if (studentsCount === 0) {
  const students = [
    { name: "Ana Beatriz Souza", turma: "2º B", attendance: 58, prev: 88, grade: 5.8, low: 1, stage: "identificado", since: "2026-10-08" },
    { name: "Lucas Ferreira", turma: "1º A", attendance: 81, prev: 84, grade: 4.6, low: 2, stage: "identificado", since: "2026-10-15" },
    { name: "Mariana Lima", turma: "1º C", attendance: 79, prev: 82, grade: 4.9, low: 1, stage: "escuta", since: "2026-10-01", need: "estudos", identified: "Relata dificuldade em matemática desde o 9º ano." },
    { name: "Pedro Henrique Alves", turma: "3º A", attendance: 68, prev: 86, grade: 5.9, low: 2, stage: "encaminhado", since: "2026-09-20", need: "renda", identified: "Faltas às sextas e queda nas notas. Na conversa, relatou que precisa trabalhar para ajudar em casa.", responsible: "Coordenação", ret: "2026-11-12" },
    { name: "Júlia Rocha", turma: "2º A", attendance: 83, prev: 85, grade: 6.2, low: 1, stage: "acompanhamento", since: "2026-09-10", need: "acolhimento", identified: "Contou que tem se sentido isolada da turma.", responsible: "Orientação educacional", ret: "2026-10-20" },
    { name: "Rafael Costa", turma: "3º B", attendance: 72, prev: 74, grade: 6.8, low: 0, stage: "acompanhamento", since: "2026-09-05", need: "perspectiva", identified: "Não vê sentido em continuar, quer começar a trabalhar logo.", responsible: "Coordenação", ret: "2026-11-05" },
    { name: "Gabriel Santos", turma: "1º A", attendance: 92, prev: 70, grade: 8.0, low: 0, stage: "concluido", since: "2026-08-12", need: "renda", identified: "Gastos com transporte dificultavam a frequência." },
    { name: "Larissa Martins", turma: "2º B", attendance: 94, prev: 95, grade: 8.4, low: 0, stage: "identificado", since: "2026-10-20" },
  ];
  const supportsByTitle = Object.fromEntries((await sql`SELECT id, title FROM supports`).map((r) => [r.title, r.id]));
  for (const s of students) {
    const [{ id }] = await sql`INSERT INTO students
      (name, turma, attendance, prev_attendance, grade, low_subjects, stage, need, identified, responsible, return_date, signal_since)
      VALUES (${s.name}, ${s.turma}, ${s.attendance}, ${s.prev}, ${s.grade}, ${s.low}, ${s.stage}, ${s.need ?? null},
        ${s.identified ?? null}, ${s.responsible ?? null}, ${s.ret ?? null}, ${s.since})
      RETURNING id`;
    if (s.identified) await sql`INSERT INTO notes (student_id, stage, text) VALUES (${id}, 'escuta', ${s.identified})`;
    const refs = {
      "Pedro Henrique Alves": [["Programa Jovem Aprendiz", "em_andamento"], ["Reforço de Matemática", "sugerido"]],
      "Júlia Rocha": [["Rede de mentoria", "enviado"], ["Apoio psicológico estudantil", "quero_tentar"]],
      "Rafael Costa": [["Orientação profissional", "enviado"], ["Trilha de carreira em tecnologia", "em_andamento"]],
      "Gabriel Santos": [["Auxílio permanência estudantil", "concluido"]],
    }[s.name] ?? [];
    for (const [title, status] of refs) {
      await sql`INSERT INTO referrals (student_id, support_id, status) VALUES (${id}, ${supportsByTitle[title]}, ${status})`;
    }
    if (refs.length) await sql`INSERT INTO notes (student_id, stage, text) VALUES (${id}, 'encaminhado', ${"Encaminhado: " + refs.map((r) => r[0]).join(", ")})`;
  }
  console.log(`✓ ${students.length} estudantes de exemplo inseridos`);
}

console.log("✓ Banco pronto");
