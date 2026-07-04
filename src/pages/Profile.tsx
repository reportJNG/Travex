import { useState } from "react";
import { Globe, Mail, Phone, Save, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const [fullName, setFullName] = useState((user as any)?.name || "");
  const [phone, setPhone] = useState("");
  const [locale, setLocale] = useState<"fr" | "ar" | "en">(currentLocale);

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated");
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    updateMutation.mutate({
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(locale && { preferredLocale: locale }),
    });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Account"
        title={t("nav.profile")}
        description="Keep your identity, contact information, and preferred language up to date."
      />

      <Card>
        <CardHeader>
          <CardTitle>Profile information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                Full name
              </Label>
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder={profile?.fullName || (user as any)?.name || ""} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email
              </Label>
              <Input value={(user as any)?.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" />
                Phone
              </Label>
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={profile?.phone || "+213555123456"} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Preferred language
              </Label>
              <Select value={locale} onValueChange={(value) => setLocale(value as typeof locale)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Francais</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {profile?.legalName ? (
            <div className="rounded-lg border bg-muted/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">Legal information</h3>
                <StatusBadge status={(user as any)?.status || "approved"}>{t(`status.${(user as any)?.status || "approved"}`)}</StatusBadge>
              </div>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Legal name</span>
                  <p className="font-medium">{profile.legalName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Role</span>
                  <p className="font-medium capitalize">{(user as any)?.role?.replace("_", " ")}</p>
                </div>
                {profile?.taxId ? (
                  <div>
                    <span className="text-muted-foreground">Tax ID</span>
                    <p className="font-medium">{profile.taxId}</p>
                  </div>
                ) : null}
                {profile?.licenseNumber ? (
                  <div>
                    <span className="text-muted-foreground">License</span>
                    <p className="font-medium">{profile.licenseNumber}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <Button className="w-full sm:w-auto" onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="me-2 h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
