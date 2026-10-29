// ============= Full file contents =============
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { buscarAluno, KEY } from "@/lib/aluno";
import mapaCosmico from "@/assets/mapa-cosmico.png.asset.json";

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
    <main
      className="relative grid min-h-screen place-items-center bg-cover bg-center px-4 py-8"
      style={{ backgroundImage: `url(${mapaCosmico.url})` }}
    >
      <div className="absolute inset-0 bg-background/40" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <div className="login-card p-7 text-center">
          <div className="text-6xl">🐱📖</div>
          <h1 className="mt-2 text-4xl font-extrabold leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">
            MISSÃO <span className="block text-primary">QUITÉRIO</span>
          </h1>
          <p className="mt-1 font-bold text-accent">Leia • Responda • Avance</p>

          <form onSubmit={entrar} className="mt-6">
            <label className="block text-sm font-semibold" htmlFor="codigo">Código do aluno</label>
            <input
              id="codigo"
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value); setErro(""); }}
              placeholder="Ex.: ADR0007"
              className="mt-2 w-full rounded-xl border bg-secondary px-4 py-3 text-center text-lg font-bold tracking-widest outline-none focus:ring-2 focus:ring-ring"
            />
            {erro && <p className="mt-2 text-sm text-destructive">{erro}</p>}
            <button className="mt-5 w-full rounded-xl bg-primary py-3 text-lg font-extrabold text-primary-foreground transition hover:brightness-110">
              Começar a missão
            </button>
          </form>

          <Link
            to="/ranking"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-accent bg-secondary/80 py-3 font-bold text-accent transition hover:bg-accent hover:text-accent-foreground"
          >
            🏆 Ver ranking dos alunos
          </Link>
        </div>
      </div>
    </main>
  );
}
