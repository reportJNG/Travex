import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery } from "./middleware";
import { createSupabaseAdmin } from "./lib/supabase";
import { camelize } from "./lib/shape";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "agency" | "hotel" | "super_admin";
  status: "awaiting_review" | "approved" | "rejected" | "suspended";
  emailVerified: boolean;
  googleLinked: boolean;
  profile: any;
};

function asUser(row: any): AdminUser {
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
    emailVerified: row.email_verified,
    googleLinked: row.google_linked,
    profile: camelize(row),
  };
}

export const adminRouter = createRouter({
  stats: adminQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.rpc("admin_platform_stats");
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    const stats = Array.isArray(data) ? data[0] : data;
    return {
      agencies: Number(stats?.agencies ?? 0),
      hotels: Number(stats?.hotels ?? 0),
      transactionsCount: Number(stats?.tx_count ?? 0),
      transactionsVolume: Number(stats?.tx_volume ?? 0),
    };
  }),

  listUsers: adminQuery
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["awaiting_review", "approved", "rejected", "suspended"]).optional(),
        role: z.enum(["agency", "hotel", "super_admin"]).optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.rpc("admin_user_overview");
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

      let users: AdminUser[] = (data ?? []).map(asUser);
      if (input.status) users = users.filter((user: AdminUser) => user.status === input.status);
      if (input.role) users = users.filter((user: AdminUser) => user.role === input.role);
      if (input.search) {
        const needle = input.search.toLowerCase();
        users = users.filter((user: AdminUser) =>
          [user.name, user.email, user.profile.legalName, user.profile.fullName]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(needle)),
        );
      }

      const start = (input.page - 1) * input.limit;
      return users.slice(start, start + input.limit);
    }),

  reviewAccount: adminQuery
    .input(
      z.object({
        userId: z.string().uuid(),
        approve: z.boolean(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.rpc("admin_review_account", {
        p_profile: input.userId,
        p_approve: input.approve,
        p_reason: input.reason ?? null,
      });
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return { success: true };
    }),

  setUserStatus: adminQuery
    .input(z.object({ userId: z.string().uuid(), status: z.enum(["approved", "suspended"]) }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("profiles")
        .update({ status: input.status })
        .eq("id", input.userId);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return { success: true };
    }),

  listClaims: adminQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("hotel_claims")
      .select("*, claimant:profiles(*), seeded_hotel:hotels(*, country:countries(*), wilaya:wilayas(*))")
      .order("created_at", { ascending: false });
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    return camelize(data ?? []);
  }),

  decideClaim: adminQuery
    .input(z.object({ claimId: z.string().uuid(), approve: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.rpc("approve_hotel_claim", {
        p_claim: input.claimId,
        p_approve: input.approve,
      });
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return { success: true };
    }),

  listInvoices: adminQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("invoices")
      .select("*, hotel:hotels(*)")
      .order("issued_at", { ascending: false });
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    return camelize(data ?? []);
  }),

  markInvoicePaid: adminQuery
    .input(z.object({ invoiceId: z.string().uuid(), paymentReference: z.string().trim().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const admin = createSupabaseAdmin();
      const { error } = await admin
        .from("invoices")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_reference: input.paymentReference,
        })
        .eq("id", input.invoiceId);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

      await admin.from("audit_logs").insert({
        actor_id: ctx.user.id,
        action: "invoice.mark_paid",
        target_type: "invoice",
        target_id: input.invoiceId,
      });

      return { success: true };
    }),

  generateInvoices: adminQuery
    .input(z.object({ year: z.number().int().min(2024).max(2030), month: z.number().int().min(1).max(12) }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.rpc("generate_monthly_invoices", {
        p_year: input.year,
        p_month: input.month,
      });
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return { success: true, count: Number(data ?? 0) };
    }),

  listPaymentVerifications: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(20),
        status: z.enum(["awaiting_admin_payment_verification", "all"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from("bookings")
        .select("*, agency:profiles(*), hotel:hotels(*, country:countries(*), wilaya:wilayas(*))")
        .eq("payment_method", "offline")
        .not("voucher_path", "is", null)
        .order("created_at", { ascending: false });

      if (input.status && input.status !== "all") {
        query = query.eq("status", input.status);
      } else {
        query = query.in("status", ["awaiting_offline_payment", "confirmed", "rejected", "expired"]);
      }

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return camelize(data ?? []);
    }),

  verifyPayment: adminQuery
    .input(
      z.object({
        bookingId: z.string().uuid(),
        approve: z.boolean(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.approve) {
        const { error } = await ctx.supabase.rpc("admin_approve_offline_payment", {
          p_booking: input.bookingId,
          p_admin: ctx.user.id,
        });
        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      } else {
        const { error } = await ctx.supabase.rpc("admin_reject_offline_payment", {
          p_booking: input.bookingId,
          p_admin: ctx.user.id,
          p_reason: input.reason ?? null,
        });
        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }

      await ctx.supabase.from("audit_logs").insert({
        actor_id: ctx.user.id,
        action: input.approve ? "payment.approve_offline" : "payment.reject_offline",
        target_type: "booking",
        target_id: input.bookingId,
        metadata: { reason: input.reason ?? null },
      });

      return { success: true };
    }),

  listAuditLogs: adminQuery
    .input(z.object({ page: z.number().default(1), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const from = (input.page - 1) * input.limit;
      const to = from + input.limit - 1;
      const { data, error } = await ctx.supabase
        .from("audit_logs")
        .select("*, actor:profiles(*)")
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return camelize(data ?? []);
    }),
});
