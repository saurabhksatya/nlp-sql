# NL→SQL Visualizer & Voice-to-SQL Engine

An interactive web application that teaches and demonstrates **Natural Language & Voice to SQL** through visualization, simulation, and step-by-step pipeline explanations.

---

## 🚀 Features

- **🎙️ Direct Voice-to-SQL ("Speak & Run")**:
  - Speak your database questions directly with one click.
  - Browser-native `MediaRecorder` audio capture with real-time volume-reactive equalizer animations.
  - Multimodal Google Gemini AI engine that transcribes your spoken audio, validates the dataset schema, and generates the exact SQL query in a single pass.
  - Inline microphone button inside the textarea for dictation.
  - Optional **Text-to-Speech (TTS)** voice readback of the query interpretation.
- **💬 Natural Language Query Translation**:
  - Translates plain-English queries into SQL using Google Gemini with confidence scoring and explanations.
- **⚡ Direct SQL Editor**:
  - Write SQL directly with instant syntax validation and error reporting.
- **📊 Step-by-Step Relational Algebra Pipeline**:
  - The query executes as an explicit relational algebra plan (`FROM → JOIN → WHERE → GROUP BY → HAVING → AGGREGATE/SELECT → ORDER BY → LIMIT`).
  - Intermediate rows, row counts, and stage complexity displayed at each stage.
- **▶️ Animated Pipeline Playback**:
  - Step through or auto-play query execution step by step.
- **📖 Theory & Explanation Panels**:
  - Per-stage relational algebra notation, algorithms, and complexity analysis.
- **🗄️ Interactive Schema & ER Diagrams**:
  - Multi-dataset switcher (E-commerce, College, etc.) with Mermaid ER diagram visualization and PK/FK markers.
- **💾 Persistence & Export**:
  - Dark/light theme persisted across page reloads with anti-flicker pre-hydration.
  - Query history saved to `localStorage`.
  - Export query execution results to **CSV** or comprehensive **Markdown reports**.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack) + [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **AI & Multimodal**: [Vercel AI SDK](https://sdk.vercel.ai/) + [Google Gemini API](https://ai.google.dev/) (`@ai-sdk/google`)
- **Diagrams**: [Mermaid.js](https://mermaid.js.org/)
- **Audio & Speech**: Web `MediaRecorder` API, `AudioContext` Frequency Analyser, and Web Speech Synthesis API (TTS)
- **Local SQL Engine**: Custom in-browser relational execution engine (`src/lib/sqlEngine.ts`) with zero external database dependencies.

---

## 🏁 Getting Started

### 1. Clone & Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (refer to `.env.example`):

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

### 3. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Sample Queries

| # | Question / Voice Prompt | Generated SQL | Expected Output |
|---|---|---|---|
| 1 | *How many customers are there?* | `SELECT COUNT(*) FROM customers;` | 6 |
| 2 | *Show products with price above 5000* | `SELECT name, category, price FROM products WHERE price > 5000;` | Laptop Pro, Office Chair, Study Desk |
| 3 | *Average total amount per customer in orders* | `SELECT customer_id, AVG(total_amount) FROM orders GROUP BY customer_id;` | One row per `customer_id` |
| 4 | *List customers in Mumbai* | `SELECT name, city, signup_year FROM customers WHERE city = 'Mumbai';` | Asha Verma, Meera Nair |
| 5 | *Total quantity ordered per product in order_items* | `SELECT product_id, SUM(quantity) FROM order_items GROUP BY product_id;` | Aggregated quantities |
| 6 | *Top 3 highest priced products sorted by price* | `SELECT name, category, price FROM products ORDER BY price DESC LIMIT 3;` | Top 3 products sorted |

---

## 📂 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── translate/route.ts   # Multimodal Voice & Text to SQL API (Gemini)
│   │   ├── globals.css              # Theme tokens & audio equalizer animations
│   │   ├── layout.tsx               # Root layout with anti-flicker theme script
│   │   └── page.tsx                 # Main interactive dashboard
│   ├── components/
│   │   ├── AppHeader.tsx            # Header with dark/light mode toggle
│   │   ├── DatasetDropdown.tsx      # Dataset switcher dropdown
│   │   ├── ExplanationPanel.tsx     # Query explanation & relational algebra
│   │   ├── InputPanel.tsx           # Voice, natural language, & SQL inputs
│   │   ├── Theory.tsx               # Database theory & references
│   │   ├── VisualizationPanel.tsx   # Step-by-step pipeline & result visualizer
│   │   ├── VoiceButton.tsx          # Volume-reactive audio voice button
│   │   └── nlSqlTypes.ts            # Component type definitions
│   └── lib/
│       ├── env.ts                   # Environment variable loader
│       ├── examples.ts              # Pre-loaded sample queries
│       ├── schema.ts                # Dataset definitions & Mermaid ER generator
│       ├── sqlEngine.ts             # In-browser mini SQL parser & relational engine
│       └── useSpeechRecognition.ts  # MediaRecorder & AudioContext custom hook
├── .env.example
├── package.json
└── README.md
```

---

## ⚡ Execution Complexity

| Stage | Operation | Algorithm | Complexity |
|---|---|---|---|
| 1 | **FROM** | Table scan | $O(N)$ |
| 2 | **JOIN** | Nested-loop join | $O(N \times M)$ |
| 3 | **WHERE** | Linear filter predicate | $O(N)$ |
| 4 | **GROUP BY** | Hash aggregation | $O(N)$ expected |
| 5 | **HAVING** | Filter aggregate groups | $O(G)$ groups |
| 6 | **SELECT** | Projection & computed columns | $O(N)$ |
| 7 | **ORDER BY** | Comparison sort | $O(N \log N)$ |
| 8 | **LIMIT** | Slice / truncation | $O(1)$ |

---

## 📚 References

- Silberschatz, Korth & Sudarshan — *Database System Concepts*, 7th ed.
- Ramakrishnan & Gehrke — *Database Management Systems*, 3rd ed.
- Yu et al. — *"Spider: A Large-Scale Human-Labeled Dataset for Complex Text-to-SQL Tasks"*, EMNLP 2018.
- ISO/IEC 9075 SQL Standard.
