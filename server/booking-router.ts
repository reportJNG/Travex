import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, agencyQuery, hotelQuery } from "./middleware";
import { camelize, unwrapRpcSingle } from "./lib/shape";

function rpcError(error: { message: string }) {
  return new TRPCError({ code: "BAD_REQUEST", message: error.message });
}

const bookingDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
  }, "Invalid booking date");

const createBookingInput = z
  .object({
    hotelId: z.string().uuid(),
    roomTypeId: z.string().uuid(),
    checkIn: bookingDate,
    checkOut: bookingDate,
    roomsCount: z.number().int().min(1).max(20),
    paymentMethod: z.enum(["cib", "edahabia", "offline"]),
  })
  .refine(({ checkIn, checkOut }) => new Date(checkOut) > new Date(checkIn), {
    message: "Check-out must be after check-in",
    path: ["checkOut"],
  });

export const bookingRouter = createRouter({
  create: agencyQuery
    .input(createBookingInput)
    .mutation(async ({ ctx, input }) => {
      if (input.paymentMethod === "offline") {
        const { data, error } = await ctx.supabase.rpc(
          "create_offline_booking",
          {
            p_hotel: input.hotelId,
            p_room_type: input.roomTypeId,
            p_check_in: input.checkIn,
            p_check_out: input.checkOut,
            p_rooms: input.roomsCount,
          }
        );
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
      .select("*, hotel:hotels(*, country:countries(*), wilaya:wilayas(*)), room_type:room_types(*)")
      .eq("agency_id", ctx.user.id)
      .eq("archived_by_agency", false)
      .order("created_at", { ascending: false });
    if (error)
      throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
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
      })
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

  get: agencyQuery
    .input(z.object({ bookingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("bookings")
        .select("*, hotel:hotels(*, country:countries(*), wilaya:wilayas(*), hotel_payment_settings:hotel_payment_settings(*)), room_type:room_types(*)")
        .eq("id", input.bookingId)
        .eq("agency_id", ctx.user.id)
        .maybeSingle();
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Booking not found" });
      return camelize(data);
    }),

  myStatement: agencyQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("bookings")
      .select(
        "id, reference, total_price, commission_amount, status, check_in, check_out, nights, rooms_count, room_name_snapshot, created_at, hotel:hotels(name)"
      )
      .eq("agency_id", ctx.user.id)
      .in("status", [
        "confirmed",
        "completed",
        "pending_hotel",
        "awaiting_offline_payment",
        "pending_payment",
      ])
      .order("created_at", { ascending: false });
    if (error)
      throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

    const bookings = camelize(data ?? []) as Array<Record<string, any>>;
    const grouped: Record<string, any> = {};
    for (const booking of bookings) {
      const d = new Date(booking.checkIn || booking.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[key])
        grouped[key] = {
          period: key,
          bookings: [],
          total: 0,
          commissionTotal: 0,
        };
      grouped[key].bookings.push(booking);
      grouped[key].total += Number(booking.totalPrice);
      grouped[key].commissionTotal += Number(booking.commissionAmount || 0);
    }
    return Object.values(grouped).sort((a: any, b: any) =>
      b.period.localeCompare(a.period)
    );
  }),
});
