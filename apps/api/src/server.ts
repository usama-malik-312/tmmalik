import cors from "cors";
import express from "express";
import morgan from "morgan";
import { ensureTemplatesSchema } from "./db/ensureTemplatesSchema.js";
import { errorHandler } from "./middleware/errorHandler.js";
import caseRoutes from "./routes/caseRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "API is running" });
});

app.use("/clients", clientRoutes);
app.use("/cases", caseRoutes);
app.use("/templates", templateRoutes);
app.use("/documents", documentRoutes);
app.use(errorHandler);

void (async () => {
  try {
    await ensureTemplatesSchema();
  } catch (err) {
    console.error("[DB] ensureTemplatesSchema failed — template routes may error until DB is fixed:", err);
  }
  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
})();
