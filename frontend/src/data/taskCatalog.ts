import type { TaskCatalogEntry } from '../types'

export const TASK_CATALOG: Record<string, TaskCatalogEntry> = {
  task_1: {
    id: 'task_1',
    story:
      'A receipt parser captured the right columns but dropped commas in the SELECT list.',
    whyItFails:
      'SQLite interprets `id name price` as malformed syntax because the projection list never separates the column identifiers.',
    schemaStatements: [
      'CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL);',
      "INSERT INTO products VALUES (1, 'Apple', 0.50);",
      "INSERT INTO products VALUES (2, 'Bread', 2.50);",
      "INSERT INTO products VALUES (3, 'Cheese', 5.00);",
      "INSERT INTO products VALUES (4, 'Milk', 1.50);",
      "INSERT INTO products VALUES (5, 'Eggs', 3.00);",
    ],
    canonicalQuery: 'SELECT id, name, price FROM products ORDER BY id',
    validationSignal: 'Solved when the result matches 5 rows × 3 columns in the expected order.',
  },
  task_2: {
    id: 'task_2',
    story:
      'An analyst copied a JOIN from another schema and kept the wrong column names.',
    whyItFails:
      'Both `username` and `user` do not exist in the current schema, so the join never resolves against the users and orders tables.',
    schemaStatements: [
      'CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT);',
      'CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, total REAL NOT NULL);',
      "INSERT INTO users VALUES (1, 'Aarav', 'IN');",
      "INSERT INTO users VALUES (2, 'Bea', 'US');",
      "INSERT INTO users VALUES (3, 'Chen', 'CN');",
      'INSERT INTO orders VALUES (10, 1, 99.00);',
      'INSERT INTO orders VALUES (11, 1, 49.50);',
      'INSERT INTO orders VALUES (12, 2, 200.00);',
      'INSERT INTO orders VALUES (13, 3, 25.00);',
    ],
    canonicalQuery:
      'SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id ORDER BY o.id',
    validationSignal: 'Solved when the name/total pairs align with all 4 order rows.',
  },
  task_3: {
    id: 'task_3',
    story:
      'A reporting query totals revenue by region but omits the grouping step.',
    whyItFails:
      'The query mixes a non-aggregate column with `SUM(amount)` and never groups by region, so the repair must add the missing aggregation boundary.',
    schemaStatements: [
      'CREATE TABLE sales (id INTEGER PRIMARY KEY, region TEXT NOT NULL, amount REAL NOT NULL);',
      "INSERT INTO sales VALUES (1, 'north', 100.00);",
      "INSERT INTO sales VALUES (2, 'north', 50.00);",
      "INSERT INTO sales VALUES (3, 'south', 200.00);",
      "INSERT INTO sales VALUES (4, 'south', 75.00);",
      "INSERT INTO sales VALUES (5, 'east', 150.00);",
      "INSERT INTO sales VALUES (6, 'east', 25.00);",
    ],
    canonicalQuery:
      'SELECT region, SUM(amount) AS total FROM sales GROUP BY region ORDER BY region',
    validationSignal: 'Solved when the grouped totals produce exactly 3 ordered regional aggregates.',
  },
}
