import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AlertCircle, Archive, BadgeCheck, CalendarCheck, Clock, Receipt, Upload } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  { value: "all", label: "All" },
  { value: "pending_payment", label: "Online pay" },
  { value: "pending_hotel", label: "Hotel review" },
  { value: "awaiting_offline_payment", label: "Awaiting payment" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
] as const;

export default function Dashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("all");

  const { data: bookings, isLoading, refetch } = trpc.booking.myBookings.useQuery();
  const archiveMutation = trpc.booking.archive.useMutation({
    onSuccess: () => { toast.success("Archived"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const counts = {
    total: bookings?.length || 0,
    pending: bookings?.filter((b) => ["pending_hotel", "pending_payment", "awaiting_offline_payment"].includes(b.status)).length || 0,
    confirmed: bookings?.filter((b) => ["confirmed", "completed"].includes(b.status)).length || 0,
  };

  const awaitingPaymentBookings = bookings?.filter((b) => b.status === "awaiting_offline_payment") ?? [];

  const filtered = activeTab === "all"
    ? bookings
    : bookings?.filter((b) => b.status === activeTab);

  function openReceiptSheet(bookingId?: string) {
    const bid = bookingId ?? awaitingPaymentBookings[0]?.id ?? "";
    if (bid) {
      navigate(`/booking/${bid}/offline-payment`);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Agency"
        title={t("dashboard.title")}
        description="Track booking status, payment actions, and archived requests across your agency workspace."
        actions={<Button asChild><Link to="/marketplace">Browse marketplace</Link></Button>}
      />

      {/* Awaiting offline payment alert */}
      {awaitingPaymentBookings.length > 0 ? (
        <Alert className="mb-6 border-amber-300 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">
            Payment Required
          </AlertTitle>
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>
              You have <strong>{awaitingPaymentBookings.length}</strong> booking{awaitingPaymentBookings.length !== 1 ? "s" : ""} awaiting offline payment.
              You must upload payment receipts within <strong>48 hours</strong> to avoid automatic cancellation.
            </span>
            <Button
              size="sm"
              className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => openReceiptSheet()}
            >
              <Upload className="me-1.5 h-3.5 w-3.5" />
              Upload Receipt
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("dashboard.totalBookings")} value={counts.total} icon={<CalendarCheck className="h-5 w-5" />} />
        <StatCard label={t("dashboard.pending")} value={counts.pending} icon={<Clock className="h-5 w-5" />} tone="amber" />
        <StatCard label={t("dashboard.confirmed")} value={counts.confirmed} icon={<BadgeCheck className="h-5 w-5" />} tone="green" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>{t("dashboard.recentBookings")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4 h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0 sm:w-auto">
              {STATUS_TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-lg border data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {tab.label}
                  {tab.value !== "all" && bookings ? (
                    <span className="ms-1.5 rounded-full bg-current/20 px-1.5 text-xs">
                      {bookings.filter((b) => b.status === tab.value).length}
                    </span>
                  ) : null}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab}>
              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : filtered && filtered.length > 0 ? (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
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
                          <TableRow key={booking.id} className="group">
                            <TableCell className="font-mono text-xs text-muted-foreground">{booking.reference}</TableCell>
                            <TableCell className="font-medium">{(booking.hotel as any)?.name || "-"}</TableCell>
                            <TableCell className="text-xs">
                              <div>{booking.checkIn} → {booking.checkOut}</div>
                              <div className="text-muted-foreground">{booking.nights} nights</div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{booking.roomNameSnapshot} ×{booking.roomsCount}</TableCell>
                            <TableCell className="text-right font-semibold">{Number(booking.totalPrice).toLocaleString()} DZD</TableCell>
                            <TableCell>
                              <StatusBadge status={booking.status}>{t(`booking.status.${booking.status}`) || booking.status}</StatusBadge>
                            </TableCell>
                            <TableCell>
                              <div className="flex justify-end gap-1">
                                {booking.status === "awaiting_offline_payment" ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                    onClick={() => openReceiptSheet(booking.id)}
                                  >
                                    <Upload className="h-3.5 w-3.5" />
                                  </Button>
                                ) : null}
                                {["rejected", "expired", "cancelled"].includes(booking.status) ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => archiveMutation.mutate({ bookingId: booking.id })}
                                    disabled={archiveMutation.isPending}
                                  >
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
                              <div className="text-xs text-muted-foreground">Dates</div>
                              <div>{booking.checkIn} → {booking.checkOut}</div>
                              <div className="text-xs text-muted-foreground">{booking.nights} nights</div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Total</div>
                              <div className="font-semibold">{Number(booking.totalPrice).toLocaleString()} DZD</div>
                              <div className="text-xs text-muted-foreground">{booking.roomNameSnapshot} ×{booking.roomsCount}</div>
                            </div>
                          </div>
                          {booking.status === "awaiting_offline_payment" ? (
                            <Button
                              size="sm"
                              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                              onClick={() => openReceiptSheet(booking.id)}
                            >
                              <Upload className="me-1.5 h-3.5 w-3.5" />
                              Upload Receipt
                            </Button>
                          ) : null}
                          {["rejected", "expired", "cancelled"].includes(booking.status) ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => archiveMutation.mutate({ bookingId: booking.id })}
                              disabled={archiveMutation.isPending}
                            >
                              <Archive className="me-1.5 h-3.5 w-3.5" />
                              Archive
                            </Button>
                          ) : null}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={<Receipt className="h-6 w-6" />}
                  title={activeTab === "all" ? "No bookings yet" : `No ${activeTab.replace("_", " ")} bookings`}
                  description={activeTab === "all" ? "Start from the marketplace to create your first B2B booking." : "Try a different status filter."}
                  action={activeTab === "all" ? <Button asChild><Link to="/marketplace">Browse marketplace</Link></Button> : undefined}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

    </div>
  );
}
