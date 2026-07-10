import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { PageHeader } from "@/components/app/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ResultState = "processing" | "confirmed" | "failed" | "cancelled" | "refund_required";

export default function PaymentResult() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const bookingId = id || "";

  const paymentStatus = searchParams.get("status");
  const [resultState, setResultState] = useState<ResultState>("processing");

  const { data: booking, isLoading } = trpc.booking.get.useQuery(
    { bookingId },
    {
      enabled: !!bookingId,
      refetchInterval: resultState === "processing" ? 3000 : false,
    }
  );

  useEffect(() => {
    if (paymentStatus === "success" || booking?.status === "confirmed") {
      setResultState("confirmed");
    } else if (paymentStatus === "failed" || booking?.status === "rejected") {
      setResultState("failed");
    } else if (paymentStatus === "cancelled" || booking?.status === "cancelled") {
      setResultState("cancelled");
    } else if (booking?.paymentStatus === "refund_required") {
      setResultState("refund_required");
    } else if (booking?.status === "confirmed" || booking?.status === "completed") {
      setResultState("confirmed");
    }
  }, [paymentStatus, booking]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full max-w-lg" />
      </div>
    );
  }

  const hotel = (booking?.hotel as any) || {};
  const reference = (booking?.reference as string) || "—";
  const totalPrice = Number(booking?.totalPrice || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payment"
        title="Payment result"
        description={`Booking reference: ${reference}`}
      />

      <div className="flex justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8 text-center">
            {resultState === "processing" ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
                </div>
                <h2 className="text-xl font-semibold">Processing payment</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your payment is being verified. This may take a moment.
                  Please do not close this page.
                </p>
                <div className="mt-6 flex justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              </>
            ) : resultState === "confirmed" ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-semibold">Payment confirmed</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your booking at <strong>{hotel.name || "the hotel"}</strong> has
                  been confirmed. You will receive a confirmation notification shortly.
                </p>
                <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Reference</span>
                    <span className="font-mono font-medium">{reference}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3">
                    <span className="text-muted-foreground">Total paid</span>
                    <span className="font-semibold text-primary">
                      {totalPrice.toLocaleString("fr-DZ")} DZD
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link to={`/booking/${bookingId}/confirmation`}>
                      View confirmation
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard">Dashboard</Link>
                  </Button>
                </div>
              </>
            ) : resultState === "failed" ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                  <XCircle className="h-8 w-8 text-rose-600" />
                </div>
                <h2 className="text-xl font-semibold">Payment failed</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your payment could not be processed. No amount has been
                  charged. You may try again or choose a different payment
                  method.
                </p>
                <Alert variant="destructive" className="mt-4 text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>What to do next</AlertTitle>
                  <AlertDescription>
                    Check your card details and try again, or select offline
                    payment to proceed with a bank transfer.
                  </AlertDescription>
                </Alert>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link to="/dashboard">Try again from dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/marketplace">Browse hotels</Link>
                  </Button>
                </div>
              </>
            ) : resultState === "cancelled" ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <XCircle className="h-8 w-8 text-slate-500" />
                </div>
                <h2 className="text-xl font-semibold">Payment cancelled</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  You cancelled the payment. The booking hold has been
                  released. You can return to the hotel and try again.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link to="/dashboard">Go to dashboard</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/marketplace">Browse hotels</Link>
                  </Button>
                </div>
              </>
            ) : resultState === "refund_required" ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold">Refund in progress</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Your payment was received but the room is no longer available.
                  A full refund is being processed and will be returned to your
                  original payment method within 5–7 business days.
                </p>
                <Alert className="mt-4 border-orange-300 bg-orange-50 text-left text-orange-900">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle>Support reference: {reference}</AlertTitle>
                  <AlertDescription>
                    Contact us at{" "}
                    <a
                      href="mailto:contact@nexelite.co"
                      className="font-medium underline"
                    >
                      contact@nexelite.co
                    </a>{" "}
                    if you have not received your refund within 7 days.
                  </AlertDescription>
                </Alert>
                <Button className="mt-6" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
              </>
            ) : null}
          </CardContent>

          {booking && resultState !== "processing" ? (
            <CardHeader className="border-t pt-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Booking details
              </CardTitle>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Hotel</span>
                  <span>{hotel.name || "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Dates</span>
                  <span>
                    {booking.checkIn as string} → {booking.checkOut as string}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Room</span>
                  <span>{booking.roomNameSnapshot as string}</span>
                </div>
              </div>
            </CardHeader>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
