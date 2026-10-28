import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { buscarAluno, KEY } from "@/lib/aluno";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Missão Quitério — Entrar" },
      { name: "description", content: "Entre com seu código de aluno e jogue com os livros que você leu." },
      { property: "og:title", content: "Missão Quitério" },
      { property: "og:description", content: "Leia, responda e avance! Biblioteca Maria Quitéria." },
    ],
  }),
  component: Login,
});

function Login() {
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const navigate = useNavigate();

  function entrar(e: React.FormEvent) {
    e.preventDefault();
    const aluno = buscarAluno(codigo);
    if (!aluno) return setErro("Código não encontrado. Confira com a biblioteca.");
    localStorage.setItem(KEY, aluno.codigo_aluno);
    navigate({ to: "/aluno" });
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-5xl items-center gap-10 px-6 py-12 md:grid-cols-2">
      <div>
        <div className="text-7xl">🐱📖</div>
        <h1 className="mt-4 text-6xl font-extrabold leading-none">
          MISSÃO <span className="block text-primary">QUITÉRIO</span>
        </h1>
        <p className="mt-2 font-bold text-accent">Leia • Responda • Avance</p>
        <p className="mt-4 text-muted-foreground">Grandes histórias te levam mais longe! Biblioteca Maria Quitéria.</p>
      </div>
      <form onSubmit={entrar} className="glow-card p-7">
        <h2 className="text-2xl font-bold">Pronto para a missão?</h2>
        <label className="mt-5 block text-sm" htmlFor="codigo">Código do aluno</label>
        <input
          id="codigo"
          value={codigo}
          onChange={(e) => { setCodigo(e.target.value); setErro(""); }}
          placeholder="Ex.: ADR0007"
          className="mt-2 w-full rounded-xl border bg-secondary px-4 py-3 outline-none focus:ring-2 focus:ring-ring"
        />
        {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
        <button className="mt-5 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground transition hover:brightness-110">
          Começar a missão
        </button>
      </form>
    </main>
  );
}
