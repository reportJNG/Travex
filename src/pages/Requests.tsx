import { useState } from "react";
import { CheckCircle, Clock, ClipboardList, DollarSign, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

export default function Requests() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.hotel.getRequests.useQuery();
  const [refuseReason, setRefuseReason] = useState("");
  const [refusingId, setRefusingId] = useState<string | null>(null);

  const decideMutation = trpc.booking.decide.useMutation({
    onSuccess: () => {
      toast.success("Décision enregistrée");
      utils.hotel.getRequests.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const markReceived = trpc.booking.markReceived.useMutation({
    onSuccess: () => {
      toast.success("Paiement confirmé");
      utils.hotel.getRequests.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const pending = data?.pending || [];
  const awaiting = data?.awaitingPayment || [];
  const other = data?.other || [];

  const handleDecide = (bookingId: string, approve: boolean) => {
    if (!approve) {
      if (refusingId !== bookingId) {
        setRefusingId(bookingId);
        setRefuseReason("");
        return;
      }
      if (refuseReason.trim().length < 3) {
        toast.error("Le motif doit comporter au moins 3 caractères");
        return;
      }
      decideMutation.mutate({ bookingId, approve: false, reason: refuseReason.trim() });
      setRefusingId(null);
      setRefuseReason("");
      return;
    }
    decideMutation.mutate({ bookingId, approve: true });
  };

  const renderRequestCard = (booking: any, showActions: boolean) => (
    <div
      key={booking.id}
      className="overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-border/80"
    >
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                {booking.reference}
              </span>
              <StatusBadge status={booking.status}>{t(`booking.status.${booking.status}`)}</StatusBadge>
            </div>
            <div>
              <h3 className="truncate text-base font-semibold text-foreground">
                {(booking.agency as any)?.legalName || "Agence"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {booking.roomNameSnapshot} × {booking.roomsCount} · {booking.nights} nuit{booking.nights > 1 ? "s" : ""}
              </p>
              <p className="text-sm text-muted-foreground">
                {booking.checkIn} → {booking.checkOut}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {booking.hotelDeadline && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  Limite hôtel : {new Date(booking.hotelDeadline).toLocaleString("fr-DZ")}
                </span>
              )}
              {booking.paymentDeadline && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Limite paiement : {new Date(booking.paymentDeadline).toLocaleString("fr-DZ")}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 lg:flex-col lg:items-end lg:text-end">
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="text-lg font-bold text-foreground">
                {Number(booking.totalPrice).toLocaleString("fr-DZ")} DZD
              </div>
              <div className="text-xs text-muted-foreground">
                Commission : {Math.round(Number(booking.totalPrice) * 0.05).toLocaleString("fr-DZ")} DZD
              </div>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="mt-4 border-t border-border/60 pt-4">
            {booking.status === "pending_hotel" && (
              <div className="space-y-3">
                {refusingId === booking.id && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t("requests.reason")} *
                    </Label>
                    <Textarea
                      value={refuseReason}
                      onChange={(event) => setRefuseReason(event.target.value)}
                      placeholder="Motif de refus…"
                      className="text-sm"
                    />
                  </div>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="sm"
                    onClick={() => handleDecide(booking.id, true)}
                    disabled={decideMutation.isPending}
                  >
                    <CheckCircle className="me-1.5 h-4 w-4" />
                    {t("requests.agree")}
                  </Button>
                  <Button
                    size="sm"
                    variant={refusingId === booking.id ? "destructive" : "outline"}
                    onClick={() => handleDecide(booking.id, false)}
                    disabled={decideMutation.isPending}
                  >
                    <XCircle className="me-1.5 h-4 w-4" />
                    {refusingId === booking.id ? "Confirmer le refus" : t("requests.refuse")}
                  </Button>
                </div>
              </div>
            )}

            {booking.status === "awaiting_offline_payment" && (
              <ConfirmAction
                title="Confirmer la réception du paiement ?"
                description={`Confirmez que vous avez reçu ${Number(booking.totalPrice).toLocaleString("fr-DZ")} DZD pour ${booking.reference}.`}
                confirmLabel={t("requests.received")}
                onConfirm={() => markReceived.mutate({ bookingId: booking.id })}
              >
                <Button size="sm" disabled={markReceived.isPending}>
                  <DollarSign className="me-1.5 h-4 w-4" />
                  {t("requests.received")}
                </Button>
              </ConfirmAction>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Espace hôtel"
        title={t("requests.title")}
        description="Examinez les réservations, gérez les fenêtres de paiement et maintenez une communication claire avec les agences."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("requests.pending")}
          value={pending.length}
          icon={<ClipboardList className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label={t("requests.awaitingPayment")}
          value={awaiting.length}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <StatCard
          label={t("requests.history")}
          value={other.length}
          icon={<CheckCircle className="h-5 w-5" />}
          tone="green"
        />
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="inline-flex h-auto gap-1 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="pending" className="rounded-md px-3 py-1.5 text-sm">
            {t("requests.pending")}
            <span className="ms-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
              {pending.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="awaiting" className="rounded-md px-3 py-1.5 text-sm">
            Paiement
            <span className="ms-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {awaiting.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-md px-3 py-1.5 text-sm">
            {t("requests.history")}
          </TabsTrigger>
        </TabsList>

        {isLoading ? (
          <LoadingCards count={4} />
        ) : (
          <>
            <TabsContent value="pending" className="space-y-3">
              {pending.length
                ? pending.map((booking) => renderRequestCard(booking, true))
                : (
                  <EmptyState
                    icon={<ClipboardList className="h-6 w-6" />}
                    title={t("requests.noRequests")}
                    description="Les nouvelles demandes de réservation d'agences apparaîtront ici."
                  />
                )}
            </TabsContent>
            <TabsContent value="awaiting" className="space-y-3">
              {awaiting.length
                ? awaiting.map((booking) => renderRequestCard(booking, true))
                : (
                  <EmptyState
                    icon={<DollarSign className="h-6 w-6" />}
                    title={t("requests.noRequests")}
                    description="Les paiements hors ligne en attente apparaîtront ici."
                  />
                )}
            </TabsContent>
            <TabsContent value="history" className="space-y-3">
              {other.length
                ? other.map((booking) => renderRequestCard(booking, false))
                : (
                  <EmptyState
                    icon={<CheckCircle className="h-6 w-6" />}
                    title="Aucun historique"
                    description="Les demandes terminées, rejetées et expirées apparaîtront ici."
                  />
                )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
