export const Session = {
  accessCookieName: "travex_sb_access",
  refreshCookieName: "travex_sb_refresh",
  cookieName: "travex_sb_access",
  maxAgeMs: 365 * 24 * 60 * 60 * 1000,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
} as const;
