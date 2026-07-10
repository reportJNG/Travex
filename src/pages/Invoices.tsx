import { useState } from "react";
import { ChevronDown, ChevronRight, Receipt } from "lucide-react";
import { Link } from "react-router";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

export default function Invoices() {
  const { t } = useI18n();
  const { data: statement, isLoading } = trpc.booking.myStatement.useQuery();
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalVolume =
    statement?.reduce((s: number, group: any) => s + group.total, 0) ?? 0;
  const totalBookings =
    statement?.reduce((s: number, group: any) => s + group.bookings.length, 0) ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Facturation"
        title={t("invoices.title")}
        description="Récapitulatif mensuel des réservations confirmées et des commissions estimées pour votre agence."
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : statement && statement.length > 0 ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Total réservations"
              value={totalBookings}
              icon={<Receipt className="h-5 w-5" />}
            />
            <StatCard
              label="Volume total"
              value={`${(totalVolume / 1000).toFixed(0)}K DZD`}
              icon={<Receipt className="h-5 w-5" />}
              tone="green"
            />
            <StatCard
              label="Périodes actives"
              value={statement.length}
              icon={<Receipt className="h-5 w-5" />}
              tone="amber"
            />
          </div>

          <div className="space-y-2">
            {statement.map((group: any) => {
              const isOpen = expanded === group.period;
              return (
                <div
                  key={group.period}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40 sm:px-5"
                    onClick={() => setExpanded(isOpen ? null : group.period)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground">{group.period}</div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {group.bookings.length} réservation{group.bookings.length !== 1 ? "s" : ""}
                        {group.commissionTotal > 0
                          ? ` · Commission : ${group.commissionTotal.toLocaleString("fr-DZ")} DZD`
                          : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-bold text-foreground">
                        {group.total.toLocaleString("fr-DZ")} DZD
                      </div>
                      <div className="text-xs text-muted-foreground">total</div>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="divide-y divide-border border-t bg-muted/20">
                      {group.bookings.map((booking: any) => (
                        <div
                          key={booking.id}
                          className="flex flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
                        >
                          <div className="min-w-0">
                            <span className="font-mono text-xs text-muted-foreground">
                              {booking.reference}
                            </span>
                            <span className="mx-2 text-muted-foreground">·</span>
                            <span className="font-medium">
                              {(booking.hotel as any)?.name || "—"}
                            </span>
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {booking.roomNameSnapshot} ×{booking.roomsCount} · {booking.checkIn} → {booking.checkOut}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <StatusBadge status={booking.status}>
                              {t(`booking.status.${booking.status}`) || booking.status}
                            </StatusBadge>
                            <span className="font-semibold text-primary">
                              {Number(booking.totalPrice).toLocaleString("fr-DZ")} DZD
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <EmptyState
            icon={<Receipt className="h-6 w-6" />}
            title="Aucune réservation"
            description="Les réservations confirmées groupées par mois apparaîtront ici."
            action={
              <Button asChild>
                <Link to="/marketplace">Parcourir le marketplace</Link>
              </Button>
            }
          />
        </div>
      )}
    </div>
  );
}
