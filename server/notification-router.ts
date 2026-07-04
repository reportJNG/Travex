import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, approvedQuery } from "./middleware";
import { camelize } from "./lib/shape";

export const notificationRouter = createRouter({
  list: approvedQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("notifications")
      .select("*")
      .eq("user_id", ctx.user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    return camelize(data ?? []);
  }),

  unreadCount: approvedQuery.query(async ({ ctx }) => {
    const { count, error } = await ctx.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.user.id)
      .is("read_at", null);
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    return count ?? 0;
  }),

  markRead: approvedQuery
    .input(z.object({ notificationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", input.notificationId)
        .eq("user_id", ctx.user.id);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return { success: true };
    }),

  markAllRead: approvedQuery.mutation(async ({ ctx }) => {
    const { error } = await ctx.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", ctx.user.id);
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    return { success: true };
  }),
});
