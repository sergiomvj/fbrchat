import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { prismaStore as appStore } from "../store/prisma-store.js";
import { hydrateMessageForEvent } from "../services/agent-runtime.js";

export const pvtRouter = Router();

pvtRouter.use(authenticate);

pvtRouter.get("/", async (req, res) => {
  const pvts = await appStore.listPvtsForUser(req.user.id);
  // Sort handled by DB usually, but for safety:
  const sorted = pvts.sort((left, right) =>
    (right.last_message_at || "").localeCompare(left.last_message_at || "")
  );

  res.json(sorted);
});

pvtRouter.post(
  "/",
  validateBody(["participant_type", "participant_id"]),
  async (req, res) => {
    if (!["user", "agent"].includes(req.body.participant_type)) {
      return res.status(400).json({ error: "participant_type invalido" });
    }

    const result = await appStore.createOrGetPvt(
      req.user.id,
      req.body.participant_type,
      req.body.participant_id
    );

    return res.status(result.isNew ? 201 : 200).json({
      pvt_id: result.pvt.id,
      is_new: result.isNew
    });
  }
);

pvtRouter.get("/:id", async (req, res) => {
  if (!(await appStore.userCanAccessPvt(req.user.id, req.params.id))) {
    return res.status(403).json({ error: "PVT access denied" });
  }

  const pvt = await appStore.getPvtById(req.params.id);
  if (!pvt) {
    return res.status(404).json({ error: "PVT not found" });
  }

  return res.json(pvt);
});

pvtRouter.get("/:id/messages", async (req, res) => {
  if (!(await appStore.userCanAccessPvt(req.user.id, req.params.id))) {
    return res.status(403).json({ error: "PVT access denied" });
  }

  const limit = Number(req.query.limit ?? 50);
  const before = req.query.before?.toString();

  const messages = await appStore.listMessages({
    conversationType: "pvt",
    conversationId: req.params.id,
    before,
    limit
  });

  return res.json(
    await Promise.all(messages.map(hydrateMessageForEvent))
  );
});
