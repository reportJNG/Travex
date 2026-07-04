import { authRouter } from "./auth-router";
import { hotelRouter } from "./hotel-router";
import { bookingRouter } from "./booking-router";
import { marketplaceRouter } from "./marketplace-router";
import { adminRouter } from "./admin-router";
import { notificationRouter } from "./notification-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  hotel: hotelRouter,
  booking: bookingRouter,
  marketplace: marketplaceRouter,
  admin: adminRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;
