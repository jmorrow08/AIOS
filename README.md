# AI OS Supabase Shell

This repository is a minimal **React + Vite** scaffold for the AI Business Systems OS, configured to use **Supabase** for authentication, database and storage. It implements a modular structure based on the design blueprint provided in the business plan and associated documentation. You can import this project into [Cursor](https://www.cursor.so/) and iterate on it using AI prompts.

## Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure Supabase:**

   - Create a Supabase project in the Supabase dashboard.
   - Copy your project’s `URL` and `anon` key into a `.env.local` file:

     ```bash
     # edit .env.local and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
     VITE_SUPABASE_URL=your_supabase_project_url_here
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
     ```

3. **Set up Database Tables:**

   Run the database setup script to create the required tables:

   ```bash
   npm run setup-db
   ```

   This will create the following tables:

   - `public.jobs` - for OperationsHub
   - `public.invoices` - for FinancialNexus
   - `public.documents` - for KnowledgeLibrary

4. **Run the development server:**

   ```bash
   npm run dev
   ```

   The app will open at `http://localhost:5173`.

## Structure

- `src/main.tsx`: entry point; wraps the app in providers.
- `src/App.tsx`: defines the main layout and client‑side routing.
- `src/context/UserContext.tsx`: a React context for storing the current user and role.
- `src/lib/supabaseClient.ts`: initialises the Supabase client using environment variables.
- `src/components/` – reusable UI components (radial menu, cosmic background).
- `src/pages/` – placeholder pages for each portal (Mission Control, Operations Hub, Financial Nexus, AI Lab, Media Studio, Knowledge Library).

Use the placeholder pages to build out your features. As you iterate with Cursor, you can generate additional components and refine the design.
