import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  adminCookieName,
  adminCookieOptions,
  createAdminSession,
  credentialsMatch,
  hasValidAdminOrigin,
  isAdminConfigured,
  requireAdmin,
} from "@/lib/session";

const loginSchema = z
  .object({
    email: z.string().trim().email().max(254),
    password: z.string().min(1).max(1024),
  })
  .strict();

export async function GET(request: NextRequest) {
  const email = await requireAdmin(request);
  return NextResponse.json({ authenticated: Boolean(email), email });
}

export async function POST(request: NextRequest) {
  if (!hasValidAdminOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Set ADMIN_EMAIL and ADMIN_PASSWORD in .env.local first." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success || !credentialsMatch(parsed.data.email, parsed.data.password)) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
  }

  const session = createAdminSession();
  const response = NextResponse.json({ authenticated: true, email: session.email });
  response.cookies.set(adminCookieName(), session.value, {
    ...adminCookieOptions,
    maxAge: session.maxAge,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  if (!hasValidAdminOrigin(request)) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(adminCookieName(), "", {
    ...adminCookieOptions,
    maxAge: 0,
  });
  return response;
}
