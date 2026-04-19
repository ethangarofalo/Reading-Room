# Reading Room

A local-first reading dashboard for tracking active books, daily notes, reading sessions, and Obsidian-friendly exports.

Reading Room is for readers who still prefer paper but need a lower-friction place to keep continuity: what is active, what happened today, what notes belong to which book, and what can safely move into a longer-term notes system.

## What It Does

- Track active books, pages read, and books finished
- Keep daily journal entries per book
- Dictate voice notes into the active book's journal when the browser supports speech recognition
- Run pomodoro, stopwatch, or countdown reading sessions
- Organize reading with optional contexts
- Export a full JSON backup
- Export Obsidian-friendly Markdown with both daily and book-based navigation

## Why This Exists

Paper notes are still better for many kinds of reading. This app is not trying to replace that. It is meant to make the digital side less annoying: capture a quick note, preserve daily continuity, and make it easy to move reading notes into Obsidian.

## Local-First Data

Reading Room stores app data in the browser's local storage. There is no account, database, or server sync in this version.

That keeps the app simple and private by default, but it also means browser storage can be cleared by your device or browser settings. Use **Backup > Export** and **Obsidian > Export .md** regularly if the notes matter.

## Voice Notes

Voice notes use the browser's built-in `SpeechRecognition` / `webkitSpeechRecognition` API when available. Support varies by browser. Chrome and Edge-style browsers are the most likely to work.

Depending on the browser implementation, speech recognition may rely on browser or platform services rather than fully local transcription. The app itself does not add a speech backend.

## Obsidian Export

The Markdown export includes two paths through the same journal data:

- **Daily Journal**: each day contains the books read that day and the full note text
- **Book Index**: each book links back to the days where it has entries

Example shape:

```md
# Reading Journal

## Contents
- [[#Daily Journal]]
- [[#Book Index]]

# Daily Journal

## [[2026-04-19]]

### [[Republic]]
...

# Book Index

## [[Republic]]
- [[2026-04-19]] - 12 pp
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

## Build

```bash
npm run build
```

The production build is written to `dist/`.

## Deploying

This is a Vite app and should deploy cleanly to services like Vercel, Netlify, or Cloudflare Pages.

Typical settings:

- Build command: `npm run build`
- Output directory: `dist`

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`. Every push to `main` builds the app and deploys `dist/` to GitHub Pages.

For this repository, the Pages URL should be:

```text
https://ethangarofalo.github.io/Reading-Room/
```

If the first deploy does not appear automatically, open the repository on GitHub and go to **Settings > Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**.

For a public repository, GitHub Pages and the Actions minutes used by this workflow should be free under GitHub's current public-repository limits. Private repositories may depend on your GitHub plan.

## Repository Notes

The Vite source files are the source of truth. `Reading Dashboard.html` was an older standalone prototype and is intentionally ignored by Git.

## License

MIT
