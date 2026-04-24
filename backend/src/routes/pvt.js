import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { memoryStore } from "../store/memory-store.js";
import { hydrateMessageForEvent } from "../services/agent-runtime.js";

export const pvtRouter = Router();

pvtRouter.use(authenticate);

pvtRouter.get("/", (req, res) => {
  const pvts = memoryStore
    .listPvtsForUser(req.user.id)
    .sort((left, right) =>
      (right.last_message_at || "").localeCompare(left.last_message_at || "")
    );

  res.json(pvts);
});

pvtRouter.post(
  "/",
  validateBody(["participant_type", "participant_id"]),
  (req, res) => {
    if (!["user", "agent"].includes(req.body.participant_type)) {
      return res.status(400).json({ error: "participant_type invalido" });
    }

    const result = memoryStore.createOrGetPvt(
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

pvtRouter.get("/:id", (req, res) => {
  if (!memoryStore.userCanAccessPvt(req.user.id, req.params.id)) {
    return res.status(403).json({ error: "PVT access denied" });
  }

  const pvt = memoryStore.getPvtById(req.params.id);
  if (!pvt) {
    return res.status(404).json({ error: "PVT not found" });
  }

  return res.json(pvt);
});

pvtRouter.get("/:id/messages", (req, res) => {
  if (!memoryStore.userCanAccessPvt(req.user.id, req.params.id)) {
    return res.status(403).json({ error: "PVT access denied" });
  }

  const limit = Number(req.query.limit ?? 50);
  const before = req.query.before?.toString();

  return res.json(
    memoryStore.listMessages({
      conversationType: "pvt",
      conversationId: req.params.id,
      before,
      limit
    }).map(hydrateMessageForEvent)
  );
});
