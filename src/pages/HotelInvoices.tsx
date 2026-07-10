import { AlertCircle, ChevronDown, ChevronRight, Receipt } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { StatCard } from "@/components/app/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

function pct(a: number, b: number) {
  if (!b) return null;
  const diff = ((a - b) / b) * 100;
  return diff > 0 ? `+${diff.toFixed(0)}%` : `${diff.toFixed(0)}%`;
}

export default function HotelInvoices() {
  const { t } = useI18n();
  const { data: invoices, isLoading } = trpc.hotel.myInvoices.useQuery();
  const [expanded, setExpanded] = useState<number | null>(null);

  const unpaidTotal = invoices?.filter((inv: any) => inv.status === "unpaid").reduce((s: number, inv: any) => s + Number(inv.commissionDue), 0) ?? 0;
  const overdueTotal = invoices?.filter((inv: any) => inv.status === "overdue").reduce((s: number, inv: any) => s + Number(inv.commissionDue), 0) ?? 0;
  const paidCount = invoices?.filter((inv: any) => inv.status === "paid").length ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title={t("invoices.title")}
        description="Review monthly commission invoices and payment instructions for your hotel account."
      />

      <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            <h3 className="font-medium text-foreground">Commission rate: 5%</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("invoices.payInfo")}. Invoices are generated automatically at the end of each month.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : invoices && invoices.length > 0 ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Unpaid"
              value={`${unpaidTotal.toLocaleString()} DZD`}
              icon={<Receipt className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Overdue"
              value={`${overdueTotal.toLocaleString()} DZD`}
              icon={<AlertCircle className="h-5 w-5" />}
              tone="slate"
            />
            <StatCard
              label="Paid invoices"
              value={paidCount}
              icon={<Receipt className="h-5 w-5" />}
              tone="green"
            />
          </div>

          <div className="space-y-3">
            {invoices.map((inv: any) => {
              const isOpen = expanded === inv.id;
              const period = `${inv.periodYear}-${String(inv.periodMonth).padStart(2, "0")}`;
              return (
                <Card key={inv.id} className="overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center gap-4 p-4 text-left hover:bg-muted/40 transition-colors sm:p-5"
                    onClick={() => setExpanded(isOpen ? null : inv.id)}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Receipt className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{period}</span>
                        <StatusBadge status={inv.status}>{t(`invoices.status.${inv.status}`)}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Due: {inv.dueDate} · Commission: <span className="font-medium text-foreground">{Number(inv.commissionDue).toLocaleString()} DZD</span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-bold text-foreground">{Number(inv.bookingsTotal).toLocaleString()} DZD</div>
                      <div className="text-xs text-muted-foreground">total bookings</div>
                    </div>
                    {isOpen ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  </button>
                  {isOpen ? (
                    <div className="border-t bg-muted/20 px-4 py-3 sm:px-5">
                      <div className="grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">Bookings total</span>
                          <p className="mt-1 font-semibold">{Number(inv.bookingsTotal).toLocaleString()} DZD</p>
                        </div>
                        <div>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">Commission (5%)</span>
                          <p className="mt-1 font-semibold text-primary">{Number(inv.commissionDue).toLocaleString()} DZD</p>
                        </div>
                        <div>
                          <span className="text-xs uppercase tracking-wide text-muted-foreground">Due date</span>
                          <p className="mt-1 font-semibold">{inv.dueDate}</p>
                        </div>
                        {inv.paidAt ? (
                          <div>
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">Paid at</span>
                            <p className="mt-1 font-semibold">{new Date(inv.paidAt).toLocaleDateString()}</p>
                          </div>
                        ) : null}
                        {inv.paymentReference ? (
                          <div>
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">Payment ref</span>
                            <p className="mt-1 font-mono text-xs">{inv.paymentReference}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Invoice history
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<Receipt className="h-6 w-6" />}
              title="No invoices yet"
              description="Invoices will appear after bookings are confirmed. They are generated automatically each month."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
