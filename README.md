# NL→SQL & Interactive DBMS Visualizer (DQL • DML • DDL)

An interactive web application that teaches and demonstrates **Natural Language & Voice to SQL** and a full-featured **Relational Database Management System (DBMS)** through real-time visualization, simulation, and step-by-step pipeline execution.

---

## Features

- **Full DDL & DML Command Support**:
  - **DQL (Data Query Language)**: `SELECT`, `JOIN` (INNER & LEFT), `WHERE` (with `=`, `>`, `<`, `>=`, `<=`, `!=`, `<>`, `LIKE`), `GROUP BY`, `HAVING`, `DISTINCT`, `ORDER BY` (`ASC`/`DESC`), `LIMIT`.
  - **DML (Data Manipulation Language)**:
    - `INSERT INTO table_name [(cols...)] VALUES (val1, ...), (val2, ...);` with type coercion and Primary Key / Foreign Key constraint validation.
    - `UPDATE table_name SET col1 = val1, col2 = val2 [WHERE condition];` with in-memory tuple mutation.
    - `DELETE FROM table_name [WHERE condition];` with relation filter updates.
  - **DDL (Data Definition Language)**:
    - `CREATE TABLE [IF NOT EXISTS] table_name (col1 TYPE [PRIMARY KEY] [REFERENCES other(col)], ...);` to dynamically create new tables and update schemas.
    - `ALTER TABLE table_name ADD COLUMN col TYPE;` / `ALTER TABLE table_name DROP COLUMN col;` / `ALTER TABLE table_name RENAME TO new_name;` / `ALTER TABLE table_name RENAME COLUMN old TO new;`
    - `DROP TABLE [IF EXISTS] table_name;` to remove relations from active catalog.
    - `TRUNCATE [TABLE] table_name;` for fast tuple deallocation.
  - **↺ Reset Database**: One-click reset to restore default sample tables and tuples at any time.

- **Direct Voice-to-SQL ("Speak & Run")**:
  - Speak database queries and commands with one click.
  - Browser-native `MediaRecorder` audio capture with real-time volume-reactive equalizer animations.
  - Multimodal Google Gemini AI engine that transcribes spoken audio, validates schema, and generates SQL queries.
  - Inline microphone button inside the textarea for dictation.
  - Optional **Text-to-Speech (TTS)** voice readback of query interpretation.

- **Step-by-Step Relational & Transactional Pipeline**:
  - Educational pipeline stages for queries (`FROM → JOIN → WHERE → GROUP BY → DISTINCT → HAVING → AGGREGATE → SELECT → ORDER BY → LIMIT`).
  - Transactional stages for DML & DDL (`PARSER → CATALOG SCAN → CONSTRAINT CHECK → MUTATION → COMMIT`).
  - Animated playback and step inspection with row counts and intermediate tables.

- **Interactive Schema & Dynamic ER Diagrams**:
  - 3 pre-loaded sample datasets (E-commerce, Library, Healthcare).
  - Dynamically updates Mermaid ER diagrams in real-time as users create tables, add columns, or alter schemas.
  - PK (Primary Key) and FK (Foreign Key) constraint markers.

- **Deep Theory & Algebra Panels**:
  - Per-stage relational algebra notation, query execution operators, and ACID transaction theory.

- **Persistence & Export**:
  - Dark/light theme persisted across page reloads with anti-flicker pre-hydration.
  - Query history saved to `localStorage` with statement type tags.
  - Export query execution results to **CSV** or **Markdown reports**.

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **AI & Multimodal**: [Vercel AI SDK](https://sdk.vercel.ai/) + [Google Gemini API](https://ai.google.dev/) (`@ai-sdk/google`)
- **Diagrams**: [Mermaid.js](https://mermaid.js.org/)
- **Audio & Speech**: Web `MediaRecorder` API, `AudioContext` Frequency Analyser, and Web Speech Synthesis API (TTS)
- **Local SQL Engine**: Custom in-browser relational execution engine (`src/lib/sqlEngine.ts`) with zero external database dependencies.

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Sample Commands

| Type | Question / Command | SQL Example | Expected Result |
|---|---|---|---|
| **DQL** | *How many customers are there?* | `SELECT COUNT(*) FROM customers;` | 6 |
| **DQL** | *Show products with price above 5000* | `SELECT name, category, price FROM products WHERE price > 5000;` | Laptop Pro, Office Chair, Study Desk |
| **DML** | *Insert new customer* | `INSERT INTO customers (id, name, city, signup_year) VALUES (7, 'Sunil Sharma', 'Bengaluru', 2024);` | 1 row inserted |
| **DML** | *Update product price* | `UPDATE products SET price = 94999 WHERE id = 101;` | Price updated |
| **DML** | *Delete order* | `DELETE FROM orders WHERE id = 1006;` | 1 row deleted |
| **DDL** | *Create suppliers table* | `CREATE TABLE suppliers (id INTEGER PRIMARY KEY, name TEXT, city TEXT, rating REAL);` | New table created |
| **DDL** | *Add column to orders* | `ALTER TABLE orders ADD COLUMN status TEXT;` | Column added |
| **DDL** | *Truncate items* | `TRUNCATE order_items;` | Table emptied |

---

## References

- Silberschatz, Korth & Sudarshan — *Database System Concepts*, 7th ed.
- Ramakrishnan & Gehrke — *Database Management Systems*, 3rd ed.
- ISO/IEC 9075 SQL Standard.
