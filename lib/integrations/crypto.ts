import crypto from "crypto";

const algorithm = "aes-256-gcm";

export function encryptSecret(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${encrypted.toString("base64")}`;
}

export function decryptSecret(value?: string | null) {
  if (!value) return undefined;
  const [ivRaw, tagRaw, encryptedRaw] = value.split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) return undefined;
  const decipher = crypto.createDecipheriv(algorithm, encryptionKey(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedRaw, "base64")), decipher.final()]).toString("utf8");
}

export function maskSecret(value?: string | null) {
  if (!value) return "";
  const visible = value.slice(-4);
  return `${"*".repeat(8)}${visible}`;
}

function encryptionKey() {
  const source = process.env.INTEGRATION_SECRET_KEY || process.env.NEXTAUTH_SECRET || process.env.DATABASE_URL || "serenza-local-integration-key";
  return crypto.createHash("sha256").update(source).digest();
}
