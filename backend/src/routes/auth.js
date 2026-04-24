import { Router } from "express";
import crypto from "node:crypto";
import { authenticate, signAccessToken } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { memoryStore } from "../store/memory-store.js";

const refreshSecret = process.env.JWT_REFRESH_SECRET || "replace-me-refresh";

function signRefreshToken(user) {
  return crypto
    .createHmac("sha256", refreshSecret)
    .update(`${user.id}:${Date.now()}:${Math.random()}`)
    .digest("hex");
}

function publicUser(user) {
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

authRouter.post("/login", validateBody(["email", "password"]), (req, res) => {
  if (typeof req.body.email !== "string" || !req.body.email.includes("@")) {
    return res.status(400).json({ error: "Email invalido" });
  }

  const user = memoryStore.findUserByEmail(req.body.email);

  if (!user || user.password !== req.body.password) {
    return res.status(401).json({ error: "Credenciais invalidas" });
  }

  user.last_seen = new Date().toISOString();

  const access_token = signAccessToken(user);
  const refresh_token = signRefreshToken(user);

  memoryStore.refreshTokens.push({
    id: crypto.randomUUID(),
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

authRouter.post("/refresh", validateBody(["refresh_token"]), (req, res) => {
  const tokenRecordIndex = memoryStore.refreshTokens.findIndex(
    (entry) => entry.token === req.body.refresh_token
  );

  if (tokenRecordIndex === -1) {
    return res.status(401).json({ error: "Token invalido ou expirado" });
  }

  const [tokenRecord] = memoryStore.refreshTokens.splice(tokenRecordIndex, 1);
  const user = memoryStore.findUserById(tokenRecord.user_id);

  if (!user) {
    return res.status(401).json({ error: "Token invalido ou expirado" });
  }

  const access_token = signAccessToken(user);
  const refresh_token = signRefreshToken(user);

  memoryStore.refreshTokens.push({
    id: crypto.randomUUID(),
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
  (req, res) => {
    const nextTokens = memoryStore.refreshTokens.filter(
      (entry) => entry.token !== req.body.refresh_token
    );

    memoryStore.refreshTokens.length = 0;
    memoryStore.refreshTokens.push(...nextTokens);

    return res.json({ success: true });
  }
);

authRouter.get("/me", authenticate, (req, res) => res.json(publicUser(req.user)));
