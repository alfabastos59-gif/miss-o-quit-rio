import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { rankingAlunos } from "@/lib/aluno";

const TOTAL_CASAS = 10;
const CORES = ["bg-primary", "bg-accent", "bg-fuchsia-400", "bg-emerald-400", "bg-blue-400"];

export const Route = createFileRoute("/ranking")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Ranking dos alunos — Missão Quitério" },
      { name: "description", content: "Veja quem avançou mais na Missão Quitério." },
      { property: "og:title", content: "Ranking dos alunos — Missão Quitério" },
    ],
  }),
  component: Ranking,
});

function Ranking() {
  const alunos = useMemo(() => rankingAlunos(), []);
  const lider = alunos[0]!;
  const houvePartidas = alunos.some((aluno) => aluno.jogos > 0);
  const casasDaTrilha = Array.from({ length: TOTAL_CASAS }, (_, casa) => casa);

  return (
    <main className="ranking-page min-h-screen px-4 py-5 sm:px-6">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 border-b border-cyan-300/30 pb-4">
        <Link to="/" className="font-display text-xl font-extrabold text-primary sm:text-2xl">🐱 MISSÃO QUITÉRIO</Link>
        <Link to="/" className="rounded-full bg-secondary px-4 py-2 text-sm font-bold transition hover:ring-2 hover:ring-primary">← Voltar</Link>
      </header>

      <div className="mx-auto mt-6 max-w-7xl">
        <section className="ranking-hero rounded-3xl border-2 border-cyan-300/70 p-5 shadow-[0_0_35px_rgba(34,211,238,0.25)] sm:p-7">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-cyan-200">Aventura literária</p>
              <h1 className="mt-1 font-display text-4xl font-extrabold text-white sm:text-6xl">Ranking dos alunos</h1>
              <p className="mt-2 max-w-2xl text-cyan-50/80">Responda, acumule pontos e avance uma casa no tabuleiro a cada missão concluída.</p>
            </div>
            <div className="rounded-2xl border border-cyan-200/40 bg-blue-950/70 px-5 py-4 text-center">
              <span className="text-sm text-cyan-100/80">Livro da rodada</span>
              <strong className="mt-1 block font-display text-xl text-white">📖 Grandes histórias</strong>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="ranking-board rounded-3xl border-2 border-cyan-300/70 p-4 shadow-[0_0_35px_rgba(34,211,238,0.2)] sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">🚀 Trilha da leitura</h2>
                <p className="text-sm text-cyan-100/75">Cada partida concluída vale uma nova casa.</p>
              </div>
              <span className="rounded-full bg-cyan-300/20 px-3 py-1 text-xs font-bold text-cyan-100">10 casas</span>
            </div>

            <div className="ranking-track relative overflow-hidden rounded-3xl border border-blue-300/40 p-4 sm:p-7">
              <div className="ranking-track-glow absolute inset-x-7 top-1/2 h-2 -translate-y-1/2 rounded-full" />
              <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-5 sm:gap-4">
                {casasDaTrilha.map((casa) => {
                  const jogadores = alunos.filter((aluno) => aluno.casas === casa && aluno.jogos > 0).slice(0, 2);
                  return (
                    <div key={casa} className={`ranking-house ${casa === 0 ? "ranking-house-start" : ""} ${casa === TOTAL_CASAS - 1 ? "ranking-house-finish" : ""}`}>
                      <span className="text-2xl sm:text-3xl">{casa === 0 ? "🚀" : casa === TOTAL_CASAS - 1 ? "🏆" : casa % 3 === 0 ? "📖" : casa % 3 === 1 ? "⭐" : "❓"}</span>
                      <strong>Casa {casa}</strong>
                      {jogadores.length > 0 && (
                        <div className="mt-1 flex -space-x-2">
                          {jogadores.map((jogador, i) => (
                            <span key={jogador.codigo} title={jogador.nome} className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-blue-950 text-xs ${CORES[i % CORES.length]}`}>
                              {jogador.nome.charAt(0).toUpperCase()}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {houvePartidas && (
                <img
                  src="/gatinho-missao.png"
                  alt="Gatinho avançando no tabuleiro"
                  className="ranking-gatinho pointer-events-none absolute bottom-2 h-20 w-16 object-contain sm:h-24 sm:w-20"
                  style={{ left: `calc(${(lider.casas / (TOTAL_CASAS - 1)) * 100}% - 2.5rem)` }}
                />
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-sm text-cyan-100/80">
              <span>⭐ Acerto = pontos</span>
              <span>🚀 Jogo = +1 casa</span>
              <span>🏆 Casa final = campeão</span>
            </div>
          </section>

          <aside className="ranking-scoreboard rounded-3xl border-2 border-cyan-300/70 p-5 shadow-[0_0_35px_rgba(34,211,238,0.2)]">
            <div className="flex items-center justify-between border-b border-cyan-200/30 pb-4">
              <h2 className="font-display text-2xl font-extrabold text-white">🏆 Pontuação</h2>
              <span className="text-2xl">⭐</span>
            </div>
            <div className="mt-3 space-y-2">
              {alunos.slice(0, 10).map((aluno, index) => (
                <div key={aluno.codigo} className={`ranking-row ${index === 0 ? "ranking-row-leader" : ""}`}>
                  <span className="w-7 text-center font-display text-xl font-extrabold text-cyan-100">{index + 1}</span>
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${CORES[index % CORES.length]}`}>{index === 0 ? "👑" : aluno.nome.charAt(0).toUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-white">{aluno.nome}</strong>
                    <small className="text-cyan-100/60">{aluno.jogos} {aluno.jogos === 1 ? "jogo" : "jogos"} • casa {aluno.casas}</small>
                  </span>
                  <strong className="font-display text-lg text-primary">{aluno.pontos}</strong>
                </div>
              ))}
            </div>
            {!houvePartidas && <p className="mt-4 rounded-xl bg-blue-950/60 p-3 text-center text-sm text-cyan-100/75">Conclua uma missão para aparecer no ranking.</p>}
          </aside>
        </div>

        <section className="mt-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-cyan-300/40 bg-blue-950/60 p-4 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-display text-xl font-extrabold text-white">{houvePartidas ? `Líder atual: ${lider.nome}` : "O tabuleiro está esperando por você!"}</p>
            <p className="text-sm text-cyan-100/70">{houvePartidas ? `${lider.acertos} acertos e ${lider.pontos} pontos conquistados.` : "Seja o primeiro aluno a avançar."}</p>
          </div>
          <Link to="/" className="rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground transition hover:brightness-110">Começar missão →</Link>
        </section>
      </div>
    </main>
  );
}
