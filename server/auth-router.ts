import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery, authedQuery, approvedQuery } from "./middleware";
import {
  clearSupabaseSessionCookies,
  createSupabaseAdmin,
  createSupabaseForToken,
  profileToAppUser,
  setSupabaseSessionCookies,
} from "./lib/supabase";

const supportedCountry = z.enum(["DZ", "TN"]);

function normalizeAlgerianPhone(value: string) {
  const compact = value.replace(/[\s().-]/g, "");
  if (/^\+213[567]\d{8}$/.test(compact)) return compact;
  if (/^213[567]\d{8}$/.test(compact)) return `+${compact}`;
  if (/^0[567]\d{8}$/.test(compact)) return `+213${compact.slice(1)}`;
  return null;
}

function normalizeTunisianPhone(value: string) {
  const compact = value.replace(/[\s().-]/g, "");
  if (/^\+216[24579]\d{7}$/.test(compact)) return compact;
  if (/^216[24579]\d{7}$/.test(compact)) return `+${compact}`;
  if (/^[24579]\d{7}$/.test(compact)) return `+216${compact}`;
  return null;
}

function normalizePhone(country: z.infer<typeof supportedCountry>, value: string) {
  return country === "TN" ? normalizeTunisianPhone(value) : normalizeAlgerianPhone(value);
}

export const authRouter = createRouter({
  me: authedQuery.query(({ ctx }) => ctx.user),

  logout: authedQuery.mutation(async ({ ctx }) => {
    const { accessToken } = ctx;
    if (accessToken) {
      await createSupabaseForToken(accessToken).auth.signOut();
    }
    clearSupabaseSessionCookies(ctx);
    return { success: true };
  }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().trim().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createSupabaseForToken();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: input.email.toLowerCase(),
        password: input.password,
      });

      if (error || !data.session) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "INVALID_CREDENTIALS",
        });
      }

      setSupabaseSessionCookies(ctx, data.session);
      return { success: true };
    }),

  register: publicQuery
    .input(
      z.object({
        role: z.enum(["agency", "hotel"]),
        fullName: z.string().trim().min(3),
        legalName: z.string().trim().min(2),
        email: z.string().trim().email(),
        password: z.string().min(8),
        phone: z.string().trim().min(8),
        country: supportedCountry.default("DZ"),
        wilaya: z.number().int().positive(),
        taxId: z.string().trim().optional(),
        licenseNumber: z.string().trim().optional(),
        locale: z.enum(["fr", "ar", "en"]).default("fr"),
      }),
    )
    .mutation(async ({ input }) => {
      const admin = createSupabaseAdmin();
      const normalizedEmail = input.email.trim().toLowerCase();
      const normalizedPhone = normalizePhone(input.country, input.phone);

      if (!normalizedPhone) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PHONE_INVALID",
        });
      }

      const { data: region, error: regionError } = await admin
        .from("wilayas")
        .select("code")
        .eq("code", input.wilaya)
        .eq("country_code", input.country)
        .maybeSingle();
      if (regionError || !region) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "REGION_INVALID" });
      }

      if (input.role === "hotel" && !input.taxId && !input.licenseNumber) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "TAX_OR_LICENSE_REQUIRED" });
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          full_name: input.fullName.trim(),
          role: input.role,
        },
      });

      if (createError || !created.user) {
        const alreadyExists = createError?.message.toLowerCase().includes("already");
        throw new TRPCError({
          code: alreadyExists ? "CONFLICT" : "BAD_REQUEST",
          message: alreadyExists ? "EMAIL_EXISTS" : createError?.message || "CREATE_USER_FAILED",
        });
      }

      const { error: profileError } = await admin.from("profiles").insert({
        id: created.user.id,
        role: input.role,
        status: "awaiting_review",
        full_name: input.fullName.trim(),
        legal_name: input.legalName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        country_code: input.country,
        wilaya_code: input.wilaya,
        tax_id: input.taxId?.trim() || null,
        license_number: input.licenseNumber?.trim() || null,
        preferred_locale: input.locale,
      });

      if (profileError) {
        await admin.auth.admin.deleteUser(created.user.id);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: profileError.message || "CREATE_PROFILE_FAILED",
        });
      }

      return { success: true, userId: created.user.id };
    }),

  updateProfile: approvedQuery
    .input(
      z.object({
        fullName: z.string().trim().min(3).optional(),
        phone: z.string().trim().optional(),
        preferredLocale: z.enum(["fr", "ar", "en"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("profiles")
        .update({
          ...(input.fullName && { full_name: input.fullName }),
          ...(input.phone !== undefined && { phone: input.phone || null }),
          ...(input.preferredLocale && { preferred_locale: input.preferredLocale }),
        })
        .eq("id", ctx.user.id)
        .select("*")
        .single();

      if (error || !data) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error?.message || "UPDATE_FAILED" });
      }

      return profileToAppUser(data);
    }),

  uploadDocuments: authedQuery
    .input(
      z.array(
        z.object({
          type: z.enum(["commercial_registry", "tax_card", "tourism_license", "other"]),
          storagePath: z.string().trim().min(1),
          originalName: z.string().trim().min(1),
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      const hasRegistry = input.some((d) => d.type === "commercial_registry");
      if (!hasRegistry) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "COMMERCIAL_REGISTRY_REQUIRED" });
      }

      const { error } = await ctx.supabase.from("business_documents").insert(
        input.map((doc) => ({
          profile_id: ctx.user.id,
          type: doc.type,
          storage_path: doc.storagePath,
          original_name: doc.originalName,
        })),
      );

      if (error) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }

      return { success: true };
    }),
});
