import { BarChart3, BedDouble, Calendar, TrendingUp } from "lucide-react";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n";

export default function Analytics() {
  const { t } = useI18n();
  const stats = [
    { label: "Bookings this month", value: "12", helper: "+20%", icon: <Calendar className="h-5 w-5" /> },
    { label: "Room nights sold", value: "48", helper: "+15%", icon: <BedDouble className="h-5 w-5" /> },
    { label: "Revenue", value: "245K DZD", helper: "+25%", icon: <TrendingUp className="h-5 w-5" />, tone: "green" as const },
    { label: "Occupancy rate", value: "72%", helper: "+8%", icon: <BarChart3 className="h-5 w-5" />, tone: "amber" as const },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Performance"
        title={t("nav.analytics")}
        description="A clean overview of booking volume, room nights, revenue, and occupancy signals."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly performance</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<BarChart3 className="h-6 w-6" />}
            title="Charts coming with live data"
            description="The layout is ready for the analytics endpoint once real booking aggregates are connected."
          />
        </CardContent>
      </Card>
    </div>
  );
}
