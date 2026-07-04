import { useState } from "react";
import { Link } from "react-router";
import { Archive, BadgeCheck, CalendarCheck, Clock, CreditCard, Receipt } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    pending: bookings?.filter((booking) => ["pending_hotel", "pending_payment", "awaiting_offline_payment"].includes(booking.status)).length || 0,
    confirmed: bookings?.filter((booking) => ["confirmed", "completed"].includes(booking.status)).length || 0,
  };
  const filtered = statusFilter ? bookings?.filter((booking) => booking.status === statusFilter) : bookings;

  return (
    <div>
      <PageHeader
        eyebrow="Agency"
        title={t("dashboard.title")}
        description="Track booking status, payment actions, and archived requests across your agency workspace."
        actions={<Button asChild><Link to="/marketplace">Browse marketplace</Link></Button>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("dashboard.totalBookings")} value={stats.total} icon={<CalendarCheck className="h-5 w-5" />} />
        <StatCard label={t("dashboard.pending")} value={stats.pending} icon={<Clock className="h-5 w-5" />} tone="amber" />
        <StatCard label={t("dashboard.confirmed")} value={stats.confirmed} icon={<BadgeCheck className="h-5 w-5" />} tone="green" />
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{t("dashboard.recentBookings")}</CardTitle>
          <div className="flex flex-wrap gap-2">
            {["pending_hotel", "confirmed", "rejected"].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(statusFilter === status ? null : status)}
              >
                {t(`booking.status.${status}`)}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-mono text-xs">{booking.reference}</TableCell>
                        <TableCell>{(booking.hotel as any)?.name || "-"}</TableCell>
                        <TableCell className="text-xs">
                          {booking.checkIn} to {booking.checkOut}
                          <div className="text-muted-foreground">{booking.nights} nights</div>
                        </TableCell>
                        <TableCell className="text-xs">{booking.roomNameSnapshot} x{booking.roomsCount}</TableCell>
                        <TableCell className="text-right font-medium">{Number(booking.totalPrice).toLocaleString()} DZD</TableCell>
                        <TableCell>
                          <StatusBadge status={booking.status}>{t(`booking.status.${booking.status}`) || booking.status}</StatusBadge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {booking.status === "pending_payment" ? (
                              <Button size="sm" variant="outline" onClick={() => confirmPayment.mutate({ bookingId: booking.id })}>
                                <CreditCard className="me-1 h-3.5 w-3.5" />
                                Pay
                              </Button>
                            ) : null}
                            {["rejected", "expired", "cancelled"].includes(booking.status) ? (
                              <Button size="sm" variant="ghost" onClick={() => archiveMutation.mutate({ bookingId: booking.id })}>
                                <Archive className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="space-y-3 md:hidden">
                {filtered.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-mono text-xs text-muted-foreground">{booking.reference}</div>
                          <h3 className="truncate font-semibold">{(booking.hotel as any)?.name || "-"}</h3>
                        </div>
                        <StatusBadge status={booking.status}>{t(`booking.status.${booking.status}`) || booking.status}</StatusBadge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Dates</div>
                          <div>{booking.checkIn} to {booking.checkOut}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Total</div>
                          <div className="font-semibold">{Number(booking.totalPrice).toLocaleString()} DZD</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              icon={<Receipt className="h-6 w-6" />}
              title="No bookings yet"
              description="Start from the marketplace to create your first B2B booking."
              action={<Button asChild><Link to="/marketplace">Browse marketplace</Link></Button>}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
