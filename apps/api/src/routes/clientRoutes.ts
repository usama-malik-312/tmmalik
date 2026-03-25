import { Router } from "express";
import * as controller from "../controllers/clientController.js";

const router = Router();

router.post("/", controller.createClient);
router.get("/", controller.getClients);
router.get("/:id", controller.getClientById);
router.put("/:id", controller.updateClient);
router.delete("/:id", controller.deleteClient);

export default router;
