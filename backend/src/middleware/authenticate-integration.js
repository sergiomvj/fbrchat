const arvaSharedToken = process.env.ARVA_SHARED_TOKEN || "replace-me-arva";

export function authenticateArva(req, res, next) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ error: "Missing integration token" });
  }

  if (token !== arvaSharedToken) {
    return res.status(403).json({ error: "Invalid integration token" });
  }

  return next();
}
