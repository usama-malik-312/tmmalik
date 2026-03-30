import cors from "cors";
import express from "express";
import morgan from "morgan";
import { ensureActivitiesSchema } from "./db/ensureActivitiesSchema.js";
import { ensureTemplatesSchema } from "./db/ensureTemplatesSchema.js";
import { ensureUsersSchema } from "./db/ensureUsersSchema.js";
import { verifyDbEncoding } from "./db/verifyDbEncoding.js";
import { errorHandler } from "./middleware/errorHandler.js";
import activityRoutes from "./routes/activityRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import caseRoutes from "./routes/caseRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

app.use("/clients", clientRoutes);
app.use("/cases", caseRoutes);
app.use("/activities", activityRoutes);
app.use("/templates", templateRoutes);
app.use("/documents", documentRoutes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use(errorHandler);

void (async () => {
  try {
    await ensureTemplatesSchema();
    await ensureUsersSchema();
    await ensureActivitiesSchema();
    await verifyDbEncoding();
  } catch (err) {
    console.error("[DB] startup schema checks failed:", err);
  }
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
})();
