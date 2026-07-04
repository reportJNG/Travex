import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Bell, BellOff, Check, Calendar } from "lucide-react";

const NOTIFICATION_ICONS: Record<string, string> = {
  booking_request: "📝",
  booking_rejected: "❌",
  payment_window_started: "⏰",
  payment_received: "💰",
  online_confirmed: "✅",
  account_approved: "🎉",
  account_rejected: "🚫",
  invoice_issued: "📄",
  claim_decided: "🏨",
};

export default function Notifications() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notification.list.useQuery();

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => utils.notification.list.invalidate(),
  });
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("All marked as read");
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const unreadCount = notifications?.filter((n) => !n.readAt).length || 0;

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Bell className="h-6 w-6" />
          {t("notifications.title")}
        </h1>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <Check className="h-4 w-4 me-1" />
            {t("notifications.markAllRead")}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {notifications.map((n) => {
                let data: Record<string, unknown> = {};
                try {
                  data = typeof n.data === "string" ? JSON.parse(n.data) : (n.data as Record<string, unknown>);
                } catch { /* ignore */ }
                const isUnread = !n.readAt;

                return (
                  <div
                    key={n.id}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition-colors ${
                      isUnread ? "bg-teal-50/50 hover:bg-teal-50" : "hover:bg-slate-50"
                    }`}
                    onClick={() => {
                      if (isUnread) markRead.mutate({ notificationId: n.id });
                    }}
                  >
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 text-lg">
                      {NOTIFICATION_ICONS[n.type] || "🔔"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800 text-sm">
                          {t(`notifications.${n.type}`) || n.type}
                        </span>
                        {isUnread && <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />}
                      </div>
                      {data.reference && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          Ref: {data.reference as string}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
                        <Calendar className="h-3 w-3" />
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <BellOff className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>{t("notifications.empty")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
