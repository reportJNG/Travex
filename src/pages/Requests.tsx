import { useState } from "react";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ClipboardList, CheckCircle, XCircle, DollarSign, Clock } from "lucide-react";

export default function Requests() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.hotel.getRequests.useQuery();

  const decideMutation = trpc.booking.decide.useMutation({
    onSuccess: () => { toast.success("Decision saved"); utils.hotel.getRequests.invalidate(); },
    onError: (err) => toast.error(err.message),
  });
  const markReceived = trpc.booking.markReceived.useMutation({
    onSuccess: () => { toast.success("Payment confirmed"); utils.hotel.getRequests.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [refuseReason, setRefuseReason] = useState("");
  const [refusingId, setRefusingId] = useState<number | null>(null);

  const handleDecide = (bookingId: number, approve: boolean) => {
    if (!approve) {
      if (refusingId === bookingId) {
        if (!refuseReason || refuseReason.length < 3) {
          toast.error("Reason must be at least 3 characters");
          return;
        }
        decideMutation.mutate({ bookingId, approve: false, reason: refuseReason });
        setRefusingId(null);
        setRefuseReason("");
      } else {
        setRefusingId(bookingId);
        setRefuseReason("");
      }
      return;
    }
    decideMutation.mutate({ bookingId, approve: true });
  };

  const renderRequestCard = (b: any, showActions: boolean) => (
    <Card key={b.id} className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-slate-500">{b.reference}</span>
              <Badge className={
                b.status === "pending_hotel" ? "bg-yellow-100 text-yellow-700" :
                b.status === "awaiting_offline_payment" ? "bg-blue-100 text-blue-700" :
                "bg-green-100 text-green-700"
              }>
                {t(`booking.status.${b.status}`) || b.status}
              </Badge>
            </div>
            <h3 className="font-medium text-slate-800">
              {(b.agency as any)?.legalName || "Agency"}
            </h3>
            <p className="text-sm text-slate-500">
              {b.roomNameSnapshot} x {b.roomsCount} · {b.nights} nuits
            </p>
            <p className="text-sm text-slate-500">
              {b.checkIn} → {b.checkOut}
            </p>
            {b.hotelDeadline && (
              <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Deadline: {new Date(b.hotelDeadline).toLocaleString()}
              </p>
            )}
            {b.paymentDeadline && (
              <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                Payment window: {new Date(b.paymentDeadline).toLocaleString()}
              </p>
            )}
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-slate-800">
              {Number(b.totalPrice).toLocaleString()} DZD
            </div>
            <div className="text-xs text-slate-400">
              Commission: {Math.round(Number(b.totalPrice) * 0.05).toLocaleString()} DZD
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            {b.status === "pending_hotel" && (
              <div className="space-y-3">
                {refusingId === b.id && (
                  <div className="space-y-2">
                    <Label className="text-xs">{t("requests.reason")} *</Label>
                    <Textarea
                      value={refuseReason}
                      onChange={(e) => setRefuseReason(e.target.value)}
                      placeholder="Enter reason for refusal..."
                      className="text-sm"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleDecide(b.id, true)}
                    disabled={decideMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 me-1" />
                    {t("requests.agree")}
                  </Button>
                  <Button
                    size="sm"
                    variant={refusingId === b.id ? "default" : "outline"}
                    className={refusingId === b.id ? "bg-red-600 hover:bg-red-700" : "text-red-600 border-red-200 hover:bg-red-50"}
                    onClick={() => handleDecide(b.id, false)}
                    disabled={decideMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 me-1" />
                    {refusingId === b.id ? "Confirm Refuse" : t("requests.refuse")}
                  </Button>
                </div>
              </div>
            )}

            {b.status === "awaiting_offline_payment" && (
              <Button
                size="sm"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => {
                  if (confirm(`Confirm you received ${Number(b.totalPrice).toLocaleString()} DZD?`)) {
                    markReceived.mutate({ bookingId: b.id });
                  }
                }}
                disabled={markReceived.isPending}
              >
                <DollarSign className="h-4 w-4 me-1" />
                {t("requests.received")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) return <div className="p-8 text-center">Loading requests...</div>;

  const pending = data?.pending || [];
  const awaiting = data?.awaitingPayment || [];
  const other = data?.other || [];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <ClipboardList className="h-6 w-6" />
        {t("requests.title")}
      </h1>

      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending">
            {t("requests.pending")}
            {pending.length > 0 && (
              <Badge variant="secondary" className="ms-2">{pending.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="awaiting">
            {t("requests.awaitingPayment")}
            {awaiting.length > 0 && (
              <Badge variant="secondary" className="ms-2">{awaiting.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">{t("requests.history")}</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pending.length > 0 ? pending.map((b) => renderRequestCard(b, true)) : (
            <div className="text-center py-12 text-slate-400">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>{t("requests.noRequests")}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="awaiting" className="space-y-4">
          {awaiting.length > 0 ? awaiting.map((b) => renderRequestCard(b, true)) : (
            <div className="text-center py-12 text-slate-400">
              <DollarSign className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>{t("requests.noRequests")}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {other.length > 0 ? other.map((b) => renderRequestCard(b, false)) : (
            <div className="text-center py-12 text-slate-400">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>No history yet</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
