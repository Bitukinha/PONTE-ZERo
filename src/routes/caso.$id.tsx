import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, ExternalLink } from "lucide-react";
import { useAddReferrals, useReferralStatus, useStudent, useSupports, useUpdateStudent } from "@/lib/api";
import { NEEDS, REFERRAL_STATUS, STAGES, formatDate, signalsOf, type Need, type ReferralStatus, type StudentDetail } from "@/lib/ponte";
import { ErrorBox, Initials, Loading, NumberDot } from "@/components/AppShell";

export const Route = createFileRoute("/caso/$id")({
  component: Caso,
});

function Caso() {
  const { id } = Route.useParams();
  const { data: s, isLoading, error } = useStudent(Number(id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <Link to="/painel" className="inline-flex items-center gap-1 text-sm font-semibold text-cinza hover:text-profundo">
        <ArrowLeft className="h-4 w-4" /> Painel
      </Link>
      <p className="eyebrow mt-3">Detalhes do caso</p>
      {error ? <div className="mt-4"><ErrorBox error={error} /></div> : isLoading || !s ? <div className="mt-4"><Loading /></div> : <CaseView s={s} />}
    </main>
  );
}

function CaseView({ s }: { s: StudentDetail }) {
  const signals = signalsOf(s);
  const stageIdx = STAGES.findIndex((x) => x.id === s.stage);

  return (
    <div className="mt-2 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="space-y-4">
        <section className="flex items-center gap-4 rounded-[18px] bg-gelo p-4">
          <Initials name={s.name} />
          <div className="min-w-0">
            <p className="font-extrabold">Acompanhamento #{s.id}</p>
            <p className="truncate text-sm text-texto">{s.name} • {s.turma}</p>
            {s.need && <p className="mt-0.5 text-[0.7rem] font-bold tracking-wider text-nuvem">{NEEDS[s.need].tag}</p>}
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-bold">O que foi identificado</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {signals.map((sig) => (
              <span key={sig.title} className={`tag ${sig.kind === "notas" ? "!bg-ponte-claro !text-ponte" : ""}`}>{sig.title}</span>
            ))}
            <span className="tag !bg-papel">Frequência {s.attendance}%</span>
            <span className="tag !bg-papel">Nota {s.grade.toFixed(1)}</span>
          </div>
          <p className="mt-3 text-sm text-texto">{s.identified ?? "Ainda sem conversa registrada. O próximo passo é escutar o estudante."}</p>
        </section>

        <NextStep s={s} />
        {s.referrals.length > 0 && <Referrals s={s} />}
      </div>

      <aside className="space-y-4">
        <section className="card p-4">
          <h2 className="font-bold">Do sinal ao encaminhamento</h2>
          <ol className="mt-3 space-y-3">
            {STAGES.map((st, i) => (
              <li key={st.id} className="flex items-start gap-3">
                {i < stageIdx ? (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-nuvem text-white"><Check className="h-4 w-4" /></span>
                ) : (
                  <span className={i === stageIdx ? "" : "opacity-40"}><NumberDot n={i + 1} tone={i === stageIdx ? "ponte" : "nuvem"} /></span>
                )}
                <div className={i > stageIdx ? "opacity-50" : ""}>
                  <p className="text-sm font-bold">{st.label}</p>
                  <p className="text-xs text-cinza">{st.hint}</p>
                </div>
              </li>
            ))}
          </ol>
          {(s.responsible || s.return_date) && (
            <p className="mt-4 rounded-xl bg-papel p-3 text-xs text-texto">
              {s.responsible && <>Responsável: <strong>{s.responsible}</strong></>}
              {s.return_date && <> • Retorno em <strong>{formatDate(s.return_date)}</strong></>}
            </p>
          )}
        </section>

        <section className="card p-4">
          <h2 className="font-bold">Histórico</h2>
          <ul className="mt-3 space-y-3">
            {s.notes.map((n) => (
              <li key={n.id} className="border-l-2 border-nuvem pl-3 text-sm">
                <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-cinza">
                  {formatDate(n.created_at)} • {STAGES.find((x) => x.id === n.stage)?.label}
                </p>
                <p className="text-texto">{n.text}</p>
              </li>
            ))}
            {s.notes.length === 0 && <li className="text-sm text-cinza">Sem registros ainda.</li>}
          </ul>
        </section>
        <Link to="/meu-caminho/$id" params={{ id: String(s.id) }} className="inline-flex items-center gap-1 text-sm font-semibold text-nuvem hover:underline">
          Ver como o estudante vê <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </aside>
    </div>
  );
}

function NextStep({ s }: { s: StudentDetail }) {
  const update = useUpdateStudent(s.id);
  const [need, setNeed] = useState<Need | "">(s.need ?? "");
  const [report, setReport] = useState("");
  const [att, setAtt] = useState("");
  const [grade, setGrade] = useState("");

  if (s.stage === "identificado")
    return (
      <section className="card space-y-3 p-4">
        <h2 className="font-bold">Próxima ação: conversar</h2>
        <p className="text-sm text-cinza">Escute o estudante sem julgamentos e registre a principal dificuldade relatada.</p>
        <textarea value={report} onChange={(e) => setReport(e.target.value)} rows={3} className="field" placeholder="O que o estudante relatou na conversa?" />
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(NEEDS) as Need[]).map((k) => (
            <label key={k} className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 p-3 text-sm ${need === k ? "border-nuvem bg-gelo/50" : "border-gelo"}`}>
              <input type="radio" name="need" checked={need === k} onChange={() => setNeed(k)} className="mt-1 accent-[#4d91b1]" />
              <span><strong>{NEEDS[k].short}</strong><br /><span className="text-xs text-cinza">{NEEDS[k].label}</span></span>
            </label>
          ))}
        </div>
        <button
          disabled={!need || !report.trim() || update.isPending}
          className="btn-primary w-full"
          onClick={() => update.mutate({ stage: "escuta", need: need as Need, identified: report, note: report, toast: "Conversa registrada" })}
        >
          Registrar conversa <ArrowRight className="h-4 w-4" />
        </button>
      </section>
    );

  if (s.stage === "escuta") return <ReferralForm s={s} />;

  if (s.stage === "concluido")
    return (
      <section className="card space-y-3 p-4">
        <h2 className="font-bold">Caso concluído</h2>
        <p className="text-sm text-cinza">O estudante seguiu estudando. Continue de olho nos próximos meses.</p>
        <button className="btn-secondary" onClick={() => update.mutate({ stage: "identificado", note: "Caso reaberto", toast: "Caso reaberto" })}>Reabrir caso</button>
      </section>
    );

  return (
    <section className="card space-y-3 p-4">
      <h2 className="font-bold">Acompanhar a evolução</h2>
      <p className="text-sm text-cinza">Atualize os números para ver se frequência e desempenho estão melhorando.</p>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" min={0} max={100} value={att} onChange={(e) => setAtt(e.target.value)} placeholder={`Frequência (${s.attendance}%)`} className="field" />
        <input type="number" min={0} max={10} step={0.1} value={grade} onChange={(e) => setGrade(e.target.value)} placeholder={`Nota (${s.grade.toFixed(1)})`} className="field" />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          disabled={(!att && !grade) || update.isPending}
          className="btn-primary"
          onClick={() =>
            update.mutate(
              {
                ...(att ? { attendance: Number(att) } : {}),
                ...(grade ? { grade: Number(grade) } : {}),
                stage: "acompanhamento",
                note: `Evolução registrada: frequência ${att || s.attendance}% • nota ${grade || s.grade}`,
                toast: "Evolução registrada",
              },
              { onSuccess: () => { setAtt(""); setGrade(""); } },
            )
          }
        >
          Registrar evolução
        </button>
        <button className="btn-secondary" onClick={() => update.mutate({ stage: "escuta", note: "Nova conversa agendada", toast: "Nova conversa" })}>Nova conversa</button>
        <button className="btn-secondary" onClick={() => update.mutate({ stage: "concluido", note: "Caso concluído: estudante seguiu estudando", toast: "Caso concluído 🎉" })}>Concluir caso</button>
      </div>
    </section>
  );
}

function ReferralForm({ s }: { s: StudentDetail }) {
  const { data: supports } = useSupports(s.need ?? undefined);
  const add = useAddReferrals(s.id);
  const already = new Set(s.referrals.map((r) => r.support_id));
  const [picked, setPicked] = useState<number[]>([]);
  const [responsible, setResponsible] = useState(s.responsible ?? "Coordenação");
  const inTwoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
  const [ret, setRet] = useState(s.return_date?.slice(0, 10) ?? inTwoWeeks);

  const toggle = (id: number) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const options = (supports ?? []).filter((x) => !already.has(x.id));

  return (
    <section className="card space-y-3 p-4">
      <h2 className="font-bold">Apoios sugeridos</h2>
      {s.need && <p className="text-sm text-cinza">{NEEDS[s.need].hint}</p>}
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 ${picked.includes(o.id) ? "border-nuvem bg-gelo/50" : "border-gelo"}`}>
            <input type="checkbox" checked={picked.includes(o.id)} onChange={() => toggle(o.id)} className="mt-1 accent-[#4d91b1]" />
            <span className="min-w-0">
              <span className="block text-sm font-bold">{o.title}</span>
              <span className="block text-xs text-cinza">{o.schedule}{o.deadline && ` • até ${formatDate(o.deadline)}`}</span>
            </span>
          </label>
        ))}
        {supports && options.length === 0 && <p className="text-sm text-cinza">Todos os apoios desta necessidade já foram encaminhados.</p>}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-xs font-semibold text-cinza">Responsável
          <input value={responsible} onChange={(e) => setResponsible(e.target.value)} className="field mt-1" />
        </label>
        <label className="text-xs font-semibold text-cinza">Data de retorno
          <input type="date" value={ret} onChange={(e) => setRet(e.target.value)} className="field mt-1" />
        </label>
      </div>
      <button
        disabled={!picked.length || add.isPending}
        className="btn-primary w-full"
        onClick={() => add.mutate({ support_ids: picked, responsible, return_date: ret }, { onSuccess: () => setPicked([]) })}
      >
        Registrar encaminhamento <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}

function Referrals({ s }: { s: StudentDetail }) {
  const setStatus = useReferralStatus();
  return (
    <section className="card p-4">
      <h2 className="font-bold">Encaminhamentos</h2>
      <ul className="mt-2 divide-y divide-gelo">
        {s.referrals.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
            <span className="tag">{r.support.kind}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">{r.support.title}</p>
              <p className="text-xs text-cinza">{r.support.schedule}{r.support.deadline && ` • até ${formatDate(r.support.deadline)}`}</p>
            </div>
            <select
              value={r.status}
              onChange={(e) => setStatus.mutate({ id: r.id, status: e.target.value as ReferralStatus })}
              className="field !w-auto !py-1.5 text-xs"
              aria-label={`Status de ${r.support.title}`}
            >
              {(Object.keys(REFERRAL_STATUS) as ReferralStatus[]).map((k) => (
                <option key={k} value={k}>{REFERRAL_STATUS[k]}</option>
              ))}
            </select>
          </li>
        ))}
      </ul>
      {s.stage !== "escuta" && s.stage !== "concluido" && <AddMore s={s} />}
    </section>
  );
}

function AddMore({ s }: { s: StudentDetail }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} className="mt-2 text-sm font-semibold text-nuvem hover:underline">+ Sugerir outro apoio</button>;
  return <div className="mt-3"><ReferralForm s={s} /></div>;
}
