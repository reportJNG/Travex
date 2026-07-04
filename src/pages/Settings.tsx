import { useState } from "react";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Settings as SettingsIcon, Clock, Save } from "lucide-react";

export default function Settings() {
  const { t } = useI18n();
  const { data: hotel } = trpc.hotel.myHotel.useQuery();
  const utils = trpc.useUtils();

  const updateSettings = trpc.hotel.updateSettings.useMutation({
    onSuccess: () => { toast.success("Settings saved"); utils.hotel.myHotel.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const [windowHours, setWindowHours] = useState(hotel?.offlinePaymentWindowHours || 48);

  const handleSave = () => {
    updateSettings.mutate({ offlinePaymentWindowHours: windowHours });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        {t("nav.settings")}
      </h1>

      {hotel && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              Payment Window Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Offline Payment Window</Label>
                <span className="text-sm font-medium text-slate-700">{windowHours} hours</span>
              </div>
              <Slider
                value={[windowHours]}
                onValueChange={(v) => setWindowHours(v[0])}
                min={6}
                max={168}
                step={6}
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>6h</span>
                <span>24h</span>
                <span>48h</span>
                <span>72h</span>
                <span>168h (7d)</span>
              </div>
              <p className="text-sm text-slate-500">
                Time given to agencies to complete offline payment after you approve their booking.
              </p>
            </div>

            <Button
              className="w-full bg-teal-600 hover:bg-teal-700"
              onClick={handleSave}
              disabled={updateSettings.isPending}
            >
              <Save className="h-4 w-4 me-2" />
              {updateSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Manage your account settings from the Profile page. You can update your contact information and preferred language there.
          </p>
          <Button variant="link" className="px-0 mt-2" onClick={() => window.location.href = "/profile"}>
            Go to Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
