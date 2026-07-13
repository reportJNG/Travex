import { CheckCircle, FileText, MapPin, XCircle } from "lucide-react";
import { toast } from "sonner";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";

import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

export default function AdminClaims() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: claims, isLoading } = trpc.admin.listClaims.useQuery();

  const decideMutation = trpc.admin.decideClaim.useMutation({
    onSuccess: () => {
      toast.success("Claim decided");
      utils.admin.listClaims.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title={t("nav.claims")}
        description="Vérifiez les demandes de propriété d'hôtel et approuvez uniquement les reprises confirmées."
      />

      {isLoading ? (
        <LoadingCards count={4} />
      ) : claims && claims.length > 0 ? (
        <div className="space-y-4">
          {claims.map((claim: Record<string, unknown>) => {
            const seededHotel = claim.seededHotel as Record<string, unknown> | undefined;
            const claimant = claim.claimant as Record<string, unknown> | undefined;
            return (
              <div key={claim.id as string} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hôtel importé</div>
                      <h3 className="text-lg font-semibold">{(seededHotel?.name as string) || "-"}</h3>
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {((seededHotel as any)?.wilaya?.nameFr) || "-"}
                      </p>
                    </div>
                    <StatusBadge status={claim.status as string}>{claim.status as string}</StatusBadge>
                  </div>

                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Demandeur</div>
                    <div className="mt-1 font-semibold">
                      {(claimant?.legalName as string) || (claimant?.fullName as string) || "-"}
                    </div>
                    <div className="text-sm text-muted-foreground">{(claimant?.phone as string) || "Aucun téléphone"}</div>
                  </div>

                  {claim.status === "pending" ? (
                    <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row">
                      <ConfirmAction
                        title="Approve this claim?"
                        description="The seeded hotel will be deactivated and this claimant will own the hotel profile."
                        confirmLabel="Approve takeover"
                        onConfirm={() => decideMutation.mutate({ claimId: claim.id as string, approve: true })}
                      >
                        <Button size="sm" disabled={decideMutation.isPending}>
                          <CheckCircle className="me-1 h-4 w-4" />
                          Approve takeover
                        </Button>
                      </ConfirmAction>
                      <ConfirmAction
                        title="Reject this claim?"
                        description="The claimant will be notified that the takeover request was rejected."
                        confirmLabel={t("admin.reject")}
                        destructive
                        onConfirm={() => decideMutation.mutate({ claimId: claim.id as string, approve: false })}
                      >
                        <Button size="sm" variant="outline" disabled={decideMutation.isPending}>
                          <XCircle className="me-1 h-4 w-4" />
                          {t("admin.reject")}
                        </Button>
                      </ConfirmAction>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={<FileText className="h-6 w-6" />} title="Aucune demande de reprise" description="Les demandes de propriété d'hôtel apparaîtront ici après soumission." />
      )}
    </div>
  );
}
