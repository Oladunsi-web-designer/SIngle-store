import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const cookieName = "dunfeto-admin";
const sessionDurationSeconds = 60 * 60 * 8;

function getAdminCredentials() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

function signSession(expiresAt: number, email: string, password: string) {
  return createHmac("sha256", password)
    .update(`dunfeto-admin:${email}:${expiresAt}`)
    .digest("base64url");
}

function constantTimeEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

export function isAdminConfigured() {
  return getAdminCredentials() !== null;
}

export function createAdminSession() {
  const credentials = getAdminCredentials();
  if (!credentials) throw new Error("Admin credentials are not configured.");

  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const value = `${expiresAt}.${signSession(expiresAt, credentials.email, credentials.password)}`;
  return {
    name: cookieName,
    value,
    email: credentials.email,
    maxAge: sessionDurationSeconds,
  };
}

export async function requireAdmin(request: NextRequest) {
  const credentials = getAdminCredentials();
  const token = request.cookies.get(cookieName)?.value;
  if (!credentials || !token) return null;

  const [expiresAtRaw, signature, ...extra] = token.split(".");
  if (!expiresAtRaw || !signature || extra.length) return null;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  const expected = signSession(expiresAt, credentials.email, credentials.password);
  return constantTimeEqual(signature, expected) ? credentials.email : null;
}

export function hasValidAdminOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return origin === request.nextUrl.origin;
}

export function adminCookieName() {
  return cookieName;
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function credentialsMatch(email: string, password: string) {
  const credentials = getAdminCredentials();
  if (!credentials) return false;
  return (
    constantTimeEqual(email.trim().toLowerCase(), credentials.email) &&
    constantTimeEqual(password, credentials.password)
  );
}
