import crypto from "crypto"

export function generateFingerprint(title: string, price: number, city: string, surface?: number): string {
  const normalized = [
    title.toLowerCase().replace(/[^a-z0-9]/g, ""),
    price.toString(),
    city.toLowerCase().replace(/[^a-z]/g, ""),
    surface ? Math.floor(surface).toString() : "",
  ].join("|")

  return crypto.createHash("md5").update(normalized).digest("hex")
}
