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

    const schema = {
      type: "object", additionalProperties: false, required: ["perguntas"],
      properties: { perguntas: { type: "array", items: {
        type: "object", additionalProperties: false,
        required: ["pergunta", "opcoes", "correta", "explicacao"],
        properties: {
          pergunta: { type: "string" },
          opcoes: { type: "array", items: { type: "string" } },
          correta: { type: "integer" },
          explicacao: { type: "string" },
        } } } },
    };
    const chaveLovable = process.env["LOVABLE_API_KEY"];
    const usandoLovable = Boolean(chaveLovable);
    const baseOpenAI = (process.env["OPENAI_API_BASE"] ?? "https://api.openai.com/v1").replace(/\/$/, "");
    const instrucoes =
      "Você cria quizzes de leitura para alunos do ensino médio brasileiro. Português do Brasil, linguagem simples e animada. Perguntas sobre enredo, personagens, temas e autor. Cada pergunta tem exatamente 4 opções e só uma correta; 'correta' é o índice 0-3.";
    const entrada = `Crie exatamente 6 perguntas de múltipla escolha sobre o livro "${livro.titulo}" de ${livro.autor}. Sinopse: ${livro.descricao ?? "sem sinopse"}`;
    const res = await fetch(
      usandoLovable ? "https://ai.gateway.lovable.dev/v1/responses" : `${baseOpenAI}/chat/completions`,
      {
        method: "POST",
        headers: usandoLovable
          ? {
              "Lovable-API-Key": chaveLovable,
              "X-Lovable-AIG-SDK": "fetch",
              "Content-Type": "application/json",
            }
          : {
              Authorization: `Bearer ${process.env["OPENAI_API_KEY"]}`,
              "Content-Type": "application/json",
            },
        body: JSON.stringify(
          usandoLovable
            ? {
                model: "openai/gpt-6-astra",
                stream: true,
                store: false,
                reasoning: { effort: "low" },
                instructions: instrucoes,
                input: entrada,
                text: { format: { type: "json_schema", name: "quiz", strict: true, schema } },
              }
            : {
                model: "gpt-5-mini",
                messages: [
                  { role: "system", content: instrucoes },
                  { role: "user", content: entrada },
                ],
                response_format: { type: "json_schema", json_schema: { name: "quiz", strict: true, schema } },
              },
        ),
      },
    );
    if (res.status === 429) throw new Error("Muitas missões ao mesmo tempo. Tente de novo em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados.");
    if (!res.ok || !res.body) throw new Error("Não foi possível criar as perguntas.");
    let texto = "";
    if (usandoLovable) {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const linhas = buf.split("\n");
        buf = linhas.pop() ?? "";
        for (const l of linhas) {
          if (!l.startsWith("data:")) continue;
          const d = l.slice(5).trim();
          if (!d || d === "[DONE]") continue;
          try {
            const ev = JSON.parse(d);
            if (ev.type === "response.output_text.delta") texto += ev.delta;
          } catch {
            /* ignora eventos incompletos */
          }
        }
      }
    } else {
      const resposta = (await res.json()) as { choices?: [{ message?: { content?: string } }] };
      texto = resposta.choices?.[0]?.message?.content ?? "";
    }
    const args = JSON.parse(texto);
    const perguntas = (args.perguntas as Pergunta[])
      .filter((p) => p.opcoes?.length === 4 && p.correta >= 0 && p.correta < 4)
      .slice(0, 6);
    if (perguntas.length < 6) throw new Error("Perguntas incompletas, tente novamente.");
    return { perguntas };
  });
