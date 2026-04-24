import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { hydrateMessageForEvent } from "../services/agent-runtime.js";

export function createMessagesRouter(messageGateway) {
  const router = Router();

  router.use(authenticate);

  router.post(
    "/",
    validateBody(["room_type", "room_id"]),
    async (req, res, next) => {
      try {
        const message = await messageGateway.processUserMessage({
          userId: req.user.id,
          roomType: req.body.room_type,
          roomId: req.body.room_id,
          content: req.body.content ?? null,
          mediaUrl: req.body.media_url ?? null,
          mediaType: req.body.media_type ?? null,
          transport: "http"
        });

        res.status(201).json(hydrateMessageForEvent(message));
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
