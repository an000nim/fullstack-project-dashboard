import { db } from "../db.js";

const columns = "id, name, budget, start_date::text AS start_date, priority";

export async function listProjects({ limit, offset }) {
  return db.task(async (t) => {
    const rows = await t.any(
      `SELECT ${columns} FROM projects ORDER BY id LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    const count = await t.one(
      "SELECT COUNT(*)::integer AS total FROM projects",
    );
    return { data: rows, total: count.total, limit, offset };
  });
}

export function getProject(id) {
  return db.oneOrNone(`SELECT ${columns} FROM projects WHERE id = $1`, [id]);
}

export function listProjectOptions() {
  return db.any("SELECT id, name FROM projects ORDER BY id");
}

export function createProject(project) {
  return db.one(
    `INSERT INTO projects (name, budget, start_date, priority)
     VALUES ($1, $2, $3, $4)
     RETURNING ${columns}`,
    [project.name, project.budget, project.startDate, project.priority],
  );
}

export function updateProject(id, project) {
  return db.oneOrNone(
    `UPDATE projects SET name = $2, budget = $3, start_date = $4, priority = $5
     WHERE id = $1 RETURNING ${columns}`,
    [id, project.name, project.budget, project.startDate, project.priority],
  );
}

export function deleteProject(id) {
  return db.result(
    "DELETE FROM projects WHERE id = $1",
    [id],
    (result) => result.rowCount,
  );
}
