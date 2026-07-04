import { useI18n } from "@/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Receipt, AlertCircle } from "lucide-react";

export default function HotelInvoices() {
  const { t } = useI18n();

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t("invoices.title")}</h1>

      <Card className="mb-6 bg-teal-50 border-teal-200">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-teal-800">Commission: 5%</h3>
            <p className="text-sm text-teal-600 mt-1">
              {t("invoices.payInfo")}. Les factures sont générées automatiquement chaque mois.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Historique des factures
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-400">
            <Receipt className="h-10 w-10 mx-auto mb-3 text-slate-300" />
            <p>Aucune facture pour le moment</p>
            <p className="text-sm mt-1">Les factures apparaîtront après confirmation des réservations</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
