"""Task definitions for SQL Repair env.

Each task gives the agent:
  - schema     : list of CREATE/INSERT statements (executed verbatim)
  - broken     : a SQL query that errors or returns the wrong rows
  - canonical  : the reference fix used to compute expected_rows
  - hint       : short natural-language pointer

Difficulty is tuned so even a vanilla LLM agent (Nemotron-class) can solve
task_1 reliably, task_2 with effort, and task_3 about half the time —
ensuring score variance across tasks (Phase 2 likely checks for this).
"""
from typing import Dict, List

TASKS: Dict[str, dict] = {
    "task_1": {
        "id": "task_1",
        "name": "Missing commas in SELECT list",
        "difficulty": "easy",
        "schema": [
            "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT NOT NULL, price REAL NOT NULL);",
            "INSERT INTO products VALUES (1, 'Apple', 0.50);",
            "INSERT INTO products VALUES (2, 'Bread', 2.50);",
            "INSERT INTO products VALUES (3, 'Cheese', 5.00);",
            "INSERT INTO products VALUES (4, 'Milk', 1.50);",
            "INSERT INTO products VALUES (5, 'Eggs', 3.00);",
        ],
        "broken_query": "SELECT id name price FROM products ORDER BY id",
        "canonical_query": "SELECT id, name, price FROM products ORDER BY id",
        "hint": "The SELECT list is missing commas between column names.",
    },
    "task_2": {
        "id": "task_2",
        "name": "Wrong column reference in JOIN",
        "difficulty": "medium",
        "schema": [
            "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT NOT NULL, country TEXT);",
            "CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, total REAL NOT NULL);",
            "INSERT INTO users VALUES (1, 'Aarav', 'IN');",
            "INSERT INTO users VALUES (2, 'Bea',   'US');",
            "INSERT INTO users VALUES (3, 'Chen',  'CN');",
            "INSERT INTO orders VALUES (10, 1,  99.00);",
            "INSERT INTO orders VALUES (11, 1,  49.50);",
            "INSERT INTO orders VALUES (12, 2, 200.00);",
            "INSERT INTO orders VALUES (13, 3,  25.00);",
        ],
        "broken_query": (
            "SELECT u.username, o.total "
            "FROM users u JOIN orders o ON u.id = o.user "
            "ORDER BY o.id"
        ),
        "canonical_query": (
            "SELECT u.name, o.total "
            "FROM users u JOIN orders o ON u.id = o.user_id "
            "ORDER BY o.id"
        ),
        "hint": "Two columns are misspelled — check the schema for the real names.",
    },
    "task_3": {
        "id": "task_3",
        "name": "Aggregate without GROUP BY",
        "difficulty": "hard",
        "schema": [
            "CREATE TABLE sales (id INTEGER PRIMARY KEY, region TEXT NOT NULL, amount REAL NOT NULL);",
            "INSERT INTO sales VALUES (1, 'north', 100.00);",
            "INSERT INTO sales VALUES (2, 'north',  50.00);",
            "INSERT INTO sales VALUES (3, 'south', 200.00);",
            "INSERT INTO sales VALUES (4, 'south',  75.00);",
            "INSERT INTO sales VALUES (5, 'east',  150.00);",
            "INSERT INTO sales VALUES (6, 'east',   25.00);",
        ],
        "broken_query": "SELECT region, SUM(amount) AS total FROM sales ORDER BY region",
        "canonical_query": (
            "SELECT region, SUM(amount) AS total FROM sales "
            "GROUP BY region ORDER BY region"
        ),
        "hint": "You SELECT a non-aggregate column with an aggregate — add GROUP BY.",
    },
}

TASK_IDS: List[str] = list(TASKS.keys())
