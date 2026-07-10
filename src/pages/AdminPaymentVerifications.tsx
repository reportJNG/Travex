import { useState } from "react";
import { AlertCircle, CheckCircle, Clock, Eye, Flag, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { StatusBadge } from "@/components/app/StatusBadge";
import { EmptyState } from "@/components/app/StateBlock";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export default function AdminPaymentVerifications() {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  const { data: verifications, isLoading, refetch } = trpc.admin.listPaymentVerifications.useQuery({
    status: "awaiting_admin_payment_verification",
  });

  const verifyMutation = trpc.admin.verifyPayment.useMutation({
    onSuccess: () => {
      toast.success("Payment decision recorded");
      refetch();
      setSheetOpen(false);
      setSelectedBooking(null);
    },
    onError: (err) => toast.error(err.message),
  });

  function openReview(booking: any) {
    setSelectedBooking(booking);
    setRejectReason("");
    setPaymentRef("");
    setSheetOpen(true);
  }

  const pending = (verifications || []).filter(
    (b: any) => b.status === "awaiting_offline_payment" || b.voucherPath
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Offline Payment Reviews"
        description="Review and verify offline payment receipts submitted by travel agencies."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending review"
          value={pending.length}
          icon={<Clock className="h-5 w-5" />}
          tone="amber"
        />
        <StatCard
          label="Approved today"
          value={0}
          icon={<CheckCircle className="h-5 w-5" />}
          tone="green"
        />
        <StatCard
          label="Rejected today"
          value={0}
          icon={<XCircle className="h-5 w-5" />}
          tone="primary"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment receipts</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending
                {pending.length > 0 ? (
                  <Badge className="ms-1.5 bg-amber-500 text-white text-xs px-1.5">
                    {pending.length}
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {pending.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle className="h-6 w-6" />}
                  title="No pending receipts"
                  description="All offline payment receipts have been reviewed."
                />
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Reference</TableHead>
                          <TableHead>Agency</TableHead>
                          <TableHead>Hotel</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Commission</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pending.map((booking: any) => {
                          const commission = Number(booking.commissionAmount || 0);
                          const total = Number(booking.totalPrice || 0);
                          const deadline = booking.paymentDeadline;
                          const isExpiring =
                            deadline &&
                            new Date(deadline).getTime() - Date.now() < 3600000 * 3;

                          return (
                            <TableRow key={booking.id}>
                              <TableCell className="font-mono text-xs text-muted-foreground">
                                {booking.reference}
                              </TableCell>
                              <TableCell className="font-medium">
                                {booking.agency?.fullName || booking.agency?.legalName || "—"}
                              </TableCell>
                              <TableCell>{booking.hotel?.name || "—"}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {total.toLocaleString("fr-DZ")} DZD
                              </TableCell>
                              <TableCell className="text-right text-primary">
                                {commission.toLocaleString("fr-DZ")} DZD
                              </TableCell>
                              <TableCell>
                                <StatusBadge status={booking.status}>
                                  {booking.status?.replace(/_/g, " ")}
                                </StatusBadge>
                              </TableCell>
                              <TableCell>
                                {deadline ? (
                                  <span
                                    className={`text-xs ${isExpiring ? "font-semibold text-destructive" : "text-muted-foreground"}`}
                                  >
                                    {new Date(deadline).toLocaleDateString("fr-DZ")}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openReview(booking)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-3 md:hidden">
                    {pending.map((booking: any) => {
                      const total = Number(booking.totalPrice || 0);
                      return (
                        <Card key={booking.id}>
                          <CardContent className="space-y-3 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-mono text-xs text-muted-foreground">
                                  {booking.reference}
                                </div>
                                <div className="font-semibold">
                                  {booking.hotel?.name || "—"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {booking.agency?.fullName || "—"}
                                </div>
                              </div>
                              <StatusBadge status={booking.status}>
                                {booking.status?.replace(/_/g, " ")}
                              </StatusBadge>
                            </div>
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <div>
                                <div className="text-xs text-muted-foreground">Total</div>
                                <div className="font-semibold">
                                  {total.toLocaleString("fr-DZ")} DZD
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => openReview(booking)}
                              >
                                Review
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Review payment receipt</SheetTitle>
          </SheetHeader>

          {selectedBooking ? (
            <div className="mt-6 flex flex-col gap-5 px-4">
              {/* Booking snapshot */}
              <Card>
                <CardContent className="space-y-3 pt-5 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono font-medium">
                      {selectedBooking.reference}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Agency</span>
                    <span className="text-right">
                      {selectedBooking.agency?.fullName ||
                        selectedBooking.agency?.legalName ||
                        "—"}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Hotel</span>
                    <span>{selectedBooking.hotel?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Dates</span>
                    <span>
                      {selectedBooking.checkIn} → {selectedBooking.checkOut}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 font-semibold">
                    <span>Total</span>
                    <span className="text-primary">
                      {Number(selectedBooking.totalPrice).toLocaleString("fr-DZ")}{" "}
                      DZD
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 text-primary">
                    <span className="text-muted-foreground">Commission (5%)</span>
                    <span className="font-semibold">
                      {Number(selectedBooking.commissionAmount).toLocaleString(
                        "fr-DZ"
                      )}{" "}
                      DZD
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Receipt preview */}
              {selectedBooking.voucherPath ? (
                <div className="space-y-2">
                  <Label>Submitted receipt</Label>
                  <div className="flex items-center justify-center rounded-xl border bg-muted/40 p-8">
                    <div className="text-center text-sm text-muted-foreground">
                      <Flag className="mx-auto mb-2 h-8 w-8" />
                      <p>Receipt document stored securely.</p>
                      <p className="mt-1 text-xs">
                        Path: {selectedBooking.voucherPath}
                      </p>
                      <Button size="sm" variant="outline" className="mt-3">
                        Open receipt
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No receipt uploaded yet</AlertTitle>
                  <AlertDescription>
                    The agency has not uploaded a payment receipt yet.
                  </AlertDescription>
                </Alert>
              )}

              {/* Approval */}
              <div className="space-y-2">
                <Label htmlFor="payment-ref">Payment reference (optional)</Label>
                <Input
                  id="payment-ref"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="CCP/bank transfer reference..."
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <ConfirmAction
                  title="Approve payment"
                  description={`Confirm that payment of ${Number(selectedBooking.totalPrice).toLocaleString("fr-DZ")} DZD has been received and verified for booking ${selectedBooking.reference}. This will confirm the booking and notify both the agency and hotel.`}
                  onConfirm={() =>
                    verifyMutation.mutate({
                      bookingId: selectedBooking.id,
                      approve: true,
                    })
                  }
                >
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={verifyMutation.isPending}
                  >
                    <CheckCircle className="me-2 h-4 w-4" />
                    Approve payment clearance
                  </Button>
                </ConfirmAction>

                <div className="space-y-2">
                  <Label htmlFor="reject-reason">Rejection reason (required to reject)</Label>
                  <Textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    placeholder="Reason visible to agency..."
                  />
                  <ConfirmAction
                    title="Reject receipt"
                    description="This will reject the payment receipt and notify the agency to upload a correct one (if still within deadline)."
                    onConfirm={() =>
                      verifyMutation.mutate({
                        bookingId: selectedBooking.id,
                        approve: false,
                        reason: rejectReason,
                      })
                    }
                  >
                    <Button
                      variant="outline"
                      className="w-full text-destructive border-destructive hover:bg-destructive/5"
                      disabled={!rejectReason || verifyMutation.isPending}
                    >
                      <XCircle className="me-2 h-4 w-4" />
                      Reject &amp; request resubmission
                    </Button>
                  </ConfirmAction>
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
