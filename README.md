# Tech tools

Small, self-contained tools. No build step, no dependencies.

## [word/](word/) — Scribe, a browser word processor

Reads and writes real `.docx` files, entirely client-side. Rich text editing, tables, images,
lists, comments, page setup, find and replace, outline navigation, autosave, and export to
`.docx` / `.html` / `.md` / `.txt` / PDF.

Open `word/index.html`. Details and the honest list of what it does not do: [word/README.md](word/README.md).

Tests: `node tests/e2e.mjs` (Playwright + Chromium).
