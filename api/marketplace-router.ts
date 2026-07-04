import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { hotels, roomTypes, wilayas } from "@db/schema";
import { eq, and, like, desc } from "drizzle-orm";

export const marketplaceRouter = createRouter({
  listHotels: publicQuery
    .input(
      z.object({
        wilaya: z.number().optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        stars: z.number().optional(),
        amenities: z.array(z.string()).optional(),
        search: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(12),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [eq(hotels.isActive, true)];

      if (input.wilaya) conditions.push(eq(hotels.wilayaCode, input.wilaya));
      if (input.stars) conditions.push(eq(hotels.starRating, input.stars));
      if (input.search) conditions.push(like(hotels.name, `%${input.search}%`));

      const offset = (input.page - 1) * input.limit;

      const results = await db.query.hotels.findMany({
        where: and(...conditions),
        with: {
          wilaya: true,
          photos: { limit: 1 },
          amenities: { with: { amenity: true } },
          rooms: { where: eq(roomTypes.isActive, true) },
        },
        limit: input.limit,
        offset,
        orderBy: [desc(hotels.createdAt)],
      });

      let filtered = results;
      if (input.minPrice || input.maxPrice) {
        filtered = results.filter((h: Record<string, unknown>) => {
          const rooms = (h.rooms || []) as Array<{ b2bRate: string | number }>;
          const minRate = rooms.length > 0
            ? Math.min(...rooms.map((r: { b2bRate: string | number }) => Number(r.b2bRate)))
            : 0;
          if (input.minPrice && minRate < input.minPrice) return false;
          if (input.maxPrice && minRate > input.maxPrice) return false;
          return true;
        });
      }

      if (input.amenities && input.amenities.length > 0) {
        filtered = filtered.filter((h: Record<string, unknown>) => {
          const ha = (h.amenities || []) as Array<{ amenity: { key: string } }>;
          return input.amenities!.some((a: string) =>
            ha.some((haItem: { amenity: { key: string } }) => haItem.amenity.key === a)
          );
        });
      }

      return filtered.map((h: Record<string, unknown>) => {
        const rooms = (h.rooms || []) as Array<{ b2bRate: string | number; availableCount: number }>;
        return {
          ...h,
          minRate: rooms.length > 0
            ? Math.min(...rooms.map((r: { b2bRate: string | number }) => Number(r.b2bRate)))
            : null,
          totalAvailable: rooms.reduce((sum: number, r: { availableCount: number }) => sum + r.availableCount, 0),
        };
      });
    }),

  getHotel: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const hotel = await db.query.hotels.findFirst({
        where: eq(hotels.id, input.id),
        with: {
          wilaya: true,
          photos: true,
          amenities: { with: { amenity: true } },
          rooms: { where: eq(roomTypes.isActive, true) },
        },
      });

      if (!hotel) return null;

      const rooms = (hotel.rooms || []) as Array<{ b2bRate: string | number }>;
      return {
        ...hotel,
        minRate: rooms.length > 0
          ? Math.min(...rooms.map((r: { b2bRate: string | number }) => Number(r.b2bRate)))
          : null,
      };
    }),

  listWilayas: publicQuery.query(async () => {
    const db = getDb();
    return db.query.wilayas.findMany({
      orderBy: [wilayas.code],
    });
  }),

  listAmenities: publicQuery.query(async () => {
    const db = getDb();
    return db.query.amenities.findMany();
  }),
});
