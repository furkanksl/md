# My Drawer

**My Drawer** is a powerful, local-first personal AI workspace designed to integrate deeply with your macOS workflow. It serves as a central hub for journaling, clipboard management, window organization, and intelligent web research.

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

**Backend (Core)**
*   **Runtime**: Tauri v2 (Rust)
*   **OS Integration**: `cocoa` / `objc` crates for macOS specific window handling.
*   **Scraping**: `reqwest` + `html2text` for robust, cleaner-friendly content extraction.

## Architecture

The project follows a clean, modular structure:

*   **`src-tauri/`**: The Rust backend. Handles the "Drawer" window behavior (slide-in/out), global shortcuts, clipboard monitoring, and heavy lifting like HTTP requests/scraping.
*   **`src/`**: The React frontend.
    *   **`components/`**: Feature-based UI components (`chat`, `clipboard`, `scraping`, etc.).
    *   **`stores/`**: Global state management using Zustand.
    *   **`core/`**: Domain logic and services (Clean Architecture approach).
        *   **`domain/`**: Type definitions and constants (e.g., `models.ts`).
        *   **`application/`**: Services like `web-scraping-service.ts`.
        *   **`infra/`**: Infrastructure implementations (AI provider factories).

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v18+)
*   [Rust & Cargo](https://rustup.rs/) (latest stable)
*   [Bun](https://bun.sh/) (optional, mostly used for dev scripts) or npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/my-drawer.git
    cd my-drawer
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    bun install
    ```

3.  Run in development mode:
    ```bash
    npm run dev
    ```
    This will start the Vite server and launch the Tauri window.

## Development Commands

*   `npm run dev`: Start dev server and app.
*   `npm run build`: Type-check and build the frontend assets.
*   `npm run tauri build`: Production build of the native app.

## Versioning & Release

This project includes automated scripts for version management and building/signing the application for macOS.

### Bumping Version

To update the version in both `package.json` and `src-tauri/tauri.conf.json`:

```bash
# Bump patch (0.1.0 -> 0.1.1)
npm run bump patch

# Bump minor (0.1.0 -> 0.2.0)
npm run bump minor

# Set specific version
npm run bump 1.2.3
```

### Building for Release (macOS)

The `release` script handles building, code signing, and notarization (required for macOS distribution).

1.  **Setup Environment Variables**:
    Create a `.env` file in the root directory with your Apple Developer credentials:

    ```env
    APPLE_ID="your-email@example.com"
    APPLE_PASSWORD="app-specific-password"
    APPLE_TEAM_ID="YOUR_TEAM_ID"
    APPLE_CERTIFICATE="Base64_Encoded_P12_Certificate"
    APPLE_CERTIFICATE_PASSWORD="cert_password"
    ```

    <details>
    <summary><strong>🔑 How to get these credentials</strong></summary>

    ### 1. `APPLE_ID`
    *   **What it is:** Your standard Apple ID email address associated with your Apple Developer account.
    *   **Example:** `developer@example.com`

    ### 2. `APPLE_PASSWORD` (App-Specific Password)
    *   **What it is:** A generated password that allows the script to log in without 2FA. **Do NOT use your real Apple ID password.**
    *   **How to get it:**
        1.  Go to [appleid.apple.com](https://appleid.apple.com).
        2.  Sign in with your Apple ID.
        3.  Go to the **Sign-In and Security** section.
        4.  Select **App-Specific Passwords**.
        5.  Click the **+ (Plus)** icon or "Generate an app-specific password".
        6.  Give it a name (e.g., "My Drawer Notarization").
        7.  Copy the generated password (format: `xxxx-xxxx-xxxx-xxxx`).

    ### 3. `APPLE_TEAM_ID`
    *   **What it is:** A unique 10-character code that identifies your development team.
    *   **How to get it:**
        1.  Go to [developer.apple.com/account](https://developer.apple.com/account).
        2.  Scroll down to the **Membership details** section.
        3.  Look for **Team ID**.
    *   **Example:** `ABC123DEF4`

    ### 4. `APPLE_CERTIFICATE` (Base64)
    *   **What it is:** Your "Developer ID Application" certificate exported as a P12 file and encoded in Base64.
    *   **How to get it:**
        1.  Open **Keychain Access** on your Mac.
        2.  Right-click your **Developer ID Application** certificate.
        3.  Select **Export "Developer ID Application..."**.
        4.  Save it as a `.p12` file (e.g., `cert.p12`).
        5.  Set a strong password for the file when prompted (this is `APPLE_CERTIFICATE_PASSWORD`).
        6.  Convert the `.p12` file to Base64 in your terminal:
            ```bash
            base64 -i cert.p12 | pbcopy
            ```
        7.  Paste the clipboard content into your `.env` file.

    </details>

2.  **Run Release**:
    ```bash
    npm run release
    ```

    **Optional**: Bump version AND release in one go:
    ```bash
    npm run release -- --bump patch
    ```

This will output a signed `.dmg` or `.app` in `src-tauri/target/release/bundle/`.
