import { createFileRoute, Link } from "@tanstack/react-router";
import { useStudents } from "@/lib/api";
import { NEEDS, STAGES, formatDate, riskOf } from "@/lib/ponte";
import { ErrorBox, Loading, NumberDot, ScreenTitle } from "@/components/AppShell";

export const Route = createFileRoute("/casos")({
  component: Casos,
});

function Casos() {
  const { data: students, isLoading, error } = useStudents();

  return (
    <main className="mx-auto max-w-7xl px-4 py-6">
      <ScreenTitle eyebrow="Fluxo de atendimento" title="Um caminho curto do sinal ao apoio" subtitle="Cada caso atravessa a ponte, etapa por etapa." />
      {error ? (
        <div className="mt-6"><ErrorBox error={error} /></div>
      ) : isLoading || !students ? (
        <div className="mt-6"><Loading /></div>
      ) : (
        <div className="-mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
          {STAGES.map((st, i) => {
            const items = students.filter((s) => s.stage === st.id);
            return (
              <section key={st.id} className="w-[78vw] max-w-xs shrink-0 snap-start rounded-[18px] bg-gelo/60 p-3 md:w-auto md:max-w-none">
                <div className="flex items-center gap-2">
                  <NumberDot n={i + 1} tone={st.id === "encaminhado" ? "ponte" : "nuvem"} />
                  <h2 className="font-bold">{st.label}</h2>
                  <span className="ml-auto text-sm font-bold text-cinza">{items.length}</span>
                </div>
                <div className="mt-3 space-y-2">
                  {items.map((s) => {
                    const r = riskOf(s);
                    return (
                      <Link key={s.id} to="/caso/$id" params={{ id: String(s.id) }} className="card block p-3 transition hover:-translate-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${r === "alto" ? "bg-ponte" : r === "medio" ? "bg-ceu" : "bg-nuvem"}`} />
                          <p className="truncate text-sm font-bold">{s.name}</p>
                        </div>
                        <p className="mt-1 text-xs text-cinza">
                          {s.turma}
                          {s.need && ` • ${NEEDS[s.need].short}`}
                          {s.return_date && st.id !== "concluido" && ` • retorno ${formatDate(s.return_date)}`}
                        </p>
                      </Link>
                    );
                  })}
                  {items.length === 0 && <p className="px-1 text-xs text-cinza">Nenhum caso nesta etapa.</p>}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
