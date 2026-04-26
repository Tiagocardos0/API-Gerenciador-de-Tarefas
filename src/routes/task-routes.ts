import { Router } from "express";

import { TaskController } from "@/controllers/Task-controller";
import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization";

const taskController = new TaskController();

const taskRoutes = Router();
taskRoutes.use(ensureAuthenticated, verifyUserAuthorization(["ADMIN", "MEMBER"]));

taskRoutes.post('/', taskController.create);
taskRoutes.get('/', taskController.show);
taskRoutes.patch('/:id', taskController.update);
taskRoutes.delete('/:id', taskController.delete);

export { taskRoutes };