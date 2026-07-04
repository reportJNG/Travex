import { z } from "zod";
import * as cookie from "cookie";
import { Session } from "@contracts/constants";
import { getSessionCookieOptions } from "./lib/cookies";
import { createRouter, publicQuery, authedQuery, approvedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, profiles, businessDocuments } from "@db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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

      const existing = await db.query.users.findFirst({
        where: eq(users.email, input.email),
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "EMAIL_EXISTS" });
      }

      if (input.role === "hotel" && !input.taxId && !input.licenseNumber) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "TAX_OR_LICENSE_REQUIRED" });
      }

      const result = await db.insert(users).values({
        unionId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        name: input.fullName,
        email: input.email,
        role: input.role,
        status: "awaiting_review",
      });

      const userId = Number(result[0].insertId);

      await db.insert(profiles).values({
        id: userId,
        fullName: input.fullName,
        legalName: input.legalName,
        phone: input.phone,
        wilayaCode: input.wilaya,
        taxId: input.taxId || null,
        licenseNumber: input.licenseNumber || null,
        preferredLocale: input.locale,
      });

      return { success: true, userId };
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
