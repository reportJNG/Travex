import { z } from "zod";
import { createRouter, agencyQuery, hotelQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { bookings, payments, roomTypes, hotels, notifications } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

function generateReference(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 999999).toString().padStart(6, "0");
  return `TVX-${year}-${seq}`;
}

export const bookingRouter = createRouter({
  create: agencyQuery
    .input(
      z.object({
        hotelId: z.number(),
        roomTypeId: z.number(),
        checkIn: z.string(),
        checkOut: z.string(),
        roomsCount: z.number().int().min(1).max(20),
        paymentMethod: z.enum(["cib", "edahabia", "offline"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const room = await db.query.roomTypes.findFirst({
        where: and(eq(roomTypes.id, input.roomTypeId), eq(roomTypes.isActive, true)),
        with: { hotel: true },
      });

      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ROOM_NOT_FOUND" });
      }

      const hotelData = room.hotel as Record<string, unknown> | undefined;
      if (!hotelData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "HOTEL_NOT_FOUND" });
      }

      if (Number(hotelData.id) !== input.hotelId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ROOM_HOTEL_MISMATCH" });
      }
      if (!hotelData.isActive || hotelData.isSeeded) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "HOTEL_NOT_BOOKABLE" });
      }
      if (room.availableCount < input.roomsCount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INSUFFICIENT_AVAILABILITY" });
      }

      const checkIn = new Date(input.checkIn);
      const checkOut = new Date(input.checkOut);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

      if (nights < 1) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_DATES" });
      }

      const rate = Number(room.b2bRate);
      const totalPrice = Math.round(rate * nights * input.roomsCount * 100) / 100;

      const reference = generateReference();
      const status = input.paymentMethod === "offline" ? "pending_hotel" : "pending_payment";
      const hotelDeadline = input.paymentMethod === "offline"
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : null;

      const bookingData = {
        reference,
        agencyId: ctx.user.id,
        hotelId: input.hotelId,
        roomTypeId: input.roomTypeId,
        roomNameSnapshot: room.name,
        nightlyRateSnapshot: String(rate),
        roomsCount: input.roomsCount,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        nights,
        totalPrice: String(totalPrice),
        commissionRate: "5.00",
        paymentMethod: input.paymentMethod,
        status,
        hotelDeadline,
      };

      const [createdBooking] = await db
        .insert(bookings)
        .values(bookingData as any)
        .returning({ id: bookings.id });

      if (!createdBooking) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "CREATE_BOOKING_FAILED" });
      }
      const bookingId = createdBooking.id;

      if (input.paymentMethod !== "offline") {
        await db.insert(payments).values({
          bookingId: bookingId,
          method: input.paymentMethod,
          amount: String(totalPrice),
          status: "initiated",
        } as any);

        await db
          .update(roomTypes)
          .set({ availableCount: room.availableCount - input.roomsCount })
          .where(eq(roomTypes.id, input.roomTypeId));
      }

      if (hotelData.ownerProfileId) {
        await db.insert(notifications).values({
          userId: Number(hotelData.ownerProfileId),
          type: "booking_request",
          data: JSON.stringify({
            bookingId,
            reference,
            agency: ctx.user.name || "Agency",
            total: totalPrice,
            deadline: hotelDeadline,
          }),
        } as any);
      }

      return {
        success: true,
        bookingId,
        reference,
        totalPrice,
        status,
        checkoutUrl: input.paymentMethod !== "offline" ? `/mock-checkout/${bookingId}` : null,
      };
    }),

  myBookings: agencyQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.query.bookings.findMany({
      where: and(eq(bookings.agencyId, ctx.user.id), eq(bookings.archivedByAgency, false)),
      with: {
        hotel: { with: { wilaya: true } },
        roomType: true,
      },
      orderBy: [desc(bookings.createdAt)],
    });
  }),

  archive: agencyQuery
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const booking = await db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.bookingId), eq(bookings.agencyId, ctx.user.id)),
      });

      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "BOOKING_NOT_FOUND" });
      }

      if (!["rejected", "expired", "cancelled"].includes(booking.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "NOT_ARCHIVABLE" });
      }

      await db
        .update(bookings)
        .set({ archivedByAgency: true, updatedAt: new Date() })
        .where(eq(bookings.id, input.bookingId));

      return { success: true };
    }),

  decide: hotelQuery
    .input(
      z.object({
        bookingId: z.number(),
        approve: z.boolean(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const hotel = await db.query.hotels.findFirst({
        where: eq(hotels.ownerProfileId, ctx.user.id),
      });
      if (!hotel) {
        throw new TRPCError({ code: "NOT_FOUND", message: "HOTEL_NOT_FOUND" });
      }

      const booking = await db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.bookingId), eq(bookings.hotelId, hotel.id)),
      });
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "BOOKING_NOT_FOUND" });
      }
      if (booking.status !== "pending_hotel") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_STATE" });
      }

      if (!input.approve) {
        if (!input.reason || input.reason.length < 3) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "REASON_REQUIRED" });
        }

        await db
          .update(bookings)
          .set({ status: "rejected", rejectionReason: input.reason, updatedAt: new Date() })
          .where(eq(bookings.id, input.bookingId));

        await db.insert(notifications).values({
          userId: Number(booking.agencyId),
          type: "booking_rejected",
          data: JSON.stringify({
            bookingId: input.bookingId,
            reference: booking.reference,
            reason: input.reason,
          }),
        } as any);

        return { success: true, status: "rejected" };
      }

      const room = await db.query.roomTypes.findFirst({
        where: eq(roomTypes.id, booking.roomTypeId),
      });
      if (!room || room.availableCount < booking.roomsCount) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INSUFFICIENT_AVAILABILITY" });
      }

      await db
        .update(roomTypes)
        .set({ availableCount: room.availableCount - booking.roomsCount })
        .where(eq(roomTypes.id, booking.roomTypeId));

      const paymentWindowHours = hotel.offlinePaymentWindowHours;
      const paymentDeadline = new Date(Date.now() + paymentWindowHours * 60 * 60 * 1000);

      await db
        .update(bookings)
        .set({ status: "awaiting_offline_payment", paymentDeadline, updatedAt: new Date() })
        .where(eq(bookings.id, input.bookingId));

      await db.insert(notifications).values({
        userId: Number(booking.agencyId),
        type: "payment_window_started",
        data: JSON.stringify({
          bookingId: input.bookingId,
          reference: booking.reference,
          deadline: paymentDeadline,
          total: booking.totalPrice,
        }),
      } as any);

      return { success: true, status: "awaiting_offline_payment", paymentDeadline };
    }),

  markReceived: hotelQuery
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const hotel = await db.query.hotels.findFirst({
        where: eq(hotels.ownerProfileId, ctx.user.id),
      });
      if (!hotel) {
        throw new TRPCError({ code: "NOT_FOUND", message: "HOTEL_NOT_FOUND" });
      }

      const booking = await db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.bookingId), eq(bookings.hotelId, hotel.id)),
      });
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "BOOKING_NOT_FOUND" });
      }
      if (booking.status !== "awaiting_offline_payment") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_STATE" });
      }

      const commissionAmount = Math.round(Number(booking.totalPrice) * 0.05 * 100) / 100;

      await db
        .update(bookings)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
          receivedConfirmedAt: new Date(),
          commissionAmount: String(commissionAmount),
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, input.bookingId));

      await db.insert(notifications).values({
        userId: Number(booking.agencyId),
        type: "payment_received",
        data: JSON.stringify({
          bookingId: input.bookingId,
          reference: booking.reference,
        }),
      } as any);

      return { success: true, status: "confirmed" };
    }),

  confirmPayment: agencyQuery
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const booking = await db.query.bookings.findFirst({
        where: and(eq(bookings.id, input.bookingId), eq(bookings.agencyId, ctx.user.id)),
      });
      if (!booking) {
        throw new TRPCError({ code: "NOT_FOUND", message: "BOOKING_NOT_FOUND" });
      }
      if (booking.status !== "pending_payment") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "INVALID_STATE" });
      }

      const commissionAmount = Math.round(Number(booking.totalPrice) * 0.05 * 100) / 100;

      await db
        .update(bookings)
        .set({
          status: "confirmed",
          confirmedAt: new Date(),
          commissionAmount: String(commissionAmount),
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, input.bookingId));

      await db
        .update(payments)
        .set({ status: "paid", paidAt: new Date() })
        .where(eq(payments.bookingId, input.bookingId));

      const hotel = await db.query.hotels.findFirst({
        where: eq(hotels.id, booking.hotelId),
      });
      if (hotel?.ownerProfileId) {
        await db.insert(notifications).values({
          userId: Number(hotel.ownerProfileId),
          type: "online_confirmed",
          data: JSON.stringify({
            bookingId: input.bookingId,
            reference: booking.reference,
            total: booking.totalPrice,
          }),
        } as any);
      }

      return { success: true, status: "confirmed" };
    }),
});
