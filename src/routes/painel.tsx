import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, CalendarClock, ChevronRight, MessageCircleHeart, Plus, TrendingDown } from "lucide-react";
import { useAddStudent, useHelpRequests, useResolveHelp, useStudents } from "@/lib/api";
import { ATTENTION_LABEL, STAGES, formatDate, isOnTrack, isOpen, needsAttention, riskOf, signalsOf, type Student } from "@/lib/ponte";
import { ErrorBox, Loading, Progress, ScreenTitle } from "@/components/AppShell";

export const Route = createFileRoute("/painel")({
  component: Painel,
});

const priority = { alto: 0, medio: 1, baixo: 2 } as const;

function Painel() {
  const { data: students, isLoading, error } = useStudents();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <ScreenTitle eyebrow="Painel da equipe" title="Quem precisa de atenção agora" subtitle="Dados de frequência e desempenho viram sinais claros, sem rótulos e com foco no próximo passo." />
      {error ? (
        <div className="mt-6"><ErrorBox error={error} /></div>
      ) : isLoading || !students ? (
        <div className="mt-6"><Loading /></div>
      ) : (
        <Dashboard students={students} />
      )}
    </main>
  );
}

function Dashboard({ students }: { students: Student[] }) {
  const open = students.filter(isOpen);
  const attention = students.filter(needsAttention);
  const followed = open.filter((s) => s.stage !== "identificado");
  const onTrack = followed.filter((s) => isOnTrack(s));
  const pct = followed.length ? Math.round((onTrack.length / followed.length) * 100) : 0;
  const overdue = followed.filter((s) => !isOnTrack(s));

  const recent = useMemo(
    () =>
      open
        .flatMap((s) => signalsOf(s).map((sig) => ({ s, sig })))
        .sort((a, b) => priority[riskOf(a.s)] - priority[riskOf(b.s)])
        .slice(0, 6),
    [open],
  );

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="space-y-4">
        <section className="rounded-[18px] bg-profundo p-5 text-white">
          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-ceu">Sinais da semana</p>
          <p className="mt-1 text-2xl font-extrabold">
            {attention.length} {attention.length === 1 ? "caso pede" : "casos pedem"} atenção
          </p>
          <p className="mt-1 text-sm text-white/75">Sem conversa ainda e com padrões de frequência ou notas que mudaram.</p>
        </section>

        <section className="card p-5">
          <p className="text-sm font-bold">Acompanhamentos  •  {pct}% em dia</p>
          <Progress value={pct} className="mt-3 h-2" />
          <p className="mt-2 text-xs text-cinza">
            {onTrack.length} de {followed.length} casos já tiveram conversa e estão com o retorno no prazo.
          </p>
          {overdue.length > 0 && (
            <div className="mt-3 space-y-1">
              {overdue.map((s) => (
                <Link key={s.id} to="/caso/$id" params={{ id: String(s.id) }} className="flex items-center gap-2 text-xs font-semibold text-ponte hover:underline">
                  <CalendarClock className="h-3.5 w-3.5" /> Retorno pendente: {s.name.split(" ")[0]} ({s.turma}) desde {formatDate(s.return_date)}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-bold">Sinais recentes</h2>
          <div className="mt-2 space-y-2">
            {recent.length === 0 && <p className="text-sm text-cinza">Nenhum sinal novo. 🎉</p>}
            {recent.map(({ s, sig }, i) => (
              <Link key={`${s.id}-${i}`} to="/caso/$id" params={{ id: String(s.id) }} className="card flex items-center gap-3 p-3 transition hover:-translate-y-0.5">
                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${sig.kind === "frequencia" ? "bg-nuvem" : "bg-ponte"}`}>
                  {sig.kind === "frequencia" ? <TrendingDown className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{sig.title}</p>
                  <p className="truncate text-xs text-cinza">{sig.detail}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-cinza" />
              </Link>
            ))}
          </div>
        </section>

        <HelpInbox />
      </div>

      <div className="space-y-4">
        <CasesList students={students} />
        <AddStudent />
      </div>
    </div>
  );
}

function HelpInbox() {
  const { data } = useHelpRequests();
  const resolve = useResolveHelp();
  const pending = (data ?? []).filter((h) => !h.resolved);
  if (!pending.length) return null;
  return (
    <section>
      <h2 className="text-lg font-bold">Pedidos de ajuda</h2>
      <div className="mt-2 space-y-2">
        {pending.map((h) => (
          <div key={h.id} className="card flex items-start gap-3 border-l-4 border-ceu p-3">
            <MessageCircleHeart className="mt-0.5 h-5 w-5 shrink-0 text-ponte" />
            <div className="min-w-0 flex-1">
              <Link to="/caso/$id" params={{ id: String(h.student_id) }} className="text-sm font-bold hover:underline">
                {h.student_name} • {h.turma}
              </Link>
              <p className="text-sm text-texto">{h.message}</p>
              <p className="text-xs text-cinza">{formatDate(h.created_at)}</p>
            </div>
            <button className="text-xs font-semibold text-nuvem hover:underline" onClick={() => resolve.mutate(h.id)}>
              Respondido
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function CasesList({ students }: { students: Student[] }) {
  const [filter, setFilter] = useState<"abertos" | "todos">("abertos");
  const list = [...students]
    .filter((s) => filter === "todos" || isOpen(s))
    .sort((a, b) => priority[riskOf(a)] - priority[riskOf(b)] || STAGES.findIndex((x) => x.id === a.stage) - STAGES.findIndex((x) => x.id === b.stage));

  return (
    <section className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Casos</h2>
        <div className="flex gap-1">
          {(["abertos", "todos"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`tag cursor-pointer ${filter === f ? "!bg-profundo !text-white" : ""}`}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-3 divide-y divide-gelo">
        {list.map((s) => {
          const r = riskOf(s);
          return (
            <li key={s.id}>
              <Link to="/caso/$id" params={{ id: String(s.id) }} className="flex items-center gap-3 py-3 hover:bg-papel">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${r === "alto" ? "bg-ponte" : r === "medio" ? "bg-ceu" : "bg-nuvem"}`} title={ATTENTION_LABEL[r]} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{s.name}</p>
                  <p className="text-xs text-cinza">
                    {s.turma} • Frequência {s.attendance}% • Nota {s.grade.toFixed(1)}
                  </p>
                </div>
                <span className="tag hidden sm:inline-flex">{STAGES.find((x) => x.id === s.stage)?.label}</span>
                <ChevronRight className="h-4 w-4 text-cinza" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function AddStudent() {
  const [open, setOpen] = useState(false);
  const add = useAddStudent();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    add.mutate(
      {
        name: String(f.get("name")),
        turma: String(f.get("turma")),
        attendance: Number(f.get("att")),
        prev_attendance: f.get("prev") ? Number(f.get("prev")) : "",
        grade: Number(f.get("grade")),
        low_subjects: Number(f.get("low") || 0),
      },
      { onSuccess: () => { form.reset(); setOpen(false); } },
    );
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary w-full">
        <Plus className="h-4 w-4" /> Adicionar estudante
      </button>
    );

  return (
    <form onSubmit={onSubmit} className="card grid gap-3 p-4 sm:grid-cols-2">
      <h2 className="text-lg font-bold sm:col-span-2">Adicionar estudante</h2>
      <input required name="name" placeholder="Nome" className="field sm:col-span-2" />
      <input required name="turma" placeholder="Turma (ex.: 2º B)" className="field" />
      <input required name="grade" type="number" min={0} max={10} step={0.1} placeholder="Nota média (0–10)" className="field" />
      <input required name="att" type="number" min={0} max={100} placeholder="Frequência atual %" className="field" />
      <input name="prev" type="number" min={0} max={100} placeholder="Frequência anterior % (opcional)" className="field" />
      <input name="low" type="number" min={0} max={20} placeholder="Disciplinas abaixo da média" className="field sm:col-span-2" />
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={add.isPending} className="btn-primary flex-1">{add.isPending ? "Salvando…" : "Adicionar"}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  );
}
