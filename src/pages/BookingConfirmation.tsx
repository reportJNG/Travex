import { Link, useParams } from "react-router";
import {
  AlertCircle,
  BadgeCheck,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  MapPin,
  Phone,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>();
  const bookingId = id || "";

  const { data: booking, isLoading, error } = trpc.booking.get.useQuery(
    { bookingId },
    { enabled: !!bookingId }
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Skeleton className="h-96" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Booking not found</AlertTitle>
        <AlertDescription>
          This booking does not exist or you do not have access to view it.{" "}
          <Link to="/dashboard" className="font-medium underline">
            Go to dashboard
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const hotel = (booking.hotel as any) || {};
  const status = booking.status as string;
  const reference = booking.reference as string;
  const totalPrice = Number(booking.totalPrice || 0);
  const isConfirmed = ["confirmed", "completed"].includes(status);
  const isPending = ["awaiting_offline_payment", "pending_hotel", "pending_payment"].includes(status);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isConfirmed ? "Booking Confirmed" : "Booking Status"}
        title={isConfirmed ? "Your booking is confirmed" : "Booking details"}
        description={`Reference: ${reference}`}
      />

      {isConfirmed ? (
        <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 [&>svg]:text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Confirmed — enjoy your stay!</AlertTitle>
          <AlertDescription>
            Your reservation at <strong>{hotel.name}</strong> is confirmed. The
            hotel has been notified and is expecting your arrival.
          </AlertDescription>
        </Alert>
      ) : isPending ? (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
          <Clock className="h-4 w-4" />
          <AlertTitle>Awaiting confirmation</AlertTitle>
          <AlertDescription>
            Your booking is pending. Follow the payment or hotel review process
            to complete your reservation.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          {/* Voucher card */}
          <div className={`overflow-hidden rounded-xl border bg-card ${isConfirmed ? "border-emerald-200 bg-emerald-50/30" : "border-border"}`}>
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border/60">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <BadgeCheck className="h-5 w-5 text-primary" />
                Bon de réservation
              </div>
              <StatusBadge status={status}>{status.replace(/_/g, " ")}</StatusBadge>
            </div>
            <div className="space-y-5 p-5">
              <div className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{hotel.name}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      {hotel.address || hotel.wilaya?.nameFr || "Algeria"}
                    </p>
                    {hotel.phone ? (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {hotel.phone}
                      </p>
                    ) : null}
                  </div>
                  {hotel.starRating ? (
                    <Badge variant="secondary">
                      {"★".repeat(hotel.starRating)} {hotel.starRating} stars
                    </Badge>
                  ) : null}
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Check-in
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 font-semibold">
                      <Calendar className="h-4 w-4 text-primary" />
                      {booking.checkIn as string}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Check-out
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 font-semibold">
                      <Calendar className="h-4 w-4 text-primary" />
                      {booking.checkOut as string}
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="grid gap-3 sm:grid-cols-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Room type</div>
                    <div className="font-medium">{booking.roomNameSnapshot as string}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Nights</div>
                    <div className="font-medium">{booking.nights as number}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Rooms</div>
                    <div className="font-medium">×{booking.roomsCount as number}</div>
                  </div>
                </div>
              </div>

              {/* Financial summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <span>
                    {Number(booking.nightlyRateSnapshot || 0).toLocaleString("fr-DZ")} DZD ×{" "}
                    {booking.nights as number} nights × {booking.roomsCount as number} rooms
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between gap-3 text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {totalPrice.toLocaleString("fr-DZ")} DZD
                  </span>
                </div>
                <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                  <span>Payment method</span>
                  <span className="capitalize">
                    {(booking.paymentMethod as string)?.replace("_", " ") || "—"}
                  </span>
                </div>
              </div>

              {isConfirmed ? (
                <Button className="w-full" variant="outline" disabled>
                  <Download className="me-2 h-4 w-4" />
                  Download voucher PDF
                  <Badge variant="secondary" className="ms-2 text-xs">
                    Coming soon
                  </Badge>
                </Button>
              ) : null}
            </div>
          </div>

          {/* Next steps */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border/60 px-5 py-4">
              <h3 className="font-semibold text-foreground">Prochaines étapes</h3>
            </div>
            <div className="space-y-3 p-5 text-sm text-muted-foreground">
              {isConfirmed ? (
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Present this booking reference at check-in.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    The hotel has been notified and will prepare for your arrival.
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    Contact the hotel directly for any special requests or early check-in arrangements.
                  </li>
                </ul>
              ) : (
                <p>
                  Follow the instructions on your dashboard to complete the
                  payment and confirm your booking.
                </p>
              )}
              <Separator />
              <p>
                Support:{" "}
                <a
                  href="mailto:contact@nexelite.co"
                  className="font-medium text-primary hover:underline"
                >
                  contact@nexelite.co
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="space-y-3 p-5 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Reference</span>
                <span className="font-mono font-medium">{reference}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Status</span>
                <StatusBadge status={status}>{status.replace(/_/g, " ")}</StatusBadge>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Hotel</span>
                <span className="text-right">{hotel.name}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild>
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/marketplace">Browse more hotels</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
