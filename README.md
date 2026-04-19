# Reading Room

A local-first reading dashboard for active books, daily journals, marginalia, reading sessions, optional encrypted sync, and Obsidian-friendly exports.

Reading Room is for readers who still prefer paper but want a lower-friction digital companion: what is active, what happened today, what notes belong to which book, and what can later become a commentary, paper topic, or long-term note.

## What It Does

- Track active books, pages read, reading contexts, and finished books
- Keep daily journal entries sorted by book and by day
- Capture marginalia as quote + thought + location + tags
- Mark words inside a quote with underline, circle, or bracket styling
- Link one marginal note to another inside the same book
- Scan a quote from a phone camera/photo and fill the quote field with local OCR
- Flag low-confidence OCR words visually so they are easy to review
- Dictate voice notes into the active book journal when the browser supports speech recognition
- Run pomodoro, stopwatch, or countdown reading sessions
- Track recent reading heatmap and reading velocity
- Export a full JSON backup
- Export Obsidian-friendly Markdown with daily, book, and marginalia navigation
- Optionally sync encrypted reading data across devices through a Cloudflare Worker relay

## Why This Exists

Paper notes are still better for many kinds of reading. Reading Room is not trying to replace the book, the pencil, or the margin. It is meant to make the digital side less annoying: capture a quick note, preserve daily continuity, attach thoughts to specific passages, and make it easy to move reading notes into Obsidian or an agent-readable workflow later.

The central idea is:

```text
quote + thought + context = useful marginalia
```

## Marginalia

The Journal tab includes a Marginalia section for the selected book. Each note can include:

- quoted passage
- your thought
- page, chapter, section, or other location
- tags
- color/type such as question, key claim, definition, image, or tension
- word-level marks: underline, circle, bracket
- links to other marginal notes from the same book

This keeps daily journal writing separate from passage-specific notes while still preserving both under the same book.

## Scan Quote

The **Scan quote** button lets you take or upload a picture of a passage. Reading Room runs local OCR with `tesseract.js`, fills the quote field, and immediately opens the word-marking interface so you can underline, circle, or bracket important words before adding your thought.

The first scan on a device may take a little longer because OCR assets need to load. Scanned annotations store OCR metadata and per-word confidence, but the app does not store the original image in this version. The schema reserves `imageThumbB64` for a future compressed thumbnail.

OCR runs locally in the browser. A future cloud "Improve OCR" path can be added without changing the annotation shape.

## Voice Notes

Voice notes use the browser's built-in `SpeechRecognition` / `webkitSpeechRecognition` API when available. Support varies by browser. Chrome and Edge-style browsers are the most likely to work.

Depending on the browser implementation, speech recognition may rely on browser or platform services rather than fully local transcription. The app itself does not add a speech backend.

## Local-First Data

By default, Reading Room stores app data in the browser's local storage. Other people visiting the same public URL do not see your books or notes; they get their own local copy.

This keeps the app simple and private by default, but it also means browser storage can be cleared by your device or browser settings. Use **Backup > Export** and **Obsidian > Export .md** regularly if the notes matter.

Avoid relying on private browsing for serious notes.

## Optional Encrypted Sync

Reading Room includes an optional sync layer:

- the browser encrypts the full reading state locally
- a Cloudflare Worker stores only an opaque encrypted blob
- pairing uses a room ID + secret stored in local storage
- the Worker does not see plaintext notes

The sync relay lives in `worker/`. See [worker/README.md](worker/README.md) for deployment details.

The pairing code contains the sync secret. Treat it like a private invite link.

## Obsidian Export

The Markdown export includes multiple paths through the same reading data:

- **Daily Journal**: each day contains the books read that day and the full note text
- **Marginalia**: each day contains saved passage notes, quotes, tags, and locations
- **Book Index**: each book links back to the days where it has journal entries
- **Marginalia Book Index**: each book links back to passage notes by date/location

Example shape:

```md
# Reading Journal

## Contents
- [[#Daily Journal]]
- [[#Marginalia]]
- [[#Book Index]]
- [[#Marginalia Book Index]]

# Marginalia

## [[2026-04-19]]

### [[Republic]]

- Author: Plato
- Category: Philosophy
- Status: current
- Source: photo scan
- Location: Book I
- Tags: #justice #definition

> Justice is nothing other than the advantage of the stronger.

**My note**

This frames justice as power, but Socrates will need to expose the instability of that claim.
```

## Getting Started

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually:

```text
http://127.0.0.1:5173/
```

## Scripts

```bash
npm run dev      # local development server
npm run build    # production build to dist/
npm run preview  # preview the production build
npm run icons    # regenerate app icons and social preview images
```

## Deploying

This is a Vite app and should deploy cleanly to services like GitHub Pages, Cloudflare Pages, Netlify, or Vercel.

Typical settings:

- Build command: `npm run build`
- Output directory: `dist`

If deploying to GitHub Pages under `/Reading-Room/`, the workflow sets `GITHUB_PAGES=true` so Vite uses the correct base path.

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`. Every push to `main` builds the app and deploys `dist/` to GitHub Pages.

For this repository, the Pages URL should be:

```text
https://ethangarofalo.github.io/Reading-Room/
```

If the first deploy does not appear automatically, open the repository on GitHub and go to **Settings > Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.

For a public repository, GitHub Pages and the Actions minutes used by this workflow should be free under GitHub's current public-repository limits. Private repositories may depend on your GitHub plan.

## Cloudflare Notes

There are two separate Cloudflare paths:

- **Cloudflare Pages** can host the static Vite app from `dist/`.
- **Cloudflare Workers + KV** can run the optional encrypted sync relay in `worker/`.

The app can still run without the Worker. If no sync relay is configured, all data remains local to the browser.

## Repository Notes

The Vite source files are the source of truth. `Reading Dashboard.html` was an older standalone prototype and is intentionally ignored by Git.

## License

MIT
