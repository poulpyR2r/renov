import crypto from "crypto";

/**
 * Generate a secure random temporary password
 * Format: 12 characters with mixed case, numbers and special chars
 */
export function generateTemporaryPassword(): string {
  // Generate 8 random bytes and convert to base64, then take first 10 chars
  const randomBytes = crypto.randomBytes(8);
  const base64 = randomBytes.toString("base64").replace(/[+/=]/g, "");

  // Ensure we have at least one lowercase, one uppercase, one number, and one special char
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%&*";

  // Take first 9 chars from base64 and add required chars
  const passwordBase = base64.slice(0, 9);
  const requiredChars =
    lowercase[Math.floor(Math.random() * lowercase.length)] +
    uppercase[Math.floor(Math.random() * uppercase.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    special[Math.floor(Math.random() * special.length)];

  // Shuffle the characters
  const passwordArray = (passwordBase + requiredChars).split("");
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join("").slice(0, 12);
}
