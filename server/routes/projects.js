import { Router } from "express";
import * as controller from "../controllers/projects.js";
import { asyncRoute } from "../http.js";

export const projectsRouter = Router();

projectsRouter.get("/", asyncRoute(controller.list));
projectsRouter.get("/options", asyncRoute(controller.options));
projectsRouter.get("/:id", asyncRoute(controller.get));
projectsRouter.post("/", asyncRoute(controller.create));
projectsRouter.put("/:id", asyncRoute(controller.update));
projectsRouter.delete("/:id", asyncRoute(controller.remove));
