import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { memoryStore } from "../store/memory-store.js";

function publicUser(user) {
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

adminUsersRouter.get("/", (_req, res) => {
  res.json(memoryStore.listUsers().map(publicUser));
});

adminUsersRouter.post(
  "/",
  validateBody(["name", "email", "password", "role"]),
  (req, res) => {
    if (!["admin", "user"].includes(req.body.role)) {
      return res.status(400).json({ error: "Role invalida" });
    }

    if (typeof req.body.email !== "string" || !req.body.email.includes("@")) {
      return res.status(400).json({ error: "Email invalido" });
    }

    const existing = memoryStore.findUserByEmail(req.body.email);

    if (existing) {
      return res.status(409).json({ error: "Email ja cadastrado" });
    }

    const user = memoryStore.createUser(req.body);
    return res.status(201).json(publicUser(user));
  }
);

adminUsersRouter.patch("/:id", (req, res) => {
  if (req.body.role && !["admin", "user"].includes(req.body.role)) {
    return res.status(400).json({ error: "Role invalida" });
  }

  const user = memoryStore.updateUser(req.params.id, req.body);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json(publicUser(user));
});

adminUsersRouter.delete("/:id", (req, res) => {
  const user = memoryStore.deactivateUser(req.params.id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  return res.json({ success: true, user: publicUser(user) });
});
