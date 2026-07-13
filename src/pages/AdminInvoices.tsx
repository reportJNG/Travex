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
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const utils = trpc.useUtils();
  const parsedYear = Number(year);
  const parsedMonth = Number(month);
  const canGenerate =
    Number.isInteger(parsedYear) &&
    parsedYear >= 2024 &&
    parsedYear <= 2030 &&
    Number.isInteger(parsedMonth) &&
    parsedMonth >= 1 &&
    parsedMonth <= 12;

  const generateMutation = trpc.admin.generateInvoices.useMutation({
    onSuccess: data => {
      toast.success(
        `${data.count} facture${data.count !== 1 ? "s" : ""} générée${data.count !== 1 ? "s" : ""}`
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
          Générer les factures mensuelles
        </h3>
      </div>
      <div className="px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="space-y-1.5">
            <Label>Année</Label>
            <Input
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              onBlur={e => {
                const parsed = Number(e.target.value);
                setYear(String(Number.isInteger(parsed) && parsed >= 2024 && parsed <= 2030 ? parsed : now.getFullYear()));
              }}
              className="w-28"
              min={2024}
              max={2030}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mois</Label>
            <Input
              type="number"
              value={month}
              onChange={e => setMonth(e.target.value)}
              onBlur={e => {
                const parsed = Number(e.target.value);
                setMonth(String(Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : now.getMonth() + 1));
              }}
              className="w-20"
              min={1}
              max={12}
            />
          </div>
          <ConfirmAction
            title="Générer les factures ?"
            description={`This will create commission invoices for all hotels for ${parsedYear}-${String(parsedMonth).padStart(2, "0")}. Existing invoices for this period will be skipped.`}
            confirmLabel="Générer"
            onConfirm={() => {
              if (!canGenerate) {
                toast.error("Saisissez une année et un mois valides");
                return;
              }
              generateMutation.mutate({ year: parsedYear, month: parsedMonth });
            }}
          >
            <Button disabled={generateMutation.isPending || !canGenerate}>
              <RefreshCw
                className={`me-2 h-4 w-4 ${generateMutation.isPending ? "animate-spin" : ""}`}
              />
              Générer
            </Button>
          </ConfirmAction>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Génère les factures de commission à 5% pour toutes les réservations confirmées de la période.
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
      toast.success("Facture marquée comme payée");
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
          <Label className="text-xs">Référence paiement</Label>
          <Input
            placeholder="Référence virement CCP/CIB..."
            value={paymentRef}
            onChange={e => setPaymentRef(e.target.value)}
          />
        </div>
        <ConfirmAction
          title="Marquer la facture comme payée ?"
          description={`Confirm payment of ${Number(invoice.commissionDue).toLocaleString()} DZD for ${(invoice.hotel as any)?.name || "this hotel"}.`}
          confirmLabel="Marquer payée"
          onConfirm={() => {
            if (!paymentRef.trim()) {
              toast.error("La référence de paiement est obligatoire");
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
            Marquer payée
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
        description="Générez, vérifiez et marquez les factures mensuelles de commission hôtel comme payées."
      />

      <GenerateInvoicesForm />

      {isLoading ? (
        <LoadingCards count={4} />
      ) : invoices && invoices.length > 0 ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Commissions impayées"
              value={`${(totalUnpaid / 1000).toFixed(1)}K DZD`}
              icon={<AlertCircle className="h-5 w-5" />}
              tone="amber"
            />
            <StatCard
              label="En retard"
              value={`${(totalOverdue / 1000).toFixed(1)}K DZD`}
              icon={<AlertCircle className="h-5 w-5" />}
              tone="slate"
            />
            <StatCard
              label="Collecté"
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
                <div key={inv.id as string} className="overflow-hidden rounded-xl border border-border bg-card">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate font-semibold">
                              {(hotel?.name as string) || "Hôtel inconnu"}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {period}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-3 text-sm sm:grid-cols-3">
                          <div>
                            <span className="text-xs uppercase tracking-wide text-muted-foreground">
                              Total réservations
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
                              Échéance
                            </span>
                            <p className="mt-0.5 font-semibold">
                              {inv.dueDate as string}
                            </p>
                          </div>
                          {inv.paidAt ? (
                            <div>
                              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                Payé le
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
                                Référence paiement
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
              title="Aucune facture"
              description="Utilisez le formulaire ci-dessus pour générer les factures mensuelles des hôtels."
            />
          </div>
        </div>
      )}
    </div>
  );
}
