export function resolveSecret(apiKeyRef) {
  if (!apiKeyRef) {
    return null;
  }

  const resolved = process.env[apiKeyRef];

  return resolved || `mock-secret-for-${apiKeyRef}`;
}
