# NL→SQL Visualizer

An interactive web application that teaches and demonstrates **Natural Language to SQL**
through visualization, simulation, and step-by-step explanations.

## Features

- **Natural language input** → rule-based translation to SQL with confidence score,
  matched rules, and plain-English interpretation. Very low-confidence questions
  automatically fall back to Gemini through the AI SDK.
- **Direct SQL editor** with validation messages for unsupported syntax.
- **Step-by-step execution pipeline** — the query runs as an explicit relational-algebra
  plan (`FROM → JOIN → WHERE → GROUP BY → HAVING → AGGREGATE/SELECT → ORDER BY → LIMIT`),
  each stage showing its intermediate rows, row counts, and complexity.
- **Animated playback** of the pipeline.
- **Explanation panel** — per-stage theory notes + relational algebra notation.
- **Schema / ER tab** — full schema with PK/FK markers and Mermaid ER source.
- **Theory tab** — definitions, use cases, limitations, algorithms & complexities, references.
- **History** (persisted in localStorage), **CSV export**, and **Markdown report export**.
- **Dark/light mode**, responsive three-panel dashboard, accessible labels.

## Tech Stack

- Next.js (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Vercel AI SDK + Google Gemini for low-confidence translation fallback
- Custom in-browser mini SQL engine (`src/lib/sqlEngine.ts`) — no backend needed;
  all operations run client-side in well under 2 s.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

For the Gemini fallback, copy `.env.example` to `.env.local` and set
`GEMINI_API_KEY` to a Google AI API key. Confident translations
continue to use the local rule-based translator without an API call.

## Sample Inputs & Expected Outputs

| #   | Question                                          | Generated SQL                                                             | Expected output                      |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------ |
| 1   | How many customers are there?                     | `SELECT COUNT(*) FROM customers;`                                         | 6                                    |
| 2   | Show products with price above 5000               | `SELECT name, category, price FROM products WHERE price > 5000;`          | Laptop Pro, Office Chair, Study Desk |
| 3   | Average total amount per customer in orders       | `SELECT customer_id, AVG(total_amount) FROM orders GROUP BY customer_id;` | one row per customer_id              |
| 4   | List customers in Mumbai                          | `SELECT name, city, signup_year FROM customers WHERE city = 'Mumbai';`    | Asha Verma, Meera Nair               |
| 5   | Total quantity ordered per product in order_items | `SELECT product_id, SUM(quantity) FROM order_items GROUP BY product_id;`  | one row per product_id               |
| 6   | Top 3 highest priced products sorted by price     | `... ORDER BY price DESC LIMIT 3;`                                        | Laptop Pro, Study Desk, Office Chair |

## Project Structure

```
src/
  app/page.tsx        # Three-panel dashboard UI
  lib/schema.ts       # Sample e-commerce database + ER diagram generator
  lib/sqlEngine.ts    # Mini SQL parser + step-recording execution engine
  lib/nlToSql.ts      # Rule-based natural-language → SQL translator
  lib/examples.ts     # Sample inputs with expected outputs
```

## Algorithms & Complexity

| Operation          | Algorithm             | Complexity           |
| ------------------ | --------------------- | -------------------- |
| NL→SQL translation | Rule/pattern matching | O(L) question length |
| Join               | Nested-loop join      | O(n·m)               |
| Filter / project   | Linear scan           | O(n)                 |
| Grouping           | Hash aggregation      | O(n) expected        |
| Sort               | Comparison sort       | O(n log n)           |

## Supported SQL Subset

Single-table or INNER/LEFT JOINed SELECT queries with:
one WHERE condition, GROUP BY (single column), HAVING `AGG(*) op N`,
ORDER BY (single expression), LIMIT. Anything else produces a clear validation message.

## AI Usage Log

This application was generated and refactored with GitHub Copilot (Ox Alpha model):
scaffolding review, mini SQL engine design, rule-based NL translator, dashboard UI,
and documentation. Prompts used: the assignment specification plus iterative
"build X module" requests; every generated file was type-checked and error-fixed
in-editor.

## References

- Silberschatz, Korth & Sudarshan — _Database System Concepts_, 7th ed.
- Ramakrishnan & Gehrke — _Database Management Systems_.
- Yu et al., "Spider: A Large-Scale Human-Labeled Dataset for Complex Text-to-SQL Tasks", EMNLP 2018.
- ISO/IEC 9075 SQL standard.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
