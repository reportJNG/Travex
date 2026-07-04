import { createClient, type Session as SupabaseSession } from "@supabase/supabase-js";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { env } from "./env";
import { getSessionCookieOptions } from "./cookies";

export type UserRole = "agency" | "hotel" | "super_admin";
export type AccountStatus = "awaiting_review" | "approved" | "rejected" | "suspended";

export type ProfileRow = {
  id: string;
  role: UserRole;
  status: AccountStatus;
  full_name: string;
  legal_name: string;
  email: string;
  phone: string;
  wilaya_code: number | null;
  tax_id: string | null;
  license_number: string | null;
  preferred_locale: "ar" | "fr" | "en";
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  profile: ProfileRow;
};

export type SupabaseClientForUser = ReturnType<typeof createSupabaseForToken>;

export function createSupabaseForToken(accessToken?: string) {
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
  });
}

export function createSupabaseAdmin() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getAuthCookies(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  return {
    accessToken: cookies[Session.accessCookieName],
    refreshToken: cookies[Session.refreshCookieName],
  };
}

export function setSupabaseSessionCookies(
  ctx: { req: Request; resHeaders: Headers },
  session: SupabaseSession,
) {
  const opts = getSessionCookieOptions(ctx.req.headers);
  const sameSite = opts.sameSite?.toLowerCase() as "lax" | "none";
  const accessMaxAge = Math.max(1, session.expires_in ?? 3600);
  const refreshMaxAge = Session.maxAgeMs / 1000;

  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.accessCookieName, session.access_token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite,
      secure: opts.secure,
      maxAge: accessMaxAge,
    }),
  );
  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.refreshCookieName, session.refresh_token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite,
      secure: opts.secure,
      maxAge: refreshMaxAge,
    }),
  );
}

export function clearSupabaseSessionCookies(ctx: { req: Request; resHeaders: Headers }) {
  const opts = getSessionCookieOptions(ctx.req.headers);
  const sameSite = opts.sameSite?.toLowerCase() as "lax" | "none";

  for (const name of [Session.accessCookieName, Session.refreshCookieName]) {
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(name, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite,
        secure: opts.secure,
        maxAge: 0,
      }),
    );
  }
}

export function profileToAppUser(profile: ProfileRow): AppUser {
  return {
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    role: profile.role,
    status: profile.status,
    profile,
  };
}
