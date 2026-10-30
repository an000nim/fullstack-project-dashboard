import * as model from "../models/tasks.js";
import { HttpError, parseId, validateTask } from "../http.js";

export async function list(req, res) {
  const projectId =
    req.query.projectId === undefined
      ? undefined
      : parseId(req.query.projectId);
  res.json(await model.listTasks(projectId));
}

export async function get(req, res) {
  const task = await model.getTask(parseId(req.params.id));
  if (!task) throw new HttpError(404, "Задача не найдена.");
  res.json(task);
}

export async function create(req, res) {
  const task = await model.createTask(validateTask(req.body));
  res.status(201).location(`/api/tasks/${task.id}`).json(task);
}

export async function update(req, res) {
  const task = await model.updateTask(
    parseId(req.params.id),
    validateTask(req.body),
  );
  if (!task) throw new HttpError(404, "Задача не найдена.");
  res.json(task);
}

export async function remove(req, res) {
  const deleted = await model.deleteTask(parseId(req.params.id));
  if (!deleted) throw new HttpError(404, "Задача не найдена.");
  res.status(204).end();
}
