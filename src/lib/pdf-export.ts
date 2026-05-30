/** Resolve the DOM node used for PDF rasterization (prefers `.print-area`). */
export function resolvePdfExportElement(elementId: string): HTMLElement {
  const container = document.getElementById(elementId);
  if (!container) throw new Error("Element not found");
  return container.querySelector<HTMLElement>(".print-area") ?? container;
}

function applyPdfTypography(clonedRoot: HTMLElement) {
  const sourceDoc = clonedRoot.querySelector<HTMLElement>(".a4-document");
  if (!sourceDoc) return;

  const liveDoc = document.querySelector<HTMLElement>(".a4-document");
  const computed = liveDoc ? getComputedStyle(liveDoc) : null;

  sourceDoc.style.fontFamily =
    computed?.fontFamily ??
    'var(--font-arabic), "IBM Plex Sans Arabic", "Cairo", "Segoe UI", Tahoma, sans-serif';
  sourceDoc.style.textRendering = "optimizeLegibility";
  sourceDoc.style.letterSpacing = "normal";
  sourceDoc.style.textTransform = "none";

  sourceDoc.querySelectorAll<HTMLElement>("*").forEach((node) => {
    node.style.letterSpacing = "normal";
    if (sourceDoc.dir === "rtl") {
      node.style.textTransform = "none";
    }
  });
}

export async function exportToPdf(elementId: string, filename: string) {
  if (typeof document !== "undefined" && document.fonts?.ready) {
    await document.fonts.ready;
  }

  const element = resolvePdfExportElement(elementId);
  document.body.classList.add("pdf-exporting");

  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: element.offsetWidth,
      height: element.offsetHeight,
      scrollX: 0,
      scrollY: 0,
      onclone: (_clonedDoc, clonedElement) => {
        applyPdfTypography(clonedElement);
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);
    } else {
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    document.body.classList.remove("pdf-exporting");
  }
}
