import { Router } from "express";
import * as controller from "../controllers/automationController.js";

const router = Router();

router.post("/fees/calculate", controller.calculateFeesEndpoint);
router.post("/whatsapp/mock", controller.sendWhatsappMock);

export default router;
