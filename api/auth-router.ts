import { z } from "zod";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery, authedQuery, approvedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, profiles, businessDocuments } from "@db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword } from "./lib/password";
import { signSessionToken } from "./lib/session";

function setSessionCookie(ctx: { req: Request; resHeaders: Headers }, token: string) {
  const opts = getSessionCookieOptions(ctx.req.headers);
  ctx.resHeaders.append(
    "set-cookie",
    cookie.serialize(Session.cookieName, token, {
      httpOnly: opts.httpOnly,
      path: opts.path,
      sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
      secure: opts.secure,
      maxAge: Session.maxAgeMs / 1000,
    }),
  );
}

export const authRouter = createRouter({
  me: authedQuery.query(async (opts) => {
    const db = getDb();
    const userWithProfile = await db.query.users.findFirst({
      where: eq(users.id, opts.ctx.user.id),
      with: { profile: true },
    });
    return userWithProfile ?? opts.ctx.user;
  }),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const user = await db.query.users.findFirst({
        where: eq(users.email, input.email.toLowerCase()),
      });

      if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "INVALID_CREDENTIALS",
        });
      }

      await db
        .update(users)
        .set({ lastSignInAt: new Date(), updatedAt: new Date() })
        .where(eq(users.id, user.id));

      const token = await signSessionToken({ userId: user.id });
      setSessionCookie(ctx, token);
      return { success: true };
    }),

  register: publicQuery
    .input(
      z.object({
        role: z.enum(["agency", "hotel"]),
        fullName: z.string().min(3),
        legalName: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        phone: z.string().regex(/^\+213[567]\d{8}$/),
        wilaya: z.number().int().min(1).max(58),
        taxId: z.string().optional(),
        licenseNumber: z.string().optional(),
        locale: z.enum(["fr", "ar", "en"]).default("fr"),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const normalizedEmail = input.email.toLowerCase();

      const existing = await db.query.users.findFirst({
        where: eq(users.email, normalizedEmail),
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "EMAIL_EXISTS" });
      }

      if (input.role === "hotel" && !input.taxId && !input.licenseNumber) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "TAX_OR_LICENSE_REQUIRED" });
      }

      const passwordHash = await hashPassword(input.password);
      const [createdUser] = await db.insert(users).values({
        name: input.fullName,
        email: normalizedEmail,
        passwordHash,
        role: input.role,
        status: "awaiting_review",
      }).returning({ id: users.id });

      if (!createdUser) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "CREATE_USER_FAILED" });
      }

      await db.insert(profiles).values({
        id: createdUser.id,
        fullName: input.fullName,
        legalName: input.legalName,
        phone: input.phone,
        wilayaCode: input.wilaya,
        taxId: input.taxId || null,
        licenseNumber: input.licenseNumber || null,
        preferredLocale: input.locale,
      });

      return { success: true, userId: createdUser.id };
    }),

  updateProfile: approvedQuery
    .input(
      z.object({
        fullName: z.string().min(3).optional(),
        phone: z.string().optional(),
        preferredLocale: z.enum(["fr", "ar", "en"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db
        .update(profiles)
        .set({
          ...(input.fullName && { fullName: input.fullName }),
          ...(input.phone && { phone: input.phone }),
          ...(input.preferredLocale && { preferredLocale: input.preferredLocale }),
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, ctx.user.id));
      return { success: true };
    }),

  uploadDocuments: approvedQuery
    .input(
      z.array(
        z.object({
          type: z.enum(["commercial_registry", "tax_card", "tourism_license", "other"]),
          storagePath: z.string(),
          originalName: z.string(),
        })
      )
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const hasRegistry = input.some((d) => d.type === "commercial_registry");
      if (!hasRegistry) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "COMMERCIAL_REGISTRY_REQUIRED" });
      }

      await db.insert(businessDocuments).values(
        input.map((doc) => ({
          profileId: ctx.user.id,
          type: doc.type,
          storagePath: doc.storagePath,
          originalName: doc.originalName,
        }))
      );

      return { success: true };
    }),
});
