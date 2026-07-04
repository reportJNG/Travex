import * as cookie from "cookie";
import * as jose from "jose";
import { eq } from "drizzle-orm";
import { Session } from "@contracts/constants";
import { Errors } from "@contracts/errors";
import { users } from "@db/schema";
import { env } from "./env";
import { getDb } from "../queries/connection";

const JWT_ALG = "HS256";

type SessionPayload = {
  userId: number;
};

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const secret = new TextEncoder().encode(env.sessionSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime("1 year")
    .sign(secret);
}

async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = new TextEncoder().encode(env.sessionSecret);
    const { payload } = await jose.jwtVerify(token, secret, {
      algorithms: [JWT_ALG],
    });
    const userId = Number(payload.userId);
    return Number.isInteger(userId) ? { userId } : null;
  } catch {
    return null;
  }
}

export async function authenticateRequest(headers: Headers) {
  const cookies = cookie.parse(headers.get("cookie") || "");
  const token = cookies[Session.cookieName];
  if (!token) {
    throw Errors.forbidden("Invalid authentication token.");
  }

  const claim = await verifySessionToken(token);
  if (!claim) {
    throw Errors.forbidden("Invalid authentication token.");
  }

  const user = await getDb().query.users.findFirst({
    where: eq(users.id, claim.userId),
  });
  if (!user) {
    throw Errors.forbidden("User not found. Please sign in again.");
  }
  return user;
}
