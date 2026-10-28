import data from "@/data/biblioteca.json";

export const KEY = "mq_aluno";

export function buscarAluno(codigo: string) {
  return data.alunos.find((a) => a.codigo_aluno.toUpperCase() === codigo.trim().toUpperCase()) ?? null;
}

export function livrosDevolvidos(alunoId: string) {
  const ids = new Set(
    data.emprestimos.filter((e) => e.aluno_id === alunoId && e.status === "Devolvido").map((e) => e.livro_id),
  );
  return data.livros.filter((l) => ids.has(l.id));
}

export function livroPorId(id: string) {
  return data.livros.find((l) => l.id === id) ?? null;
}

export const PONTOS_POR_ACERTO = 100;
export const TOTAL_PERGUNTAS = 6;

export const DIAS_ESPERA = 5;
const PARTIDAS = "mq_partidas";
export type Partida = { livroId: string; pontos: number; acertos: number; data: string };

function lerTodas(): Record<string, Partida[]> {
  try { return JSON.parse(localStorage.getItem(PARTIDAS) ?? "{}"); } catch { return {}; }
}
export function partidasDo(codigo: string): Partida[] {
  return lerTodas()[codigo] ?? [];
}

export type LinhaRanking = {
  nome: string;
  codigo: string;
  turma: string;
  jogos: number;
  acertos: number;
  pontos: number;
  casas: number;
};

export function rankingAlunos(): LinhaRanking[] {
  const todas = lerTodas();
  return data.alunos
    .map((aluno) => {
      const partidas = todas[aluno.codigo_aluno] ?? [];
      const jogos = partidas.length;
      return {
        nome: aluno.nome,
        codigo: aluno.codigo_aluno,
        turma: aluno.turma,
        jogos,
        acertos: partidas.reduce((total, partida) => total + partida.acertos, 0),
        pontos: partidas.reduce((total, partida) => total + partida.pontos, 0),
        casas: Math.min(jogos, 9),
      };
    })
    .sort((a, b) => b.acertos - a.acertos || b.pontos - a.pontos || b.jogos - a.jogos || a.nome.localeCompare(b.nome));
}

export function registrarPartida(codigo: string, p: Partida) {
  const t = lerTodas();
  const lista = t[codigo] ?? [];
  const antiga = lista.find((x) => x.livroId === p.livroId);
  t[codigo] = [...lista.filter((x) => x.livroId !== p.livroId), antiga ? { ...p, data: antiga.data } : p];
  localStorage.setItem(PARTIDAS, JSON.stringify(t));
}

/** Regras: cada livro só pode ser jogado uma vez; nova partida só após 5 dias da última. */
export function situacao(partidas: Partida[], livroId: string | null, agora = new Date()) {
  const ultima = partidas.reduce<Date | null>((m, p) => {
    const d = new Date(p.data);
    return !m || d > m ? d : m;
  }, null);
  const liberaEm = ultima ? new Date(ultima.getTime() + DIAS_ESPERA * 86400000) : null;
  const jaJogado = !!livroId && partidas.some((p) => p.livroId === livroId);
  const aguardando = !!liberaEm && agora < liberaEm;
  return { jaJogado, aguardando, liberaEm, podeJogar: !jaJogado && !aguardando };
}
