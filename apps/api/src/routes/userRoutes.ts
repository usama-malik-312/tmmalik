import { Router } from "express";
import * as controller from "../controllers/userController.js";
import { ownerOnly } from "../middleware/ownerOnly.js";

const router = Router();

router.use(ownerOnly);
router.post("/", controller.createUser);
router.get("/", controller.getUsers);
router.get("/:id", controller.getUserById);
router.put("/:id", controller.updateUser);
router.delete("/:id", controller.deleteUser);

export default router;

