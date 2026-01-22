# My Drawer

**My Drawer** is a powerful, local-first personal AI workspace designed to integrate deeply with your macOS workflow. It serves as a central hub for journaling, clipboard management, window organization, and intelligent web research.

This repository now follows a monorepo layout that keeps the native drawer experience in `desktop/` alongside a small marketing site in `landing/`.

## Features

*   **🧠 AI Journal (Chat)**: Chat with various LLMs (OpenAI, Anthropic, Google, Mistral, Groq, or Custom). Context-aware assistance that lives in your drawer.
*   **📋 Clipboard Manager**: Automatically tracks your clipboard history. Search, pin, and organize your clips locally.
*   **🌐 Web Research**: Intelligent web scraping that fetches URL content and feeds it into an LLM for instant summarization, analysis, or Q&A.
*   **⚡ App Shortcuts**: Quick access to your favorite applications.
*   **🪟 Window Layouts**: Manage and organize your window arrangements efficiently.
*   **🔒 Local & Private**: Your data stays on your machine. API keys are stored securely.

## Tech Stack

**Frontend**
*   **Framework**: React (Vite)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, Radix UI primitives
*   **Animations**: Framer Motion
*   **State Management**: Zustand (with persistence)
*   **AI Integration**: Vercel AI SDK (`ai`), `react-markdown`

**Backend (Core - macOS)**
*   **Runtime**: Tauri v2 (Rust)
*   **OS Integration**: `cocoa` / `objc` crates for macOS specific window handling.
*   **Scraping**: `reqwest` + `html2text` for robust, cleaner-friendly content extraction.

## Architecture

*   **`desktop/`** contains the Tauri frontend (`desktop/src`) and Rust backend (`desktop/src-tauri`). The existing `scripts/` helpers (release automation, version bumps, etc.) live inside this workspace so those commands continue to run from there.
*   **`landing/`** is a standalone Vite + React marketing site that introduces My Drawer, showcases key features, and delivers a CTA in a responsive layout.

## Repository layout

*   Root (`package.json`): Defines the npm workspaces, central scripts for starting/building each workspace, and shared tooling. Run `npm install` from the root to bootstrap both packages and generate a single `package-lock.json`.
*   `desktop/`: The complete desktop experience with the Tauri frontend (`src`), Rust backend (`src-tauri`), Tailwind/Vite configs, and release scripts.
*   `landing/`: The marketing site with its own Vite config, TypeScript entry point, and CSS styles.

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18+)
*   [Rust & Cargo](https://rustup.rs/) (latest stable) for the desktop build
*   [Bun](https://bun.sh/) or npm if preferred for scripts (optional)

### Installation

```bash
npm install
```

This installs dependencies for both workspaces and produces one `package-lock.json` at the repo root.

### Running

*   `npm run dev:desktop` — Starts the desktop Vite server for Tauri development.
*   `npm run tauri:desktop` — Runs `tauri dev` from the desktop workspace (requires Rust).
*   `npm run dev:landing` — Serves the landing page locally (`landing/`).

### Building

*   `npm run build:desktop` — `tsc && vite build` for the desktop frontend.
*   `npm run build:landing` — Builds the marketing landing page and outputs into `landing/dist`.

## Development Commands

The workspace scripts mirror the previous standalone commands:

*   `npm run dev:desktop`
*   `npm run preview` inside `desktop/`
*   `npm run build:desktop`
*   `npm run tauri:desktop`
*   `npm run release` (run from `desktop/`) — handles versioning, signing, and notarization via `desktop/scripts/release.sh`.
*   `npm run dev:landing`
*   `npm run build:landing`

## Versioning & Release

The automated release flow remains under `desktop/scripts`. Version bumps still update both `desktop/package.json` and `desktop/src-tauri/tauri.conf.json`.

```bash
npm run build:desktop
npm run release -- --bump patch
```

Use `npm run bump` from the desktop workspace to adjust versions (`desktop/package.json`).
