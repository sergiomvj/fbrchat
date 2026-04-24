import jwt from "jsonwebtoken";
import { memoryStore } from "../store/memory-store.js";

const accessSecret = process.env.JWT_ACCESS_SECRET || "replace-me-access";

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email
    },
    accessSecret,
    { expiresIn: process.env.JWT_ACCESS_TTL || "24h" }
  );
}

export function authenticate(req, res, next) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }

  try {
    const payload = jwt.verify(token, accessSecret);
    const user = memoryStore.findUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  return next();
}
