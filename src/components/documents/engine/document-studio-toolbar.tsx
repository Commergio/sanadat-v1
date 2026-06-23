"use client";

import { Save, X, Loader2, Maximize2, PencilLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DocumentActionButtons } from "./document-action-buttons";
import type { DocumentShareMeta } from "./types";
import type { StudioViewMode } from "@/components/documents/voucher-studio/voucher-studio-context";

interface DocumentStudioToolbarProps {
  previewId: string;
  documentNumber: string;
  partyName: string;
  amountLabel: string;
  documentTitle?: string;
  saving?: boolean;
  saveDisabled?: boolean;
  onSave: () => void;
  onCancel: () => void;
  viewMode?: StudioViewMode;
  onViewModeChange?: (mode: StudioViewMode) => void;
  className?: string;
  trailing?: React.ReactNode;
  pdfFilenamePrefix?: string;
  /** Hide PDF/print/WhatsApp (receipt studio — draft only). */
  hideExportActions?: boolean;
  shareMeta?: DocumentShareMeta;
}

export function DocumentStudioToolbar({
  previewId,
  documentNumber,
  partyName,
  amountLabel,
  documentTitle,
  saving,
  saveDisabled,
  onSave,
  onCancel,
  viewMode = "edit",
  onViewModeChange,
  className,
  trailing,
  pdfFilenamePrefix = "sanadat",
  hideExportActions = false,
  shareMeta: shareMetaProp,
}: DocumentStudioToolbarProps) {
  const t = useTranslations("documents");

  const exportConfig = { previewElementId: previewId, pdfFilenamePrefix };
  const shareMeta: DocumentShareMeta = shareMetaProp ?? {
    documentNumber,
    partyName,
    amountLabel,
    documentTitle,
    exportEnabled: !hideExportActions,
  };

  return (
    <div
      className={cn(
        "document-studio-toolbar no-print flex flex-col gap-2 border-b border-border/80 bg-card/80 px-3 py-2.5 backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:px-4 sm:py-3 lg:px-6",
        className
      )}
    >
      <div className="hidden items-center gap-2 lg:flex">
        <Button type="button" size="sm" className="gap-2" onClick={onSave} disabled={saving || saveDisabled}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? t("creating") : t("save")}
        </Button>
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onCancel}>
          <X className="h-4 w-4" />
          {t("cancel")}
        </Button>
        <div className="hidden h-6 w-px bg-border sm:block" />
      </div>

      <div className="-mx-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 pb-0.5 sm:mx-0 sm:overflow-visible sm:pb-0">
        <DocumentActionButtons
          compact
          exportConfig={exportConfig}
          shareMeta={shareMeta}
          hideExportActions={hideExportActions}
        />
        {onViewModeChange ? (
          viewMode === "edit" ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2 shrink-0"
              onClick={() => onViewModeChange("preview")}
            >
              <Maximize2 className="h-4 w-4" />
              <span className="hidden sm:inline">{t("fullPreview")}</span>
              <span className="sm:hidden">{t("fullPreviewShort")}</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2 shrink-0"
              onClick={() => onViewModeChange("edit")}
            >
              <PencilLine className="h-4 w-4" />
              <span className="hidden sm:inline">{t("backToEdit")}</span>
              <span className="sm:hidden">{t("backToEditShort")}</span>
            </Button>
          )
        ) : null}
      </div>

      {trailing ? (
        <div className="hidden items-center lg:ms-auto lg:flex">{trailing}</div>
      ) : null}
    </div>
  );
}
