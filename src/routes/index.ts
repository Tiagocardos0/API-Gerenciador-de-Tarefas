import { Router } from "express";

import { usersRoutes } from "@/routes/users-routes";
import { sessionsRoutes } from "@/routes/sessions-routes";
import { teamsRoutes } from "@/routes/teams-routes";
import { membersRoutes } from "@/routes/members-routes";
import { taskRoutes } from "@/routes/task-routes";

const routes = Router();

routes.use("/users", usersRoutes);
routes.use("/sessions", sessionsRoutes);
routes.use("/teams", teamsRoutes);
routes.use("/members", membersRoutes);
routes.use("/tasks", taskRoutes);

export { routes };