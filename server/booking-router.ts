import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, agencyQuery, hotelQuery } from "./middleware";
import { camelize, unwrapRpcSingle } from "./lib/shape";

function rpcError(error: { message: string }) {
  return new TRPCError({ code: "BAD_REQUEST", message: error.message });
}

export const bookingRouter = createRouter({
  create: agencyQuery
    .input(
      z.object({
        hotelId: z.string().uuid(),
        roomTypeId: z.string().uuid(),
        checkIn: z.string(),
        checkOut: z.string(),
        roomsCount: z.number().int().min(1).max(20),
        paymentMethod: z.enum(["cib", "edahabia", "offline"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.paymentMethod === "offline") {
        const { data, error } = await ctx.supabase.rpc("create_offline_booking", {
          p_hotel: input.hotelId,
          p_room_type: input.roomTypeId,
          p_check_in: input.checkIn,
          p_check_out: input.checkOut,
          p_rooms: input.roomsCount,
        });
        if (error) throw rpcError(error);
        const booking = camelize(unwrapRpcSingle(data));
        return {
          success: true,
          bookingId: booking.id,
          reference: booking.reference,
          totalPrice: Number(booking.totalPrice),
          status: booking.status,
          checkoutUrl: null,
        };
      }

      const { data, error } = await ctx.supabase.rpc("create_online_booking", {
        p_hotel: input.hotelId,
        p_room_type: input.roomTypeId,
        p_check_in: input.checkIn,
        p_check_out: input.checkOut,
        p_rooms: input.roomsCount,
        p_method: input.paymentMethod,
      });
      if (error) throw rpcError(error);

      const created = unwrapRpcSingle(data);
      return {
        success: true,
        bookingId: created.booking_id,
        reference: "",
        totalPrice: Number(created.amount),
        status: "pending_payment",
        checkoutUrl: null,
      };
    }),

  myBookings: agencyQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("bookings")
      .select("*, hotel:hotels(*, wilaya:wilayas(*)), room_type:room_types(*)")
      .eq("agency_id", ctx.user.id)
      .eq("archived_by_agency", false)
      .order("created_at", { ascending: false });
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    return camelize(data ?? []);
  }),

  archive: agencyQuery
    .input(z.object({ bookingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.rpc("archive_rejected_booking", {
        p_booking: input.bookingId,
      });
      if (error) throw rpcError(error);
      return { success: true };
    }),

  decide: hotelQuery
    .input(
      z.object({
        bookingId: z.string().uuid(),
        approve: z.boolean(),
        reason: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.rpc("hotel_decide_booking", {
        p_booking: input.bookingId,
        p_approve: input.approve,
        p_reason: input.reason ?? null,
      });
      if (error) throw rpcError(error);
      const booking = camelize(unwrapRpcSingle(data));
      return { success: true, status: booking.status, booking };
    }),

  markReceived: hotelQuery
    .input(z.object({ bookingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase.rpc("hotel_mark_received", {
        p_booking: input.bookingId,
      });
      if (error) throw rpcError(error);
      const booking = camelize(unwrapRpcSingle(data));
      return { success: true, status: booking.status, booking };
    }),

  myStatement: agencyQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("bookings")
      .select("id, reference, total_price, commission_amount, status, check_in, check_out, nights, rooms_count, room_name_snapshot, created_at, hotel:hotels(name)")
      .eq("agency_id", ctx.user.id)
      .in("status", ["confirmed", "completed", "pending_hotel", "awaiting_offline_payment", "pending_payment"])
      .order("created_at", { ascending: false });
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

    const bookings = camelize(data ?? []);
    const grouped: Record<string, any> = {};
    for (const booking of bookings) {
      const d = new Date(booking.checkIn || booking.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[key]) grouped[key] = { period: key, bookings: [], total: 0, commissionTotal: 0 };
      grouped[key].bookings.push(booking);
      grouped[key].total += Number(booking.totalPrice);
      grouped[key].commissionTotal += Number(booking.commissionAmount || 0);
    }
    return Object.values(grouped).sort((a: any, b: any) => b.period.localeCompare(a.period));
  }),
});
