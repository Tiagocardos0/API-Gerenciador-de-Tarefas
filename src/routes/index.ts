import { Router } from "express";
import { usersRoutes } from "@/routes/users-routes";
import { sessionsRoutes } from "@/routes/sessions-routes";

const routes = Router();

routes.use("/users", usersRoutes);
routes.use("/sessions", sessionsRoutes);

export { routes };