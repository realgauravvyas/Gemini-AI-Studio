<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AutoGrade AI

**A Gemini-powered grading assistant: photograph a handwritten math solution, get it
transcribed to LaTeX and graded against a rubric — automatically.**

## What it does

1. **Set up a question** — type or photograph the question itself; Gemini extracts
   the question text and builds grading context from it.
2. **Upload the handwritten solution** — a photo of a student's worked answer.
3. **Transcribe** — Gemini converts the handwriting into LaTeX, rendered live in a
   side-by-side editor/preview (with a math symbol palette for manual touch-ups).
4. **Grade** — the transcribed LaTeX is graded against the question, returning a
   score and structured feedback.

Built on `gemini-2.5-flash` via `@google/genai`, with retry/backoff handling for
rate limits baked into every model call.

## Stack

React 19 + TypeScript + Vite, `@google/genai` for the model calls, `prismjs` /
`react-simple-code-editor` for the LaTeX editor, `jspdf` + `html2canvas` for export.

## Run locally

**Prerequisites:** Node.js

```bash
npm install
```

Set `GEMINI_API_KEY` in `.env.local` to your Gemini API key, then:

```bash
npm run dev
```

## Layout

```
components/    FileUpload, QuestionSetup, LatexEditor + LatexPreview, SymbolPalette, GradingPanel
services/      geminiService.ts — all Gemini calls: image→LaTeX, question extraction, grading
hooks/         useDebounce
```
