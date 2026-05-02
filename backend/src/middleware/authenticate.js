import jwt from "jsonwebtoken";
import { prismaStore as appStore } from "../store/prisma-store.js";

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

export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await appStore.findUserById(payload.sub);

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
