import { Link } from "react-router";
import { BarChart3, Building2, RefreshCw, Receipt, Shield, Users } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";

export default function AdminDashboard() {
  const { t } = useI18n();
  const { data: stats, refetch, isFetching } = trpc.admin.stats.useQuery();

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
        <StatCard label={t("admin.agencies")} value={stats?.agencies || 0} icon={<Users className="h-5 w-5" />} />
        <StatCard label={t("admin.hotels")} value={stats?.hotels || 0} icon={<Building2 className="h-5 w-5" />} tone="green" />
        <StatCard label={t("admin.transactions")} value={stats?.transactionsCount || 0} icon={<Receipt className="h-5 w-5" />} />
        <StatCard
          label={t("admin.volume")}
          value={stats ? `${(stats.transactionsVolume / 1000).toFixed(0)}K DZD` : "0 DZD"}
          icon={<BarChart3 className="h-5 w-5" />}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            title: "Review verifications",
            description: "Approve or reject new hotel and agency accounts awaiting review.",
            href: "/admin/verifications",
            icon: Shield,
          },
          {
            title: "Manage users",
            description: "Search accounts, inspect roles, and suspend risky access.",
            href: "/admin/users",
            icon: Users,
          },
          {
            title: "Review claims",
            description: "Resolve seeded hotel ownership requests with clear audit actions.",
            href: "/admin/claims",
            icon: Building2,
          },
        ].map((action) => (
          <Card key={action.href}>
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <action.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 className="font-semibold">{action.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
              </div>
              <Button asChild variant="outline" className="justify-start">
                <Link to={action.href}>Open</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
