import { useI18n } from "@/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, BedDouble } from "lucide-react";

export default function Analytics() {
  const { t } = useI18n();

  // Placeholder analytics - in real app, would come from API
  const stats = [
    { label: "Bookings this month", value: "12", change: "+20%", icon: Calendar },
    { label: "Room nights sold", value: "48", change: "+15%", icon: BedDouble },
    { label: "Revenue (DZD)", value: "245,000", change: "+25%", icon: TrendingUp },
    { label: "Occupancy rate", value: "72%", change: "+8%", icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t("nav.analytics")}</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <s.icon className="h-8 w-8 text-teal-600" />
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {s.change}
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-800">{s.value}</div>
                <div className="text-sm text-slate-500">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-slate-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <p>Charts will appear here with real data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
