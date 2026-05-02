import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { prismaStore as appStore } from "../store/prisma-store.js";

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    last_seen: user.last_seen
  };
}

export const adminUsersRouter = Router();

adminUsersRouter.use(authenticate, requireAdmin);

adminUsersRouter.get("/", async (_req, res) => {
  const users = await appStore.listUsers();
  res.json(users.map(publicUser));
});

adminUsersRouter.post(
  "/",
  validateBody(["name", "email", "password", "role"]),
  async (req, res) => {
    if (!["admin", "user"].includes(req.body.role)) {
      return res.status(400).json({ error: "Role invalida" });
    }

    if (typeof req.body.email !== "string" || !req.body.email.includes("@")) {
      return res.status(400).json({ error: "Email invalido" });
    }

    const existing = await appStore.findUserByEmail(req.body.email);

    if (existing) {
      return res.status(409).json({ error: "Email ja cadastrado" });
    }

    try {
      const user = await appStore.createUser(req.body);
      return res.status(201).json(publicUser(user));
    } catch (error) {
      console.error("[admin-users] create error", error);
      return res.status(500).json({ error: "Erro ao criar usuario" });
    }
  }
);

adminUsersRouter.patch("/:id", async (req, res) => {
  if (req.body.role && !["admin", "user"].includes(req.body.role)) {
    return res.status(400).json({ error: "Role invalida" });
  }

  try {
    const user = await appStore.updateUser(req.params.id, req.body);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(publicUser(user));
  } catch (error) {
    return res.status(404).json({ error: "User not found or update failed" });
  }
});

adminUsersRouter.delete("/:id", async (req, res) => {
  try {
    const user = await appStore.deactivateUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    return res.status(404).json({ error: "User not found" });
  }
});
