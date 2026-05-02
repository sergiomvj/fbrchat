import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { prismaStore as appStore } from "../store/prisma-store.js";

export const bootstrapRouter = Router();

bootstrapRouter.use(authenticate);

bootstrapRouter.get("/", async (req, res) => {
  res.json({
    me: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    ...(await appStore.getConversationSnapshotForUser(req.user.id))
  });
});
