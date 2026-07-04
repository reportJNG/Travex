import { z } from "zod";
import { createRouter, hotelQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { hotels, hotelAmenities, roomTypes, bookings } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const hotelRouter = createRouter({
  myHotel: hotelQuery.query(async ({ ctx }) => {
    const db = getDb();
    const hotel = await db.query.hotels.findFirst({
      where: eq(hotels.ownerProfileId, ctx.user.id),
      with: {
        wilaya: true,
        photos: true,
        amenities: { with: { amenity: true } },
        rooms: true,
      },
    });
    return hotel ?? null;
  }),

  createHotel: hotelQuery
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        wilayaCode: z.number(),
        address: z.string().optional(),
        starRating: z.number().min(1).max(5).optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        websiteUrl: z.string().optional(),
        facebookUrl: z.string().optional(),
        instagramUrl: z.string().optional(),
        googleMapsUrl: z.string().optional(),
        lat: z.string().optional(),
        lng: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const existing = await db.query.hotels.findFirst({
        where: eq(hotels.ownerProfileId, ctx.user.id),
      });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "HOTEL_EXISTS" });
      }

      const [createdHotel] = await db.insert(hotels).values({
        ownerProfileId: ctx.user.id,
        isSeeded: false,
        name: input.name,
        description: input.description || null,
        wilayaCode: input.wilayaCode,
        address: input.address || null,
        starRating: input.starRating || null,
        phone: input.phone || null,
        email: input.email || null,
        websiteUrl: input.websiteUrl || null,
        facebookUrl: input.facebookUrl || null,
        instagramUrl: input.instagramUrl || null,
        googleMapsUrl: input.googleMapsUrl || null,
        lat: input.lat || null,
        lng: input.lng || null,
      }).returning({ id: hotels.id });

      if (!createdHotel) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "CREATE_HOTEL_FAILED" });
      }

      return { success: true, hotelId: createdHotel.id };
    }),

  updateHotel: hotelQuery
    .input(
      z.object({
        name: z.string().min(2).optional(),
        description: z.string().optional(),
        wilayaCode: z.number().optional(),
        address: z.string().optional(),
        starRating: z.number().min(1).max(5).optional(),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        websiteUrl: z.string().optional(),
        facebookUrl: z.string().optional(),
        instagramUrl: z.string().optional(),
        googleMapsUrl: z.string().optional(),
        amenityIds: z.array(z.number()).optional(),
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

      await db
        .update(hotels)
        .set({
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.wilayaCode && { wilayaCode: input.wilayaCode }),
          ...(input.address !== undefined && { address: input.address }),
          ...(input.starRating && { starRating: input.starRating }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.email !== undefined && { email: input.email }),
          ...(input.websiteUrl !== undefined && { websiteUrl: input.websiteUrl }),
          ...(input.facebookUrl !== undefined && { facebookUrl: input.facebookUrl }),
          ...(input.instagramUrl !== undefined && { instagramUrl: input.instagramUrl }),
          ...(input.googleMapsUrl !== undefined && { googleMapsUrl: input.googleMapsUrl }),
          updatedAt: new Date(),
        })
        .where(eq(hotels.id, hotel.id));

      if (input.amenityIds) {
        await db.delete(hotelAmenities).where(eq(hotelAmenities.hotelId, hotel.id));
        if (input.amenityIds.length > 0) {
          await db.insert(hotelAmenities).values(
            input.amenityIds.map((aid) => ({
              hotelId: Number(hotel.id),
              amenityId: aid,
            }))
          );
        }
      }

      return { success: true };
    }),

  upsertRoom: hotelQuery
    .input(
      z.object({
        id: z.number().optional(),
        name: z.string().min(1),
        totalCapacity: z.number().int().positive(),
        b2bRate: z.number().positive(),
        thumbnailPath: z.string().optional(),
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

      if (input.id) {
        await db
          .update(roomTypes)
          .set({
            name: input.name,
            totalCapacity: input.totalCapacity,
            availableCount: input.totalCapacity,
            b2bRate: String(input.b2bRate),
            thumbnailPath: input.thumbnailPath || null,
            updatedAt: new Date(),
          })
          .where(and(eq(roomTypes.id, input.id), eq(roomTypes.hotelId, hotel.id)));
      } else {
        await db.insert(roomTypes).values({
          hotelId: Number(hotel.id),
          name: input.name,
          totalCapacity: input.totalCapacity,
          availableCount: input.totalCapacity,
          b2bRate: String(input.b2bRate),
          thumbnailPath: input.thumbnailPath || null,
        });
      }

      return { success: true };
    }),

  adjustAvailability: hotelQuery
    .input(z.object({ roomId: z.number(), delta: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const hotel = await db.query.hotels.findFirst({
        where: eq(hotels.ownerProfileId, ctx.user.id),
      });
      if (!hotel) {
        throw new TRPCError({ code: "NOT_FOUND", message: "HOTEL_NOT_FOUND" });
      }

      const room = await db.query.roomTypes.findFirst({
        where: and(eq(roomTypes.id, input.roomId), eq(roomTypes.hotelId, hotel.id)),
      });
      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ROOM_NOT_FOUND" });
      }

      const newCount = room.availableCount + input.delta;
      if (newCount < 0 || newCount > room.totalCapacity) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "AVAILABILITY_OUT_OF_RANGE" });
      }

      await db
        .update(roomTypes)
        .set({ availableCount: newCount, updatedAt: new Date() })
        .where(eq(roomTypes.id, input.roomId));

      return { success: true };
    }),

  toggleRoomActive: hotelQuery
    .input(z.object({ roomId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const hotel = await db.query.hotels.findFirst({
        where: eq(hotels.ownerProfileId, ctx.user.id),
      });
      if (!hotel) {
        throw new TRPCError({ code: "NOT_FOUND", message: "HOTEL_NOT_FOUND" });
      }

      const room = await db.query.roomTypes.findFirst({
        where: and(eq(roomTypes.id, input.roomId), eq(roomTypes.hotelId, hotel.id)),
      });
      if (!room) {
        throw new TRPCError({ code: "NOT_FOUND", message: "ROOM_NOT_FOUND" });
      }

      await db
        .update(roomTypes)
        .set({ isActive: !room.isActive, updatedAt: new Date() })
        .where(eq(roomTypes.id, input.roomId));

      return { success: true, isActive: !room.isActive };
    }),

  getRequests: hotelQuery.query(async ({ ctx }) => {
    const db = getDb();

    const hotel = await db.query.hotels.findFirst({
      where: eq(hotels.ownerProfileId, ctx.user.id),
    });
    if (!hotel) return { pending: [], awaitingPayment: [], other: [] };

    const allBookings = await db.query.bookings.findMany({
      where: eq(bookings.hotelId, hotel.id),
      with: {
        agency: true,
        roomType: true,
      },
      orderBy: [desc(bookings.createdAt)],
    });

    return {
      pending: allBookings.filter((b) => b.status === "pending_hotel"),
      awaitingPayment: allBookings.filter((b) => b.status === "awaiting_offline_payment"),
      other: allBookings.filter(
        (b) => !["pending_hotel", "awaiting_offline_payment"].includes(b.status)
      ),
    };
  }),

  updateSettings: hotelQuery
    .input(
      z.object({
        offlinePaymentWindowHours: z.number().int().min(6).max(168).optional(),
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

      await db
        .update(hotels)
        .set({
          ...(input.offlinePaymentWindowHours && {
            offlinePaymentWindowHours: input.offlinePaymentWindowHours,
          }),
          updatedAt: new Date(),
        })
        .where(eq(hotels.id, hotel.id));

      return { success: true };
    }),
});
