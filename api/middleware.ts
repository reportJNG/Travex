import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

function requireStatus(status: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.status !== status) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Account not approved",
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

// Base authenticated procedure
export const authedQuery = t.procedure.use(requireAuth);

// Role-specific procedures
export const agencyQuery = authedQuery.use(requireRole("agency")).use(requireStatus("approved"));
export const hotelQuery = authedQuery.use(requireRole("hotel")).use(requireStatus("approved"));
export const adminQuery = authedQuery.use(requireRole("super_admin")).use(requireStatus("approved"));

// Any approved user
export const approvedQuery = authedQuery.use(requireStatus("approved"));
