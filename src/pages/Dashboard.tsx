import { useState } from "react";
import { Link } from "react-router";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  CalendarCheck, Clock, BadgeCheck, Receipt, Archive,
  Eye, Download, CreditCard
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  pending_hotel: "bg-yellow-100 text-yellow-700",
  awaiting_offline_payment: "bg-blue-100 text-blue-700",
  confirmed: "bg-green-100 text-green-700",
  completed: "bg-slate-100 text-slate-700",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-orange-100 text-orange-700",
  cancelled: "bg-gray-100 text-gray-700",
  pending_payment: "bg-purple-100 text-purple-700",
};

export default function Dashboard() {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: bookings, isLoading, refetch } = trpc.booking.myBookings.useQuery();
  const archiveMutation = trpc.booking.archive.useMutation({
    onSuccess: () => { toast.success("Archived"); refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const confirmPayment = trpc.booking.confirmPayment.useMutation({
    onSuccess: () => { toast.success("Payment confirmed"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter((b) => ["pending_hotel", "pending_payment", "awaiting_offline_payment"].includes(b.status)).length || 0,
    confirmed: bookings?.filter((b) => ["confirmed", "completed"].includes(b.status)).length || 0,
  };

  const filtered = statusFilter
    ? bookings?.filter((b) => b.status === statusFilter)
    : bookings;

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t("dashboard.title")}</h1>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-teal-50 flex items-center justify-center">
              <CalendarCheck className="h-6 w-6 text-teal-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-sm text-slate-500">{t("dashboard.totalBookings")}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{stats.pending}</div>
              <div className="text-sm text-slate-500">{t("dashboard.pending")}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-50 flex items-center justify-center">
              <BadgeCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">{stats.confirmed}</div>
              <div className="text-sm text-slate-500">{t("dashboard.confirmed")}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{t("dashboard.recentBookings")}</CardTitle>
            <div className="flex gap-2">
              {["pending_hotel", "confirmed", "rejected"].map((s) => (
                <Badge
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                >
                  {t(`booking.status.${s}`)}
                </Badge>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Ref</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Hôtel</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Dates</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Chambre</th>
                    <th className="text-right py-2 px-3 font-medium text-slate-500">Total</th>
                    <th className="text-left py-2 px-3 font-medium text-slate-500">Statut</th>
                    <th className="text-right py-2 px-3 font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((b) => (
                    <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-600">{b.reference}</td>
                      <td className="py-2.5 px-3">{(b.hotel as any)?.name || "-"}</td>
                      <td className="py-2.5 px-3 text-xs">
                        {b.checkIn} → {b.checkOut}
                        <br />
                        <span className="text-slate-400">{b.nights} nuits</span>
                      </td>
                      <td className="py-2.5 px-3 text-xs">
                        {b.roomNameSnapshot} x{b.roomsCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium">
                        {Number(b.totalPrice).toLocaleString()} DZD
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge className={`text-xs ${STATUS_COLORS[b.status] || ""}`}>
                          {t(`booking.status.${b.status}`) || b.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-1">
                          {b.status === "pending_payment" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => confirmPayment.mutate({ bookingId: b.id })}
                            >
                              <CreditCard className="h-3 w-3 me-1" />
                              Pay
                            </Button>
                          )}
                          {["rejected", "expired", "cancelled"].includes(b.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              onClick={() => archiveMutation.mutate({ bookingId: b.id })}
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Receipt className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>No bookings yet</p>
              <Link to="/marketplace">
                <Button variant="link" className="mt-2">Browse marketplace</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
