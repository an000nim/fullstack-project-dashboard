import { db } from "../db.js";

const columns =
  "id, project_id, title, estimate_hours, due_date::text AS due_date, priority";

export function listTasks(projectId) {
  if (projectId === undefined) {
    return db.any(`SELECT ${columns} FROM tasks ORDER BY id`);
  }
  return db.any(
    `SELECT ${columns} FROM tasks WHERE project_id = $1 ORDER BY id`,
    [projectId],
  );
}

export function getTask(id) {
  return db.oneOrNone(`SELECT ${columns} FROM tasks WHERE id = $1`, [id]);
}

export function createTask(task) {
  return db.one(
    `INSERT INTO tasks (project_id, title, estimate_hours, due_date, priority)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${columns}`,
    [
      task.projectId,
      task.title,
      task.estimateHours,
      task.dueDate,
      task.priority,
    ],
  );
}

export function updateTask(id, task) {
  return db.oneOrNone(
    `UPDATE tasks SET project_id = $2, title = $3, estimate_hours = $4, due_date = $5, priority = $6
     WHERE id = $1 RETURNING ${columns}`,
    [
      id,
      task.projectId,
      task.title,
      task.estimateHours,
      task.dueDate,
      task.priority,
    ],
  );
}

export function deleteTask(id) {
  return db.result(
    "DELETE FROM tasks WHERE id = $1",
    [id],
    (result) => result.rowCount,
  );
}
