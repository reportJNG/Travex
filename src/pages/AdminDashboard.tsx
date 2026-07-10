import { Link } from "react-router";
import { BarChart3, Building2, Receipt, RefreshCw, Shield, Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

export default function AdminDashboard() {
  const { t } = useI18n();
  const { data: stats, refetch, isFetching } = trpc.admin.stats.useQuery();
  const { data: pendingUsers } = trpc.admin.listUsers.useQuery({ status: "awaiting_review" });

  return (
    <div>
      <PageHeader
        eyebrow="Command center"
        title={t("admin.title")}
        description="Monitor platform health, verification queues, users, and claim activity from one place."
        actions={
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`me-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {!stats ? (
          <>
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </>
        ) : (
          <>
            <StatCard label={t("admin.agencies")} value={stats.agencies} icon={<Users className="h-5 w-5" />} />
            <StatCard label={t("admin.hotels")} value={stats.hotels} icon={<Building2 className="h-5 w-5" />} tone="green" />
            <StatCard label={t("admin.transactions")} value={stats.transactionsCount} icon={<Receipt className="h-5 w-5" />} />
            <StatCard
              label={t("admin.volume")}
              value={`${(stats.transactionsVolume / 1000).toFixed(0)}K DZD`}
              icon={<BarChart3 className="h-5 w-5" />}
              tone="amber"
            />
          </>
        )}
      </div>

      {pendingUsers && pendingUsers.length > 0 ? (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Shield className="h-5 w-5 shrink-0 text-amber-600" />
          <span>
            <span className="font-semibold">{pendingUsers.length}</span> account{pendingUsers.length !== 1 ? "s" : ""} awaiting verification review.
          </span>
          <Button size="sm" asChild variant="outline" className="ms-auto border-amber-300 bg-amber-100 hover:bg-amber-200">
            <Link to="/admin/verifications">Review now</Link>
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          {
            title: "Review verifications",
            description: "Approve or reject new hotel and agency accounts awaiting review.",
            href: "/admin/verifications",
            icon: Shield,
            badge: pendingUsers?.length,
          },
          {
            title: "Manage users",
            description: "Search accounts, inspect roles, and suspend risky access.",
            href: "/admin/users",
            icon: Users,
            badge: undefined,
          },
          {
            title: "Review claims",
            description: "Resolve seeded hotel ownership requests with clear audit actions.",
            href: "/admin/claims",
            icon: Building2,
            badge: undefined,
          },
          {
            title: "Hotel invoices",
            description: "Generate monthly commissions, mark payments received, and track billing.",
            href: "/admin/invoices",
            icon: Receipt,
            badge: undefined,
          },
        ].map((action) => (
          <Card key={action.href} className="transition-shadow hover:shadow-md">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                {action.badge ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                    {action.badge}
                  </span>
                ) : null}
              </div>
              <div className="flex-1">
                <h2 className="font-semibold">{action.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
              </div>
              <Button asChild variant="outline" className="justify-start hover:bg-primary/5">
                <Link to={action.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
