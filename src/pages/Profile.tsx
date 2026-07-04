import { useState } from "react";
import { useI18n } from "@/i18n";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserCircle, Mail, Phone, Globe, Save } from "lucide-react";

export default function Profile() {
  const { t } = useI18n();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: userData } = trpc.auth.me.useQuery();

  const updateMutation = trpc.auth.updateProfile.useMutation({
    onSuccess: () => { toast.success("Profile updated"); utils.auth.me.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [fullName, setFullName] = useState((user as any)?.name || "");
  const [phone, setPhone] = useState("");
  const [locale, setLocale] = useState("fr");

  const handleSave = () => {
    updateMutation.mutate({
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(locale && { preferredLocale: locale as "fr" | "ar" | "en" }),
    });
  };

  const profile = (userData as any)?.profile;

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <UserCircle className="h-6 w-6" />
        {t("nav.profile")}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <UserCircle className="h-4 w-4 text-slate-400" />
              Full Name
            </Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={profile?.fullName || (user as any)?.name || ""}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-slate-400" />
              Email
            </Label>
            <Input value={(user as any)?.email || ""} disabled className="bg-slate-50" />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Phone className="h-4 w-4 text-slate-400" />
              Phone
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={profile?.phone || "+213555123456"}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Globe className="h-4 w-4 text-slate-400" />
              Preferred Language
            </Label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>

          {profile?.legalName && (
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Legal Information</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">Legal Name</span>
                  <p className="font-medium text-slate-700">{profile.legalName}</p>
                </div>
                <div>
                  <span className="text-slate-400">Role</span>
                  <p className="font-medium text-slate-700 capitalize">{(user as any)?.role}</p>
                </div>
                {profile?.taxId && (
                  <div>
                    <span className="text-slate-400">Tax ID</span>
                    <p className="font-medium text-slate-700">{profile.taxId}</p>
                  </div>
                )}
                {profile?.licenseNumber && (
                  <div>
                    <span className="text-slate-400">License</span>
                    <p className="font-medium text-slate-700">{profile.licenseNumber}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button
            className="w-full bg-teal-600 hover:bg-teal-700"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            <Save className="h-4 w-4 me-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
