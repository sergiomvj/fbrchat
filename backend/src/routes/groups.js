import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { memoryStore } from "../store/memory-store.js";
import { hydrateMessageForEvent } from "../services/agent-runtime.js";

function hydrateGroup(group) {
  return {
    ...group,
    members: memoryStore.listGroupMembers(group.id)
  };
}

export const groupsRouter = Router();

groupsRouter.use(authenticate);

groupsRouter.get("/", (req, res) => {
  res.json(memoryStore.listVisibleGroupsForUser(req.user.id).map(hydrateGroup));
});

groupsRouter.post(
  "/",
  requireAdmin,
  validateBody(["name", "description", "topic"]),
  (req, res) => {
    const group = memoryStore.createGroup(req.body, req.user.id);
    res.status(201).json(hydrateGroup(group));
  }
);

groupsRouter.get("/:id", (req, res) => {
  if (!memoryStore.userCanAccessGroup(req.user.id, req.params.id)) {
    return res.status(403).json({ error: "Group access denied" });
  }

  const group = memoryStore.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  return res.json(hydrateGroup(group));
});

groupsRouter.patch("/:id", requireAdmin, (req, res) => {
  const group = memoryStore.updateGroup(req.params.id, req.body);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  return res.json(hydrateGroup(group));
});

groupsRouter.delete("/:id", requireAdmin, (req, res) => {
  const group = memoryStore.archiveGroup(req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  return res.json({ success: true });
});

groupsRouter.post(
  "/:id/members",
  requireAdmin,
  validateBody(["member_type", "member_id"]),
  (req, res) => {
    if (!["user", "agent"].includes(req.body.member_type)) {
      return res.status(400).json({ error: "member_type invalido" });
    }

    const group = memoryStore.getGroupById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const member = memoryStore.addGroupMember(
      req.params.id,
      req.body.member_type,
      req.body.member_id
    );

    if (!member) {
      return res.status(409).json({ error: "Member already exists" });
    }

    return res.status(201).json(member);
  }
);

groupsRouter.delete("/:id/members/:memberType/:memberId", requireAdmin, (req, res) => {
  const removed = memoryStore.removeGroupMember(
    req.params.id,
    req.params.memberType,
    req.params.memberId
  );

  if (!removed) {
    return res.status(404).json({ error: "Member not found" });
  }

  return res.json({ success: true });
});

groupsRouter.get("/:id/messages", (req, res) => {
  if (!memoryStore.userCanAccessGroup(req.user.id, req.params.id)) {
    return res.status(403).json({ error: "Group access denied" });
  }

  const limit = Number(req.query.limit ?? 50);
  const before = req.query.before?.toString();

  return res.json(
    memoryStore.listMessages({
      conversationType: "group",
      conversationId: req.params.id,
      before,
      limit
    }).map(hydrateMessageForEvent)
  );
});
