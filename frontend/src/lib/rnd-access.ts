const RND_LOCKED_EMAILS = new Set([
  "amira@nexerp.id",
  "yaya@nexerp.id",
  "panca@nexerp.id",
]);

export function isRndLockedAccount(email?: string | null): boolean {
  if (!email) return false;
  return RND_LOCKED_EMAILS.has(email.toLowerCase());
}
