import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Clock, Plus, Search } from "lucide-react";
import { useAddSupport, useSupports } from "@/lib/api";
import { NEEDS, formatDate, type Need, type Support } from "@/lib/ponte";
import { ErrorBox, Loading, ScreenTitle } from "@/components/AppShell";

const needKeys = Object.keys(NEEDS) as Need[];

export const Route = createFileRoute("/apoios")({
  validateSearch: (search: Record<string, unknown>): { need?: Need; q?: string } => ({
    ...(needKeys.includes(search["need"] as Need) ? { need: search["need"] as Need } : {}),
    ...(typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {}),
  }),
  component: Apoios,
});

function daysLeft(deadline: string) {
  return Math.ceil((new Date(deadline + "T23:59:59").getTime() - Date.now()) / 86400000);
}

function Apoios() {
  const { need, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/apoios" });
  const [text, setText] = useState(q ?? "");
  const { data, isLoading, error, isFetching } = useSupports(need, q);

  useEffect(() => {
    const t = setTimeout(() => {
      if ((q ?? "") !== text) navigate({ search: (prev) => ({ ...prev, q: text || undefined }), replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [text, q, navigate]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <ScreenTitle eyebrow="Apoios para você" title="Oportunidades que cabem na rotina" subtitle="Bolsas, vagas, cursos e acolhimento com horários pensados para não competir com a escola." />

      <label className="card mt-5 flex items-center gap-2 px-3 py-2.5">
        <Search className="h-4 w-4 text-cinza" />
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Buscar bolsa, curso ou vaga" className="w-full bg-transparent text-sm outline-none placeholder:text-cinza" />
      </label>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={!need} onClick={() => navigate({ search: (p) => ({ ...p, need: undefined }) })}>Todas</Chip>
        {needKeys.map((k) => (
          <Chip key={k} active={need === k} onClick={() => navigate({ search: (p) => ({ ...p, need: k }) })}>
            {NEEDS[k].short}
          </Chip>
        ))}
      </div>

      {need && <p className="mt-3 text-sm text-cinza">{NEEDS[need].hint}</p>}

      <div className={`mt-4 ${isFetching ? "opacity-70" : ""}`}>
        {error ? (
          <ErrorBox error={error} />
        ) : isLoading || !data ? (
          <Loading />
        ) : data.length === 0 ? (
          <p className="text-sm text-cinza">Nenhum apoio encontrado com esse filtro.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((s) => <SupportCard key={s.id} s={s} />)}
          </div>
        )}
      </div>

      <NewSupport />
    </main>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition ${active ? "bg-profundo text-white" : "bg-gelo text-profundo hover:bg-[#d4e6ec]"}`}>
      {children}
    </button>
  );
}

export function SupportCard({ s }: { s: Support }) {
  const left = s.deadline ? daysLeft(s.deadline) : null;
  const work = s.kind === "TRABALHO" || s.kind === "ESTÁGIO";
  return (
    <article className="card flex flex-col p-4">
      <span className={`tag self-start ${work ? "!bg-ponte-claro !text-ponte" : ""}`}>{s.kind}</span>
      <h3 className="mt-2 font-bold">{s.title}</h3>
      <p className="mt-1 flex-1 text-sm text-texto">{s.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cinza">
        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.schedule}</span>
        {s.deadline ? (
          <span className={`inline-flex items-center gap-1 font-bold ${left != null && left <= 21 ? "text-ponte" : "text-profundo"}`}>
            <CalendarDays className="h-3.5 w-3.5" />até {formatDate(s.deadline)}{left != null && left >= 0 && ` • ${left === 0 ? "último dia" : `${left} dias`}`}
          </span>
        ) : (
          <span className="font-semibold text-nuvem">Inscrições abertas</span>
        )}
      </div>
    </article>
  );
}

function NewSupport() {
  const [open, setOpen] = useState(false);
  const add = useAddSupport();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    add.mutate(
      {
        need: f.get("need") as Need,
        kind: String(f.get("kind")),
        title: String(f.get("title")),
        schedule: String(f.get("schedule")),
        description: String(f.get("description")),
        deadline: f.get("deadline") ? String(f.get("deadline")) : null,
      },
      { onSuccess: () => { form.reset(); setOpen(false); } },
    );
  }

  if (!open)
    return (
      <button onClick={() => setOpen(true)} className="btn-secondary mt-6">
        <Plus className="h-4 w-4" /> Cadastrar apoio (equipe)
      </button>
    );

  return (
    <form onSubmit={onSubmit} className="card mt-6 grid gap-3 p-4 sm:grid-cols-2">
      <h2 className="text-lg font-bold sm:col-span-2">Cadastrar apoio</h2>
      <select required name="need" className="field" defaultValue="">
        <option value="" disabled>Necessidade</option>
        {needKeys.map((k) => <option key={k} value={k}>{NEEDS[k].short}</option>)}
      </select>
      <input required name="kind" placeholder="Tipo (ex.: BOLSA, ESTÁGIO)" className="field" />
      <input required name="title" placeholder="Título" className="field sm:col-span-2" />
      <input required name="schedule" placeholder="Horário (ex.: contraturno)" className="field" />
      <label className="text-xs font-semibold text-cinza">Prazo (opcional)<input type="date" name="deadline" className="field mt-1" /></label>
      <textarea required name="description" placeholder="Descrição" rows={2} className="field sm:col-span-2" />
      <div className="flex gap-2 sm:col-span-2">
        <button disabled={add.isPending} className="btn-primary flex-1">Salvar</button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancelar</button>
      </div>
    </form>
  );
}
