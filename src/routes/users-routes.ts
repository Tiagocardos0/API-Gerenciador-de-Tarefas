import { Router } from "express";
import { UsersController } from "@/controllers/Users-controller";

const usersRoutes = Router();
const usersController = new UsersController();

usersRoutes.post("/", usersController.create);

export { usersRoutes };