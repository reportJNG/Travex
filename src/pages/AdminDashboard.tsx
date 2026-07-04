import { useI18n } from "@/i18n";
import { trpc } from "@/providers/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Shield, Users, Building2, Receipt, BarChart3, RefreshCw } from "lucide-react";

export default function AdminDashboard() {
  const { t } = useI18n();
  const { data: stats, refetch } = trpc.admin.stats.useQuery();

  const statCards = [
    { label: t("admin.agencies"), value: stats?.agencies || 0, icon: Users, color: "text-blue-600 bg-blue-50" },
    { label: t("admin.hotels"), value: stats?.hotels || 0, icon: Building2, color: "text-teal-600 bg-teal-50" },
    { label: t("admin.transactions"), value: stats?.transactionsCount || 0, icon: Receipt, color: "text-green-600 bg-green-50" },
    { label: t("admin.volume"), value: stats ? `${(stats.transactionsVolume / 1000).toFixed(0)}K DZD` : "0 DZD", icon: BarChart3, color: "text-purple-600 bg-purple-50" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Shield className="h-6 w-6" />
          {t("admin.title")}
        </h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 me-1" /> Refresh
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className={`h-10 w-10 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-slate-800">{s.value}</div>
              <div className="text-sm text-slate-500">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => window.location.href = "/admin/verifications"}>
              <Badge variant="secondary" className="me-2">{stats?.agencies || 0}</Badge>
              Review Pending Verifications
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/admin/users"}>
              Manage Users
            </Button>
            <Button variant="outline" onClick={() => window.location.href = "/admin/claims"}>
              Review Claims
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
