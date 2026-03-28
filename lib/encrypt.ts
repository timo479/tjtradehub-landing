import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const keyHex = process.env.METAAPI_ENCRYPTION_KEY;
  if (keyHex) return Buffer.from(keyHex, "hex");
  // Fallback: derive a stable 32-byte key from NEXTAUTH_SECRET
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return crypto.createHash("sha256").update(secret).digest();
  throw new Error("Neither METAAPI_ENCRYPTION_KEY nor NEXTAUTH_SECRET is configured.");
}

export function encrypt(text: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(data: string): string {
  if (!data.includes(":")) return data; // plaintext (legacy) → return as-is
  const key = getKey();
  try {
    const [ivHex, tagHex, encryptedHex] = data.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted).toString("utf8") + decipher.final("utf8");
  } catch {
    return data; // decryption failed → return raw (handles old plaintext values)
  }
}
