import { Errors } from "@contracts/errors";
import {
  createSupabaseForToken,
  getAuthCookies,
  profileToAppUser,
  setSupabaseSessionCookies,
  type AppUser,
} from "./supabase";

export async function authenticateRequest(
  headers: Headers,
  cookieWriter?: { req: Request; resHeaders: Headers },
): Promise<AppUser> {
  const { accessToken, refreshToken } = getAuthCookies(headers);
  if (!accessToken && !refreshToken) {
    throw Errors.forbidden("Invalid authentication token.");
  }

  let token = accessToken;
  if (!token && refreshToken) {
    const refreshClient = createSupabaseForToken();
    const { data, error } = await refreshClient.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session) {
      throw Errors.forbidden("Invalid authentication token.");
    }
    token = data.session.access_token;
    if (cookieWriter) {
      setSupabaseSessionCookies(cookieWriter, data.session);
    }
  }
  if (!token) {
    throw Errors.forbidden("Invalid authentication token.");
  }

  const supabase = createSupabaseForToken(token);
  const { data: userData, error: userError } = await supabase.auth.getUser(token);

  if ((userError || !userData.user) && refreshToken) {
    const refreshClient = createSupabaseForToken();
    const { data, error } = await refreshClient.auth.refreshSession({
      refresh_token: refreshToken,
    });
    if (error || !data.session) {
      throw Errors.forbidden("Invalid authentication token.");
    }
    if (cookieWriter) {
      setSupabaseSessionCookies(cookieWriter, data.session);
    }
    const refreshed = await createSupabaseForToken(data.session.access_token).auth.getUser(
      data.session.access_token,
    );
    if (refreshed.error || !refreshed.data.user) {
      throw Errors.forbidden("Invalid authentication token.");
    }
    return authenticateWithAccessToken(data.session.access_token, refreshed.data.user.id);
  }

  if (userError || !userData.user) {
    throw Errors.forbidden("Invalid authentication token.");
  }

  return authenticateWithAccessToken(token, userData.user.id);
}

async function authenticateWithAccessToken(accessToken: string, userId: string): Promise<AppUser> {
  const supabase = createSupabaseForToken(accessToken);
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw Errors.forbidden("Profile not found. Please sign in again.");
  }

  return profileToAppUser(profile);
}
