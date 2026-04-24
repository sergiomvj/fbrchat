import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { memoryStore } from "../store/memory-store.js";

export const adminSettingsRouter = Router();

adminSettingsRouter.use(authenticate, requireAdmin);

adminSettingsRouter.get("/", (_req, res) => {
  res.json(memoryStore.getSystemSettings());
});

adminSettingsRouter.put("/", (req, res) => {
  res.json(memoryStore.updateSystemSettings(req.body));
});
