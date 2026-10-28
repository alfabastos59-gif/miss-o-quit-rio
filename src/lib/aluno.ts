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
