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

export interface DatasetExample {
  id: number;
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
        question: "How many customers are there?",
        sql: "SELECT COUNT(*) FROM customers;",
        expected: "Count all customers.",
      },
      {
        id: 2,
        question: "Show products with price above 5000",
        sql: "SELECT name, category, price FROM products WHERE price > 5000;",
        expected: "Products priced above 5000.",
      },
      {
        id: 3,
        question: "Average total amount per customer in orders",
        sql: "SELECT customer_id, AVG(total_amount) FROM orders GROUP BY customer_id;",
        expected: "Average order value per customer.",
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
        question: "How many books are there?",
        sql: "SELECT COUNT(*) FROM books;",
        expected: "Count all books.",
      },
      {
        id: 2,
        question: "Show books with pages above 300",
        sql: "SELECT title, genre, pages FROM books WHERE pages > 300;",
        expected: "Books longer than 300 pages.",
      },
      {
        id: 3,
        question: "How many loans per member?",
        sql: "SELECT member_id, COUNT(*) FROM loans GROUP BY member_id;",
        expected: "Loan count per member.",
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
        question: "How many patients are there?",
        sql: "SELECT COUNT(*) FROM patients;",
        expected: "Count all patients.",
      },
      {
        id: 2,
        question: "Show patients above age 40",
        sql: "SELECT name, city, age FROM patients WHERE age > 40;",
        expected: "Patients older than 40.",
      },
      {
        id: 3,
        question: "Average fee per doctor in visits",
        sql: "SELECT doctor_id, AVG(fee) FROM visits GROUP BY doctor_id;",
        expected: "Average visit fee per doctor.",
      },
    ],
  },
];

export function getTable(
  name: string,
  schema: Table[] = SCHEMA,
): Table | undefined {
  return schema.find((t) => t.name === name.toLowerCase());
}

/** Mermaid ER diagram source for the schema. */
export function erDiagramMermaid(schema: Table[] = SCHEMA): string {
  let out = "erDiagram\n";
  for (const t of schema) {
    out += `  ${t.name.toUpperCase()} {\n`;
    for (const c of t.columns) {
      out += `    ${c.type} ${c.name}${c.pk ? " PK" : c.fk ? " FK" : ""}\n`;
    }
    out += "  }\n";
  }
  for (const t of schema) {
    for (const c of t.columns) {
      if (c.fk)
        out += `  ${c.fk.table.toUpperCase()} ||--o{ ${t.name.toUpperCase()} : has\n`;
    }
  }
  return out;
}
