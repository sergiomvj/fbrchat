import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate-body.js";
import { createUploadRecord } from "../services/storage-service.js";

export const uploadsRouter = Router();

uploadsRouter.use(authenticate);

uploadsRouter.post(
  "/",
  validateBody(["filename", "mime_type", "size_bytes"]),
  (req, res) => {
    try {
      const upload = createUploadRecord(req.body);
      res.status(201).json(upload);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Upload invalido"
      });
    }
  }
);
