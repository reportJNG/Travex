import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { camelize } from "./lib/shape";

const supportedCountry = z.enum(["DZ", "TN"]);

export const marketplaceRouter = createRouter({
  listHotels: authedQuery
    .input(
      z.object({
        country: supportedCountry.optional(),
        wilaya: z.number().int().positive().optional(),
        minPrice: z.number().finite().min(0).optional(),
        maxPrice: z.number().finite().min(0).optional(),
        stars: z.number().int().min(1).max(5).optional(),
        amenities: z.array(z.string().trim().min(1)).optional(),
        search: z.string().trim().optional(),
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(12),
      }),
    )
    .query(async ({ ctx, input }) => {
      const from = (input.page - 1) * input.limit;
      const to = from + input.limit - 1;
      let query = ctx.supabase
        .from("hotels")
        .select(
          "*, country:countries(*), wilaya:wilayas(*), photos:hotel_photos(*), amenities:hotel_amenities(amenity:amenities(*)), rooms:room_types(*)",
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (input.country) query = query.eq("country_code", input.country);
      if (input.wilaya) query = query.eq("wilaya_code", input.wilaya);
      if (input.stars) query = query.eq("star_rating", input.stars);
      if (input.search) query = query.ilike("name", `%${input.search}%`);

      const { data, error } = await query;
      if (error) throw error;

      let results = data ?? [];
      if (input.minPrice || input.maxPrice) {
        results = results.filter((hotel) => {
          const rooms = (hotel.rooms ?? []) as Array<{ b2b_rate: string | number }>;
          const minRate = rooms.length ? Math.min(...rooms.map((room) => Number(room.b2b_rate))) : 0;
          if (input.minPrice && minRate < input.minPrice) return false;
          if (input.maxPrice && minRate > input.maxPrice) return false;
          return true;
        });
      }

      if (input.amenities?.length) {
        results = results.filter((hotel) => {
          const amenities = (hotel.amenities ?? []) as Array<{ amenity: { key: string } }>;
          return input.amenities!.some((key) => amenities.some((item) => item.amenity.key === key));
        });
      }

      return camelize(
        results.map((hotel) => {
          const rooms = (hotel.rooms ?? []) as Array<{ b2b_rate: string | number; available_count: number }>;
          return {
            ...hotel,
            min_rate: rooms.length ? Math.min(...rooms.map((room) => Number(room.b2b_rate))) : null,
            total_available: rooms.reduce((sum, room) => sum + room.available_count, 0),
          };
        }),
      );
    }),

  getHotel: authedQuery
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from("hotels")
        .select(
          "*, country:countries(*), wilaya:wilayas(*), photos:hotel_photos(*), amenities:hotel_amenities(amenity:amenities(*)), rooms:room_types(*)",
        )
        .eq("id", input.id)
        .eq("rooms.is_active", true)
        .single();

      if (error || !data) return null;

      const rooms = (data.rooms ?? []) as Array<{ b2b_rate: string | number }>;
      return camelize({
        ...data,
        min_rate: rooms.length ? Math.min(...rooms.map((room) => Number(room.b2b_rate))) : null,
      });
    }),

  listCountries: publicQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from("countries")
      .select("*")
      .eq("is_active", true)
      .order("name_fr");
    if (error) throw error;
    return camelize(data ?? []);
  }),

  listWilayas: publicQuery
    .input(z.object({ country: supportedCountry.optional() }).optional())
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase.from("wilayas").select("*").order("country_code").order("code");
      if (input?.country) query = query.eq("country_code", input.country);
      const { data, error } = await query;
      if (error) throw error;
      return camelize(data ?? []);
    }),

  listAmenities: authedQuery.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase.from("amenities").select("*").order("key");
    if (error) throw error;
    return camelize(data ?? []);
  }),
});
