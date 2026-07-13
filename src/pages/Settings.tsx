import { Link } from "react-router";
import { Clock, Save, Settings as SettingsIcon, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

export default function Settings() {
  const { t } = useI18n();
  const { user } = useAuth();
  const role = (user as any)?.role;
  const isHotel = role === "hotel";

  const { data: hotel } = trpc.hotel.myHotel.useQuery(undefined, { enabled: isHotel });
  const utils = trpc.useUtils();
  const [windowHours, setWindowHours] = useState<number | null>(null);
  const effectiveWindowHours = windowHours ?? (hotel as any)?.offlinePaymentWindowHours ?? 48;

  const updateSettings = trpc.hotel.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Paramètres enregistrés");
      utils.hotel.myHotel.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const hourLabel = effectiveWindowHours >= 24
    ? `${effectiveWindowHours / 24}j ${effectiveWindowHours % 24 > 0 ? `${effectiveWindowHours % 24}h` : ""}`
    : `${effectiveWindowHours}h`;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Espace de travail"
        title={t("nav.settings")}
        description="Configurez les préférences opérationnelles pour l'approbation des réservations et la gestion du compte."
      />

      {isHotel ? (
        hotel ? (
          <div className="mb-5 rounded-xl border border-border bg-card p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Fenêtre de paiement hors ligne</h3>
                <p className="text-xs text-muted-foreground">
                  Délai accordé aux agences pour effectuer le paiement après approbation.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3 rounded-lg bg-muted/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">Durée sélectionnée</span>
                <span className="rounded-full bg-primary/10 px-3.5 py-1 text-sm font-semibold text-primary">
                  {hourLabel}
                </span>
              </div>

              <div className="space-y-3 px-1">
                <Slider
                  value={[effectiveWindowHours]}
                  onValueChange={(value) => setWindowHours(value[0])}
                  min={6}
                  max={168}
                  step={6}
                  className="py-1"
                />
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                  <span>6h</span>
                  <span>24h</span>
                  <span>48h</span>
                  <span>72h</span>
                  <span>7j</span>
                </div>
              </div>

              <p className="text-sm leading-relaxed text-muted-foreground">
                Une fois que vous approuvez une réservation hors ligne, l'agence disposera de{" "}
                <strong className="text-foreground">{hourLabel}</strong> pour confirmer et soumettre le paiement.
                Après ce délai, la réservation expire automatiquement.
              </p>
            </div>

            <div className="mt-5 border-t border-border/60 pt-4">
              <Button
                onClick={() => updateSettings.mutate({ offlinePaymentWindowHours: effectiveWindowHours })}
                disabled={updateSettings.isPending}
              >
                <Save className="me-2 h-4 w-4" />
                {updateSettings.isPending ? "Enregistrement…" : "Enregistrer les paramètres"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="mb-5">
            <EmptyState
              icon={<SettingsIcon className="h-6 w-6" />}
              title="Aucun profil hôtel trouvé"
              description="Créez un profil hôtel avant de modifier les paramètres opérationnels."
              action={<Button asChild><Link to="/inventory">Ouvrir l'inventaire</Link></Button>}
            />
          </div>
        )
      ) : null}

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <User className="h-5 w-5" />
          </div>
          <h3 className="font-semibold text-foreground">Paramètres du compte</h3>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Gérez vos coordonnées, votre nom complet et votre langue d'affichage préférée depuis votre page de profil.
        </p>
        <div className="mt-4 border-t border-border/60 pt-4">
          <Button variant="outline" asChild>
            <Link to="/profile">Accéder au profil</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
