import { useState } from "react";
import { CheckCircle, Clock, ClipboardList, DollarSign, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  const [refusingId, setRefusingId] = useState<number | null>(null);

  const decideMutation = trpc.booking.decide.useMutation({
    onSuccess: () => {
      toast.success("Decision saved");
      utils.hotel.getRequests.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const markReceived = trpc.booking.markReceived.useMutation({
    onSuccess: () => {
      toast.success("Payment confirmed");
      utils.hotel.getRequests.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const pending = data?.pending || [];
  const awaiting = data?.awaitingPayment || [];
  const other = data?.other || [];

  const handleDecide = (bookingId: number, approve: boolean) => {
    if (!approve) {
      if (refusingId !== bookingId) {
        setRefusingId(bookingId);
        setRefuseReason("");
        return;
      }
      if (refuseReason.trim().length < 3) {
        toast.error("Reason must be at least 3 characters");
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
    <Card key={booking.id} className="overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
                {booking.reference}
              </span>
              <StatusBadge status={booking.status}>{t(`booking.status.${booking.status}`)}</StatusBadge>
            </div>
            <div>
              <h3 className="truncate text-base font-semibold text-foreground">
                {(booking.agency as any)?.legalName || "Agency"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {booking.roomNameSnapshot} x {booking.roomsCount} - {booking.nights} nights
              </p>
              <p className="text-sm text-muted-foreground">
                {booking.checkIn} to {booking.checkOut}
              </p>
            </div>
            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              {booking.hotelDeadline ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  Deadline: {new Date(booking.hotelDeadline).toLocaleString()}
                </span>
              ) : null}
              {booking.paymentDeadline ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  Payment window: {new Date(booking.paymentDeadline).toLocaleString()}
                </span>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-3 text-start lg:min-w-48 lg:text-end">
            <div className="text-lg font-bold text-foreground">
              {Number(booking.totalPrice).toLocaleString()} DZD
            </div>
            <div className="text-xs text-muted-foreground">
              Commission {Math.round(Number(booking.totalPrice) * 0.05).toLocaleString()} DZD
            </div>
          </div>
        </div>

        {showActions ? (
          <div className="mt-4 border-t pt-4">
            {booking.status === "pending_hotel" ? (
              <div className="space-y-3">
                {refusingId === booking.id ? (
                  <div className="space-y-2">
                    <Label className="text-xs">{t("requests.reason")} *</Label>
                    <Textarea
                      value={refuseReason}
                      onChange={(event) => setRefuseReason(event.target.value)}
                      placeholder="Enter reason for refusal..."
                    />
                  </div>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="sm"
                    onClick={() => handleDecide(booking.id, true)}
                    disabled={decideMutation.isPending}
                  >
                    <CheckCircle className="me-1 h-4 w-4" />
                    {t("requests.agree")}
                  </Button>
                  <Button
                    size="sm"
                    variant={refusingId === booking.id ? "destructive" : "outline"}
                    onClick={() => handleDecide(booking.id, false)}
                    disabled={decideMutation.isPending}
                  >
                    <XCircle className="me-1 h-4 w-4" />
                    {refusingId === booking.id ? "Confirm refusal" : t("requests.refuse")}
                  </Button>
                </div>
              </div>
            ) : null}

            {booking.status === "awaiting_offline_payment" ? (
              <ConfirmAction
                title="Confirm payment received?"
                description={`Confirm you received ${Number(booking.totalPrice).toLocaleString()} DZD for ${booking.reference}.`}
                confirmLabel={t("requests.received")}
                onConfirm={() => markReceived.mutate({ bookingId: booking.id })}
              >
                <Button size="sm" disabled={markReceived.isPending}>
                  <DollarSign className="me-1 h-4 w-4" />
                  {t("requests.received")}
                </Button>
              </ConfirmAction>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Hotel workspace"
        title={t("requests.title")}
        description="Review bookings, manage payment windows, and keep agency communication clear."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("requests.pending")} value={pending.length} icon={<ClipboardList className="h-5 w-5" />} tone="amber" />
        <StatCard label={t("requests.awaitingPayment")} value={awaiting.length} icon={<DollarSign className="h-5 w-5" />} />
        <StatCard label={t("requests.history")} value={other.length} icon={<CheckCircle className="h-5 w-5" />} tone="green" />
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-3 sm:w-auto sm:inline-grid">
          <TabsTrigger value="pending">{t("requests.pending")} ({pending.length})</TabsTrigger>
          <TabsTrigger value="awaiting">{t("requests.awaitingPayment")} ({awaiting.length})</TabsTrigger>
          <TabsTrigger value="history">{t("requests.history")}</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <LoadingCards count={4} />
        ) : (
          <>
            <TabsContent value="pending" className="space-y-4">
              {pending.length ? pending.map((booking) => renderRequestCard(booking, true)) : (
                <EmptyState icon={<ClipboardList className="h-6 w-6" />} title={t("requests.noRequests")} description="New agency booking requests will appear here." />
              )}
            </TabsContent>
            <TabsContent value="awaiting" className="space-y-4">
              {awaiting.length ? awaiting.map((booking) => renderRequestCard(booking, true)) : (
                <EmptyState icon={<DollarSign className="h-6 w-6" />} title={t("requests.noRequests")} description="Approved offline payments waiting for confirmation will appear here." />
              )}
            </TabsContent>
            <TabsContent value="history" className="space-y-4">
              {other.length ? other.map((booking) => renderRequestCard(booking, false)) : (
                <EmptyState icon={<CheckCircle className="h-6 w-6" />} title="No history yet" description="Completed, rejected, and expired requests will appear here." />
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
