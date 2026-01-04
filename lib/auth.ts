import { verify } from "jsonwebtoken";
import type { EditTokenPayload } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET_KEY || "your-secret-key-change-in-production";

/**
 * Verify and decode JWT edit token
 * @returns Decoded token payload or null if invalid
 */
export function verifyEditToken(token: string): EditTokenPayload | null {
  try {
    const decoded = verify(token, JWT_SECRET) as EditTokenPayload;
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

