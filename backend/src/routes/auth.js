import { Router } from "express";
import crypto from "node:crypto";
import { authenticate, signAccessToken } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { prismaStore as appStore } from "../store/prisma-store.js";

const refreshSecret = process.env.JWT_REFRESH_SECRET || "replace-me-refresh";

function signRefreshToken(user) {
  return crypto
    .createHmac("sha256", refreshSecret)
    .update(`${user.id}:${Date.now()}:${Math.random()}`)
    .digest("hex");
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar_url: user.avatar_url,
    role: user.role,
    last_seen: user.last_seen
  };
}

export const authRouter = Router();

authRouter.post("/login", validateBody(["email", "password"]), async (req, res) => {
  if (typeof req.body.email !== "string" || !req.body.email.includes("@")) {
    return res.status(400).json({ error: "Email invalido" });
  }

  const user = await appStore.findUserByEmail(req.body.email);

  if (!user || user.password !== req.body.password) {
    return res.status(401).json({ error: "Credenciais invalidas" });
  }

  const last_seen = new Date().toISOString();
  await appStore.updateUser(user.id, { last_seen });
  user.last_seen = last_seen;

  const access_token = signAccessToken(user);
  const refresh_token = signRefreshToken(user);

  await appStore.createRefreshToken({
    user_id: user.id,
    token: refresh_token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  return res.json({
    access_token,
    refresh_token,
    user: publicUser(user)
  });
});

authRouter.post("/refresh", validateBody(["refresh_token"]), async (req, res) => {
  const tokenRecord = await appStore.findRefreshToken(req.body.refresh_token);

  if (!tokenRecord || new Date(tokenRecord.expires_at) < new Date()) {
    return res.status(401).json({ error: "Token invalido ou expirado" });
  }

  await appStore.deleteRefreshToken(tokenRecord.token);
  const user = await appStore.findUserById(tokenRecord.user_id);

  if (!user) {
    return res.status(401).json({ error: "Token invalido ou expirado" });
  }

  const access_token = signAccessToken(user);
  const refresh_token = signRefreshToken(user);

  await appStore.createRefreshToken({
    user_id: user.id,
    token: refresh_token,
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  });

  return res.json({ access_token, refresh_token });
});

authRouter.post(
  "/logout",
  authenticate,
  validateBody(["refresh_token"]),
  async (req, res) => {
    try {
      await appStore.deleteRefreshToken(req.body.refresh_token);
    } catch (_e) {
      // Ignore if already deleted
    }
    return res.json({ success: true });
  }
);

authRouter.get("/me", authenticate, (req, res) => res.json(publicUser(req.user)));
