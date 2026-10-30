async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch {
    throw new Error(
      "Не удалось связаться с сервером. Проверьте, что он запущен.",
    );
  }

  if (response.status === 204) return null;
  let body;
  try {
    body = await response.json();
  } catch {
    throw new Error("Сервер вернул некорректный ответ.");
  }
  if (!response.ok)
    throw new Error(body.error || `Ошибка сервера: ${response.status}`);
  return body;
}

export const api = {
  projects: (limit, offset) =>
    request(`/projects?limit=${limit}&offset=${offset}`),
  projectOptions: () => request("/projects/options"),
  tasks: (projectId) => request(`/tasks?projectId=${projectId}`),
  saveTask: (id, body) =>
    request(id ? `/tasks/${id}` : "/tasks", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(body),
    }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
};
