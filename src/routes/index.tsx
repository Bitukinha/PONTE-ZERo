import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, GraduationCap, Users } from "lucide-react";
import hero from "@/assets/ponte-hero.webp";
import { NEEDS, type Need } from "@/lib/ponte";
import { NumberDot } from "@/components/AppShell";

export const Route = createFileRoute("/")({
  component: Index,
});

const desafio = [
  ["Dificuldade", "Trabalho, renda ou aprendizagem"],
  ["Faltas", "Ausências começam a se repetir"],
  ["Rendimento", "As notas caem aos poucos"],
  ["Vínculo", "O estudante se afasta da escola"],
  ["Abandono", "Quando já é tarde demais"],
];

const pesquisa = [
  ["2 de 4", "Fatores de permanência", "apontam a necessidade de trabalhar como fator que dificulta a permanência nos estudos."],
  ["3 de 4", "Conciliação da rotina", "sentem dificuldade frequente para conciliar os estudos com outras responsabilidades."],
  ["2 de 4", "Impacto financeiro", "dizem que as dificuldades financeiras afetam muito a continuidade dos estudos."],
  ["4 de 4", "Interesse na solução", "usariam um app que reúna oportunidades e acompanhe inscrições."],
];

const proposta = [
  ["Identificar", "Padrões de frequência e desempenho que precisam de atenção."],
  ["Acompanhar", "Organizar os casos e registrar cada conversa com o estudante."],
  ["Encaminhar", "Sugerir apoios de acordo com a necessidade identificada."],
];

const fluxo = [
  ["Dados", "Frequência e desempenho"],
  ["Sinal", "Padrões que pedem atenção"],
  ["Conversa", "A equipe escuta o estudante"],
  ["Encaminhar", "Apoio compatível com a necessidade"],
  ["Acompanhar", "Retorno e evolução do caso"],
];

function Index() {
  return (
    <main>
      <section className="relative overflow-hidden bg-ceu">
        <img src={hero} alt="Ponte vermelha sobre nuvens azuis com dois estudantes, um em cada ponta" width={1600} height={1007} className="h-[62vh] min-h-[380px] w-full object-cover object-[30%_60%] sm:h-[78vh]" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-papel via-papel/85 to-transparent px-4 pb-8 pt-20">
          <div className="mx-auto max-w-6xl">
            <h1 className="sr-only">Ponte Zero — conectando estudantes a oportunidades, antes que seja tarde.</h1>
            <p className="eyebrow">Tema • Antes que seja tarde</p>
            <p className="mt-2 max-w-xl text-lg font-semibold text-profundo">Software de análise de dados e encaminhamento para prevenir a evasão escolar.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/painel" className="btn-primary">
                <Users className="h-4 w-4" /> Sou da equipe
              </Link>
              <Link to="/meu-caminho" className="btn-secondary bg-white">
                <GraduationCap className="h-4 w-4" /> Sou estudante
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="eyebrow">01 • O desafio</p>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">A evasão começa muito antes do abandono</h2>
        <p className="mt-2 max-w-2xl text-cinza">Os sinais aparecem aos poucos, mas nem sempre as instituições conseguem identificá-los a tempo de agir.</p>
        <ol className="mt-6 grid gap-3 sm:grid-cols-5">
          {desafio.map(([t, d], i) => (
            <li key={t} className="card flex items-start gap-3 p-4 sm:flex-col">
              <NumberDot n={i + 1} tone={i === 4 ? "ponte" : "nuvem"} />
              <div>
                <h3 className="font-bold">{t}</h3>
                <p className="text-sm text-cinza">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[14px] bg-gelo p-4">
            <p className="eyebrow !text-nuvem">O que já existe</p>
            <p className="mt-1 text-sm">Escolas e instituições já têm dados de frequência e desempenho.</p>
          </div>
          <div className="rounded-[14px] bg-ponte-claro p-4">
            <p className="eyebrow">O que falta</p>
            <p className="mt-1 text-sm">Transformar esses dados em ação preventiva e acompanhamento individual.</p>
          </div>
        </div>
      </section>

      <section className="bg-creme">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="eyebrow">02 • Pesquisa piloto</p>
          <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">Conciliar estudo e trabalho foi o desafio mais citado</h2>
          <p className="mt-2 text-sm text-cinza">Formulário online e anônimo • 4 respostas • 18 a 29 anos</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pesquisa.map(([n, t, d]) => (
              <div key={t} className="card p-5">
                <p className="text-3xl font-extrabold text-ponte">{n}</p>
                <p className="mt-1 text-[0.7rem] font-bold uppercase tracking-widest text-nuvem">{t}</p>
                <p className="mt-2 text-sm text-texto">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="eyebrow">03 • A proposta</p>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">Uma ponte para o estudante continuar estudando</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="rounded-[18px] bg-profundo p-6 text-white">
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-ceu">Nosso objetivo</p>
            <p className="mt-3 text-2xl font-extrabold leading-snug">Dados que viram ação. Alertas que viram apoio.</p>
            <p className="mt-3 text-sm text-white/80">Aproximar quem enfrenta dificuldades dos recursos que ajudam a continuar estudando.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {proposta.map(([t, d], i) => (
              <div key={t} className="card p-5">
                <p className="text-sm font-extrabold text-nuvem">0{i + 1}</p>
                <h3 className="mt-1 text-lg font-bold">{t}</h3>
                <p className="mt-1 text-sm text-cinza">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gelo/60">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="eyebrow">04 • Do problema ao apoio</p>
          <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">Cada dificuldade aponta para um tipo de apoio</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(NEEDS) as Need[]).map((k, i) => (
              <Link key={k} to="/apoios" search={{ need: k }} className="card group p-5 transition hover:-translate-y-0.5">
                <p className="text-sm font-extrabold text-nuvem">0{i + 1}</p>
                <h3 className="mt-1 font-bold">{NEEDS[k].label}</h3>
                <p className="mt-1 text-sm text-cinza">{NEEDS[k].hint}</p>
                {k === "renda" && <span className="tag mt-3 !bg-ponte-claro !text-ponte">Mais citado na pesquisa</span>}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <p className="eyebrow">09 • Fluxo de atendimento</p>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">Um caminho curto do sinal ao apoio</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-5">
          {fluxo.map(([t, d], i) => (
            <li key={t} className="flex items-start gap-3 sm:flex-col">
              <NumberDot n={i + 1} tone={i === 3 ? "ponte" : "nuvem"} />
              <div>
                <h3 className="font-bold">{t}</h3>
                <p className="text-sm text-cinza">{d}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link to="/painel" className="btn-primary mt-8">
          Abrir painel da equipe <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="bg-profundo text-white">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-widest text-ceu">Nosso compromisso</p>
            <p className="mt-2 text-2xl font-extrabold">Sem rótulos. Com olhar humano.</p>
            <p className="mt-2 text-sm text-white/80">A tecnologia apoia, as pessoas decidem. Os profissionais conversam com os alunos, avaliam cada situação e acompanham os encaminhamentos.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Dados", "Análise de frequência e desempenho e identificação de padrões."],
              ["App", "Painel da equipe e app do estudante, com interface clara."],
              ["Equipe", "Avalia cada caso, decide o encaminhamento e acompanha o estudante."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-[14px] bg-white/10 p-4">
                <h3 className="font-bold text-ceu">{t}</h3>
                <p className="mt-1 text-sm text-white/85">{d}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/60 lg:col-span-2">Dados tratados com cuidado: acesso restrito à equipe e uso só para apoiar o estudante. Nenhum estudante deveria precisar escolher entre estudar e sobreviver.</p>
        </div>
      </section>
    </main>
  );
}
