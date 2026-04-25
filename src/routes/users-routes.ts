import { Router } from "express";
import { UsersController } from "@/controllers/Users-controller";
import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated";

const usersRoutes = Router();
const usersController = new UsersController();

usersRoutes.post("/", ensureAuthenticated, usersController.create);

export { usersRoutes };