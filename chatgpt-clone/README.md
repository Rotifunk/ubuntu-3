# ChatGPT UI Clone (SvelteKit)

This project is a clone of the ChatGPT web user interface, built using SvelteKit, TypeScript, and Tailwind CSS. It features real-time chat functionality powered by the Google Gemini API and persistent storage using SQLite.

## Features Implemented

*   **UI Layout:**
    *   Two-column layout with a sidebar for chat sessions and a main chat area.
    *   Dark theme similar to the original ChatGPT interface.
*   **Component Structure:**
    *   Modular components for `Sidebar`, `ChatArea`, `InputField`, and `MessageBubble`.
*   **Chat Session Management:**
    *   Display a list of chat sessions in the sidebar, sorted by creation date (newest first).
    *   Add new chat sessions using the '+ New Chat' button.
    *   Select a chat session from the sidebar to view its messages.
    *   Delete chat sessions (with confirmation).
    *   Edit chat session titles inline in the sidebar.
*   **Message Handling:**
    *   Display user and bot messages in distinct bubbles.
    *   Send new messages using the input field (Enter key).
    *   Real-time bot responses streamed from the Google Gemini API (`gemini-2.5-pro-exp-03-25` model).
    *   Markdown rendering for message content (using `marked` and `@tailwindcss/typography`).
    *   Delete individual messages (user or bot) with a confirmation prompt (via hover button).
*   **Persistence:**
    *   Chat sessions and messages are saved to an SQLite database (`sqlite.db`) using Drizzle ORM.
    *   Data persists across page reloads and application restarts (assuming the database file is persisted, e.g., via Docker volume).
*   **UI/UX Improvements:**
    *   Currently selected chat session is highlighted in the sidebar.
    *   Chat area automatically scrolls to the bottom when new messages arrive (with smooth scrolling).
    *   Message input field (`textarea`) automatically adjusts its height based on content.
    *   A "Bot is typing..." indicator is shown while waiting for the bot response stream.
    *   Input field automatically gains focus when a chat is selected.
    *   Optimistic UI updates for message sending and chat deletion/editing for a smoother experience.

## Tech Stack

*   **Framework:** SvelteKit (v2.x)
*   **Language:** TypeScript (v5.x)
*   **Styling:** Tailwind CSS (v4.x) with `@tailwindcss/typography` and `@tailwindcss/forms` plugins.
*   **Database:** SQLite (via `@libsql/client`)
*   **ORM:** Drizzle ORM with Drizzle Kit for migrations.
*   **LLM:** Google Gemini API (via `@google/generative-ai`)
*   **Markdown Parsing:** `marked`
*   **State Management:** Svelte Stores (v5 runes syntax with `$effect`)
*   **ID Generation:** `nanoid`
*   **Build Tool:** Vite
*   **Testing:** Vitest (Unit), Playwright (E2E)
*   **i18n:** Inlang with Paraglide JS (setup, basic messages)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd chatgpt-clone
    ```
2.  **Install Node.js and npm:**
    It's recommended to use a Node Version Manager (nvm) to install and manage Node.js versions. Install nvm (if you haven't already) and then run:
    ```bash
    nvm install --lts # Install the latest LTS version of Node.js
    nvm use --lts
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Set up environment variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and add your Google Gemini API key:
        ```
        GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
        # DATABASE_URL is already set to use a local file
        ```
5.  **Set up the database:**
    *   Run the Drizzle Kit command to create the `sqlite.db` file and apply the schema:
        ```bash
        npm run db:push
        ```
        *(Alternatively, if using migrations: `npm run db:migrate`)*
6.  **Run the development server:**
    ```bash
    npm run dev -- --open
    ```
    The application will be available at `http://localhost:8000` (or the specified port in `vite.config.ts`).

## Available Scripts

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run preview`: Previews the production build locally.
*   `npm run check`: Runs Svelte check for type errors.
*   `npm run lint`: Lints the code using ESLint and Prettier.
*   `npm run format`: Formats the code using Prettier.
*   `npm run test`: Runs unit and end-to-end tests.
*   `npm run test:unit`: Runs unit tests using Vitest.
*   `npm run test:e2e`: Runs end-to-end tests using Playwright.
*   `npm run db:push`: Pushes schema changes directly to the database (useful for development).
*   `npm run db:migrate`: Generates SQL migration files based on schema changes.
*   `npm run db:studio`: Opens Drizzle Studio to browse the database.

## Project Structure

*   `src/lib/components/`: Reusable Svelte UI components.
*   `src/lib/stores/`: Svelte stores for state management (`chatStore.ts`).
*   `src/lib/server/`: Server-side logic, including database setup (`db/`) and authentication (`auth.ts`).
*   `src/routes/`: SvelteKit routes, including page components and API endpoints (`api/`).
*   `drizzle.config.ts`: Configuration for Drizzle Kit.
*   `svelte.config.js`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`: Configuration files for SvelteKit, Vite, Tailwind, and TypeScript.
