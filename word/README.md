# Scribe — a browser word processor

A word processor that reads and writes real `.docx` files, runs entirely in the browser, and has
no build step and no dependencies. Open `word/index.html` and it works — from a file:// path, a
static host, or embedded in something else.

    open word/index.html          # macOS
    xdg-open word/index.html      # Linux
    npx http-server word          # or serve it

## What it does

**Editing** — headings and body styles, bold/italic/underline/strikethrough, superscript and
subscript, font family and size, text colour and highlight, alignment, line spacing, space
before/after, indents, bulleted and numbered lists (nested), block quotes, code blocks,
horizontal rules, links, symbols, dates, undo/redo, clear formatting.

**Tables** — insert by grid picker, add/delete rows and columns, header-row toggle, borderless
toggle, Tab to walk cells (Tab in the last cell adds a row).

**Images** — insert from disk, paste from clipboard, or drag in. Stored inline and embedded in
the exported `.docx` as real image parts.

**Pages** — A4/Letter/Legal/A5, portrait or landscape, four margin presets, manual page breaks,
page-boundary markers on screen, a page count, and print CSS that paginates properly for
Print → Save as PDF.

**Review** — find and replace (case, whole word, replace all), margin comments anchored to a text
range, live word/character/paragraph counts, spell check toggle, read-only toggle.

**Navigation and view** — heading outline pane, comments pane, zoom 50–200%, page layout vs. web
layout, focus mode, formatting marks, light/dark interface.

**Files** — open `.docx`, `.html`, `.md`, `.txt`; save to browser storage (autosave every few
seconds, multiple documents, duplicate/delete); download as `.docx`, `.html` (self-contained),
`.md`, `.txt`; print to PDF.

## DOCX fidelity

Export writes a complete OPC package: `document.xml`, `styles.xml`, `numbering.xml`,
`comments.xml`, header/footer parts, `docProps`, relationships, content types, and media parts.
Mapped both ways: paragraph styles, direct run formatting (bold, italic, underline, strike,
colour, highlight/shading, font, size, sub/superscript), alignment, indentation, line and
paragraph spacing, multi-level bullets and numbering, tables with header rows, column spans and
cell shading, hyperlinks, inline images, page breaks, section page size and margins, and comments.

Verified in `tests/e2e.mjs`: the app runs in Chromium, exports a document with all of the above,
re-imports it, and the result is checked element by element. The exported file is also parsed
independently with `python-docx`.

## What it deliberately does not do

This is not Microsoft Word, and the gap is mostly in these places:

- **No track changes.** Comments yes, revision marking no.
- **On-screen pagination is indicative, not reflowed.** Page markers are computed from content
  height; text does not re-flow around page boundaries the way Word's layout engine does. Printing
  and PDF export use the browser's paginator, which is real.
- **No mail merge, macros/VBA, equation editor, footnotes/endnotes, cross-references, table of
  contents field, citation manager, or SmartArt.**
- **No multi-column layout, text boxes, floating image wrap, or drawing canvas.** Images are inline.
- **No co-editing.** One browser, one document, local storage.
- **DOCX import covers the mainstream subset.** Content controls, fields (beyond page numbers),
  footnotes, floating shapes, and theme-based fonts are dropped rather than misrendered.
- **Header/footer text applies to the `.docx` export.** Browsers do not let a page paint its own
  print headers, so for PDF use the browser's own header/footer settings.

## Layout

    word/
      index.html          UI shell
      css/app.css         interface + document typography
      css/print.css       what reaches the printer
      js/util.js          helpers, unit conversion (px/pt/twip/EMU)
      js/zip.js           ZIP read/write (deflate via CompressionStream)
      js/ui.js            toasts, modals, prompts
      js/editor.js        document surface, selection, page geometry, stats
      js/format.js        character/paragraph formatting, toolbar state
      js/tables.js        table insert and edit
      js/outline.js       navigation pane, counters
      js/findreplace.js   find and replace
      js/comments.js      anchored comments
      js/docx-export.js   DOM -> WordprocessingML
      js/docx-import.js   WordprocessingML -> DOM
      js/storage.js       documents in localStorage, autosave
      js/files.js         open/save/export/print, paste and drop handling
      js/main.js          wiring, shortcuts

## Keyboard

`Ctrl/Cmd` + `B` `I` `U` formatting · `Alt+1..4` headings, `Alt+0` body · `S` save to browser ·
`Shift+S` download .docx · `O` open · `F` find · `H` replace · `K` link · `Shift+C` comment ·
`Enter` page break · `P` print · `Z`/`Y` undo/redo · `Alt+N` new document.

## Browser support

Needs `CompressionStream`/`DecompressionStream` (Chrome/Edge 80+, Firefox 113+, Safari 16.4+) for
`.docx` read and write. Everything else works without them.

## Tests

    node tests/e2e.mjs

Runs the real app in Chromium via Playwright: formatting, tables, find/replace, counters, outline,
a full DOCX export with XML validation of every part, a DOCX round trip, import of a
foreign-style DOCX, storage, and the Markdown/HTML exporters.
