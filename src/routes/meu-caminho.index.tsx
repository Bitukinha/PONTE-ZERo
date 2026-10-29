import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { useStudents } from "@/lib/api";
import { ME_KEY } from "@/lib/ponte";
import { ErrorBox, Initials, Loading, ScreenTitle } from "@/components/AppShell";

export const Route = createFileRoute("/meu-caminho/")({
  component: Escolher,
});

function Escolher() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useStudents();

  useEffect(() => {
    try {
      const me = localStorage.getItem(ME_KEY);
      if (me) navigate({ to: "/meu-caminho/$id", params: { id: me }, replace: true });
    } catch {
      /* armazenamento indisponível */
    }
  }, [navigate]);

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <ScreenTitle
        eyebrow="Meu caminho"
        title="Quem é você?"
        subtitle="Protótipo: escolha um estudante para ver o app como ele vê. Na versão final, cada estudante entra com o próprio acesso."
      />
      <div className="mt-5 space-y-2">
        {error ? (
          <ErrorBox error={error} />
        ) : isLoading || !data ? (
          <Loading />
        ) : (
          data.map((s) => (
            <Link key={s.id} to="/meu-caminho/$id" params={{ id: String(s.id) }} className="card flex items-center gap-3 p-3 transition hover:-translate-y-0.5">
              <Initials name={s.name} className="h-10 w-10 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{s.name}</p>
                <p className="text-xs text-cinza">{s.turma}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-cinza" />
            </Link>
          ))
        )}
      </div>
    </main>
  );
}
