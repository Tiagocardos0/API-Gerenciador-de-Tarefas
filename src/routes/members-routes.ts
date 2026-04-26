import { Router } from "express";

import { ensureAuthenticated } from "@/middlewares/ensureAuthenticated";
import { verifyUserAuthorization } from "@/middlewares/verifyUserAuthorization";
import { MembersController } from "@/controllers/Members-controller";

const membersRoutes = Router();
const membersController = new MembersController();

membersRoutes.use(ensureAuthenticated, verifyUserAuthorization(['ADMIN']));
membersRoutes.post("/", membersController.create);
membersRoutes.get("/:teamId", membersController.show);
membersRoutes.delete("/:id", membersController.delete);

export { membersRoutes };