import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { gerarPerguntas } from "@/lib/quiz.functions";
import { KEY, livroPorId, partidasDo, PONTOS_POR_ACERTO, registrarPartida, situacao, TOTAL_PERGUNTAS } from "@/lib/aluno";
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
  const navigate = useNavigate();
  const [liberado] = useState(() => !!aluno && situacao(partidasDo(aluno.codigo_aluno), livroId).podeJogar);
  const gerar = useServerFn(gerarPerguntas);
  const q = useQuery({
    queryKey: ["quiz", livroId, aluno?.codigo_aluno],
    queryFn: () => gerar({ data: { livroId, codigo: aluno!.codigo_aluno } }),
    enabled: !!aluno && liberado,
    staleTime: Infinity,
    retry: false,
  });
  const [atual, setAtual] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);

  const [restante, setRestante] = useState(15);
  const encerrar = () => { localStorage.removeItem(KEY); navigate({ to: "/", replace: true }); };
  useEffect(() => {
    if (!fim) return;
    if (restante <= 0) { encerrar(); return; }
    const t = setTimeout(() => setRestante((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [fim, restante]);

  if (!aluno || !livro) return null;

  let conteudo;
  if (!liberado && !fim) {
    conteudo = (
      <div className="text-center">
        <div className="text-5xl">🔒</div>
        <p className="mt-3">Esta missão não está disponível agora. Cada livro vale uma única missão, e a próxima libera 5 dias após a última.</p>
        <Link to="/aluno" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2 font-bold text-primary-foreground">Voltar</Link>
      </div>
    );
  } else if (q.isLoading || q.isFetching) {
    conteudo = (
      <div className="text-center" role="status" aria-live="polite">
        <div className="relative mx-auto h-36 max-w-xl overflow-hidden rounded-2xl bg-secondary/70">
          <div className="absolute inset-x-6 bottom-6 h-1 rounded-full bg-accent/30" />
          <img
            src="/gatinho-missao.png"
            alt="Gatinho caminhando enquanto prepara a missão"
            className="missao-gatinho absolute bottom-5 left-2 h-28 w-20 object-contain"
          />
        </div>
        <div className="relative mt-5 h-3 overflow-hidden rounded-full bg-secondary">
          <div className="missao-barra-carrega absolute inset-y-0 left-0 w-1/3 rounded-full bg-primary" />
        </div>
        <p className="mt-4 animate-pulse text-lg font-bold">🐱 Preparando sua missão...</p>
        <p className="mt-1 text-sm text-muted-foreground">O gatinho está buscando perguntas no livro.</p>
      </div>
    );
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
        <p className="mt-4 text-sm text-muted-foreground">Pontos registrados! Sua próxima missão, com outro livro, libera em 5 dias.</p>
        <button onClick={encerrar} className="mt-5 rounded-xl bg-primary px-6 py-2 font-bold text-primary-foreground">
          Encerrar e passar a vez ({restante}s)
        </button>
      </div>
    );
  } else {
    const p = q.data.perguntas[atual]!;
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
                onClick={() => {
                  setEscolha(i);
                  const novo = acertos + (i === p.correta ? 1 : 0);
                  setAcertos(novo);
                }}
                className={`rounded-xl px-4 py-3 text-left font-semibold transition ${cor}`}
              >{String.fromCharCode(65 + i)}) {o}</button>
            );
          })}
        </div>
        {respondeu && (
          <div className="mt-5">
            <p className="text-muted-foreground">{escolha === p.correta ? "✅ Acertou! " : "❌ Quase! "}{p.explicacao}</p>
            <button
              onClick={() => {
                if (atual + 1 >= TOTAL_PERGUNTAS) {
                  // A partida só passa a contar depois que o aluno responde tudo.
                  // Assim, sair ou atualizar a página no meio não consome a missão.
                  registrarPartida(aluno.codigo_aluno, {
                    livroId,
                    acertos,
                    pontos: acertos * PONTOS_POR_ACERTO,
                    data: new Date().toISOString(),
                  });
                  setFim(true);
                } else {
                  setAtual(atual + 1);
                  setEscolha(null);
                }
              }}
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
