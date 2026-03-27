import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer | null {
  const keyHex = process.env.METAAPI_ENCRYPTION_KEY;
  if (!keyHex) return null;
  return Buffer.from(keyHex, "hex");
}

export function encrypt(text: string): string {
  const key = getKey();
  if (!key) throw new Error("METAAPI_ENCRYPTION_KEY is not configured. Set this env variable to encrypt credentials.");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decrypt(data: string): string {
  const key = getKey();
  if (!key || !data.includes(":")) return data; // no key or plaintext → return as-is
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
