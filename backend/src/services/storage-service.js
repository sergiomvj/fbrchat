import path from "node:path";

const allowedMimeTypes = new Set(["audio/webm", "audio/mpeg", "image/png", "image/jpeg"]);
const maxBytes = 10 * 1024 * 1024;

export function validateUploadDescriptor(descriptor) {
  if (!descriptor.filename || !descriptor.mime_type) {
    throw new Error("filename e mime_type sao obrigatorios");
  }

  if (!allowedMimeTypes.has(descriptor.mime_type)) {
    throw new Error("mime_type nao suportado");
  }

  if (typeof descriptor.size_bytes !== "number" || descriptor.size_bytes <= 0) {
    throw new Error("size_bytes invalido");
  }

  if (descriptor.size_bytes > maxBytes) {
    throw new Error("arquivo excede o limite local");
  }
}

export function createUploadRecord(descriptor) {
  validateUploadDescriptor(descriptor);

  return {
    upload_id: crypto.randomUUID(),
    storage_path: `/mock-uploads/${Date.now()}-${path.basename(descriptor.filename)}`,
    max_bytes: maxBytes
  };
}
