import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { buscarAluno, KEY, livrosDevolvidos, partidasDo, situacao } from "@/lib/aluno";

export const Route = createFileRoute("/aluno")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Área do aluno — Missão Quitério" },
      { name: "description", content: "Escolha um livro devolvido para jogar a Missão Quitério." },
      { property: "og:title", content: "Área do aluno — Missão Quitério" },
      { property: "og:description", content: "Seus livros devolvidos viram missões de 6 perguntas." },
    ],
  }),
  component: AreaAluno,
});

export function Cabecalho({ nome }: { nome: string }) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between border-b px-5 py-3">
      <Link to="/aluno" className="leading-tight">
        <span className="font-display text-lg font-extrabold text-primary">🐱 MISSÃO QUITÉRIO</span>
        <span className="block text-xs text-muted-foreground">Área do aluno</span>
      </Link>
      <div className="flex items-center gap-3">
        <span className="font-bold">{nome}</span>
        <button
          onClick={() => { localStorage.removeItem(KEY); navigate({ to: "/", replace: true }); }}
          className="rounded-full bg-secondary px-4 py-1.5 text-sm"
        >Sair</button>
      </div>
    </header>
  );
}

export function useAluno() {
  const navigate = useNavigate();
  const [aluno] = useState(() => buscarAluno(localStorage.getItem(KEY) ?? ""));
  useEffect(() => { if (!aluno) navigate({ to: "/", replace: true }); }, [aluno, navigate]);
  return aluno;
}

function AreaAluno() {
  const aluno = useAluno();
  if (!aluno) return null;
  const livros = livrosDevolvidos(aluno.id);
  const partidas = partidasDo(aluno.codigo_aluno);
  const total = partidas.reduce((s, p) => s + p.pontos, 0);
  const geral = situacao(partidas, null);
  return (
    <>
      <Cabecalho nome={aluno.nome} />
      <main className="mx-auto max-w-5xl space-y-6 px-5 py-8">
        <section className="glow-card p-6">
          <h1 className="text-3xl font-extrabold">Olá, {aluno.nome}! 🚀</h1>
          <p className="text-muted-foreground">Turma: {aluno.turma}</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-primary">⭐ {total} pts acumulados</p>
          {geral.aguardando && geral.liberaEm && (
            <p className="mt-2 rounded-xl bg-secondary px-4 py-2 text-sm">
              ⏳ Próxima missão liberada em {geral.liberaEm.toLocaleDateString("pt-BR")} às {geral.liberaEm.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </section>
        <section className="glow-card p-6">
          <h2 className="text-xl font-bold">📚 Livros devolvidos — escolha sua missão</h2>
          <p className="mb-4 text-sm text-muted-foreground">6 perguntas sobre o livro • 100 pontos por acerto</p>
          {livros.length === 0 ? (
            <p className="text-muted-foreground">Você ainda não devolveu nenhum livro. Leia um e volte para jogar!</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {livros.map((l) => {
                const feita = partidas.find((p) => p.livroId === l.id);
                const st = situacao(partidas, l.id);
                const corpo = (
                  <>
                    {l.capa_url ? (
                      <img src={l.capa_url} alt={l.titulo} className="h-20 w-14 rounded-lg object-cover" />
                    ) : <div className="h-20 w-14 rounded-lg bg-muted" />}
                    <div className="flex flex-1 flex-col">
                      <span className="font-bold">{l.titulo}</span>
                      <span className="text-sm text-muted-foreground">{l.autor}</span>
                      <span className={`mt-auto text-sm font-bold ${st.podeJogar ? "text-primary" : "text-muted-foreground"}`}>
                        {feita ? `✅ Concluída — ${feita.pontos} pts` : st.podeJogar ? "Jogar missão →" : "🔒 Aguarde liberação"}
                      </span>
                    </div>
                  </>
                );
                if (!st.podeJogar) return <div key={l.id} className="flex gap-4 rounded-2xl bg-secondary p-3 opacity-70">{corpo}</div>;
                return (
                <Link
                  key={l.id}
                  to="/missao/$livroId"
                  params={{ livroId: l.id }}
                  className="flex gap-4 rounded-2xl bg-secondary p-3 transition hover:ring-2 hover:ring-primary"
                >{corpo}
                </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
