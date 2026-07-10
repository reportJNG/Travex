import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  AlertCircle,
  Archive,
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  Clock,
  Receipt,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_TABS = [
  { value: "all", label: "Tous" },
  { value: "pending_payment", label: "Paiement en ligne" },
  { value: "pending_hotel", label: "Révision hôtel" },
  { value: "awaiting_offline_payment", label: "Paiement offline" },
  { value: "confirmed", label: "Confirmé" },
  { value: "completed", label: "Terminé" },
  { value: "rejected", label: "Rejeté" },
] as const;

export default function Dashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data: bookings, isLoading, refetch } = trpc.booking.myBookings.useQuery();
  const archiveMutation = trpc.booking.archive.useMutation({
    onSuccess: () => { toast.success("Archivé"); refetch(); },
    onError: err => toast.error(err.message),
  });

  const counts = {
    total: bookings?.length ?? 0,
    pending: bookings?.filter(b => ["pending_hotel", "pending_payment", "awaiting_offline_payment"].includes(b.status)).length ?? 0,
    confirmed: bookings?.filter(b => ["confirmed", "completed"].includes(b.status)).length ?? 0,
  };

  const awaitingPaymentBookings = bookings?.filter(b => b.status === "awaiting_offline_payment") ?? [];
  const filtered = activeTab === "all" ? bookings : bookings?.filter(b => b.status === activeTab);

  function openReceiptSheet(bookingId?: string) {
    const bid = bookingId ?? awaitingPaymentBookings[0]?.id ?? "";
    if (bid) navigate(`/booking/${bid}/offline-payment`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Agence"
        title={t("dashboard.title")}
        description="Suivez le statut des réservations, les actions de paiement et les demandes archivées."
        actions={
          <Button asChild className="gap-2">
            <Link to="/marketplace">
              <ArrowUpRight className="h-4 w-4" />
              Parcourir la marketplace
            </Link>
          </Button>
        }
      />

      {/* Awaiting payment alert */}
      {awaitingPaymentBookings.length > 0 && (
        <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Paiement requis</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              Vous avez <strong>{awaitingPaymentBookings.length}</strong> réservation{awaitingPaymentBookings.length !== 1 ? "s" : ""} en attente de paiement offline.
              Téléversez les reçus dans les <strong>48 heures</strong>.
            </span>
            <Button
              size="sm"
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => openReceiptSheet()}
            >
              <Upload className="me-1.5 h-3.5 w-3.5" />
              Téléverser le reçu
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("dashboard.totalBookings")}
          value={counts.total}
          icon={<CalendarCheck className="h-5 w-5" />}
        />
        <StatCard
          label={t("dashboard.pending")}
          value={counts.pending}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label={t("dashboard.confirmed")}
          value={counts.confirmed}
          icon={<BadgeCheck className="h-5 w-5" />}
          tone="green"
        />
      </div>

      {/* Bookings table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="px-5 pt-5 pb-0">
          <h2 className="text-sm font-semibold text-foreground">{t("dashboard.recentBookings")}</h2>
        </div>
        <div className="pt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-4 overflow-x-auto">
              <TabsList className="inline-flex h-auto gap-1 bg-muted/50 p-1 rounded-lg">
                {STATUS_TABS.map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="rounded-md px-3 py-1.5 text-xs data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    {tab.label}
                    {tab.value !== "all" && bookings ? (
                      <span className="ms-1.5 rounded-full bg-muted px-1.5 text-[10px] font-medium tabular-nums">
                        {bookings.filter(b => b.status === tab.value).length}
                      </span>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : filtered && filtered.length > 0 ? (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Référence</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hôtel</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dates</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chambre</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total</TableHead>
                          <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</TableHead>
                          <TableHead className="w-20" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map(booking => (
                          <TableRow key={booking.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-mono text-xs text-muted-foreground py-3">
                              {booking.reference}
                            </TableCell>
                            <TableCell className="font-medium py-3">
                              {(booking.hotel as any)?.name || "—"}
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="text-sm">{booking.checkIn} → {booking.checkOut}</div>
                              <div className="text-xs text-muted-foreground">{booking.nights} nuits</div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground py-3">
                              {booking.roomNameSnapshot} ×{booking.roomsCount}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-foreground py-3">
                              {Number(booking.totalPrice).toLocaleString()} DZD
                            </TableCell>
                            <TableCell className="py-3">
                              <StatusBadge status={booking.status}>
                                {t(`booking.status.${booking.status}`) || booking.status}
                              </StatusBadge>
                            </TableCell>
                            <TableCell className="py-3">
                              <div className="flex justify-end gap-1">
                                {booking.status === "awaiting_offline_payment" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 border-amber-200 text-amber-700 hover:bg-amber-50"
                                    onClick={() => openReceiptSheet(booking.id)}
                                  >
                                    <Upload className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                                {["rejected", "expired", "cancelled"].includes(booking.status) && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-muted-foreground hover:text-foreground"
                                    onClick={() => archiveMutation.mutate({ bookingId: booking.id })}
                                    disabled={archiveMutation.isPending}
                                  >
                                    <Archive className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile cards */}
                  <div className="space-y-3 md:hidden">
                    {filtered.map(booking => (
                      <div key={booking.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-mono text-xs text-muted-foreground">{booking.reference}</div>
                            <h3 className="truncate font-semibold text-foreground">{(booking.hotel as any)?.name || "—"}</h3>
                          </div>
                          <StatusBadge status={booking.status}>
                            {t(`booking.status.${booking.status}`) || booking.status}
                          </StatusBadge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-0.5">Dates</div>
                            <div className="text-sm">{booking.checkIn} → {booking.checkOut}</div>
                            <div className="text-xs text-muted-foreground">{booking.nights} nuits</div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-0.5">Total</div>
                            <div className="font-semibold">{Number(booking.totalPrice).toLocaleString()} DZD</div>
                            <div className="text-xs text-muted-foreground">{booking.roomNameSnapshot} ×{booking.roomsCount}</div>
                          </div>
                        </div>
                        {booking.status === "awaiting_offline_payment" && (
                          <Button
                            size="sm"
                            className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => openReceiptSheet(booking.id)}
                          >
                            <Upload className="me-1.5 h-3.5 w-3.5" />
                            Téléverser le reçu
                          </Button>
                        )}
                        {["rejected", "expired", "cancelled"].includes(booking.status) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => archiveMutation.mutate({ bookingId: booking.id })}
                            disabled={archiveMutation.isPending}
                          >
                            <Archive className="me-1.5 h-3.5 w-3.5" />
                            Archiver
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<Receipt className="h-6 w-6" />}
                  title={activeTab === "all" ? "Aucune réservation" : `Aucune réservation (${activeTab.replace("_", " ")})`}
                  description={
                    activeTab === "all"
                      ? "Parcourez la marketplace pour créer votre première réservation B2B."
                      : "Essayez un autre filtre de statut."
                  }
                  action={
                    activeTab === "all" ? (
                      <Button asChild>
                        <Link to="/marketplace">Parcourir la marketplace</Link>
                      </Button>
                    ) : undefined
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
