import { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import { themeQuartz } from "ag-grid-community";
import { api } from "./api.js";
import TaskEditor from "./TaskEditor.jsx";
import DashboardLayout from "./template/DashboardLayout.jsx";

const rowSelection = {
  mode: "singleRow",
  checkboxes: false,
  enableClickSelection: "enableSelection",
};

const gridTheme = themeQuartz.withParams({
  accentColor: "#003631",
  backgroundColor: "#fffdf4",
  foregroundColor: "#123e38",
  borderColor: "#dde3d3",
  headerBackgroundColor: "#f1f3e8",
  rowHoverColor: "#fff6ce",
  selectedRowBackgroundColor: "#ffeda8",
});

const money = (value) =>
  value === null || value === undefined || value === ""
    ? ""
    : Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });

const projectColumns = [
  { field: "name", headerName: "Проект", flex: 2, minWidth: 160 },
  {
    field: "budget",
    headerName: "Бюджет, ₽",
    flex: 1,
    minWidth: 130,
    valueFormatter: ({ value }) => money(value),
  },
  {
    field: "start_date",
    headerName: "Дата начала",
    flex: 1,
    minWidth: 130,
  },
  { field: "priority", headerName: "Приоритет", width: 115 },
];

const taskColumns = [
  { field: "title", headerName: "Задача", flex: 2, minWidth: 190 },
  {
    field: "estimate_hours",
    headerName: "Часы",
    flex: 1,
    minWidth: 100,
    valueFormatter: ({ value }) => money(value),
  },
  { field: "due_date", headerName: "Срок", flex: 1, minWidth: 125 },
  { field: "priority", headerName: "Приоритет", width: 115 },
];

function App() {
  const [taskRevision, setTaskRevision] = useState(0);
  const [section, setSection] = useState("workspace");
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);

  const selectedProjectId = selectedProject?.id;
  useEffect(() => {
    let active = true;
    setSelectedTask(null);
    setTasks([]);
    setTaskError("");
    setLoadingTasks(Boolean(selectedProjectId));
    if (selectedProjectId) {
      api
        .tasks(selectedProjectId)
        .then((rows) => {
          if (active) setTasks(rows);
        })
        .catch((error) => {
          if (active) setTaskError(error.message);
        })
        .finally(() => {
          if (active) setLoadingTasks(false);
        });
    }
    return () => {
      active = false;
    };
  }, [selectedProjectId, taskRevision]);

  const projectDatasource = useMemo(
    () => ({
      getRows: async (params) => {
        try {
          const result = await api.projects(
            params.endRow - params.startRow,
            params.startRow,
          );
          params.successCallback(result.data, result.total);
        } catch (error) {
          setNotice(error.message);
          params.failCallback();
        }
      },
    }),
    [],
  );

  async function deleteTask() {
    if (!selectedTask || !window.confirm(`Удалить «${selectedTask.title}»?`))
      return;
    setNotice("");
    try {
      await api.deleteTask(selectedTask.id);
      setSelectedTask(null);
      setTaskRevision((value) => value + 1);
      setNotice("Запись удалена.");
    } catch (error) {
      setNotice(error.message);
    }
  }

  function saved() {
    setModal(null);
    setNotice("Запись сохранена.");
    setTaskRevision((value) => value + 1);
    setSelectedTask(null);
  }

  return (
    <DashboardLayout section={section} onSectionChange={setSection}>
      {section === "workspace" && (
        <>
          {notice && (
            <div className="notice" role="status">
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Закрыть сообщение"
              >
                ×
              </button>
            </div>
          )}
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">Проекты</h2>
              </div>
            </div>
            <div className="card-body">
              <div className="grid-wrap project-grid">
                <AgGridReact
                  theme={gridTheme}
                  rowSelection={rowSelection}
                  rowModelType="infinite"
                  datasource={projectDatasource}
                  cacheBlockSize={25}
                  maxBlocksInCache={4}
                  rowHeight={46}
                  headerHeight={44}
                  columnDefs={projectColumns}
                  defaultColDef={{
                    resizable: true,
                    sortable: false,
                    filter: false,
                  }}
                  onSelectionChanged={({ api }) => {
                    setSelectedProject(api.getSelectedRows()[0] || null);
                    setNotice("");
                  }}
                  getRowId={({ data }) => String(data.id)}
                />
              </div>
            </div>
          </section>
          <section className="card">
            <div className="card-header">
              <div>
                <h2 className="card-title">
                  Задачи{" "}
                  {selectedProject ? (
                    <span className="soft-text">/ {selectedProject.name}</span>
                  ) : (
                    ""
                  )}
                </h2>
              </div>
              <div className="toolbar">
                <button
                  className="btn btn-primary btn-fill"
                  disabled={!selectedProject}
                  onClick={() =>
                    setModal({
                      initial: { project_id: selectedProject.id },
                    })
                  }
                >
                  + Добавить запись
                </button>
                <button
                  className="btn"
                  disabled={!selectedTask}
                  onClick={() =>
                    setModal({
                      initial: selectedTask,
                    })
                  }
                >
                  Изменить
                </button>
                <button
                  className="btn btn-danger"
                  disabled={!selectedTask}
                  onClick={deleteTask}
                >
                  Удалить
                </button>
              </div>
            </div>
            {taskError && (
              <div className="form-error inline-error" role="alert">
                {taskError}
              </div>
            )}
            <div className="card-body">
              <div className="grid-wrap task-grid">
                <AgGridReact
                  theme={gridTheme}
                  rowSelection={rowSelection}
                  rowData={tasks}
                  columnDefs={taskColumns}
                  defaultColDef={{
                    resizable: true,
                    sortable: true,
                    filter: false,
                  }}
                  rowHeight={46}
                  headerHeight={44}
                  loading={loadingTasks}
                  overlayNoRowsTemplate={
                    selectedProject
                      ? "<span class='empty-grid'>У этого проекта пока нет задач. Добавьте первую запись.</span>"
                      : "<span class='empty-grid'>Сначала выберите проект в верхней таблице.</span>"
                  }
                  onSelectionChanged={({ api }) =>
                    setSelectedTask(api.getSelectedRows()[0] || null)
                  }
                  onRowDataUpdated={({ api }) => api.deselectAll()}
                  getRowId={({ data }) => String(data.id)}
                />
              </div>
            </div>
          </section>
        </>
      )}
      {section === "help" && (
        <section className="simple-page">
          <p>Выберите проект в верхней таблице, чтобы увидеть его задачи.</p>
          <p>
            Для изменения или удаления сначала выберите строку. В форме задачи
            можно изменить связанный проект.
          </p>
        </section>
      )}
      {modal && (
        <TaskEditor
          key={modal.initial?.id || "new"}
          {...modal}
          onClose={() => setModal(null)}
          onSaved={saved}
        />
      )}
    </DashboardLayout>
  );
}

export default App;
