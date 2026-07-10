import { BarChart3, BedDouble, Calendar, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
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
        description="Volume de réservations, nuits vendues, revenus et taux de confirmation pour votre hôtel."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Ce mois vs le mois précédent</h3>
          {data ? (
            <div className="space-y-5">
              {[
                { label: "Réservations", current: data.thisMonthBookings, last: data.lastMonthBookings },
                { label: "Nuits vendues", current: data.thisMonthNights, last: data.lastMonthNights },
                { label: "Revenus (DZD)", current: data.thisMonthRevenue, last: data.lastMonthRevenue },
              ].map((row) => {
                const max = Math.max(row.current, row.last, 1);
                return (
                  <div key={row.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-semibold text-foreground">{row.current.toLocaleString("fr-DZ")}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${(row.current / max) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Ce mois</span>
                      <span>Précédent : {row.last.toLocaleString("fr-DZ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-6 w-6" />}
              title="Aucune donnée"
              description="Les statistiques s'afficheront à mesure que les réservations sont confirmées."
            />
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">Vue d'ensemble des réservations</h3>
          {data && data.totalBookings > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3.5">
                <span className="text-sm text-muted-foreground">Total réservations</span>
                <span className="text-2xl font-bold text-foreground">{data.totalBookings}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3.5">
                <span className="text-sm text-emerald-700">Confirmées / complétées</span>
                <span className="text-2xl font-bold text-emerald-700">{data.confirmedTotal}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3.5">
                <span className="text-sm text-primary">Taux de confirmation</span>
                <span className="text-2xl font-bold text-primary">{occupancyRate}%</span>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<BarChart3 className="h-6 w-6" />}
              title="Aucune réservation"
              description="Acceptez votre première réservation pour voir les statistiques."
            />
          )}
        </div>
      </div>
    </div>
  );
}
