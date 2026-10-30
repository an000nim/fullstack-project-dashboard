import * as model from "../models/projects.js";
import { HttpError, parseId, parsePage, validateProject } from "../http.js";

export async function list(req, res) {
  res.json(await model.listProjects(parsePage(req.query)));
}

export async function options(_req, res) {
  res.json(await model.listProjectOptions());
}

export async function get(req, res) {
  const project = await model.getProject(parseId(req.params.id));
  if (!project) throw new HttpError(404, "Проект не найден.");
  res.json(project);
}

export async function create(req, res) {
  const project = await model.createProject(validateProject(req.body));
  res.status(201).location(`/api/projects/${project.id}`).json(project);
}

export async function update(req, res) {
  const project = await model.updateProject(
    parseId(req.params.id),
    validateProject(req.body),
  );
  if (!project) throw new HttpError(404, "Проект не найден.");
  res.json(project);
}

export async function remove(req, res) {
  const deleted = await model.deleteProject(parseId(req.params.id));
  if (!deleted) throw new HttpError(404, "Проект не найден.");
  res.status(204).end();
}
