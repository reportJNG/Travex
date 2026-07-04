import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { authenticateRequest } from "./lib/session";
import {
  createSupabaseForToken,
  getAuthCookies,
  type AppUser,
  type SupabaseClientForUser,
} from "./lib/supabase";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: AppUser;
  supabase: SupabaseClientForUser;
  accessToken?: string;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const { accessToken } = getAuthCookies(opts.req.headers);
  const ctx: TrpcContext = {
    req: opts.req,
    resHeaders: opts.resHeaders,
    supabase: createSupabaseForToken(accessToken),
    accessToken,
  };
  try {
    ctx.user = await authenticateRequest(opts.req.headers, ctx);
  } catch {
    // Authentication is optional here
  }
  return ctx;
}
