import assert from "node:assert/strict";
import { test } from "node:test";
import { once } from "node:events";
import { app } from "../app.js";
import { closeDb, db } from "../db.js";

test("API: блоки проектов, связь, CRUD и защита удаления", async () => {
  await db.one("SELECT 1");
  const server = app.listen(0);
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}/api`;
  let projectId;
  let secondProjectId;
  let taskId;

  async function request(path, method = "GET", body) {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: response.status,
      body: response.status === 204 ? null : await response.json(),
    };
  }

  try {
    const firstBlock = await request("/projects?limit=7&offset=0");
    const secondBlock = await request("/projects?limit=7&offset=7");
    assert.equal(firstBlock.status, 200);
    assert.equal(firstBlock.body.data.length, 7);
    assert.equal(secondBlock.body.data.length, 7);
    assert.equal(firstBlock.body.total >= 180, true);
    assert.equal(
      firstBlock.body.data[0].id < secondBlock.body.data[0].id,
      true,
    );

    const createdProject = await request("/projects", "POST", {
      name: "Проверка API",
      budget: 1234.5,
      startDate: "2026-10-28",
      priority: 2,
    });
    assert.equal(createdProject.status, 201);
    projectId = createdProject.body.id;
    const validProject = {
      name: "Проверка валидации",
      budget: 10,
      startDate: "2026-10-30",
      priority: 1,
    };
    for (const invalid of [
      { budget: [1] },
      { budget: true },
      { priority: true },
      { priority: [1] },
      { startDate: "0000-01-01" },
    ]) {
      assert.equal(
        (
          await request(`/projects/${projectId}`, "PUT", {
            ...validProject,
            ...invalid,
          })
        ).status,
        400,
      );
    }
    assert.equal((await request("/projects?limit=7&limit=8")).status, 400);
    const malformed = await fetch(`${base}/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "{broken",
    });
    assert.equal(malformed.status, 400);
    const oversized = await request(`/projects/${projectId}`, "PUT", {
      ...validProject,
      name: "x".repeat(110000),
    });
    assert.equal(oversized.status, 413);
    assert.equal(
      (await request(`/projects/${projectId}`)).body.name,
      "Проверка API",
    );
    const changedProject = await request(`/projects/${projectId}`, "PUT", {
      name: "Обновлённый проект",
      budget: 2500.75,
      startDate: "2026-10-29",
      priority: 5,
    });
    assert.equal(changedProject.status, 200);
    assert.equal(changedProject.body.name, "Обновлённый проект");
    assert.equal(Number(changedProject.body.budget), 2500.75);

    const createdTask = await request("/tasks", "POST", {
      projectId,
      title: "Проверить связь",
      estimateHours: 1.5,
      dueDate: "2026-11-01",
      priority: 3,
    });
    assert.equal(createdTask.status, 201);
    taskId = createdTask.body.id;
    assert.equal(
      (
        await request(`/tasks/${taskId}`, "PUT", {
          projectId: [projectId],
          title: "Проверка",
          estimateHours: 1,
          dueDate: "2026-11-01",
          priority: 1,
        })
      ).status,
      400,
    );
    assert.equal(createdTask.body.project_id, projectId);

    const related = await request(`/tasks?projectId=${projectId}`);
    assert.equal(related.body.length, 1);
    assert.equal(related.body[0].title, "Проверить связь");

    const updated = await request(`/tasks/${taskId}`, "PUT", {
      projectId,
      title: "Связь проверена",
      estimateHours: 2,
      dueDate: "2026-11-02",
      priority: 4,
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.title, "Связь проверена");
    assert.equal(
      (await request(`/tasks/${taskId}`)).body.title,
      "Связь проверена",
    );

    assert.equal(
      (await request(`/projects/${projectId}`, "DELETE")).status,
      409,
    );
    assert.equal(
      (
        await request("/tasks", "POST", {
          projectId: 99999999,
          title: "Нет проекта",
          estimateHours: 1,
          dueDate: "2026-11-02",
          priority: 1,
        })
      ).status,
      409,
    );
    assert.equal((await request("/projects?limit=0&offset=0")).status, 400);
    assert.equal(
      (
        await request("/projects", "POST", {
          name: "Неверная дата",
          budget: 1,
          startDate: "2026-02-30",
          priority: 1,
        })
      ).status,
      400,
    );
    const secondProject = await request("/projects", "POST", {
      name: "Другой проект",
      budget: 0,
      startDate: "2026-10-30",
      priority: 1,
    });
    assert.equal(secondProject.status, 201);
    secondProjectId = secondProject.body.id;
    const movedTask = await request(`/tasks/${taskId}`, "PUT", {
      projectId: secondProjectId,
      title: "Перенесённая задача",
      estimateHours: 2,
      dueDate: "2026-11-02",
      priority: 4,
    });
    assert.equal(movedTask.status, 200);
    assert.equal(movedTask.body.project_id, secondProjectId);
    assert.equal(
      (await request(`/tasks?projectId=${projectId}`)).body.length,
      0,
    );
    assert.equal(
      (await request(`/tasks?projectId=${secondProjectId}`)).body[0].id,
      taskId,
    );
    assert.equal((await request(`/tasks/${taskId}`, "DELETE")).status, 204);
    assert.equal((await request(`/tasks/${taskId}`)).status, 404);
    taskId = undefined;
    assert.equal(
      (await request(`/projects/${projectId}`, "DELETE")).status,
      204,
    );
    assert.equal((await request(`/projects/${projectId}`)).status, 404);
    projectId = undefined;
    assert.equal(
      (await request(`/projects/${secondProjectId}`, "DELETE")).status,
      204,
    );
    secondProjectId = undefined;
  } finally {
    if (taskId) await request(`/tasks/${taskId}`, "DELETE");
    if (projectId) await request(`/projects/${projectId}`, "DELETE");
    if (secondProjectId)
      await request(`/projects/${secondProjectId}`, "DELETE");
    await new Promise((resolve) => server.close(resolve));
    await closeDb();
  }
});
