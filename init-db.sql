-- Run with psql as a role allowed to create databases.
-- Docker Compose runs this file once when its database volume is first created.
CREATE DATABASE project_tasks;
\connect project_tasks

CREATE TABLE projects (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
    start_date DATE NOT NULL,
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5)
);

CREATE TABLE tasks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
    title VARCHAR(160) NOT NULL,
    estimate_hours NUMERIC(8, 2) NOT NULL CHECK (estimate_hours >= 0),
    due_date DATE NOT NULL,
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5)
);

CREATE INDEX tasks_project_id_idx ON tasks (project_id);

INSERT INTO projects (name, budget, start_date, priority)
SELECT
    'Проект ' || to_char(n, 'FM000'),
    (30000 + n * 1750)::NUMERIC(12, 2),
    DATE '2026-01-01' + ((n - 1) * 2),
    ((n - 1) % 5) + 1
FROM generate_series(1, 180) AS n;

INSERT INTO tasks (project_id, title, estimate_hours, due_date, priority)
SELECT
    p.id,
    CASE t.n
        WHEN 1 THEN 'Подготовить требования'
        WHEN 2 THEN 'Реализовать интерфейс'
        ELSE 'Проверить результат'
    END,
    (t.n * 6.5)::NUMERIC(8, 2),
    p.start_date + (t.n * 7),
    t.n
FROM projects AS p
CROSS JOIN generate_series(1, 3) AS t(n)
WHERE p.id <= 24;
