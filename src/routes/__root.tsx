import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter, type ErrorComponentProps } from "@tanstack/react-router";

import { AppHeader, BottomNav } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 text-3xl font-extrabold">Página não encontrada</h1>
      <p className="mt-2 text-cinza">O caminho que você procurou não existe ou mudou de lugar.</p>
      <Link to="/" className="btn-primary mt-6">Voltar ao início</Link>
    </main>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow">Algo deu errado</p>
      <h1 className="mt-2 text-2xl font-extrabold">Não foi possível carregar esta página</h1>
      <p className="mt-2 text-sm text-cinza">{error instanceof Error ? error.message : String(error)}</p>
      <button
        className="btn-primary mt-6"
        onClick={() => {
          router.invalidate();
          reset();
        }}
      >
        Tentar novamente
      </button>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-dvh flex-col">
        <AppHeader />
        <div className="flex-1 pb-24 md:pb-10">
          <Outlet />
        </div>
        <BottomNav />
      </div>
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
