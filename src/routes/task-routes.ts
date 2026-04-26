import { Router } from "express";

import { TaskController } from "@/controllers/Task-controller";
import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated";


const taskController = new TaskController();

const taskRoutes = Router();
taskRoutes.use(ensureAuthenticated);

taskRoutes.post('/', taskController.create);
taskRoutes.get('/', taskController.index);
taskRoutes.patch('/:id', taskController.update);
taskRoutes.delete('/:id', taskController.delete);
taskRoutes.get('/:id/history', taskController.history);

export { taskRoutes };