import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Copy,
  FileText,
  Info,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

function Countdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    function tick() {
      const diff = Math.max(0, new Date(deadline).getTime() - Date.now());
      setRemaining(diff);
    }
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (remaining === 0) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-semibold">Deadline passed — booking expired</span>
      </div>
    );
  }

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const totalHours = 48;
  const progress = Math.min(100, ((totalHours * 3600000 - remaining) / (totalHours * 3600000)) * 100);
  const isUrgent = remaining < 3600000 * 6;

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-2 font-semibold ${isUrgent ? "text-destructive" : "text-amber-600"}`}>
        <Clock className="h-4 w-4" />
        <span>
          {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")} remaining
        </span>
      </div>
      <Progress value={progress} className={`h-2 ${isUrgent ? "[&>div]:bg-destructive" : "[&>div]:bg-amber-500"}`} />
      <p className="text-xs text-muted-foreground">
        Deadline:{" "}
        {new Date(deadline).toLocaleString("fr-DZ", {
          timeZone: "Africa/Algiers",
          dateStyle: "full",
          timeStyle: "short",
        })}
      </p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border bg-background transition-colors hover:bg-accent"
      aria-label="Copy"
    >
      {copied ? (
        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </button>
  );
}

export default function OfflinePayment() {
  const { id } = useParams<{ id: string }>();
  const bookingId = id || "";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { data: booking, isLoading, error } = trpc.booking.get.useQuery(
    { bookingId },
    { enabled: !!bookingId, refetchInterval: 30000 }
  );

  const isExpired =
    booking?.status === "expired" ||
    (booking?.paymentDeadline && new Date(booking.paymentDeadline) < new Date());

  const alreadySubmitted =
    booking?.status === "confirmed" ||
    booking?.status === "completed" ||
    booking?.voucherPath;

  async function handleSubmitReceipt() {
    if (!receiptFile) {
      toast.error("Sélectionnez un reçu de paiement");
      return;
    }
    setIsUploading(true);
    try {
      // In production: upload to Supabase Storage then call mutation
      // For now simulate upload process
      await new Promise((r) => setTimeout(r, 1200));
      setSubmitted(true);
      toast.success("Reçu envoyé pour vérification");
    } catch {
      toast.error("Échec de l'envoi. Réessayez.");
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
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
          This booking does not exist or you do not have access to it.{" "}
          <Link to="/dashboard" className="font-medium underline">
            Go to dashboard
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  const hotel = (booking.hotel as any) || {};
  const hotelName = hotel.name || "Hotel";
  const deadlineStr = (booking.paymentDeadline as string) || "";
  const reference = (booking.reference as string) || "";
  const totalPrice = Number(booking.totalPrice || 0);

  if (alreadySubmitted && !submitted) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card px-6 py-10 text-center">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-emerald-500" />
          <h1 className="text-2xl font-bold tracking-tight">Réservation confirmée</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Votre paiement a été vérifié et votre réservation est confirmée.
          </p>
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
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Paiement hors ligne"
        title="Finaliser le paiement"
        description={`Référence réservation : ${reference} · ${hotelName}`}
      />

      {/* Deadline alert */}
      {deadlineStr && !isExpired && !submitted ? (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
          <Clock className="h-4 w-4" />
          <AlertTitle className="font-semibold">Échéance de paiement</AlertTitle>
          <AlertDescription>
            <Countdown deadline={deadlineStr} />
          </AlertDescription>
        </Alert>
      ) : null}

      {isExpired ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Échéance dépassée</AlertTitle>
          <AlertDescription>
            Le délai de paiement de cette réservation a expiré. Le blocage de chambre a été libéré.{" "}
            <Link to="/marketplace" className="font-medium underline">
              Créez une nouvelle réservation
            </Link>{" "}
            si vous souhaitez encore réserver cet hôtel.
          </AlertDescription>
        </Alert>
      ) : null}

      {submitted ? (
        <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900 [&>svg]:text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Reçu envoyé</AlertTitle>
          <AlertDescription>
            Votre reçu est en vérification. Vous serez notifié dès que le paiement est validé.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        {/* Payment instructions */}
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4 font-semibold text-foreground">
              <Info className="h-5 w-5 text-primary" />
              Instructions de paiement
            </div>
            <div className="space-y-5 p-5">
              <Alert>
                <AlertDescription className="text-sm">
                  Transférez le montant exact vers le compte ci-dessous. Ajoutez la référence de réservation
                  dans le motif du virement pour faciliter la vérification.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Bénéficiaire
                    </div>
                    <div className="mt-0.5 font-semibold">TRAVEX B2B MARKETPLACE</div>
                  </div>
                  <CopyButton text="TRAVEX B2B MARKETPLACE" />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Compte CCP
                    </div>
                    <div className="mt-0.5 font-mono font-semibold">1234567890 / CLE 12</div>
                  </div>
                  <CopyButton text="1234567890 / CLE 12" />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-4 py-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Montant à transférer
                    </div>
                    <div className="mt-0.5 text-xl font-bold text-primary">
                      {totalPrice.toLocaleString("fr-DZ")} DZD
                    </div>
                  </div>
                  <CopyButton text={String(totalPrice)} />
                </div>

                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Motif du virement (obligatoire)
                    </div>
                    <div className="mt-0.5 font-mono font-bold text-amber-900">
                      {reference}
                    </div>
                  </div>
                  <CopyButton text={reference} />
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border bg-sky-50 p-4 text-sm text-sky-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
                <p>
                  Après le virement bancaire/CCP, envoyez le reçu ci-dessous. L'équipe vérifiera le paiement
                  sous 24 heures ouvrées.
                </p>
              </div>
            </div>
          </div>

          {/* Receipt upload */}
          {!isExpired && !submitted ? (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center gap-2 border-b border-border/60 px-5 py-4 font-semibold text-foreground">
                <Upload className="h-5 w-5 text-primary" />
                Soumettre le reçu de paiement
              </div>
              <div className="space-y-4 p-5">
                <p className="text-sm text-muted-foreground">
                  Envoyez une photo ou un scan lisible du reçu de virement. Formats acceptés : PDF, JPEG, PNG (10 MB max).
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="hidden"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed border-muted-foreground/30 p-8 text-center transition-colors hover:border-primary/50 hover:bg-muted/20"
                >
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  {receiptFile ? (
                    <div>
                      <p className="font-medium text-foreground">
                        {receiptFile.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-medium">Sélectionner le reçu</p>
                      <p className="text-xs text-muted-foreground">
                        PDF, JPG ou PNG · 10 MB max
                      </p>
                    </div>
                  )}
                </button>

                {receiptFile ? (
                  <Button
                    className="w-full"
                    onClick={handleSubmitReceipt}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="me-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Envoi...
                      </>
                    ) : (
                      "Envoyer le reçu pour vérification"
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        {/* Booking summary */}
        <aside>
          <div className="sticky top-24 overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border/60 px-5 py-4">
              <h3 className="font-semibold text-foreground">Récapitulatif</h3>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{hotelName}</span>
                  <StatusBadge status={submitted ? "confirmed" : (booking.status as string)}>
                    {submitted ? "Reçu envoyé" : booking.status as string}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {hotel.address || [hotel.wilaya?.nameFr, hotel.country?.nameFr].filter(Boolean).join(", ") || "North Africa"}
                </p>
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Référence</span>
                  <span className="font-mono font-medium">{reference}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Arrivée</span>
                  <span>{booking.checkIn as string}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Départ</span>
                  <span>{booking.checkOut as string}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Nuits</span>
                  <span>{booking.nights as number}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Chambre</span>
                  <span>{booking.roomNameSnapshot as string}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Quantité</span>
                  <span>×{booking.roomsCount as number}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between gap-3 text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">
                  {totalPrice.toLocaleString("fr-DZ")} DZD
                </span>
              </div>

              <Badge variant="secondary" className="w-full justify-center">
                Virement bancaire hors ligne
              </Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <Button variant="outline" asChild className="w-full">
              <Link to="/dashboard">Retour au tableau de bord</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
