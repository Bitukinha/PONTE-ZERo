// API REST do Ponte Zero sobre o Postgres do Neon.
// Função serverless da Vercel (todas as rotas /api/* chegam aqui via vercel.json);
// também usada pelo servidor de desenvolvimento do Vite (vite.config.ts).
import { neon } from "@neondatabase/serverless";

type Sql = ReturnType<typeof neon>;
let sqlClient: Sql | undefined;

function db(): Sql {
  if (!sqlClient) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new HttpError(500, "DATABASE_URL não configurada");
    sqlClient = neon(url);
  }
  return sqlClient;
}

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const STAGES = ["identificado", "escuta", "encaminhado", "acompanhamento", "concluido"];
const NEEDS = ["renda", "perspectiva", "estudos", "acolhimento"];
const STATUSES = ["sugerido", "quero_tentar", "em_andamento", "enviado", "concluido"];

const STUDENT_COLS = `s.id, s.name, s.turma, s.attendance, s.prev_attendance, s.grade::float8 AS grade, s.low_subjects,
  s.stage, s.need, s.identified, s.responsible, s.return_date::text AS return_date,
  s.signal_since::text AS signal_since, s.created_at::text AS created_at`;
const SUPPORT_COLS = `id, need, kind, title, schedule, description, deadline::text AS deadline`;

type Body = Record<string, unknown>;

function str(v: unknown, field: string, max = 500): string {
  if (typeof v !== "string" || !v.trim()) throw new HttpError(400, `Campo obrigatório: ${field}`);
  return v.trim().slice(0, max);
}
function optStr(v: unknown, max = 500): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}
function num(v: unknown, field: string, min: number, max: number): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n) || n < min || n > max) throw new HttpError(400, `Valor inválido: ${field}`);
  return n;
}
function oneOf(v: unknown, list: string[], field: string): string {
  if (typeof v !== "string" || !list.includes(v)) throw new HttpError(400, `Valor inválido: ${field}`);
  return v;
}
function optDate(v: unknown): string | null {
  if (typeof v !== "string" || !v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new HttpError(400, "Data inválida");
  return v;
}
function id(v: string | undefined): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(404, "Não encontrado");
  return n;
}

async function getStudent(sid: number) {
  const sql = db();
  const [student] = (await sql.query(`SELECT ${STUDENT_COLS} FROM students s WHERE s.id = $1`, [sid])) as Body[];
  if (!student) throw new HttpError(404, "Estudante não encontrado");
  const notes = await sql.query(`SELECT id, stage, text, created_at::text AS created_at FROM notes WHERE student_id = $1 ORDER BY created_at DESC, id DESC`, [sid]);
  const refs = (await sql.query(
    `SELECT r.id, r.student_id, r.support_id, r.status, r.created_at::text AS created_at,
       json_build_object('id', p.id, 'need', p.need, 'kind', p.kind, 'title', p.title, 'schedule', p.schedule,
         'description', p.description, 'deadline', p.deadline::text) AS support
     FROM referrals r JOIN supports p ON p.id = r.support_id WHERE r.student_id = $1 ORDER BY r.created_at, r.id`,
    [sid],
  )) as Body[];
  const help = await sql.query(`SELECT id, student_id, message, resolved, created_at::text AS created_at FROM help_requests WHERE student_id = $1 ORDER BY created_at DESC`, [sid]);
  return { ...student, notes, referrals: refs, help };
}

async function addNote(sid: number, stage: string, text: string) {
  await db().query(`INSERT INTO notes (student_id, stage, text) VALUES ($1, $2, $3)`, [sid, stage, text.slice(0, 2000)]);
}

async function route(method: string, parts: string[], url: URL, body: Body) {
  const sql = db();
  const [res, rid, sub] = parts;

  if (res === "health") {
    await sql`SELECT 1`;
    return { ok: true };
  }

  if (res === "students" && !rid) {
    if (method === "GET") return sql.query(`SELECT ${STUDENT_COLS} FROM students s ORDER BY s.updated_at DESC, s.id DESC`);
    if (method === "POST") {
      const attendance = Math.round(num(body["attendance"], "frequência", 0, 100));
      const prev = body["prev_attendance"] === "" || body["prev_attendance"] == null ? null : Math.round(num(body["prev_attendance"], "frequência anterior", 0, 100));
      const [row] = (await sql.query(
        `INSERT INTO students (name, turma, attendance, prev_attendance, grade, low_subjects) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [str(body["name"], "nome", 120), str(body["turma"], "turma", 30), attendance, prev, num(body["grade"], "nota", 0, 10), Math.round(num(body["low_subjects"] ?? 0, "disciplinas", 0, 20))],
      )) as { id: number }[];
      return getStudent(row!.id);
    }
  }

  if (res === "students" && rid && !sub) {
    const sid = id(rid);
    if (method === "GET") return getStudent(sid);
    if (method === "PATCH") {
      const sets: string[] = [];
      const vals: unknown[] = [];
      const set = (col: string, v: unknown) => { vals.push(v); sets.push(`${col} = $${vals.length}`); };
      if ("stage" in body) set("stage", oneOf(body["stage"], STAGES, "etapa"));
      if ("need" in body) set("need", body["need"] == null ? null : oneOf(body["need"], NEEDS, "necessidade"));
      if ("identified" in body) set("identified", optStr(body["identified"], 2000));
      if ("responsible" in body) set("responsible", optStr(body["responsible"], 120));
      if ("return_date" in body) set("return_date", optDate(body["return_date"]));
      if ("attendance" in body) {
        const current = (await sql.query(`SELECT attendance FROM students WHERE id = $1`, [sid])) as { attendance: number }[];
        set("prev_attendance", current[0]?.attendance ?? null);
        set("attendance", Math.round(num(body["attendance"], "frequência", 0, 100)));
      }
      if ("grade" in body) set("grade", num(body["grade"], "nota", 0, 10));
      if ("low_subjects" in body) set("low_subjects", Math.round(num(body["low_subjects"], "disciplinas", 0, 20)));
      if (body["stage"] === "identificado") set("signal_since", new Date().toISOString().slice(0, 10));
      if (sets.length) {
        vals.push(sid);
        await sql.query(`UPDATE students SET ${sets.join(", ")}, updated_at = now() WHERE id = $${vals.length}`, vals);
      }
      const note = optStr(body["note"], 2000);
      if (note) {
        const [s] = (await sql.query(`SELECT stage FROM students WHERE id = $1`, [sid])) as { stage: string }[];
        await addNote(sid, s?.stage ?? "identificado", note);
      }
      return getStudent(sid);
    }
    if (method === "DELETE") {
      await sql.query(`DELETE FROM students WHERE id = $1`, [sid]);
      return { ok: true };
    }
  }

  if (res === "students" && rid && sub === "referrals" && method === "POST") {
    const sid = id(rid);
    const ids = Array.isArray(body["support_ids"]) ? body["support_ids"].map((x) => id(String(x))) : [];
    if (!ids.length) throw new HttpError(400, "Escolha ao menos um apoio");
    for (const supportId of ids) {
      await sql.query(`INSERT INTO referrals (student_id, support_id) VALUES ($1, $2) ON CONFLICT (student_id, support_id) DO NOTHING`, [sid, supportId]);
    }
    await sql.query(
      `UPDATE students SET stage = 'encaminhado', responsible = COALESCE($2, responsible), return_date = COALESCE($3::date, return_date), updated_at = now() WHERE id = $1`,
      [sid, optStr(body["responsible"], 120), optDate(body["return_date"])],
    );
    const titles = (await sql.query(`SELECT title FROM supports WHERE id = ANY($1::int[])`, [ids])) as { title: string }[];
    await addNote(sid, "encaminhado", `Encaminhado: ${titles.map((t) => t.title).join(", ")}` + (optStr(body["note"]) ? ` — ${optStr(body["note"])}` : ""));
    return getStudent(sid);
  }

  if (res === "students" && rid && sub === "help" && method === "POST") {
    const sid = id(rid);
    const message = str(body["message"], "mensagem", 2000);
    await sql.query(`INSERT INTO help_requests (student_id, message) VALUES ($1, $2)`, [sid, message]);
    await addNote(sid, "acompanhamento", `Pedido de ajuda do estudante: ${message}`);
    await sql.query(`UPDATE students SET updated_at = now() WHERE id = $1`, [sid]);
    return getStudent(sid);
  }

  if (res === "referrals" && rid && method === "PATCH") {
    const status = oneOf(body["status"], STATUSES, "status");
    const rows = (await sql.query(
      `UPDATE referrals r SET status = $1, updated_at = now() FROM supports p WHERE r.id = $2 AND p.id = r.support_id RETURNING r.student_id, p.title`,
      [status, id(rid)],
    )) as { student_id: number; title: string }[];
    const row = rows[0];
    if (!row) throw new HttpError(404, "Encaminhamento não encontrado");
    await addNote(row.student_id, "acompanhamento", `${row.title}: ${status.replace("_", " ")}`);
    await sql.query(`UPDATE students SET stage = CASE WHEN stage = 'encaminhado' THEN 'acompanhamento' ELSE stage END, updated_at = now() WHERE id = $1`, [row.student_id]);
    return getStudent(row.student_id);
  }

  if (res === "supports" && !rid) {
    if (method === "GET") {
      const need = url.searchParams.get("need");
      const q = url.searchParams.get("q");
      const where: string[] = [];
      const vals: unknown[] = [];
      if (need && NEEDS.includes(need)) { vals.push(need); where.push(`need = $${vals.length}`); }
      if (q) { vals.push(`%${q}%`); where.push(`(title ILIKE $${vals.length} OR kind ILIKE $${vals.length} OR description ILIKE $${vals.length})`); }
      return sql.query(
        `SELECT ${SUPPORT_COLS} FROM supports ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY deadline NULLS LAST, title`,
        vals,
      );
    }
    if (method === "POST") {
      const [row] = await sql.query(
        `INSERT INTO supports (need, kind, title, schedule, description, deadline) VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${SUPPORT_COLS}`,
        [oneOf(body["need"], NEEDS, "necessidade"), str(body["kind"], "tipo", 30).toUpperCase(), str(body["title"], "título", 120), str(body["schedule"], "horário", 80), str(body["description"], "descrição", 500), optDate(body["deadline"])],
      ) as Body[];
      return row;
    }
  }

  if (res === "help" && !rid && method === "GET") {
    return sql.query(
      `SELECT h.id, h.student_id, h.message, h.resolved, h.created_at::text AS created_at, s.name AS student_name, s.turma
       FROM help_requests h JOIN students s ON s.id = h.student_id ORDER BY h.resolved, h.created_at DESC LIMIT 50`,
    );
  }
  if (res === "help" && rid && method === "PATCH") {
    await sql.query(`UPDATE help_requests SET resolved = $1 WHERE id = $2`, [body["resolved"] !== false, id(rid)]);
    return { ok: true };
  }

  throw new HttpError(404, "Rota não encontrada");
}

export async function handleApi(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // Na Vercel o vercel.json reescreve /api/:path* para /api?path=:path*
  const path = url.searchParams.get("path") ?? url.pathname.replace(/^\/api\/?/, "");
  const parts = path.split("/").filter(Boolean);
  try {
    let body: Body = {};
    if (request.method !== "GET" && request.method !== "HEAD") {
      const text = await request.text();
      if (text) body = JSON.parse(text) as Body;
    }
    const data = await route(request.method, parts, url, body);
    return Response.json(data, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    if (err instanceof HttpError) return Response.json({ error: err.message }, { status: err.status });
    if (err instanceof SyntaxError) return Response.json({ error: "JSON inválido" }, { status: 400 });
    console.error(err);
    return Response.json({ error: "Erro interno" }, { status: 500 });
  }
}

export const GET = handleApi;
export const POST = handleApi;
export const PATCH = handleApi;
export const DELETE = handleApi;
