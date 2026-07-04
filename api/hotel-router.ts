import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, hotelQuery } from "./middleware";
import { camelize } from "./lib/shape";

async function getOwnedHotel(ctx: { supabase: any; user: { id: string } }) {
  const { data, error } = await ctx.supabase
    .from("hotels")
    .select("*")
    .eq("owner_profile_id", ctx.user.id)
    .maybeSingle();
  if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
  return data;
}

export const hotelRouter = createRouter({
  myHotel: hotelQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("hotels")
      .select(
        "*, wilaya:wilayas(*), photos:hotel_photos(*), amenities:hotel_amenities(amenity:amenities(*)), rooms:room_types(*)",
      )
      .eq("owner_profile_id", ctx.user.id)
      .maybeSingle();
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
    return data ? camelize(data) : null;
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { data: existing } = await ctx.supabase
        .from("hotels")
        .select("id")
        .eq("owner_profile_id", ctx.user.id)
        .maybeSingle();
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "HOTEL_EXISTS" });

      const { data, error } = await ctx.supabase
        .from("hotels")
        .insert({
          owner_profile_id: ctx.user.id,
          is_seeded: false,
          name: input.name,
          description: input.description || null,
          wilaya_code: input.wilayaCode,
          address: input.address || null,
          star_rating: input.starRating || null,
          phone: input.phone || null,
          email: input.email || null,
          website_url: input.websiteUrl || null,
          facebook_url: input.facebookUrl || null,
          instagram_url: input.instagramUrl || null,
          google_maps_url: input.googleMapsUrl || null,
          lat: input.lat ? Number(input.lat) : null,
          lng: input.lng ? Number(input.lng) : null,
        })
        .select("id")
        .single();

      if (error || !data) {
        throw new TRPCError({ code: "BAD_REQUEST", message: error?.message || "CREATE_HOTEL_FAILED" });
      }

      return { success: true, hotelId: data.id };
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hotel = await getOwnedHotel(ctx);
      if (!hotel) throw new TRPCError({ code: "NOT_FOUND", message: "HOTEL_NOT_FOUND" });

      const { error } = await ctx.supabase
        .from("hotels")
        .update({
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.wilayaCode && { wilaya_code: input.wilayaCode }),
          ...(input.address !== undefined && { address: input.address }),
          ...(input.starRating && { star_rating: input.starRating }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.email !== undefined && { email: input.email }),
          ...(input.websiteUrl !== undefined && { website_url: input.websiteUrl }),
          ...(input.facebookUrl !== undefined && { facebook_url: input.facebookUrl }),
          ...(input.instagramUrl !== undefined && { instagram_url: input.instagramUrl }),
          ...(input.googleMapsUrl !== undefined && { google_maps_url: input.googleMapsUrl }),
        })
        .eq("id", hotel.id);

      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

      if (input.amenityIds) {
        const remove = await ctx.supabase.from("hotel_amenities").delete().eq("hotel_id", hotel.id);
        if (remove.error) throw new TRPCError({ code: "BAD_REQUEST", message: remove.error.message });
        if (input.amenityIds.length) {
          const add = await ctx.supabase.from("hotel_amenities").insert(
            input.amenityIds.map((amenityId) => ({
              hotel_id: hotel.id,
              amenity_id: amenityId,
            })),
          );
          if (add.error) throw new TRPCError({ code: "BAD_REQUEST", message: add.error.message });
        }
      }

      return { success: true };
    }),

  upsertRoom: hotelQuery
    .input(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().min(1),
        totalCapacity: z.number().int().positive(),
        b2bRate: z.number().positive(),
        thumbnailPath: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const hotel = await getOwnedHotel(ctx);
      if (!hotel) throw new TRPCError({ code: "NOT_FOUND", message: "HOTEL_NOT_FOUND" });

      if (input.id) {
        const { error } = await ctx.supabase
          .from("room_types")
          .update({
            name: input.name,
            total_capacity: input.totalCapacity,
            available_count: input.totalCapacity,
            b2b_rate: input.b2bRate,
            thumbnail_path: input.thumbnailPath || null,
          })
          .eq("id", input.id)
          .eq("hotel_id", hotel.id);
        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      } else {
        const { error } = await ctx.supabase.from("room_types").insert({
          hotel_id: hotel.id,
          name: input.name,
          total_capacity: input.totalCapacity,
          available_count: input.totalCapacity,
          b2b_rate: input.b2bRate,
          thumbnail_path: input.thumbnailPath || null,
        });
        if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      }

      return { success: true };
    }),

  adjustAvailability: hotelQuery
    .input(z.object({ roomId: z.string().uuid(), delta: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase.rpc("adjust_room_availability", {
        p_room: input.roomId,
        p_delta: input.delta,
      });
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return { success: true };
    }),

  toggleRoomActive: hotelQuery
    .input(z.object({ roomId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const hotel = await getOwnedHotel(ctx);
      if (!hotel) throw new TRPCError({ code: "NOT_FOUND", message: "HOTEL_NOT_FOUND" });

      const { data: room, error: findError } = await ctx.supabase
        .from("room_types")
        .select("is_active")
        .eq("id", input.roomId)
        .eq("hotel_id", hotel.id)
        .single();
      if (findError || !room) throw new TRPCError({ code: "NOT_FOUND", message: "ROOM_NOT_FOUND" });

      const nextActive = !room.is_active;
      const { error } = await ctx.supabase
        .from("room_types")
        .update({ is_active: nextActive })
        .eq("id", input.roomId)
        .eq("hotel_id", hotel.id);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return { success: true, isActive: nextActive };
    }),

  getRequests: hotelQuery.query(async ({ ctx }) => {
    const hotel = await getOwnedHotel(ctx);
    if (!hotel) return { pending: [], awaitingPayment: [], other: [] };

    const { data, error } = await ctx.supabase
      .from("bookings")
      .select("*, agency:profiles(*), room_type:room_types(*)")
      .eq("hotel_id", hotel.id)
      .order("created_at", { ascending: false });
    if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });

    const all = camelize(data ?? []);
    return {
      pending: all.filter((booking: any) => booking.status === "pending_hotel"),
      awaitingPayment: all.filter((booking: any) => booking.status === "awaiting_offline_payment"),
      other: all.filter((booking: any) => !["pending_hotel", "awaiting_offline_payment"].includes(booking.status)),
    };
  }),

  updateSettings: hotelQuery
    .input(z.object({ offlinePaymentWindowHours: z.number().int().min(6).max(168).optional() }))
    .mutation(async ({ ctx, input }) => {
      const hotel = await getOwnedHotel(ctx);
      if (!hotel) throw new TRPCError({ code: "NOT_FOUND", message: "HOTEL_NOT_FOUND" });

      const { error } = await ctx.supabase
        .from("hotels")
        .update({
          ...(input.offlinePaymentWindowHours && {
            offline_payment_window_hours: input.offlinePaymentWindowHours,
          }),
        })
        .eq("id", hotel.id);
      if (error) throw new TRPCError({ code: "BAD_REQUEST", message: error.message });
      return { success: true };
    }),
});
