const RND_LOCKED_EMAILS = new Set([
  "amira@nexerp.id",
  "amira@dreamlab.com",
  "amira@nexerp.com",
  "yaya@nexerp.id",
  "yaya@dreamlab.com",
  "yaya@nexerp.com",
  "panca@nexerp.id",
  "panca@dreamlab.com",
  "panca@nexerp.com",
]);

export function isRndLockedAccount(email?: string | null): boolean {
  if (!email) return false;
  return RND_LOCKED_EMAILS.has(email.toLowerCase());
}

export function isRndHeadAccount(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return normalized === "amira@nexerp.id" ||
    normalized === "amira@dreamlab.com" ||
    normalized === "amira@nexerp.com";
}
