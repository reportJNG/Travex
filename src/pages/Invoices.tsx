import { useI18n } from "@/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Invoices() {
  const { t } = useI18n();

  // Mock data
  const invoices = [
    { id: 1, period: "2026-06", total: 125000, status: "unpaid", dueDate: "2026-07-10" },
    { id: 2, period: "2026-05", total: 98000, status: "paid", dueDate: "2026-06-10" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t("invoices.title")}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t("invoices.title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 text-slate-500">{t("invoices.period")}</th>
                    <th className="text-right py-2 px-3 text-slate-500">{t("invoices.amount")}</th>
                    <th className="text-left py-2 px-3 text-slate-500">{t("invoices.status")}</th>
                    <th className="text-left py-2 px-3 text-slate-500">{t("invoices.dueDate")}</th>
                    <th className="text-right py-2 px-3 text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-3 font-medium">{inv.period}</td>
                      <td className="py-3 px-3 text-right">{inv.total.toLocaleString()} DZD</td>
                      <td className="py-3 px-3">
                        <Badge className={
                          inv.status === "paid" ? "bg-green-100 text-green-700" :
                          inv.status === "unpaid" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }>
                          {t(`invoices.status.${inv.status}`)}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{inv.dueDate}</td>
                      <td className="py-3 px-3 text-right">
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Receipt className="h-10 w-10 mx-auto mb-3 text-slate-300" />
              <p>No invoices yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
