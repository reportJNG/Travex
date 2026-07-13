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
import { Skeleton } from "@/components/ui/skeleton";

type ResultState = "processing" | "confirmed" | "failed" | "cancelled" | "refund_required";

function getResultState(paymentStatus: string | null, booking?: any): ResultState {
  if (paymentStatus === "success" || booking?.status === "confirmed" || booking?.status === "completed") {
    return "confirmed";
  }
  if (paymentStatus === "failed" || booking?.status === "rejected") {
    return "failed";
  }
  if (paymentStatus === "cancelled" || booking?.status === "cancelled") {
    return "cancelled";
  }
  if (booking?.paymentStatus === "refund_required") {
    return "refund_required";
  }
  return "processing";
}

export default function PaymentResult() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const bookingId = id || "";

  const paymentStatus = searchParams.get("status");

  const { data: booking, isLoading } = trpc.booking.get.useQuery(
    { bookingId },
    {
      enabled: !!bookingId,
      refetchInterval: (query) => getResultState(paymentStatus, query.state.data) === "processing" ? 3000 : false,
    }
  );
  const resultState = getResultState(paymentStatus, booking);

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
        eyebrow="Paiement"
        title="Résultat du paiement"
        description={`Référence réservation : ${reference}`}
      />

      <div className="flex justify-center">
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card">
          <div className="p-8 text-center">
            {resultState === "processing" ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                  <Clock className="h-8 w-8 text-amber-600 animate-pulse" />
                </div>
                <h2 className="text-xl font-semibold">Paiement en cours</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Votre paiement est en vérification. Cette étape peut prendre quelques instants.
                  Gardez cette page ouverte.
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
                <h2 className="text-xl font-semibold">Paiement confirmé</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Votre réservation chez <strong>{hotel.name || "l'hôtel"}</strong> est confirmée.
                  Une notification de confirmation sera envoyée.
                </p>
                <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Référence</span>
                    <span className="font-mono font-medium">{reference}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3">
                    <span className="text-muted-foreground">Total payé</span>
                    <span className="font-semibold text-primary">
                      {totalPrice.toLocaleString("fr-DZ")} DZD
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link to={`/booking/${bookingId}/confirmation`}>
                      Voir la confirmation
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/dashboard">Tableau de bord</Link>
                  </Button>
                </div>
              </>
            ) : resultState === "failed" ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100">
                  <XCircle className="h-8 w-8 text-rose-600" />
                </div>
                <h2 className="text-xl font-semibold">Paiement refusé</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Le paiement n'a pas pu être traité. Aucun montant n'a été débité.
                  Vous pouvez réessayer ou choisir un autre mode de paiement.
                </p>
                <Alert variant="destructive" className="mt-4 text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Prochaine étape</AlertTitle>
                  <AlertDescription>
                    Vérifiez les informations de paiement ou choisissez le paiement hors ligne par virement.
                  </AlertDescription>
                </Alert>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link to="/dashboard">Réessayer depuis le tableau de bord</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/marketplace">Parcourir les hôtels</Link>
                  </Button>
                </div>
              </>
            ) : resultState === "cancelled" ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <XCircle className="h-8 w-8 text-slate-500" />
                </div>
                <h2 className="text-xl font-semibold">Paiement annulé</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Le paiement a été annulé. Le blocage temporaire de la réservation a été libéré.
                  Vous pouvez relancer une réservation.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button asChild>
                    <Link to="/dashboard">Tableau de bord</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/marketplace">Parcourir les hôtels</Link>
                  </Button>
                </div>
              </>
            ) : resultState === "refund_required" ? (
              <>
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
                <h2 className="text-xl font-semibold">Remboursement en cours</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  Le paiement a été reçu mais la chambre n'est plus disponible.
                  Un remboursement complet est en cours et sera retourné sous 5 à 7 jours ouvrés.
                </p>
                <Alert className="mt-4 border-orange-300 bg-orange-50 text-left text-orange-900">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertTitle>Référence support : {reference}</AlertTitle>
                  <AlertDescription>
                    Contact us at{" "}
                    <a
                      href="mailto:contact@nexelite.co"
                      className="font-medium underline"
                    >
                      contact@nexelite.co
                    </a>{" "}
                    si le remboursement n'apparaît pas après 7 jours.
                  </AlertDescription>
                </Alert>
                <Button className="mt-6" asChild>
                  <Link to="/dashboard">Tableau de bord</Link>
                </Button>
              </>
            ) : null}
          </div>

          {booking && resultState !== "processing" ? (
            <div className="border-t border-border px-8 py-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Détails de la réservation
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Hôtel</span>
                  <span className="font-medium">{hotel.name || "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Dates</span>
                  <span className="font-medium">
                    {booking.checkIn as string} → {booking.checkOut as string}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Chambre</span>
                  <span className="font-medium">{booking.roomNameSnapshot as string}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
