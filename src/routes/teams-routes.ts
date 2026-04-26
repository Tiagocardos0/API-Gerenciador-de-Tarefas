import { Router } from "express";

import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization";
import { TeamsController } from "@/controllers/Teams-controller";


const teamsRoutes = Router();

const teamsController = new TeamsController();

teamsRoutes.use(ensureAuthenticated, verifyUserAuthorization(['ADMIN']));
teamsRoutes.post("/", teamsController.create);

export { teamsRoutes };