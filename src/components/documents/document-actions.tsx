"use client";

import { Printer, Download, MessageCircle } from "lucide-react";
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
  const handlePrint = () => window.print();

  const handlePdf = async () => {
    try {
      await exportToPdf("document-preview", `sanadat-${documentNumber}`);
      toast.success("تم تصدير PDF بنجاح");
    } catch {
      toast.error("فشل تصدير PDF");
    }
  };

  const handleWhatsApp = () => {
    const message = `مستند ${documentNumber}\nالطرف: ${partyName}\nالمبلغ: ${amount}\n— نظام السندات`;
    window.open(generateWhatsAppLink("966500000000", message), "_blank");
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
        <Printer className="h-4 w-4" />
        طباعة
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={handlePdf}>
        <Download className="h-4 w-4" />
        تصدير PDF
      </Button>
      <Button variant="outline" size="sm" className="gap-2" onClick={handleWhatsApp}>
        <MessageCircle className="h-4 w-4" />
        واتساب
      </Button>
    </div>
  );
}
