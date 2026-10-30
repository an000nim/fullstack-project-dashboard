import { Router } from "express";
import * as controller from "../controllers/tasks.js";
import { asyncRoute } from "../http.js";

export const tasksRouter = Router();

tasksRouter.get("/", asyncRoute(controller.list));
tasksRouter.get("/:id", asyncRoute(controller.get));
tasksRouter.post("/", asyncRoute(controller.create));
tasksRouter.put("/:id", asyncRoute(controller.update));
tasksRouter.delete("/:id", asyncRoute(controller.remove));
