import { Link } from "@tanstack/react-router";
import { Compass, Home, LayoutDashboard, Route as RouteIcon, Waypoints } from "lucide-react";
import type { ReactNode } from "react";

const links = [
  { to: "/", label: "Início", icon: Home },
  { to: "/painel", label: "Painel", icon: LayoutDashboard },
  { to: "/casos", label: "Casos", icon: Waypoints },
  { to: "/apoios", label: "Apoios", icon: Compass },
  { to: "/meu-caminho", label: "Meu caminho", icon: RouteIcon },
] as const;

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <img src="/logo.svg" alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
      <span className="text-sm font-extrabold tracking-[0.18em] text-profundo">PONTE ZERO</span>
    </Link>
  );
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gelo bg-papel/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: l.to === "/" }}
              className="rounded-full px-3 py-1.5 text-sm font-semibold text-profundo hover:bg-gelo"
              activeProps={{ className: "bg-profundo !text-white hover:bg-profundo" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-gelo bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex flex-col items-center gap-0.5 py-2 text-[0.68rem] font-semibold text-cinza"
            activeProps={{ className: "!text-ponte" }}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

/** Cabeçalho de tela no estilo dos mockups: "PONTE ZERO" + título. */
export function ScreenTitle({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-extrabold leading-tight text-profundo sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-cinza">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Progress({ value, className = "h-2" }: { value: number; className?: string }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-gelo ${className}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-nuvem transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function NumberDot({ n, tone = "nuvem" }: { n: ReactNode; tone?: "nuvem" | "ponte" }) {
  return (
    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${tone === "ponte" ? "bg-ponte" : "bg-nuvem"}`}>{n}</span>
  );
}

export function Loading({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="space-y-3" aria-busy>
      <p className="sr-only">{label}</p>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-[14px] bg-gelo/70" />
      ))}
    </div>
  );
}

export function ErrorBox({ error }: { error: Error }) {
  return (
    <div className="card border-l-4 border-ponte p-4 text-sm">
      <p className="font-bold text-ponte">Não foi possível falar com o servidor.</p>
      <p className="text-cinza">{error.message}</p>
    </div>
  );
}

export function Initials({ name, className = "h-12 w-12 text-base" }: { name: string; className?: string }) {
  const ini = name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  return <span className={`grid shrink-0 place-items-center rounded-full bg-nuvem font-bold text-white ${className}`}>{ini}</span>;
}
