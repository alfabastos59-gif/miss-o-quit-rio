import { describe, it, expect } from "vitest";
import { situacao } from "@/lib/aluno";

const p = [{ livroId: "A", pontos: 100, acertos: 1, data: "2026-10-01T12:00:00Z" }];
describe("regras da missão", () => {
  it("livro já jogado nunca pode ser jogado de novo", () => {
    expect(situacao(p, "A", new Date("2026-12-01")).podeJogar).toBe(false);
  });
  it("outro livro bloqueado antes de 5 dias", () => {
    expect(situacao(p, "B", new Date("2026-10-05T12:00:00Z")).podeJogar).toBe(false);
  });
  it("outro livro liberado após 5 dias", () => {
    expect(situacao(p, "B", new Date("2026-10-06T12:00:01Z")).podeJogar).toBe(true);
  });
});
