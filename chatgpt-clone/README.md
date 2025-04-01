# ChatGPT UI Clone (SvelteKit)

This project is a clone of the ChatGPT web user interface, built using SvelteKit, TypeScript, and Tailwind CSS.

## Features Implemented

*   **Basic UI Layout:**
    *   Two-column layout with a sidebar for chat sessions and a main chat area.
    *   Dark theme similar to the original ChatGPT interface.
*   **Component Structure:**
    *   Modular components for `Sidebar`, `ChatArea`, `InputField`, and `MessageBubble`.
*   **Chat Session Management:**
    *   Display a list of chat sessions in the sidebar.
    *   Add new chat sessions using the '+ New Chat' button.
    *   Select a chat session from the sidebar to view its messages.
    *   Delete chat sessions (with confirmation).
    *   Edit chat session titles inline in the sidebar.
*   **Message Handling:**
    *   Display user and bot messages in distinct bubbles.
    *   Send new messages using the input field (Enter key or send button).
    *   Simulated bot responses with a slight delay.
*   **Persistence:**
    *   Chat sessions and messages are saved to the browser's `localStorage`.
    *   Data persists across page reloads.
*   **UI/UX Improvements:**
    *   Currently selected chat session is highlighted in the sidebar.
    *   Chat area automatically scrolls to the bottom when new messages arrive (with smooth scrolling).
    *   Message input field (`textarea`) automatically adjusts its height based on content.
    *   A "Bot is typing..." indicator is shown while waiting for the simulated bot response.
    *   Input field automatically gains focus when a chat is selected.

## Tech Stack

*   **Framework:** SvelteKit
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **State Management:** Svelte Stores

## Getting Started

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <repository-url>
    cd chatgpt-clone
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev -- --open
    ```
    The application will be available at `http://localhost:8000` (or the specified port).

## Further Development Ideas

*   Integrate with a real LLM API (e.g., OpenAI API).
*   Implement user authentication.
*   Improve bot response simulation or replace with actual API calls.
*   Add error handling for API calls.
*   Refine styling and responsiveness.
*   Implement database persistence instead of localStorage.
*   Add automated chat title generation based on initial messages.

## Development Plan (Next Steps)

1.  **SQLite Database Persistence:**
    *   Define database schema for chats and messages using Drizzle ORM.
    *   Configure SQLite database connection (using a file path suitable for volume mounting).
    *   Migrate data handling logic (CRUD operations for chats and messages) from Svelte stores to SvelteKit server routes/actions.
    *   Update frontend components to fetch data from and send data to the server routes/actions.
    *   Remove localStorage persistence logic from stores.
2.  **Real LLM Integration (e.g., OpenAI):**
    *   Set up environment variables for the LLM API key.
    *   Create a server route/action to handle requests to the LLM API.
    *   Update the message sending logic in `ChatArea.svelte` to call this server route instead of simulating a response.
    *   Implement response streaming for a better user experience (optional but recommended).
3.  **Markdown Rendering:**
    *   Install a Markdown rendering library compatible with Svelte (e.g., `marked` or use `mdsvex` which is already installed).
    *   Update the `MessageBubble.svelte` component to render the message content as HTML generated from Markdown.
    *   Ensure proper styling for Markdown elements (code blocks, lists, etc.), potentially using `@tailwindcss/typography`.
