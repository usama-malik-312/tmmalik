import { Router } from "express";
import * as controller from "../controllers/activityController.js";

const router = Router();

router.get("/", controller.getRecentActivities);

export default router;
