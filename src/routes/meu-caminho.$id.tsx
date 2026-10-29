import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, Check, MessageCircleHeart, Send } from "lucide-react";
import { useAskHelp, useReferralStatus, useStudent } from "@/lib/api";
import { ME_KEY, REFERRAL_STATUS, achievementsOf, formatDate, progressOf, type ReferralStatus, type StudentDetail } from "@/lib/ponte";
import { ErrorBox, Initials, Loading, Progress } from "@/components/AppShell";

export const Route = createFileRoute("/meu-caminho/$id")({
  component: MeuCaminho,
});

function MeuCaminho() {
  const { id } = Route.useParams();
  const { data: s, isLoading, error } = useStudent(Number(id));

  useEffect(() => {
    if (!s) return;
    try {
      localStorage.setItem(ME_KEY, String(s.id));
    } catch {
      /* armazenamento indisponível */
    }
  }, [s]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <p className="eyebrow">Meu caminho</p>
      {error ? (
        <div className="mt-4"><ErrorBox error={error} /></div>
      ) : isLoading || !s ? (
        <div className="mt-4"><Loading /></div>
      ) : (
        <Caminho s={s} />
      )}
    </main>
  );
}

const STUDENT_STATUSES: ReferralStatus[] = ["quero_tentar", "em_andamento", "enviado"];

function nextActions(s: StudentDetail) {
  const list: { title: string; detail: string; done: boolean }[] = [
    {
      title: "Conversa com a coordenação",
      detail: s.stage === "identificado" ? "A equipe vai chamar você para conversar." : "Conversa realizada.",
      done: s.stage !== "identificado",
    },
  ];
  for (const r of s.referrals) {
    list.push({
      title: r.support.kind === "ESTUDOS" ? r.support.title : `Inscrição: ${r.support.title}`,
      detail: `${REFERRAL_STATUS[r.status]}${r.support.deadline ? ` • até ${formatDate(r.support.deadline)}` : ""}`,
      done: r.status === "enviado" || r.status === "concluido",
    });
  }
  if (s.return_date && s.stage !== "concluido") list.push({ title: "Retorno com a equipe", detail: `Previsto para ${formatDate(s.return_date)}`, done: false });
  return list;
}

function Caminho({ s }: { s: StudentDetail }) {
  const navigate = useNavigate();
  const pct = progressOf(s);

  function trocar() {
    try {
      localStorage.removeItem(ME_KEY);
    } catch {
      /* armazenamento indisponível */
    }
    navigate({ to: "/meu-caminho" });
  }

  return (
    <div className="mt-2 grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <section className="flex items-center gap-4">
          <Initials name={s.name} className="h-14 w-14 text-lg" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold">Olá, {s.name.split(" ")[0]}!</h1>
            <p className="text-sm text-cinza">
              {s.responsible ? `Acompanhado pela ${s.responsible.toLowerCase()}` : "Estamos com você"} • {s.turma}
            </p>
          </div>
          <button onClick={trocar} className="text-xs font-semibold text-cinza hover:underline">Trocar</button>
        </section>

        <section className="card p-4">
          <p className="text-sm font-bold">Seu progresso</p>
          <Progress value={pct} className="mt-3 h-2.5" />
          <p className="mt-2 text-xs text-cinza">{pct}% das etapas concluídas</p>
        </section>

        <section>
          <h2 className="font-bold">Próximas ações</h2>
          <ul className="mt-2 space-y-2">
            {nextActions(s).map((a) => (
              <li key={a.title} className="card flex items-center gap-3 p-3">
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${a.done ? "bg-nuvem text-white" : "bg-gelo"}`}>
                  {a.done && <Check className="h-3.5 w-3.5" />}
                </span>
                <div className="min-w-0">
                  <p className={`text-sm font-bold ${a.done ? "text-cinza line-through decoration-1" : ""}`}>{a.title}</p>
                  <p className="text-xs text-cinza">{a.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4">
          <h2 className="flex items-center gap-2 font-bold"><Award className="h-4 w-4 text-ceu" /> Conquistas</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {achievementsOf(s).map((a) => (
              <li key={a.title} className={`rounded-full px-3 py-1 text-xs font-bold ${a.done ? "bg-ceu text-profundo" : "bg-gelo/60 text-cinza"}`}>
                {a.done ? "★ " : "☆ "}
                {a.title}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-4">
        <Inscricoes s={s} />
        <PedirAjuda s={s} />
        <Link to="/apoios" className="btn-secondary w-full">Ver todos os apoios</Link>
      </div>
    </div>
  );
}

function Inscricoes({ s }: { s: StudentDetail }) {
  const setStatus = useReferralStatus();
  return (
    <section className="card p-4">
      <h2 className="font-bold">Apoios sugeridos e inscrições</h2>
      <p className="text-xs text-cinza">Encaminhamentos feitos pela equipe, com próximo passo claro.</p>
      {s.referrals.length === 0 ? (
        <p className="mt-3 text-sm text-cinza">Assim que a equipe conversar com você, os apoios aparecem aqui.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {s.referrals.map((r) => (
            <li key={r.id} className="rounded-xl border border-gelo p-3">
              <span className={`tag ${r.support.kind === "TRABALHO" ? "!bg-ponte-claro !text-ponte" : ""}`}>{r.support.kind}</span>
              <p className="mt-1 text-sm font-bold">{r.support.title}</p>
              <p className="text-xs text-cinza">
                {r.support.schedule}
                {r.support.deadline && ` • até ${formatDate(r.support.deadline)}`}
              </p>
              {r.status === "concluido" ? (
                <p className="mt-2 text-xs font-bold text-nuvem">✓ Concluído</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1">
                  {STUDENT_STATUSES.map((st) => (
                    <button
                      key={st}
                      disabled={setStatus.isPending}
                      onClick={() => setStatus.mutate({ id: r.id, status: st })}
                      className={`rounded-full px-3 py-1 text-xs font-bold transition ${r.status === st ? "bg-profundo text-white" : "bg-gelo text-profundo hover:bg-[#d4e6ec]"}`}
                    >
                      {REFERRAL_STATUS[st]}
                    </button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PedirAjuda({ s }: { s: StudentDetail }) {
  const ask = useAskHelp(s.id);
  const [msg, setMsg] = useState("");
  return (
    <section className="card p-4">
      <h2 className="flex items-center gap-2 font-bold"><MessageCircleHeart className="h-4 w-4 text-ponte" /> Pedir ajuda</h2>
      <p className="text-xs text-cinza">Algo mudou? Fale com a equipe. Sem julgamentos.</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (msg.trim()) ask.mutate(msg, { onSuccess: () => setMsg("") });
        }}
      >
        <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Escreva sua mensagem" className="field" maxLength={2000} />
        <button disabled={!msg.trim() || ask.isPending} className="btn-primary !px-3" aria-label="Enviar">
          <Send className="h-4 w-4" />
        </button>
      </form>
      {s.help.length > 0 && (
        <ul className="mt-3 space-y-1">
          {s.help.slice(0, 3).map((h) => (
            <li key={h.id} className="text-xs text-cinza">
              {formatDate(h.created_at)} — {h.message} {h.resolved ? "• respondido" : "• aguardando"}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
