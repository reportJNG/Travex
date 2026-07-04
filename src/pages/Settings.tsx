import { Link } from "react-router";
import { Clock, Save, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

export default function Settings() {
  const { t } = useI18n();
  const { data: hotel } = trpc.hotel.myHotel.useQuery();
  const utils = trpc.useUtils();
  const [windowHours, setWindowHours] = useState<number | null>(null);
  const effectiveWindowHours = windowHours ?? hotel?.offlinePaymentWindowHours ?? 48;

  const updateSettings = trpc.hotel.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved");
      utils.hotel.myHotel.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Workspace"
        title={t("nav.settings")}
        description="Tune operational preferences for booking approval and account management."
      />

      {hotel ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5" />
              Payment window settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Label>Offline payment window</Label>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {effectiveWindowHours} hours
                </span>
              </div>
              <Slider value={[effectiveWindowHours]} onValueChange={(value) => setWindowHours(value[0])} min={6} max={168} step={6} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>6h</span>
                <span>24h</span>
                <span>48h</span>
                <span>72h</span>
                <span>168h</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Time given to agencies to complete offline payment after you approve their booking.
              </p>
            </div>

            <Button onClick={() => updateSettings.mutate({ offlinePaymentWindowHours: effectiveWindowHours })} disabled={updateSettings.isPending}>
              <Save className="me-2 h-4 w-4" />
              {updateSettings.isPending ? "Saving..." : "Save settings"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          icon={<SettingsIcon className="h-6 w-6" />}
          title="No hotel profile found"
          description="Create a hotel profile before changing operational settings."
          action={<Button asChild><Link to="/inventory">Open inventory</Link></Button>}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Manage your contact information and preferred language from your profile.
          </p>
          <Button asChild variant="outline">
            <Link to="/profile">Go to profile</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
