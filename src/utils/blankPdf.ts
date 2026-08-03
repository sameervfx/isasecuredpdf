import { PDFDocument } from 'pdf-lib';

export interface CreatePDFOptions {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  pageCount: number;
}

export async function createBlankPDF(options: CreatePDFOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  let dims: [number, number] = [612, 792]; // Default Letter Portrait
  if (options.pageSize === 'A4') {
    dims = [595.28, 841.89];
  } else if (options.pageSize === 'Legal') {
    dims = [612, 1008];
  }

  if (options.orientation === 'landscape') {
    dims = [dims[1], dims[0]];
  }

  const count = Math.max(1, Math.min(50, options.pageCount));
  for (let i = 0; i < count; i++) {
    pdfDoc.addPage(dims);
  }

  return await pdfDoc.save();
}
