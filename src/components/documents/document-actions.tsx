"use client";

import { Printer, Download, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportToPdf } from "@/lib/pdf-export";
import { generateWhatsAppLink } from "@/lib/utils";

interface DocumentActionsProps {
  documentId: string;
  documentNumber: string;
  partyName: string;
  amount: string;
}

export function DocumentActions({
  documentId,
  documentNumber,
  partyName,
  amount,
}: DocumentActionsProps) {
  const t = useTranslations("documents");

  const handlePrint = () => window.print();

  const handlePdf = async () => {
    try {
      await exportToPdf("document-preview", `sanadat-${documentNumber}`);
      toast.success(t("pdfSuccess"));
    } catch {
      toast.error(t("pdfFailed"));
    }
  };

  const handleWhatsApp = () => {
    const message = t("whatsappMessage", {
      number: documentNumber,
      party: partyName,
      amount,
    });
    window.open(generateWhatsAppLink("966500000000", message), "_blank");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
        <Printer className="h-4 w-4" />
        {t("print")}
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={handlePdf}>
        <Download className="h-4 w-4" />
        {t("exportPdf")}
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={handleWhatsApp}>
        <MessageCircle className="h-4 w-4" />
        {t("whatsapp")}
      </Button>
    </div>
  );
}
