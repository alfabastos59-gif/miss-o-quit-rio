<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Library data (students, loans, books) is a static JSON snapshot in src/data/biblioteca.json, imported from the uploaded backup; student login is by student code stored in localStorage (no Cloud yet).
- Quiz questions are generated server-side via Lovable AI Gateway in src/lib/quiz.functions.ts, which re-checks the student actually returned the book.
