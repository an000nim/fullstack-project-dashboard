import express from "express";
import "./env.js";
import { errorHandler } from "./http.js";
import { projectsRouter } from "./routes/projects.js";
import { tasksRouter } from "./routes/tasks.js";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

app.use("/api/projects", projectsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Маршрут не найден." }),
);
app.use(errorHandler);
