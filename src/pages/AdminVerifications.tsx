import { CheckCircle, Clock, ExternalLink, FileText, Mail, Phone, User, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

function isImagePath(path: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
}

interface DocumentSlotProps {
  label: string;
  path?: string | null;
}

function DocumentSlot({ label, path }: DocumentSlotProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      {path ? (
        isImagePath(path) ? (
          <img
            src={path}
            alt={label}
            className="w-full max-h-48 rounded object-cover border"
          />
        ) : (
          <a
            href={path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open Document
          </a>
        )
      ) : (
        <p className="text-sm text-muted-foreground italic">Not uploaded</p>
      )}
    </div>
  );
}

export default function AdminVerifications() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: users, isLoading } = trpc.admin.listUsers.useQuery({ status: "awaiting_review" });
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [docsUserId, setDocsUserId] = useState<string | null>(null);

  const reviewMutation = trpc.admin.reviewAccount.useMutation({
    onSuccess: () => {
      toast.success("Account reviewed");
      utils.admin.listUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const docsUser = users?.find((u: Record<string, unknown>) => u.id === docsUserId);
  const docsProfile = docsUser?.profile as Record<string, unknown> | undefined;
  const businessDocuments = docsProfile?.businessDocuments as Record<string, string> | undefined;

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title={t("admin.pendingVerifications")}
        description="Validez les profils professionnels complets et documentez clairement chaque refus."
      />

      {isLoading ? (
        <LoadingCards count={4} />
      ) : users && users.length > 0 ? (
        <div className="space-y-4">
          {users.map((user: Record<string, unknown>) => {
            const profile = user.profile as Record<string, unknown> | undefined;
            const userId = user.id as string;
            const taxId = typeof profile?.taxId === "string" ? profile.taxId : "";
            const licenseNumber = typeof profile?.licenseNumber === "string" ? profile.licenseNumber : "";
            const phone = typeof profile?.phone === "string" ? profile.phone : "";
            return (
              <div key={userId} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-lg font-semibold">{(user.name as string) || "Utilisateur inconnu"}</h3>
                        <span className="rounded-md border px-2 py-1 text-xs capitalize">{(user.role as string) || "unknown"}</span>
                        <StatusBadge status="awaiting_review">{t("status.awaiting_review")}</StatusBadge>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{(user.email as string) || "Aucun email"}</span>
                        <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{(profile?.legalName as string) || "Aucun nom légal"}</span>
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          {phone || "Aucun téléphone"}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          Région : {[(profile?.countryCode as string) || "DZ", (profile?.wilayaCode as number) || "-"].join(" / ")}
                        </span>
                        {taxId ? <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />NIF : {taxId}</span> : null}
                        {licenseNumber ? <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" />Agrément : {licenseNumber}</span> : null}
                      </div>
                      <Input
                        placeholder="Motif de refus (obligatoire en cas de rejet)"
                        value={reasons[userId] || ""}
                        onChange={(event) => setReasons({ ...reasons, [userId]: event.target.value })}
                      />
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDocsUserId(userId)}
                      >
                        <FileText className="me-1 h-4 w-4" />
                        Voir documents
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => reviewMutation.mutate({ userId, approve: true })}
                        disabled={reviewMutation.isPending}
                      >
                        <CheckCircle className="me-1 h-4 w-4" />
                        {t("admin.approve")}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const reason = reasons[userId]?.trim();
                          if (!reason) {
                            toast.error("Le motif est obligatoire");
                            return;
                          }
                          reviewMutation.mutate({ userId, approve: false, reason });
                        }}
                        disabled={reviewMutation.isPending}
                      >
                        <XCircle className="me-1 h-4 w-4" />
                        {t("admin.reject")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Clock className="h-6 w-6" />}
          title="Aucun dossier en attente"
          description="Il n'y a pas de compte à vérifier pour le moment."
        />
      )}

      {/* Business Documents Sheet */}
      <Sheet open={docsUserId !== null} onOpenChange={(open) => { if (!open) setDocsUserId(null); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              Documents professionnels - {(docsUser?.name as string) || "Utilisateur inconnu"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 px-4">
            {businessDocuments ? (
              <div className="flex flex-col gap-4 sm:grid sm:grid-cols-1">
                <DocumentSlot
                  label="Registre de commerce"
                  path={businessDocuments.commercialRegistry || businessDocuments.commercial_registry}
                />
                <DocumentSlot
                  label="Agrément tourisme"
                  path={businessDocuments.tourismLicense || businessDocuments.tourism_license}
                />
                <DocumentSlot
                  label="Carte fiscale"
                  path={businessDocuments.taxCard || businessDocuments.tax_card}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
                <FileText className="h-10 w-10 opacity-40" />
                <p className="font-medium">Documents non envoyés</p>
                <p className="text-sm">Ce demandeur n'a pas encore ajouté ses documents professionnels.</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
