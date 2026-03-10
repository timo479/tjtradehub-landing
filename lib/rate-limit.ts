const store = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  ip: string,
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const mapKey = `${key}:${ip}`;
  const entry = store.get(mapKey);

  if (!entry || now > entry.resetAt) {
    store.set(mapKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= max) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}
