import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { gerarPerguntas } from "@/lib/quiz.functions";
import { livroPorId, PONTOS_POR_ACERTO, TOTAL_PERGUNTAS } from "@/lib/aluno";
import { Cabecalho, useAluno } from "./aluno";

export const Route = createFileRoute("/missao/$livroId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Missão em andamento — Missão Quitério" },
      { name: "description", content: "Responda 6 perguntas sobre o livro e acumule pontos." },
      { property: "og:title", content: "Missão Quitério — Quiz do livro" },
      { property: "og:description", content: "6 perguntas, 100 pontos cada. Você encara?" },
    ],
  }),
  component: Missao,
});

function Missao() {
  const { livroId } = Route.useParams();
  const aluno = useAluno();
  const livro = livroPorId(livroId);
  const gerar = useServerFn(gerarPerguntas);
  const q = useQuery({
    queryKey: ["quiz", livroId, aluno?.codigo_aluno],
    queryFn: () => gerar({ data: { livroId, codigo: aluno!.codigo_aluno } }),
    enabled: !!aluno,
    staleTime: Infinity,
    retry: false,
  });
  const [atual, setAtual] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);

  if (!aluno || !livro) return null;

  const reiniciar = () => { setAtual(0); setEscolha(null); setAcertos(0); setFim(false); q.refetch(); };

  let conteudo;
  if (q.isLoading || q.isFetching) {
    conteudo = <p className="animate-pulse text-center text-lg">🐱 Preparando sua missão sobre o livro...</p>;
  } else if (q.error || !q.data) {
    conteudo = (
      <div className="text-center">
        <p className="text-destructive">{(q.error as Error)?.message ?? "Erro"}</p>
        <button onClick={() => q.refetch()} className="mt-4 rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground">Tentar de novo</button>
      </div>
    );
  } else if (fim) {
    const pontos = acertos * PONTOS_POR_ACERTO;
    conteudo = (
      <div className="text-center">
        <div className="text-6xl">{acertos >= 5 ? "🏆" : acertos >= 3 ? "⭐" : "📖"}</div>
        <h2 className="mt-3 text-3xl font-extrabold">Missão concluída!</h2>
        <p className="mt-2">Você acertou {acertos} de {TOTAL_PERGUNTAS}</p>
        <p className="mt-1 font-display text-5xl font-extrabold text-primary">{pontos} pts</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reiniciar} className="rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground">Jogar de novo</button>
          <Link to="/aluno" className="rounded-xl bg-secondary px-5 py-2 font-bold">Escolher outro livro</Link>
        </div>
      </div>
    );
  } else {
    const p = q.data.perguntas[atual];
    const respondeu = escolha !== null;
    conteudo = (
      <div>
        <div className="mb-4 flex justify-between text-sm font-bold">
          <span className="text-accent">Pergunta {atual + 1} de {TOTAL_PERGUNTAS}</span>
          <span className="text-primary">{acertos * PONTOS_POR_ACERTO} pts</span>
        </div>
        <div className="mb-5 h-2 rounded-full bg-secondary">
          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${((atual + (respondeu ? 1 : 0)) / TOTAL_PERGUNTAS) * 100}%` }} />
        </div>
        <h2 className="text-2xl font-bold">{p.pergunta}</h2>
        <div className="mt-5 grid gap-3">
          {p.opcoes.map((o, i) => {
            const cor = !respondeu ? "bg-secondary hover:ring-2 hover:ring-accent"
              : i === p.correta ? "bg-success text-primary-foreground"
              : i === escolha ? "bg-destructive text-destructive-foreground" : "bg-secondary opacity-60";
            return (
              <button key={i} disabled={respondeu}
                onClick={() => { setEscolha(i); if (i === p.correta) setAcertos((a) => a + 1); }}
                className={`rounded-xl px-4 py-3 text-left font-semibold transition ${cor}`}
              >{String.fromCharCode(65 + i)}) {o}</button>
            );
          })}
        </div>
        {respondeu && (
          <div className="mt-5">
            <p className="text-muted-foreground">{escolha === p.correta ? "✅ Acertou! " : "❌ Quase! "}{p.explicacao}</p>
            <button
              onClick={() => { if (atual + 1 >= TOTAL_PERGUNTAS) setFim(true); else { setAtual(atual + 1); setEscolha(null); } }}
              className="mt-4 rounded-xl bg-primary px-6 py-2 font-bold text-primary-foreground"
            >{atual + 1 >= TOTAL_PERGUNTAS ? "Ver resultado" : "Próxima →"}</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <Cabecalho nome={aluno.nome} />
      <main className="mx-auto max-w-3xl space-y-6 px-5 py-8">
        <div className="flex items-center gap-4">
          {livro.capa_url && <img src={livro.capa_url} alt={livro.titulo} className="h-24 w-16 rounded-lg object-cover" />}
          <div>
            <p className="text-sm font-bold text-accent">MISSÃO</p>
            <h1 className="text-2xl font-extrabold">{livro.titulo}</h1>
            <p className="text-muted-foreground">{livro.autor}</p>
          </div>
        </div>
        <section className="glow-card p-6">{conteudo}</section>
      </main>
    </>
  );
}
