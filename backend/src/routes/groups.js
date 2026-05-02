import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { prismaStore as appStore } from "../store/prisma-store.js";
import { hydrateMessageForEvent } from "../services/agent-runtime.js";

async function hydrateGroup(group) {
  if (!group) return null;
  return {
    ...group,
    members: await appStore.listGroupMembers(group.id)
  };
}

export const groupsRouter = Router();

groupsRouter.use(authenticate);

groupsRouter.get("/", async (req, res) => {
  const groups = await appStore.listVisibleGroupsForUser(req.user.id);
  res.json(await Promise.all(groups.map(hydrateGroup)));
});

groupsRouter.post(
  "/",
  requireAdmin,
  validateBody(["name", "description", "topic"]),
  async (req, res) => {
    const group = await appStore.createGroup(req.body, req.user.id);
    res.status(201).json(await hydrateGroup(group));
  }
);

groupsRouter.get("/:id", async (req, res) => {
  if (!(await appStore.userCanAccessGroup(req.user.id, req.params.id))) {
    return res.status(403).json({ error: "Group access denied" });
  }

  const group = await appStore.getGroupById(req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  return res.json(await hydrateGroup(group));
});

groupsRouter.patch("/:id", requireAdmin, async (req, res) => {
  const group = await appStore.updateGroup(req.params.id, req.body);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  return res.json(await hydrateGroup(group));
});

groupsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const group = await appStore.archiveGroup(req.params.id);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  return res.json({ success: true });
});

groupsRouter.post(
  "/:id/members",
  requireAdmin,
  validateBody(["member_type", "member_id"]),
  async (req, res) => {
    if (!["user", "agent"].includes(req.body.member_type)) {
      return res.status(400).json({ error: "member_type invalido" });
    }

    const group = await appStore.getGroupById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    try {
      const member = await appStore.addGroupMember(
        req.params.id,
        req.body.member_type,
        req.body.member_id
      );
      return res.status(201).json(member);
    } catch (_error) {
      return res.status(409).json({ error: "Member already exists" });
    }
  }
);

groupsRouter.delete("/:id/members/:memberType/:memberId", requireAdmin, async (req, res) => {
  try {
    await appStore.removeGroupMember(
      req.params.id,
      req.params.memberType,
      req.params.memberId
    );
    return res.json({ success: true });
  } catch (_error) {
    return res.status(404).json({ error: "Member not found" });
  }
});

groupsRouter.get("/:id/messages", async (req, res) => {
  if (!(await appStore.userCanAccessGroup(req.user.id, req.params.id))) {
    return res.status(403).json({ error: "Group access denied" });
  }

  const limit = Number(req.query.limit ?? 50);
  const before = req.query.before?.toString();

  const messages = await appStore.listMessages({
    conversationType: "group",
    conversationId: req.params.id,
    before,
    limit
  });

  return res.json(
    await Promise.all(messages.map(hydrateMessageForEvent))
  );
});
