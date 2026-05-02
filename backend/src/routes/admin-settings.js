import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { prismaStore as appStore } from "../store/prisma-store.js";

export const adminSettingsRouter = Router();

adminSettingsRouter.use(authenticate, requireAdmin);

adminSettingsRouter.get("/", async (_req, res) => {
  res.json(await appStore.getSystemSettings());
});

adminSettingsRouter.put("/", async (req, res) => {
  res.json(await appStore.updateSystemSettings(req.body));
});
