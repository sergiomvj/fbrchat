import express from "express";
import { authRouter } from "./routes/auth.js";
import { adminCompaniesRouter } from "./routes/admin-companies.js";
import { adminUsersRouter } from "./routes/admin-users.js";
import { adminAgentsRouter } from "./routes/admin-agents.js";
import { groupsRouter } from "./routes/groups.js";
import { pvtRouter } from "./routes/pvt.js";
import { bootstrapRouter } from "./routes/bootstrap.js";
import { adminSettingsRouter } from "./routes/admin-settings.js";
import { adminLogsRouter } from "./routes/admin-logs.js";
import { createMessagesRouter } from "./routes/messages.js";
import { uploadsRouter } from "./routes/uploads.js";
import { integrationsArvaRouter } from "./routes/integrations-arva.js";
import { requestContext } from "./middleware/request-context.js";
import { requestLogger } from "./middleware/request-logger.js";
import { securityHeaders } from "./middleware/security-headers.js";

export function createApp(messageGateway = null) {
  const app = express();

  app.use(requestContext);
  app.use(requestLogger);
  app.use(securityHeaders);
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      service: "fbr-chat-backend",
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/bootstrap", bootstrapRouter);
  app.use("/api/admin/companies", adminCompaniesRouter);
  app.use("/api/admin/users", adminUsersRouter);
  app.use("/api/admin/agents", adminAgentsRouter);
  app.use("/api/admin/settings", adminSettingsRouter);
  app.use("/api/admin/logs", adminLogsRouter);
  app.use("/api/groups", groupsRouter);
  app.use("/api/pvt", pvtRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/api/integrations/arva", integrationsArvaRouter);
  if (messageGateway) {
    app.use("/api/messages", createMessagesRouter(messageGateway));
  }

  app.use((error, _req, res, _next) => {
    console.error("[backend] unhandled error", error);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
