import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { memoryStore } from "../store/memory-store.js";

export const bootstrapRouter = Router();

bootstrapRouter.use(authenticate);

bootstrapRouter.get("/", (req, res) => {
  res.json({
    me: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    },
    ...memoryStore.getConversationSnapshotForUser(req.user.id)
  });
});
