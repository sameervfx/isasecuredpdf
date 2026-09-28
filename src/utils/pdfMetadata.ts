import { PDFDocument, PDFName } from 'pdf-lib';

export const APP_METADATA = {
  creator: 'ISA Secured PDF Suite',
  producer: 'ISA Secured PDF Engine (WASM)',
} as const;

// Ensure pdf-lib internal updateInfoDict preserves ISA Secured PDF branding
// and does not overwrite Producer with third-party GitHub URL or browser userAgent.
if (typeof (PDFDocument.prototype as any).updateInfoDict === 'function') {
  (PDFDocument.prototype as any).updateInfoDict = function () {
    const now = new Date();
    const info = (this as any).getInfoDict();

    this.setProducer(APP_METADATA.producer);
    this.setModificationDate(now);

    const existingCreator = info && typeof info.get === 'function' ? info.get(PDFName.of('Creator')) : null;
    if (!existingCreator) {
      this.setCreator(APP_METADATA.creator);
    }
    if (info && typeof info.get === 'function' && !info.get(PDFName.of('CreationDate'))) {
      this.setCreationDate(now);
    }
  };
}

/**
 * Sets standardized, privacy-preserving application metadata on the PDF document dictionary.
 * Prevents raw browser userAgent strings or default third-party library tracking strings from leaking into exports.
 */
export function applyStandardMetadata(pdfDoc: PDFDocument): void {
  try {
    pdfDoc.setCreator(APP_METADATA.creator);
    pdfDoc.setProducer(APP_METADATA.producer);
    pdfDoc.setModificationDate(new Date());
  } catch (err) {
    console.warn('[PDFMetadata] Error applying document metadata:', err);
  }
}
