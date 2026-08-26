// Sample inputs with expected outputs, per the assignment spec.

export interface Example {
  id: number;
  question: string;
  sql: string;
  expected: string;
}

export const EXAMPLES: Example[] = [
  {
    id: 1,
    question: "How many customers are there?",
    sql: "SELECT COUNT(*) FROM customers;",
    expected: "6 — one row containing the count of all customers.",
  },
  {
    id: 2,
    question: "Show products with price above 5000",
    sql: "SELECT name, category, price FROM products WHERE price > 5000;",
    expected:
      "3 rows — Laptop Pro (89999), Office Chair (7499), Study Desk (9999).",
  },
  {
    id: 3,
    question: "Average total amount per customer in orders",
    sql: "SELECT customer_id, AVG(total_amount) FROM orders GROUP BY customer_id;",
    expected:
      "6 rows — one average order value per customer_id (e.g. customer 1 averages 45998).",
  },
  {
    id: 4,
    question: "List customers in Mumbai",
    sql: "SELECT name, city, signup_year FROM customers WHERE city = 'Mumbai';",
    expected: "2 rows — Asha Verma and Meera Nair.",
  },
  {
    id: 5,
    question: "Total quantity ordered per product in order_items",
    sql: "SELECT product_id, SUM(quantity) FROM order_items GROUP BY product_id;",
    expected:
      "5 rows — e.g. product 102 totals 4 units, product 105 totals 6 units.",
  },
  {
    id: 6,
    question: "Top 3 highest priced products sorted by price",
    sql: "SELECT name, category, price FROM products ORDER BY price DESC LIMIT 3;",
    expected:
      "Laptop Pro, Study Desk, Office Chair — the three most expensive products.",
  },
];
