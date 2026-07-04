import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createSupabaseAdmin } from "./lib/supabase";

const app = new Hono<{ Bindings: HttpBindings }>();

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
  });
});

function cronAuthorized(req: Request) {
  if (!env.cronSecret) return !env.isProduction;
  return req.headers.get("authorization") === `Bearer ${env.cronSecret}`;
}

app.post("/api/webhooks/chargily", async (c) => {
  const payload = await c.req.json().catch(() => ({}));
  const checkoutId =
    payload.checkout_id ||
    payload.checkout?.id ||
    payload.data?.checkout_id ||
    payload.data?.id ||
    payload.id;

  if (!checkoutId || typeof checkoutId !== "string") {
    return c.json({ error: "checkout_id is required" }, 400);
  }

  const { error } = await createSupabaseAdmin().rpc("confirm_online_payment", {
    p_checkout_id: checkoutId,
  });

  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true });
});

app.post("/api/cron/expire-bookings", async (c) => {
  if (!cronAuthorized(c.req.raw)) return c.json({ error: "Unauthorized" }, 401);
  const { data, error } = await createSupabaseAdmin().rpc("expire_due_bookings");
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true, count: data ?? 0 });
});

app.post("/api/cron/complete-stays", async (c) => {
  if (!cronAuthorized(c.req.raw)) return c.json({ error: "Unauthorized" }, 401);
  const { data, error } = await createSupabaseAdmin().rpc("complete_finished_stays");
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true, count: data ?? 0 });
});

app.post("/api/cron/monthly-invoices", async (c) => {
  if (!cronAuthorized(c.req.raw)) return c.json({ error: "Unauthorized" }, 401);
  const payload = await c.req.json().catch(() => ({}));
  const now = new Date();
  const year = Number(payload.year ?? now.getUTCFullYear());
  const month = Number(payload.month ?? now.getUTCMonth() + 1);
  const { data, error } = await createSupabaseAdmin().rpc("generate_monthly_invoices", {
    p_year: year,
    p_month: month,
  });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ success: true, count: data ?? 0 });
});

app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction && !process.env.VERCEL) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
