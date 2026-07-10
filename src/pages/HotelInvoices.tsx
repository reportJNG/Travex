import { AlertCircle, ChevronDown, ChevronRight, Receipt } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { StatCard } from "@/components/app/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

export default function HotelInvoices() {
  const { t } = useI18n();
  const { data: invoices, isLoading } = trpc.hotel.myInvoices.useQuery();
  const [expanded, setExpanded] = useState<number | null>(null);

  const unpaidTotal =
    invoices
      ?.filter((inv: any) => inv.status === "unpaid")
      .reduce((s: number, inv: any) => s + Number(inv.commissionDue), 0) ?? 0;
  const overdueTotal =
    invoices
      ?.filter((inv: any) => inv.status === "overdue")
      .reduce((s: number, inv: any) => s + Number(inv.commissionDue), 0) ?? 0;
  const paidCount =
    invoices?.filter((inv: any) => inv.status === "paid").length ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Facturation"
        title={t("invoices.title")}
        description="Consultez les factures de commission mensuelles et les instructions de paiement pour votre compte hôtel."
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <h3 className="font-semibold text-foreground">Taux de commission : 5%</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("invoices.payInfo")}. Les factures sont générées automatiquement à la fin de chaque mois.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : invoices && invoices.length > 0 ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Non payé"
              value={`${unpaidTotal.toLocaleString("fr-DZ")} DZD`}
              icon={<Receipt className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="En retard"
              value={`${overdueTotal.toLocaleString("fr-DZ")} DZD`}
              icon={<AlertCircle className="h-5 w-5" />}
              tone="slate"
            />
            <StatCard
              label="Factures payées"
              value={paidCount}
              icon={<Receipt className="h-5 w-5" />}
              tone="green"
            />
          </div>

          <div className="space-y-2">
            {invoices.map((inv: any) => {
              const isOpen = expanded === inv.id;
              const period = `${inv.periodYear}-${String(inv.periodMonth).padStart(2, "0")}`;
              return (
                <div
                  key={inv.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/40 sm:px-5"
                    onClick={() => setExpanded(isOpen ? null : inv.id)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{period}</span>
                        <StatusBadge status={inv.status}>
                          {t(`invoices.status.${inv.status}`)}
                        </StatusBadge>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Échéance : {inv.dueDate} · Commission :{" "}
                        <span className="font-medium text-foreground">
                          {Number(inv.commissionDue).toLocaleString("fr-DZ")} DZD
                        </span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-bold text-foreground">
                        {Number(inv.bookingsTotal).toLocaleString("fr-DZ")} DZD
                      </div>
                      <div className="text-xs text-muted-foreground">total réservations</div>
                    </div>
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-border bg-muted/20 px-4 py-4 sm:px-5">
                      <div className="grid gap-4 text-sm sm:grid-cols-3">
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Total réservations
                          </span>
                          <p className="mt-1 font-semibold">
                            {Number(inv.bookingsTotal).toLocaleString("fr-DZ")} DZD
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Commission (5%)
                          </span>
                          <p className="mt-1 font-semibold text-primary">
                            {Number(inv.commissionDue).toLocaleString("fr-DZ")} DZD
                          </p>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Date d'échéance
                          </span>
                          <p className="mt-1 font-semibold">{inv.dueDate}</p>
                        </div>
                        {inv.paidAt && (
                          <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Payé le
                            </span>
                            <p className="mt-1 font-semibold">
                              {new Date(inv.paidAt).toLocaleDateString("fr-DZ")}
                            </p>
                          </div>
                        )}
                        {inv.paymentReference && (
                          <div>
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              Référence paiement
                            </span>
                            <p className="mt-1 font-mono text-xs">{inv.paymentReference}</p>
                          </div>
                        )}
                      </div>
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
            title="Aucune facture"
            description="Les factures apparaissent après confirmation des réservations. Elles sont générées automatiquement chaque mois."
          />
        </div>
      )}
    </div>
  );
}
