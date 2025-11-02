import crypto from "crypto";

/**
 * NoteEncryptionService
 *
 * Encrypts and decrypts note content for secure storage.
 * Uses AES-256-GCM for authenticated encryption, matching TokenEncryptionService pattern.
 */

const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

if (!ENCRYPTION_KEY) {
  throw new Error(
    "TOKEN_ENCRYPTION_KEY environment variable is not set. Please set a 32-byte base64 encoded key."
  );
}

let encryptionKeyBuffer: Buffer;

try {
  encryptionKeyBuffer = Buffer.from(ENCRYPTION_KEY, "base64");
  if (encryptionKeyBuffer.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes when decoded from base64");
  }
} catch (error) {
  throw new Error(
    `Invalid TOKEN_ENCRYPTION_KEY: ${error instanceof Error ? error.message : "Invalid base64"}`
  );
}

/**
 * Encrypts note content for secure storage
 * Returns a concatenated string of: iv:authTag:encryptedData (all base64 encoded)
 */
export function encryptNoteContent(content: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKeyBuffer, iv);

    let encrypted = cipher.update(content, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Combine IV, authTag, and encrypted data, then encode as base64
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]);
    return combined.toString("base64");
  } catch (error) {
    throw new Error(
      `Note content encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Decrypts note content that was encrypted with encryptNoteContent()
 */
export function decryptNoteContent(encryptedContent: string): string {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedContent, "base64");

    // Extract IV, authTag, and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const authTag = combined.slice(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKeyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new Error(
      `Note content decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}
