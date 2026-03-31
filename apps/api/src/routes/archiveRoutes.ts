import { Router } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import * as controller from "../controllers/archiveController.js";

const router = Router();

const uploadDir = path.resolve(process.cwd(), "uploads", "archives");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({ storage });

router.post("/upload", upload.single("file"), controller.uploadArchive);
router.get("/", controller.getArchives);

export default router;
