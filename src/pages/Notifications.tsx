import {
  BadgeCheck,
  Bell,
  BellOff,
  Building2,
  CalendarCheck,
  Check,
  CreditCard,
  FileText,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, LoadingCards } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

type NotifStyle = { icon: React.ElementType; bg: string; text: string };

const NOTIFICATION_STYLE: Record<string, NotifStyle> = {
  booking_request: {
    icon: CalendarCheck,
    bg: "bg-primary/10",
    text: "text-primary",
  },
  booking_rejected: { icon: XCircle, bg: "bg-rose-100", text: "text-rose-600" },
  payment_window_started: {
    icon: CreditCard,
    bg: "bg-sky-100",
    text: "text-sky-600",
  },
  payment_received: {
    icon: BadgeCheck,
    bg: "bg-emerald-100",
    text: "text-emerald-600",
  },
  online_confirmed: {
    icon: BadgeCheck,
    bg: "bg-emerald-100",
    text: "text-emerald-600",
  },
  account_approved: {
    icon: ShieldAlert,
    bg: "bg-emerald-100",
    text: "text-emerald-600",
  },
  account_rejected: {
    icon: ShieldAlert,
    bg: "bg-rose-100",
    text: "text-rose-600",
  },
  invoice_issued: {
    icon: FileText,
    bg: "bg-amber-100",
    text: "text-amber-600",
  },
  claim_decided: {
    icon: Building2,
    bg: "bg-violet-100",
    text: "text-violet-600",
  },
};

const DEFAULT_STYLE: NotifStyle = {
  icon: Bell,
  bg: "bg-muted",
  text: "text-muted-foreground",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-DZ");
}

function getNotificationDetail(
  type: string,
  data: Record<string, unknown>
): string | null {
  const ref =
    typeof data.reference === "string" ? `Réf: ${data.reference}` : null;
  const hotel = typeof data.hotelName === "string" ? data.hotelName : null;
  const period = typeof data.period === "string" ? data.period : null;

  if (
    type === "booking_request" ||
    type === "booking_rejected" ||
    type === "payment_window_started" ||
    type === "payment_received" ||
    type === "online_confirmed"
  ) {
    return [ref, hotel].filter(Boolean).join(" · ");
  }
  if (type === "invoice_issued") {
    return [period, ref].filter(Boolean).join(" · ");
  }
  return ref;
}

export default function Notifications() {
  const { t } = useI18n();
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } = trpc.notification.list.useQuery();

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => {
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });
  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      toast.success("Toutes marquées comme lues");
      utils.notification.list.invalidate();
      utils.notification.unreadCount.invalidate();
    },
  });

  const unreadCount = notifications?.filter(n => !n.readAt).length || 0;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Boîte de réception"
        title={t("notifications.title")}
        description="Réservations, paiements, comptes, factures et réclamations."
        actions={
          unreadCount > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <Check className="me-2 h-4 w-4" />
              {t("notifications.markAllRead")}
            </Button>
          ) : null
        }
      />

      {unreadCount > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-4 py-2.5 text-sm text-primary">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>
            <span className="font-semibold">{unreadCount}</span> notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-5">
            <LoadingCards count={4} />
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="divide-y divide-border">
            {notifications.map(notification => {
              let payload: Record<string, unknown> = {};
              try {
                payload =
                  typeof notification.data === "string"
                    ? JSON.parse(notification.data)
                    : (notification.data as Record<string, unknown>) || {};
              } catch {
                payload = {};
              }
              const isUnread = !notification.readAt;
              const detail = getNotificationDetail(
                notification.type,
                payload
              );
              const style =
                NOTIFICATION_STYLE[notification.type] ?? DEFAULT_STYLE;
              const Icon = style.icon;

              return (
                <button
                  key={notification.id}
                  type="button"
                  className={`group flex w-full items-start gap-4 px-5 py-4 text-start transition-colors hover:bg-muted/40 ${
                    isUnread ? "bg-primary/[0.03]" : ""
                  }`}
                  onClick={() => {
                    if (isUnread)
                      markRead.mutate({ notificationId: notification.id });
                  }}
                >
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${style.bg} ${style.text}`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={`truncate text-sm ${isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"}`}>
                        {t(`notifications.${notification.type}`) ||
                          notification.type}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </span>
                    {detail && (
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {detail}
                      </span>
                    )}
                  </span>
                  {isUnread && (
                    <span
                      className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-label="Non lue"
                    />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              icon={<BellOff className="h-6 w-6" />}
              title={t("notifications.empty")}
              description="Vous êtes à jour. Les nouvelles notifications apparaîtront ici."
            />
          </div>
        )}
      </div>
    </div>
  );
}
