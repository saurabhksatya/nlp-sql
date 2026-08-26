// Sample e-commerce database used for the NL→SQL demo.
// Small enough to visualize row-by-row, realistic enough to be meaningful.

export type ColumnType = "INTEGER" | "TEXT" | "REAL";

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

export function getTable(name: string): Table | undefined {
  return SCHEMA.find((t) => t.name === name.toLowerCase());
}

/** Mermaid ER diagram source for the schema. */
export function erDiagramMermaid(): string {
  let out = "erDiagram\n";
  for (const t of SCHEMA) {
    out += `  ${t.name.toUpperCase()} {\n`;
    for (const c of t.columns) {
      out += `    ${c.type} ${c.name}${c.pk ? " PK" : c.fk ? " FK" : ""}\n`;
    }
    out += "  }\n";
  }
  for (const t of SCHEMA) {
    for (const c of t.columns) {
      if (c.fk)
        out += `  ${c.fk.table.toUpperCase()} ||--o{ ${t.name.toUpperCase()} : has\n`;
    }
  }
  return out;
}
