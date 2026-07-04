import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, profiles, hotels, bookings, invoices, hotelClaims, notifications, auditLogs } from "@db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const adminRouter = createRouter({
  stats: adminQuery.query(async () => {
    const db = getDb();

    const [agenciesCount, hotelsCount, bookingsCount, volumeResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, "agency"), eq(users.status, "approved"))),
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.role, "hotel"), eq(users.status, "approved"))),
      db.select({ count: sql<number>`count(*)` })
        .from(bookings)
        .where(sql`${bookings.status} IN ('confirmed', 'completed')`),
      db.select({ total: sql<number>`COALESCE(SUM(${bookings.totalPrice}), 0)` })
        .from(bookings)
        .where(sql`${bookings.status} IN ('confirmed', 'completed')`),
    ]);

    return {
      agencies: Number(agenciesCount[0]?.count ?? 0),
      hotels: Number(hotelsCount[0]?.count ?? 0),
      transactionsCount: Number(bookingsCount[0]?.count ?? 0),
      transactionsVolume: Number(volumeResult[0]?.total ?? 0),
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
      })
    )
    .query(async ({ input }) => {
      const db = getDb();

      const conditions = [];
      if (input.status) conditions.push(eq(users.status, input.status));
      if (input.role) conditions.push(eq(users.role, input.role));

      const offset = (input.page - 1) * input.limit;

      const results = await db.query.users.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { profile: { with: { wilaya: true } } },
        limit: input.limit,
        offset,
        orderBy: [desc(users.createdAt)],
      });

      if (input.search) {
        const search = input.search.toLowerCase();
        return results.filter((u: Record<string, unknown>) => {
          const name = (u.name as string) || "";
          const email = (u.email as string) || "";
          const profile = u.profile as Record<string, unknown> | undefined;
          const legalName = (profile?.legalName as string) || "";
          return name.toLowerCase().includes(search) ||
            email.toLowerCase().includes(search) ||
            legalName.toLowerCase().includes(search);
        });
      }

      return results;
    }),

  reviewAccount: adminQuery
    .input(
      z.object({
        userId: z.number(),
        approve: z.boolean(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });
      if (!user || user.status !== "awaiting_review") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "NOT_REVIEWABLE" });
      }

      await db
        .update(users)
        .set({
          status: input.approve ? "approved" : "rejected",
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      if (!input.approve && input.reason) {
        await db
          .update(profiles)
          .set({ rejectionReason: input.reason })
          .where(eq(profiles.id, input.userId));
      }

      await db.insert(notifications).values({
        userId: input.userId,
        type: input.approve ? "account_approved" : "account_rejected",
        data: JSON.stringify({ reason: input.reason }),
      } as any);

      await db.insert(auditLogs).values({
        actorId: ctx.user.id,
        action: input.approve ? "account.approve" : "account.reject",
        targetType: "profile",
        targetId: String(input.userId),
        meta: JSON.stringify({ reason: input.reason }),
      } as any);

      return { success: true };
    }),

  setUserStatus: adminQuery
    .input(
      z.object({
        userId: z.number(),
        status: z.enum(["approved", "suspended"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db
        .update(users)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(users.id, input.userId));

      await db.insert(auditLogs).values({
        actorId: ctx.user.id,
        action: `account.${input.status}`,
        targetType: "profile",
        targetId: String(input.userId),
      } as any);

      return { success: true };
    }),

  listClaims: adminQuery.query(async () => {
    const db = getDb();
    return db.query.hotelClaims.findMany({
      with: {
        claimant: true,
        seededHotel: { with: { wilaya: true } },
      },
      orderBy: [desc(hotelClaims.createdAt)],
    });
  }),

  decideClaim: adminQuery
    .input(
      z.object({
        claimId: z.number(),
        approve: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const claim = await db.query.hotelClaims.findFirst({
        where: eq(hotelClaims.id, input.claimId),
      });
      if (!claim || claim.status !== "pending") {
        throw new TRPCError({ code: "NOT_FOUND", message: "CLAIM_NOT_FOUND" });
      }

      await db
        .update(hotelClaims)
        .set({
          status: input.approve ? "approved" : "rejected",
          decidedBy: ctx.user.id,
          decidedAt: new Date(),
        })
        .where(eq(hotelClaims.id, input.claimId));

      if (input.approve) {
        await db
          .update(hotels)
          .set({ isActive: false })
          .where(eq(hotels.id, claim.seededHotelId));

        const claimantHotel = await db.query.hotels.findFirst({
          where: eq(hotels.ownerProfileId, claim.claimantProfileId),
        });
        if (claimantHotel) {
          await db
            .update(hotels)
            .set({ replacedSeededId: claim.seededHotelId })
            .where(eq(hotels.id, claimantHotel.id));
        }
      }

      await db.insert(notifications).values({
        userId: Number(claim.claimantProfileId),
        type: "claim_decided",
        data: JSON.stringify({ approved: input.approve }),
      } as any);

      return { success: true };
    }),

  listInvoices: adminQuery.query(async () => {
    const db = getDb();
    return db.query.invoices.findMany({
      with: { hotel: true },
      orderBy: [desc(invoices.issuedAt)],
    });
  }),

  markInvoicePaid: adminQuery
    .input(
      z.object({
        invoiceId: z.number(),
        paymentReference: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      await db
        .update(invoices)
        .set({
          status: "paid",
          paidAt: new Date(),
          paymentReference: input.paymentReference,
        })
        .where(eq(invoices.id, input.invoiceId));

      await db.insert(auditLogs).values({
        actorId: ctx.user.id,
        action: "invoice.mark_paid",
        targetType: "invoice",
        targetId: String(input.invoiceId),
      } as any);

      return { success: true };
    }),

  generateInvoices: adminQuery
    .input(
      z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      const periodStart = `${input.year}-${String(input.month).padStart(2, "0")}-01`;

      const eligibleBookings = await db.query.bookings.findMany({
        where: and(
          sql`${bookings.status} IN ('confirmed', 'completed')`,
          sql`${bookings.confirmedAt} >= ${periodStart}`,
          sql`${bookings.invoiceId} IS NULL`
        ),
        with: { hotel: true },
      });

      const byHotel = new Map<number, typeof eligibleBookings>();
      for (const b of eligibleBookings) {
        const hid = Number(b.hotelId);
        const list = byHotel.get(hid) || [];
        list.push(b);
        byHotel.set(hid, list);
      }

      let count = 0;
      for (const [hotelId, hotelBookings] of byHotel) {
        const total = hotelBookings.reduce((s, b) => s + Number(b.totalPrice), 0);
        const commission = hotelBookings.reduce(
          (s, b) => s + Number(b.commissionAmount || 0),
          0
        );

        const dueDate = new Date(input.year, input.month, 10);

        const result = await db.insert(invoices).values({
          hotelId: hotelId,
          periodYear: input.year,
          periodMonth: input.month,
          bookingsTotal: String(total),
          commissionDue: String(commission),
          dueDate: dueDate.toISOString().split("T")[0] as any,
        } as any);

        const invoiceId = Number(result[0].insertId);

        for (const b of hotelBookings) {
          await db
            .update(bookings)
            .set({ invoiceId: invoiceId })
            .where(eq(bookings.id, b.id));
        }

        const hotel = await db.query.hotels.findFirst({
          where: eq(hotels.id, hotelId),
        });
        if (hotel?.ownerProfileId) {
          await db.insert(notifications).values({
            userId: Number(hotel.ownerProfileId),
            type: "invoice_issued",
            data: JSON.stringify({
              invoiceId,
              period: `${input.year}-${input.month}`,
              commissionDue: commission,
              dueDate,
            }),
          } as any);
        }

        count++;
      }

      await db.insert(auditLogs).values({
        actorId: ctx.user.id,
        action: "invoices.generate",
        targetType: "period",
        targetId: `${input.year}-${input.month}`,
        meta: JSON.stringify({ generated: count }),
      } as any);

      return { success: true, count };
    }),

  listAuditLogs: adminQuery
    .input(
      z.object({
        page: z.number().default(1),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;

      return db.query.auditLogs.findMany({
        with: { actor: true },
        limit: input.limit,
        offset,
        orderBy: [desc(auditLogs.createdAt)],
      });
    }),
});
