import { BarChart3, BedDouble, Calendar, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

function trend(current: number, previous: number): string | undefined {
  if (!previous) return current > 0 ? "+100%" : undefined;
  const pct = ((current - previous) / previous) * 100;
  return pct > 0 ? `+${pct.toFixed(0)}% vs last month` : `${pct.toFixed(0)}% vs last month`;
}

function trendTone(current: number, previous: number): "green" | "amber" | undefined {
  if (!previous && !current) return undefined;
  return current >= previous ? "green" : "amber";
}

export default function Analytics() {
  const { t } = useI18n();
  const { data, isLoading } = trpc.hotel.analytics.useQuery();

  if (isLoading) {
    return (
      <div>
        <PageHeader
          eyebrow="Performance"
          title={t("nav.analytics")}
          description="Booking volume, room nights, revenue, and occupancy for your hotel."
        />
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  const occupancyRate = data && data.totalBookings > 0
    ? Math.round((data.confirmedTotal / data.totalBookings) * 100)
    : 0;

  const stats = data ? [
    {
      label: "Bookings this month",
      value: data.thisMonthBookings,
      helper: trend(data.thisMonthBookings, data.lastMonthBookings),
      icon: <Calendar className="h-5 w-5" />,
      tone: trendTone(data.thisMonthBookings, data.lastMonthBookings),
    },
    {
      label: "Room nights sold",
      value: data.thisMonthNights,
      helper: trend(data.thisMonthNights, data.lastMonthNights),
      icon: <BedDouble className="h-5 w-5" />,
      tone: trendTone(data.thisMonthNights, data.lastMonthNights),
    },
    {
      label: "Revenue this month",
      value: `${(data.thisMonthRevenue / 1000).toFixed(0)}K DZD`,
      helper: trend(data.thisMonthRevenue, data.lastMonthRevenue),
      icon: <TrendingUp className="h-5 w-5" />,
      tone: trendTone(data.thisMonthRevenue, data.lastMonthRevenue),
    },
    {
      label: "Confirmation rate",
      value: `${occupancyRate}%`,
      helper: `${data.confirmedTotal} of ${data.totalBookings} total bookings`,
      icon: <BarChart3 className="h-5 w-5" />,
      tone: (occupancyRate >= 60 ? "green" : "amber") as "green" | "amber",
    },
  ] : [];

  return (
    <div>
      <PageHeader
        eyebrow="Performance"
        title={t("nav.analytics")}
        description="A clean overview of booking volume, room nights, revenue, and confirmation signals."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This month vs last month</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <div className="space-y-4">
                {[
                  { label: "Bookings", current: data.thisMonthBookings, last: data.lastMonthBookings },
                  { label: "Room nights", current: data.thisMonthNights, last: data.lastMonthNights },
                  { label: "Revenue (DZD)", current: data.thisMonthRevenue, last: data.lastMonthRevenue },
                ].map((row) => {
                  const max = Math.max(row.current, row.last, 1);
                  return (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-medium">{row.current.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-1">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${(row.current / max) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>This month</span>
                        <span>Last: {row.last.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<BarChart3 className="h-6 w-6" />}
                title="No data yet"
                description="Stats will populate as bookings are confirmed."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking overview</CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.totalBookings > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-muted/50 p-4">
                  <span className="text-sm text-muted-foreground">Total bookings ever</span>
                  <span className="text-2xl font-bold text-foreground">{data.totalBookings}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-4">
                  <span className="text-sm text-emerald-700">Confirmed / completed</span>
                  <span className="text-2xl font-bold text-emerald-700">{data.confirmedTotal}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-primary/5 p-4">
                  <span className="text-sm text-primary">Confirmation rate</span>
                  <span className="text-2xl font-bold text-primary">{occupancyRate}%</span>
                </div>
              </div>
            ) : (
              <EmptyState
                icon={<BarChart3 className="h-6 w-6" />}
                title="No bookings yet"
                description="Accept your first booking to see overview stats."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
