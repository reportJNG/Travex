import { useState } from "react";
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle,
  FileText,
  Receipt,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

function GenerateInvoicesForm() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const utils = trpc.useUtils();

  const generateMutation = trpc.admin.generateInvoices.useMutation({
    onSuccess: data => {
      toast.success(
        `Generated ${data.count} invoice${data.count !== 1 ? "s" : ""}`
      );
      utils.admin.listInvoices.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  return (
    <div className="mb-6 rounded-xl border border-primary/25 bg-primary/5">
      <div className="px-5 pt-5 pb-0">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          Generate monthly invoices
        </h3>
      </div>
      <div className="px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label>Year</Label>
            <Input
              type="number"
              value={year}
              onChange={e =>
                setYear(parseInt(e.target.value) || now.getFullYear())
              }
              className="w-28"
              min={2024}
              max={2030}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Month</Label>
            <Input
              type="number"
              value={month}
              onChange={e =>
                setMonth(
                  Math.min(12, Math.max(1, parseInt(e.target.value) || 1))
                )
              }
              className="w-20"
              min={1}
              max={12}
            />
          </div>
          <ConfirmAction
            title="Generate invoices?"
            description={`This will create commission invoices for all hotels for ${year}-${String(month).padStart(2, "0")}. Existing invoices for this period will be skipped.`}
            confirmLabel="Generate"
            onConfirm={() => generateMutation.mutate({ year, month })}
          >
            <Button disabled={generateMutation.isPending}>
              <RefreshCw
                className={`me-2 h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`}
              />
              Generate invoices
            </Button>
          </ConfirmAction>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Generates commission invoices at 5% rate for all confirmed bookings in
          the selected period.
        </p>
      </div>
    </div>
  );
}

function MarkPaidDialog({ invoice }: { invoice: Record<string, unknown> }) {
  const [paymentRef, setPaymentRef] = useState("");
  const utils = trpc.useUtils();

  const markPaid = trpc.admin.markInvoicePaid.useMutation({
    onSuccess: () => {
      toast.success("Invoice marked as paid");
      utils.admin.listInvoices.invalidate();
      setPaymentRef("");
    },
    onError: err => toast.error(err.message),
  });

  if (invoice.status !== "unpaid" && invoice.status !== "overdue") return null;

  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs">Payment reference</Label>
          <Input
            placeholder="CCP/CIB transfer reference..."
            value={paymentRef}
            onChange={e => setPaymentRef(e.target.value)}
          />
        </div>
        <ConfirmAction
          title="Mark invoice as paid?"
          description={`Confirm payment of ${Number(invoice.commissionDue).toLocaleString()} DZD for ${(invoice.hotel as any)?.name || "this hotel"}.`}
          confirmLabel="Mark paid"
          onConfirm={() => {
            if (!paymentRef.trim()) {
              toast.error("Payment reference is required");
              return;
            }
            markPaid.mutate({
              invoiceId: invoice.id as string,
              paymentReference: paymentRef.trim(),
            });
          }}
        >
          <Button size="sm" disabled={markPaid.isPending || !paymentRef.trim()}>
            <CheckCircle className="me-1 h-4 w-4" />
            Mark paid
          </Button>
        </ConfirmAction>
      </div>
    </div>
  );
}

export default function AdminInvoices() {
  const { t } = useI18n();
  const { data: invoices, isLoading } = trpc.admin.listInvoices.useQuery();

  const totalUnpaid =
    invoices
      ?.filter((inv: any) => inv.status === "unpaid")
      .reduce((s: number, inv: any) => s + Number(inv.commissionDue), 0) ?? 0;
  const totalOverdue =
    invoices
      ?.filter((inv: any) => inv.status === "overdue")
      .reduce((s: number, inv: any) => s + Number(inv.commissionDue), 0) ?? 0;
  const totalPaid =
    invoices
      ?.filter((inv: any) => inv.status === "paid")
      .reduce((s: number, inv: any) => s + Number(inv.commissionDue), 0) ?? 0;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title={t("admin.invoices")}
        description="Generate, review, and mark monthly hotel commission invoices as paid."
      />

      <GenerateInvoicesForm />

      {isLoading ? (
        <LoadingCards count={4} />
      ) : invoices && invoices.length > 0 ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Unpaid commissions"
              value={`${(totalUnpaid / 1000).toFixed(1)}K DZD`}
              icon={<AlertCircle className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="Overdue"
              value={`${(totalOverdue / 1000).toFixed(1)}K DZD`}
              icon={<AlertCircle className="h-5 w-5" />}
              tone="slate"
            />
            <StatCard
              label="Collected"
              value={`${(totalPaid / 1000).toFixed(1)}K DZD`}
              icon={<Receipt className="h-5 w-5" />}
              tone="green"
            />
          </div>

          <div className="space-y-3">
            {(invoices as Record<string, unknown>[]).map(inv => {
              const hotel = inv.hotel as Record<string, unknown> | undefined;
              const period = `${inv.periodYear}-${String(inv.periodMonth).padStart(2, "0")}`;
              return (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">
                              {(hotel?.name as string) || "Unknown hotel"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {period}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 text-sm sm:grid-cols-3">
                          <div>
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                              Bookings total
                            </span>
                            <p className="mt-0.5 font-semibold">
                              {Number(inv.bookingsTotal).toLocaleString()} DZD
                            </p>
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                              Commission (5%)
                            </span>
                            <p className="mt-0.5 font-semibold text-primary">
                              {Number(inv.commissionDue).toLocaleString()} DZD
                            </p>
                          </div>
                          <div>
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                              Due date
                            </span>
                            <p className="mt-0.5 font-semibold">
                              {inv.dueDate as string}
                            </p>
                          </div>
                          {inv.paidAt ? (
                            <div>
                              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                Paid at
                              </span>
                              <p className="mt-0.5 font-semibold">
                                {new Date(
                                  inv.paidAt as string
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          ) : null}
                          {inv.paymentReference ? (
                            <div>
                              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                Payment ref
                              </span>
                              <p className="mt-0.5 font-mono text-xs">
                                {inv.paymentReference as string}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <StatusBadge status={inv.status as string}>
                        {t(`invoices.status.${inv.status as string}`) ||
                          (inv.status as string)}
                      </StatusBadge>
                    </div>
                    <MarkPaidDialog invoice={inv} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-6">
            <EmptyState
              icon={<FileText className="h-6 w-6" />}
              title="No invoices yet"
              description="Use the form above to generate monthly invoices for all hotels."
            />
          </div>
        </div>
      )}
    </div>
  );
}
