import { AlertCircle, Receipt } from "lucide-react";
import { EmptyState } from "@/components/app/StateBlock";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/i18n";

export default function HotelInvoices() {
  const { t } = useI18n();

  return (
    <div>
      <PageHeader
        eyebrow="Billing"
        title={t("invoices.title")}
        description="Review monthly commission invoices and payment instructions for your hotel account."
      />

      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
          <div>
            <h3 className="font-medium text-foreground">Commission: 5%</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("invoices.payInfo")}. Invoices are generated automatically each month.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoice history
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Receipt className="h-6 w-6" />}
            title="No invoices yet"
            description="Invoices will appear after reservations are confirmed."
          />
        </CardContent>
      </Card>
    </div>
  );
}
