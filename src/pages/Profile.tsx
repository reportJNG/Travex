import { useState } from "react";
import { Globe, Mail, Phone, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

export default function Profile() {
  const { t, locale: currentLocale } = useI18n();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: userData } = trpc.auth.me.useQuery();
  const profile = (userData as any)?.profile;

  const [fullName, setFullName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [locale, setLocale] = useState<"fr" | "ar" | "en" | null>(null);
  const effectiveFullName =
    fullName ?? profile?.fullName ?? (user as any)?.name ?? "";
  const effectivePhone = phone ?? profile?.phone ?? "";
  const effectiveLocale =
    locale ??
    (profile?.preferredLocale as "fr" | "ar" | "en" | undefined) ??
    currentLocale;

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profil mis à jour");
      utils.auth.me.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const handleSave = () => {
    updateMutation.mutate({
      fullName: effectiveFullName.trim() || undefined,
      phone: effectivePhone || undefined,
      preferredLocale: effectiveLocale,
    });
  };

  const initials = effectiveFullName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "?";

  const roleLabel: Record<string, string> = {
    agency: "Agence de voyage",
    hotel: "Hôtel",
    super_admin: "Administrateur",
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Compte"
        title={t("nav.profile")}
        description="Gardez votre identité, vos coordonnées et votre langue préférée à jour."
      />

      {/* Avatar + Identity */}
      <div className="mb-5 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-xl font-bold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                {effectiveFullName || "Mon compte"}
              </h2>
              {(user as any)?.status && (
                <StatusBadge status={(user as any).status}>
                  {t(`status.${(user as any).status}`)}
                </StatusBadge>
              )}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {(user as any)?.email || ""}
            </p>
            {profile?.legalName && (
              <p className="mt-0.5 text-sm font-medium text-foreground/70">
                {profile.legalName} ·{" "}
                <span className="font-normal text-muted-foreground">
                  {roleLabel[(user as any)?.role] || (user as any)?.role}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Editable fields */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Informations personnelles
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span className="uppercase tracking-wider">Nom complet</span>
            </Label>
            <Input
              value={effectiveFullName}
              onChange={event => setFullName(event.target.value)}
              placeholder={profile?.fullName || (user as any)?.name || "Ahmed Benali"}
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <span className="uppercase tracking-wider">Email</span>
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={(user as any)?.email || ""}
                disabled
                className="h-10 ps-9 text-muted-foreground"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Téléphone
            </Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={effectivePhone}
                onChange={event => setPhone(event.target.value)}
                placeholder="+213 5XX XXX XXX"
                className="h-10 ps-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Langue préférée
            </Label>
            <div className="relative">
              <Globe className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={effectiveLocale}
                onValueChange={value => setLocale(value as "fr" | "ar" | "en")}
              >
                <SelectTrigger className="h-10 ps-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3 border-t border-border/60 pt-4">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            <Save className="me-2 h-4 w-4" />
            {updateMutation.isPending ? "Enregistrement…" : "Enregistrer les modifications"}
          </Button>
        </div>
      </div>

      {/* Legal info section */}
      {profile?.legalName && (
        <div className="mt-5 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold text-foreground">
            Informations légales
          </h3>
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nom légal
              </span>
              <p className="mt-1 font-medium">{profile.legalName}</p>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Rôle
              </span>
              <p className="mt-1 font-medium">
                {roleLabel[(user as any)?.role] || (user as any)?.role}
              </p>
            </div>
            {profile?.taxId && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  NIF / Identifiant fiscal
                </span>
                <p className="mt-1 font-mono text-sm">{profile.taxId}</p>
              </div>
            )}
            {profile?.licenseNumber && (
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Numéro d'agrément
                </span>
                <p className="mt-1 font-mono text-sm">{profile.licenseNumber}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
