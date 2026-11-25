import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

// Credentials live only in sealed, httpOnly cookies: AES-256-GCM with a key from FX_GUI_COOKIE_SECRET. No database.

const CHUNK = 3800;
const MAX_CHUNKS = 4;

function key() {
  const secret = process.env.FX_GUI_COOKIE_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("FX_GUI_COOKIE_SECRET must be set to at least 32 characters");
  return createHash("sha256").update(secret).digest();
}

export function seal(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function unseal<T>(sealed: string | undefined): T | null {
  if (!sealed) return null;
  try {
    const raw = Buffer.from(sealed, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key(), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8"),
    ) as T;
  } catch {
    return null;
  }
}

const options = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge,
});

/** Writes a sealed value across as many cookies as it needs, since a cookie holds about 4 KB. */
export async function writeSealed(name: string, value: unknown, maxAge: number) {
  const jar = await cookies();
  const sealed = seal(value);
  const parts = Math.ceil(sealed.length / CHUNK);
  if (parts > MAX_CHUNKS) throw new Error("Credentials are too large to keep in cookies");
  for (let i = 0; i < MAX_CHUNKS; i++) {
    if (i < parts) jar.set(`${name}.${i}`, sealed.slice(i * CHUNK, (i + 1) * CHUNK), options(maxAge));
    else if (jar.has(`${name}.${i}`)) jar.delete(`${name}.${i}`);
  }
}

export async function readSealed<T>(name: string): Promise<T | null> {
  const jar = await cookies();
  let sealed = "";
  for (let i = 0; i < MAX_CHUNKS; i++) {
    const part = jar.get(`${name}.${i}`)?.value;
    if (!part) break;
    sealed += part;
  }
  return unseal<T>(sealed);
}

export async function clearSealed(name: string) {
  const jar = await cookies();
  for (let i = 0; i < MAX_CHUNKS; i++) jar.delete(`${name}.${i}`);
}
