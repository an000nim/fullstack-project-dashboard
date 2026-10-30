import { useEffect, useState } from "react";
import { api } from "./api.js";
import FormSelect from "./FormSelect.jsx";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function TaskEditor({ initial, onClose, onSaved }) {
  const [form, setForm] = useState({
    projectId: initial.project_id,
    title: initial.title || "",
    estimateHours: initial.estimate_hours || "0",
    dueDate: initial.due_date || today(),
    priority: initial.priority || 3,
  });
  const [projectOptions, setProjectOptions] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .projectOptions()
      .then((items) => {
        if (active) setProjectOptions(items);
      })
      .catch((err) => {
        if (active) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, []);

  function change(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.saveTask(initial.id || null, form);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (!saving && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <div className="modal-head">
          <div>
            <h2 id="editor-title">
              {initial.id ? "Изменить запись" : "Добавить запись"}
            </h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <form onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="task-project">Проект</label>
            <FormSelect
              id="task-project"
              options={projectOptions.map((project) => ({
                value: project.id,
                label: project.name,
              }))}
              value={form.projectId}
              onChange={(projectId) =>
                setForm((previous) => ({ ...previous, projectId }))
              }
              searchable
              required
            />
          </div>
          <label>
            Название задачи
            <input
              className="form-input"
              name="title"
              value={form.title}
              onChange={change}
              maxLength="160"
              required
            />
          </label>
          <div className="form-row">
            <label>
              Оценка, часы
              <input
                className="form-input"
                name="estimateHours"
                type="number"
                min="0"
                max="999999.99"
                step="0.01"
                value={form.estimateHours}
                onChange={change}
                required
              />
            </label>
            <label>
              Срок выполнения
              <input
                className="form-input"
                name="dueDate"
                type="date"
                value={form.dueDate}
                onChange={change}
                required
              />
            </label>
          </div>
          <div className="form-field">
            <label htmlFor="record-priority">Приоритет</label>
            <FormSelect
              id="record-priority"
              options={[1, 2, 3, 4, 5].map((value) => ({
                value,
                label: String(value),
              }))}
              value={form.priority}
              onChange={(priority) =>
                setForm((previous) => ({ ...previous, priority }))
              }
            />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              className="btn"
              type="button"
              onClick={onClose}
              disabled={saving}
            >
              Отмена
            </button>
            <button
              className="btn btn-primary btn-fill"
              type="submit"
              disabled={saving || projectOptions.length === 0}
            >
              {saving ? "Сохраняем…" : "Сохранить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
