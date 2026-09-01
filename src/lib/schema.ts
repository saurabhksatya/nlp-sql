// Sample database schemas and definitions used for the DBMS visualizer.

export type ColumnType =
  | "INTEGER"
  | "TEXT"
  | "REAL"
  | "VARCHAR"
  | "INT"
  | "FLOAT"
  | "DOUBLE"
  | "BOOLEAN"
  | "DATE"
  | "NUMERIC";

export interface Column {
  name: string;
  type: ColumnType;
  pk?: boolean;
  fk?: { table: string; column: string };
}

export interface Table {
  name: string;
  columns: Column[];
  rows: Record<string, string | number>[];
}

export interface DatasetExample {
  id: number;
  category?: "DQL" | "DML" | "DDL";
  question: string;
  sql: string;
  expected: string;
}

export interface Dataset {
  id: string;
  name: string;
  description: string;
  schema: Table[];
  defaultQuery: string;
  examples: DatasetExample[];
  isCustom?: boolean;
  createdAt?: number;
}

export const SCHEMA: Table[] = [
  {
    name: "customers",
    columns: [
      { name: "id", type: "INTEGER", pk: true },
      { name: "name", type: "TEXT" },
      { name: "city", type: "TEXT" },
      { name: "signup_year", type: "INTEGER" },
    ],
    rows: [
      { id: 1, name: "Asha Verma", city: "Mumbai", signup_year: 2021 },
      { id: 2, name: "Rahul Iyer", city: "Chennai", signup_year: 2022 },
      { id: 3, name: "Meera Nair", city: "Mumbai", signup_year: 2022 },
      { id: 4, name: "John Dsouza", city: "Delhi", signup_year: 2023 },
      { id: 5, name: "Priya Shah", city: "Pune", signup_year: 2023 },
      { id: 6, name: "Arjun Rao", city: "Delhi", signup_year: 2021 },
    ],
  },
  {
    name: "products",
    columns: [
      { name: "id", type: "INTEGER", pk: true },
      { name: "name", type: "TEXT" },
      { name: "category", type: "TEXT" },
      { name: "price", type: "REAL" },
    ],
    rows: [
      { id: 101, name: "Laptop Pro", category: "Electronics", price: 89999 },
      { id: 102, name: "Wireless Mouse", category: "Electronics", price: 1499 },
      { id: 103, name: "Office Chair", category: "Furniture", price: 7499 },
      { id: 104, name: "Study Desk", category: "Furniture", price: 9999 },
      { id: 105, name: "Notebook Pack", category: "Stationery", price: 299 },
      { id: 106, name: "Gel Pens Set", category: "Stationery", price: 199 },
    ],
  },
  {
    name: "orders",
    columns: [
      { name: "id", type: "INTEGER", pk: true },
      {
        name: "customer_id",
        type: "INTEGER",
        fk: { table: "customers", column: "id" },
      },
      { name: "order_date", type: "TEXT" },
      { name: "total_amount", type: "REAL" },
    ],
    rows: [
      {
        id: 1001,
        customer_id: 1,
        order_date: "2024-01-15",
        total_amount: 91498,
      },
      {
        id: 1002,
        customer_id: 2,
        order_date: "2024-02-03",
        total_amount: 7499,
      },
      { id: 1003, customer_id: 1, order_date: "2024-03-10", total_amount: 498 },
      {
        id: 1004,
        customer_id: 3,
        order_date: "2024-03-22",
        total_amount: 17498,
      },
      {
        id: 1005,
        customer_id: 4,
        order_date: "2024-04-05",
        total_amount: 9999,
      },
      { id: 1006, customer_id: 2, order_date: "2024-05-19", total_amount: 299 },
      {
        id: 1007,
        customer_id: 5,
        order_date: "2024-06-01",
        total_amount: 1499,
      },
      {
        id: 1008,
        customer_id: 6,
        order_date: "2024-06-14",
        total_amount: 97497,
      },
    ],
  },
  {
    name: "order_items",
    columns: [
      { name: "id", type: "INTEGER", pk: true },
      {
        name: "order_id",
        type: "INTEGER",
        fk: { table: "orders", column: "id" },
      },
      {
        name: "product_id",
        type: "INTEGER",
        fk: { table: "products", column: "id" },
      },
      { name: "quantity", type: "INTEGER" },
    ],
    rows: [
      { id: 1, order_id: 1001, product_id: 101, quantity: 1 },
      { id: 2, order_id: 1001, product_id: 102, quantity: 1 },
      { id: 3, order_id: 1002, product_id: 103, quantity: 1 },
      { id: 4, order_id: 1003, product_id: 105, quantity: 1 },
      { id: 5, order_id: 1003, product_id: 106, quantity: 1 },
      { id: 6, order_id: 1004, product_id: 102, quantity: 2 },
      { id: 7, order_id: 1004, product_id: 105, quantity: 5 },
      { id: 8, order_id: 1005, product_id: 104, quantity: 1 },
      { id: 9, order_id: 1006, product_id: 106, quantity: 1 },
      { id: 10, order_id: 1007, product_id: 102, quantity: 1 },
      { id: 11, order_id: 1008, product_id: 101, quantity: 1 },
      { id: 12, order_id: 1008, product_id: 103, quantity: 1 },
    ],
  },
];

export const DATASETS: Dataset[] = [
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Customers, products, orders and order items",
    schema: SCHEMA,
    defaultQuery: "SELECT name, city FROM customers WHERE city = 'Mumbai';",
    examples: [
      {
        id: 1,
        category: "DQL",
        question: "How many customers are there?",
        sql: "SELECT COUNT(*) FROM customers;",
        expected: "Count all customers.",
      },
      {
        id: 2,
        category: "DQL",
        question: "Show products with price above 5000",
        sql: "SELECT name, category, price FROM products WHERE price > 5000;",
        expected: "Products priced above 5000.",
      },
      {
        id: 3,
        category: "DQL",
        question: "Average total amount per customer in orders",
        sql: "SELECT customer_id, AVG(total_amount) FROM orders GROUP BY customer_id;",
        expected: "Average order value per customer.",
      },
      {
        id: 4,
        category: "DML",
        question: "Insert a new customer into customers table",
        sql: "INSERT INTO customers (id, name, city, signup_year) VALUES (7, 'Sunil Sharma', 'Bengaluru', 2024);",
        expected: "Insert new customer row into customers table.",
      },
      {
        id: 5,
        category: "DML",
        question: "Update product price for Laptop Pro",
        sql: "UPDATE products SET price = 94999 WHERE id = 101;",
        expected: "Update Laptop Pro price to 94999.",
      },

    ],
  },
  {
    id: "library",
    name: "Library",
    description: "Members, books and borrowing activity",
    schema: [
      {
        name: "members",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "name", type: "TEXT" },
          { name: "membership", type: "TEXT" },
          { name: "join_year", type: "INTEGER" },
        ],
        rows: [
          { id: 1, name: "Aarav Shah", membership: "Gold", join_year: 2021 },
          { id: 2, name: "Diya Rao", membership: "Silver", join_year: 2022 },
          { id: 3, name: "Kabir Mehta", membership: "Gold", join_year: 2023 },
          { id: 4, name: "Isha Nair", membership: "Student", join_year: 2024 },
        ],
      },
      {
        name: "books",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "title", type: "TEXT" },
          { name: "genre", type: "TEXT" },
          { name: "pages", type: "INTEGER" },
        ],
        rows: [
          { id: 101, title: "The Alchemist", genre: "Fiction", pages: 208 },
          { id: 102, title: "Clean Code", genre: "Technology", pages: 464 },
          { id: 103, title: "Sapiens", genre: "History", pages: 498 },
          {
            id: 104,
            title: "The Pragmatic Programmer",
            genre: "Technology",
            pages: 352,
          },
        ],
      },
      {
        name: "loans",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          {
            name: "member_id",
            type: "INTEGER",
            fk: { table: "members", column: "id" },
          },
          {
            name: "book_id",
            type: "INTEGER",
            fk: { table: "books", column: "id" },
          },
          { name: "loan_year", type: "INTEGER" },
        ],
        rows: [
          { id: 1001, member_id: 1, book_id: 101, loan_year: 2024 },
          { id: 1002, member_id: 1, book_id: 102, loan_year: 2024 },
          { id: 1003, member_id: 2, book_id: 103, loan_year: 2024 },
          { id: 1004, member_id: 3, book_id: 104, loan_year: 2025 },
          { id: 1005, member_id: 4, book_id: 101, loan_year: 2025 },
        ],
      },
    ],
    defaultQuery: "SELECT title, genre FROM books;",
    examples: [
      {
        id: 1,
        category: "DQL",
        question: "How many books are there?",
        sql: "SELECT COUNT(*) FROM books;",
        expected: "Count all books.",
      },
      {
        id: 2,
        category: "DQL",
        question: "Show books with pages above 300",
        sql: "SELECT title, genre, pages FROM books WHERE pages > 300;",
        expected: "Books longer than 300 pages.",
      },
      {
        id: 3,
        category: "DQL",
        question: "How many loans per member?",
        sql: "SELECT member_id, COUNT(*) FROM loans GROUP BY member_id;",
        expected: "Loan count per member.",
      },
      {
        id: 4,
        category: "DML",
        question: "Insert a new book",
        sql: "INSERT INTO books (id, title, genre, pages) VALUES (105, 'Designing Data-Intensive Applications', 'Technology', 616);",
        expected: "Add a new book to library catalog.",
      },
      {
        id: 5,
        category: "DDL",
        question: "Create authors table",
        sql: "CREATE TABLE authors (id INTEGER PRIMARY KEY, name TEXT, country TEXT);",
        expected: "Create a new authors table.",
      },
    ],
  },
  {
    id: "healthcare",
    name: "Healthcare",
    description: "Patients, doctors and appointment records",
    schema: [
      {
        name: "patients",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "name", type: "TEXT" },
          { name: "city", type: "TEXT" },
          { name: "age", type: "INTEGER" },
        ],
        rows: [
          { id: 1, name: "Anika Sen", city: "Mumbai", age: 34 },
          { id: 2, name: "Vikram Das", city: "Delhi", age: 58 },
          { id: 3, name: "Neha Kapoor", city: "Pune", age: 27 },
          { id: 4, name: "Rohan Iyer", city: "Mumbai", age: 46 },
        ],
      },
      {
        name: "doctors",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          { name: "name", type: "TEXT" },
          { name: "specialty", type: "TEXT" },
        ],
        rows: [
          { id: 201, name: "Dr. Tara Rao", specialty: "Cardiology" },
          { id: 202, name: "Dr. Sameer Ali", specialty: "Neurology" },
          { id: 203, name: "Dr. Kavya Nair", specialty: "Pediatrics" },
        ],
      },
      {
        name: "visits",
        columns: [
          { name: "id", type: "INTEGER", pk: true },
          {
            name: "patient_id",
            type: "INTEGER",
            fk: { table: "patients", column: "id" },
          },
          {
            name: "doctor_id",
            type: "INTEGER",
            fk: { table: "doctors", column: "id" },
          },
          { name: "visit_year", type: "INTEGER" },
          { name: "fee", type: "REAL" },
        ],
        rows: [
          {
            id: 3001,
            patient_id: 1,
            doctor_id: 201,
            visit_year: 2025,
            fee: 1200,
          },
          {
            id: 3002,
            patient_id: 2,
            doctor_id: 202,
            visit_year: 2025,
            fee: 1500,
          },
          {
            id: 3003,
            patient_id: 1,
            doctor_id: 203,
            visit_year: 2025,
            fee: 800,
          },
          {
            id: 3004,
            patient_id: 4,
            doctor_id: 201,
            visit_year: 2026,
            fee: 1200,
          },
        ],
      },
    ],
    defaultQuery: "SELECT name, city, age FROM patients;",
    examples: [
      {
        id: 1,
        category: "DQL",
        question: "How many patients are there?",
        sql: "SELECT COUNT(*) FROM patients;",
        expected: "Count all patients.",
      },
      {
        id: 2,
        category: "DQL",
        question: "Show patients above age 40",
        sql: "SELECT name, city, age FROM patients WHERE age > 40;",
        expected: "Patients older than 40.",
      },
      {
        id: 3,
        category: "DQL",
        question: "Average fee per doctor in visits",
        sql: "SELECT doctor_id, AVG(fee) FROM visits GROUP BY doctor_id;",
        expected: "Average visit fee per doctor.",
      },
      {
        id: 4,
        category: "DML",
        question: "Insert a new patient",
        sql: "INSERT INTO patients (id, name, city, age) VALUES (5, 'Karan Singhal', 'Hyderabad', 31);",
        expected: "Register a new patient.",
      },
      {
        id: 5,
        category: "DDL",
        question: "Create departments table",
        sql: "CREATE TABLE departments (id INTEGER PRIMARY KEY, name TEXT, building TEXT);",
        expected: "Create a new departments table.",
      },
    ],
  },
];

export function cloneSchema(schema: Table[]): Table[] {
  return schema.map((t) => ({
    name: t.name,
    columns: t.columns.map((c) => ({
      ...c,
      fk: c.fk ? { ...c.fk } : undefined,
    })),
    rows: t.rows.map((r) => ({ ...r })),
  }));
}

export function getDefaultSchema(
  datasetId: string,
  allDatasets: Dataset[] = DATASETS,
): Table[] {
  const dataset =
    allDatasets.find((d) => d.id === datasetId) ??
    DATASETS.find((d) => d.id === datasetId) ??
    DATASETS[0];
  return cloneSchema(dataset.schema);
}

export function getTable(
  name: string,
  schema: Table[] = SCHEMA,
): Table | undefined {
  return schema.find((t) => t.name.toLowerCase() === name.toLowerCase());
}

/** Mermaid ER diagram source for the schema. */
export function erDiagramMermaid(schema: Table[] = SCHEMA): string {
  if (!schema || schema.length === 0) {
    return "erDiagram\n  EMPTY_DATASET {\n    string status \"No tables in dataset yet\"\n  }\n";
  }
  let out = "erDiagram\n";
  for (const t of schema) {
    const tableName = (t.name || "UNNAMED_TABLE").replace(/[^\w]/g, "_").toUpperCase();
    out += `  ${tableName} {\n`;
    if (!t.columns || t.columns.length === 0) {
      out += "    string id PK \"(empty table)\"\n";
    } else {
      for (const c of t.columns) {
        const colType = (c.type || "TEXT").replace(/[^\w]/g, "_");
        const colName = (c.name || "col").replace(/[^\w]/g, "_");
        out += `    ${colType} ${colName}${c.pk ? " PK" : c.fk ? " FK" : ""}\n`;
      }
    }
    out += "  }\n";
  }
  for (const t of schema) {
    const tableName = (t.name || "UNNAMED_TABLE").replace(/[^\w]/g, "_").toUpperCase();
    for (const c of t.columns || []) {
      if (c.fk && c.fk.table) {
        const targetTable = schema.find(
          (other) => other.name.toLowerCase() === c.fk!.table.toLowerCase(),
        );
        if (targetTable) {
          const refTable = targetTable.name.replace(/[^\w]/g, "_").toUpperCase();
          out += `  ${refTable} ||--o{ ${tableName} : references\n`;
        }
      }
    }
  }
  return out;
}

/**
 * Generates a standard Chen-style ER diagram in Graphviz DOT format.
 * - Entities are rectangles ([shape=box])
 * - Relationships are diamonds ([shape=diamond])
 * - Attributes are ellipses ([shape=ellipse])
 * - Primary Key attributes have underlined labels (<<u>NAME</u>>)
 * - Cardinality annotations (1, N) are attached to edges
 */
export function erDiagramChenDot(schema: Table[] = SCHEMA, dark: boolean = true): string {
  if (!schema || schema.length === 0) {
    return `graph ER_Chen {
  layout=dot;
  bgcolor="transparent";
  node [fontname="Arial, Helvetica, sans-serif", fontsize=10];
  EMPTY [shape=box, label="No tables in dataset yet", style="filled", fillcolor="${dark ? "#1e293b" : "#f1f5f9"}", color="${dark ? "#475569" : "#cbd5e1"}", fontcolor="${dark ? "#94a3b8" : "#64748b"}"];
}`;
  }

  const lines: string[] = [];
  lines.push("graph ER_Chen {");
  lines.push("  // Global graph configuration");
  lines.push("  layout=dot;");
  lines.push("  splines=spline;");
  lines.push('  bgcolor="transparent";');
  lines.push("  nodesep=0.5;");
  lines.push("  ranksep=0.7;");
  lines.push('  node [fontname="Arial, Helvetica, sans-serif"];');
  lines.push(`  edge [fontname="Arial, Helvetica, sans-serif", fontsize=10, color="${dark ? "#64748b" : "#94a3b8"}", fontcolor="${dark ? "#93c5fd" : "#2563eb"}", penwidth=1.3];`);
  lines.push("");

  // Entities (Sharp-corner Rectangles)
  lines.push("  // Entities (Sharp-corner Rectangles)");
  const entityFill = dark ? "#1e3a8a" : "#dbeafe";
  const entityBorder = dark ? "#3b82f6" : "#2563eb";
  const entityFont = dark ? "#ffffff" : "#1e3a8a";
  lines.push(`  node [shape=box, style="filled", fillcolor="${entityFill}", color="${entityBorder}", fontcolor="${entityFont}", fontsize=11, height=0.45, penwidth=1.5];`);
  
  for (const t of schema) {
    const safeName = (t.name || "unnamed").replace(/[^\w]/g, "_").toLowerCase();
    const displayName = (t.name || "UNNAMED").toUpperCase();
    lines.push(`  entity_${safeName} [label="  ${displayName}  "];`);
  }
  lines.push("");

  // Attributes
  lines.push("  // Attributes (Ellipses)");
  const attrFill = dark ? "#1e293b" : "#f8fafc";
  const attrBorder = dark ? "#475569" : "#cbd5e1";
  const attrFont = dark ? "#f1f5f9" : "#0f172a";
  lines.push(`  node [shape=ellipse, style="filled", fillcolor="${attrFill}", color="${attrBorder}", fontcolor="${attrFont}", fontsize=9.5, height=0.35, penwidth=1.2];`);
  
  for (const t of schema) {
    const safeTableName = (t.name || "unnamed").replace(/[^\w]/g, "_").toLowerCase();
    for (const c of t.columns || []) {
      const safeColName = (c.name || "col").replace(/[^\w]/g, "_").toLowerCase();
      const colId = `attr_${safeTableName}_${safeColName}`;
      const colLabel = (c.name || "COL").toUpperCase();
      if (c.pk) {
        lines.push(`  ${colId} [label=<<u><b>${colLabel}</b></u>>];`);
      } else {
        lines.push(`  ${colId} [label="${colLabel}"];`);
      }
    }
  }
  lines.push("");

  // Connections between Entities and Attributes
  lines.push("  // Entity to Attribute connections");
  for (const t of schema) {
    const safeTableName = (t.name || "unnamed").replace(/[^\w]/g, "_").toLowerCase();
    for (const c of t.columns || []) {
      const safeColName = (c.name || "col").replace(/[^\w]/g, "_").toLowerCase();
      const colId = `attr_${safeTableName}_${safeColName}`;
      lines.push(`  entity_${safeTableName} -- ${colId};`);
    }
  }
  lines.push("");

  // Relationships derived from Foreign Keys
  lines.push("  // Relationships (Diamonds)");
  const relFill = dark ? "#064e3b" : "#d1fae5";
  const relBorder = dark ? "#10b981" : "#059669";
  const relFont = dark ? "#ffffff" : "#064e3b";
  lines.push(`  node [shape=diamond, style="filled", fillcolor="${relFill}", color="${relBorder}", fontcolor="${relFont}", fontsize=9.5, height=0.6, width=1.0, penwidth=1.5];`);
  
  const processedRels = new Set<string>();

  for (const t of schema) {
    const safeTableName = (t.name || "unnamed").replace(/[^\w]/g, "_").toLowerCase();
    for (const c of t.columns || []) {
      if (c.fk && c.fk.table) {
        const targetTable = schema.find(
          (other) => other.name.toLowerCase() === c.fk!.table.toLowerCase(),
        );
        if (targetTable) {
          const safeTargetName = targetTable.name.replace(/[^\w]/g, "_").toLowerCase();
          const relKey = `${safeTableName}_${safeTargetName}_${c.name}`;
          if (!processedRels.has(relKey)) {
            processedRels.add(relKey);
            const relId = `rel_${safeTableName}_${safeTargetName}_${c.name.replace(/[^\w]/g, "_").toLowerCase()}`;
            
            // Derive a descriptive relationship name
            let relName = "REFERENCES";
            const lowerTable = t.name.toLowerCase();
            const lowerCol = c.name.toLowerCase();
            if (lowerTable.includes("item") || lowerTable.includes("line")) {
              relName = "CONTAINS";
            } else if (lowerCol.includes("customer") || lowerCol.includes("user") || lowerCol.includes("buyer")) {
              relName = "PLACES";
            } else if (lowerCol.includes("product") || lowerCol.includes("item")) {
              relName = "INCLUDES";
            } else if (lowerCol.includes("farmer") || lowerCol.includes("owner")) {
              relName = "OWNS";
            } else if (lowerCol.includes("crop") || lowerCol.includes("farm")) {
              relName = "CULTIVATES";
            }

            lines.push(`  ${relId} [label="${relName}"];`);
            // Target table is the '1' parent side
            lines.push(`  entity_${safeTargetName} -- ${relId} [label="1"];`);
            // Source table is the 'N' child side
            lines.push(`  ${relId} -- entity_${safeTableName} [label="N", penwidth=2];`);
          }
        }
      }
    }
  }

  lines.push("}");
  return lines.join("\n");
}

