import { createServerFn } from "@tanstack/react-start";
import data from "@/data/biblioteca.json";

export type Pergunta = { pergunta: string; opcoes: string[]; correta: number; explicacao: string };

export const gerarPerguntas = createServerFn({ method: "POST" })
  .inputValidator((input: { livroId: string; codigo: string }) => input)
  .handler(async ({ data: input }) => {
    const aluno = data.alunos.find((a) => a.codigo_aluno.toUpperCase() === input.codigo.toUpperCase());
    if (!aluno) throw new Error("Aluno não encontrado");
    const devolveu = data.emprestimos.some(
      (e) => e.aluno_id === aluno.id && e.livro_id === input.livroId && e.status === "Devolvido",
    );
    if (!devolveu) throw new Error("Este livro ainda não foi devolvido por você.");
    const livro = data.livros.find((l) => l.id === input.livroId)!;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "Você cria quizzes de leitura para alunos do ensino médio brasileiro. Escreva em português do Brasil, linguagem simples e animada. Perguntas sobre enredo, personagens, temas e autor do livro. Cada pergunta tem 4 opções e apenas uma correta.",
          },
          {
            role: "user",
            content: `Crie exatamente 6 perguntas de múltipla escolha sobre o livro "${livro.titulo}" de ${livro.autor}. Sinopse: ${livro.descricao ?? "sem sinopse"}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "quiz",
              parameters: {
                type: "object",
                properties: {
                  perguntas: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        pergunta: { type: "string" },
                        opcoes: { type: "array", items: { type: "string" } },
                        correta: { type: "integer", description: "índice 0-3 da opção correta" },
                        explicacao: { type: "string" },
                      },
                      required: ["pergunta", "opcoes", "correta", "explicacao"],
                    },
                  },
                },
                required: ["perguntas"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "quiz" } },
      }),
    });
    if (res.status === 429) throw new Error("Muitas missões ao mesmo tempo. Tente de novo em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok) throw new Error("Não foi possível criar as perguntas.");
    const json = await res.json();
    const args = JSON.parse(json.choices[0].message.tool_calls[0].function.arguments);
    const perguntas = (args.perguntas as Pergunta[])
      .filter((p) => p.opcoes?.length === 4 && p.correta >= 0 && p.correta < 4)
      .slice(0, 6);
    if (perguntas.length < 6) throw new Error("Perguntas incompletas, tente novamente.");
    return { perguntas };
  });
