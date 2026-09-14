/** Validate only boot-critical environment variables. Optional integrations are
 * intentionally allowed to remain unset and validate themselves when enabled. */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const required = ['DATABASE_URL', 'JWT_SECRET'] as const;
  const missing = required.filter(
    (key) => typeof config[key] !== 'string' || !config[key].trim(),
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }
  return config;
}
