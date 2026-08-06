import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type TemplateType = 'blank' | 'nda' | 'invoice' | 'contractor' | 'w9';

export interface CreatePDFOptions {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  pageCount: number;
  templateType?: TemplateType;
}

export async function createBlankPDF(options: CreatePDFOptions): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let dims: [number, number] = [612, 792]; // Default Letter Portrait
  if (options.pageSize === 'A4') {
    dims = [595.28, 841.89];
  } else if (options.pageSize === 'Legal') {
    dims = [612, 1008];
  }

  if (options.orientation === 'landscape') {
    dims = [dims[1], dims[0]];
  }

  const template = options.templateType || 'blank';

  if (template === 'blank') {
    const count = Math.max(1, Math.min(50, options.pageCount));
    for (let i = 0; i < count; i++) {
      pdfDoc.addPage(dims);
    }
    return await pdfDoc.save();
  }

  // Generate Preset Document Templates
  const page = pdfDoc.addPage(dims);
  const { width: pageW, height: pageH } = page.getSize();

  if (template === 'nda') {
    // 1. MUTUAL NON-DISCLOSURE AGREEMENT (NDA)
    page.drawText('MUTUAL NON-DISCLOSURE AGREEMENT', {
      x: 54,
      y: pageH - 54,
      size: 18,
      font: boldFont,
      color: rgb(0.06, 0.11, 0.22),
    });

    page.drawLine({
      start: { x: 54, y: pageH - 64 },
      end: { x: pageW - 54, y: pageH - 64 },
      thickness: 2,
      color: rgb(0.06, 0.72, 0.84),
    });

    const bodyText = [
      'This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the Effective Date written below,',
      'by and between the Disclosing Party and the Receiving Party (collectively, the "Parties").',
      '',
      '1. Confidential Information',
      'Confidential Information refers to any proprietary information, technical data, trade secrets, software code,',
      'business plans, financial records, or customer lists disclosed by one party to the other.',
      '',
      '2. Non-Use and Non-Disclosure Obligations',
      'The Receiving Party agrees to hold all Confidential Information in strict confidence and shall not disclose',
      'such information to any third party without prior written consent from the Disclosing Party.',
      '',
      '3. Term and Termination',
      'This Agreement shall remain in effect for a period of two (2) years from the Effective Date, after which the',
      'obligations of confidentiality shall survive for an additional three (3) years.',
      '',
      '4. Governing Law',
      'This Agreement shall be governed by and construed in accordance with applicable state and federal laws.',
    ];

    let currentY = pageH - 95;
    for (const line of bodyText) {
      if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
        page.drawText(line, { x: 54, y: currentY, size: 11, font: boldFont, color: rgb(0.1, 0.15, 0.3) });
      } else {
        page.drawText(line, { x: 54, y: currentY, size: 9.5, font: font, color: rgb(0.2, 0.25, 0.35) });
      }
      currentY -= 15;
    }

    // Signature Block Box
    page.drawRectangle({
      x: 54,
      y: 74,
      width: pageW - 108,
      height: 140,
      color: rgb(0.96, 0.98, 1),
      borderColor: rgb(0.8, 0.85, 0.95),
      borderWidth: 1,
    });

    page.drawText('EXECUTED AND AGREED BY THE PARTIES:', {
      x: 70,
      y: 195,
      size: 10,
      font: boldFont,
      color: rgb(0.06, 0.11, 0.22),
    });

    // Party A & Party B lines
    page.drawText('DISCLOSING PARTY:', { x: 70, y: 175, size: 9, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    page.drawLine({ start: { x: 70, y: 135 }, end: { x: 260, y: 135 }, thickness: 1, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('Authorized Signature', { x: 70, y: 120, size: 8, font: font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('Date: ________________________', { x: 70, y: 95, size: 8.5, font: font, color: rgb(0.3, 0.3, 0.3) });

    page.drawText('RECEIVING PARTY:', { x: 320, y: 175, size: 9, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    page.drawLine({ start: { x: 320, y: 135 }, end: { x: 510, y: 135 }, thickness: 1, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('Authorized Signature', { x: 320, y: 120, size: 8, font: font, color: rgb(0.5, 0.5, 0.5) });
    page.drawText('Date: ________________________', { x: 320, y: 95, size: 8.5, font: font, color: rgb(0.3, 0.3, 0.3) });

  } else if (template === 'invoice') {
    // 2. COMMERCIAL INVOICE TEMPLATE
    page.drawText('COMMERCIAL INVOICE', {
      x: 54,
      y: pageH - 54,
      size: 22,
      font: boldFont,
      color: rgb(0.06, 0.65, 0.85),
    });

    page.drawText('Invoice #: INV-2026-001', { x: pageW - 200, y: pageH - 50, size: 10, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    page.drawText('Date: August 5, 2026', { x: pageW - 200, y: pageH - 65, size: 9, font: font, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('Due Date: Upon Receipt', { x: pageW - 200, y: pageH - 80, size: 9, font: font, color: rgb(0.4, 0.4, 0.4) });

    // Billed To & From Boxes
    page.drawRectangle({ x: 54, y: pageH - 170, width: 240, height: 75, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.85, 0.9, 0.95), borderWidth: 1 });
    page.drawText('ISSUED BY:', { x: 64, y: pageH - 110, size: 9, font: boldFont, color: rgb(0.06, 0.65, 0.85) });
    page.drawText('Isa Secure PDF Services LLC\n100 Enterprise Way, Suite 400\nsupport@isasecuredpdf.com', { x: 64, y: pageH - 125, size: 8.5, font: font, color: rgb(0.2, 0.2, 0.2), lineHeight: 12 });

    page.drawRectangle({ x: 318, y: pageH - 170, width: 240, height: 75, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.85, 0.9, 0.95), borderWidth: 1 });
    page.drawText('BILLED TO:', { x: 328, y: pageH - 110, size: 9, font: boldFont, color: rgb(0.06, 0.65, 0.85) });
    page.drawText('Client Name / Corporation\n500 Business Avenue\nNew York, NY 10001', { x: 328, y: pageH - 125, size: 8.5, font: font, color: rgb(0.2, 0.2, 0.2), lineHeight: 12 });

    // Itemized Table Header
    const tableTop = pageH - 210;
    page.drawRectangle({ x: 54, y: tableTop - 20, width: pageW - 108, height: 24, color: rgb(0.06, 0.11, 0.22) });
    page.drawText('DESCRIPTION', { x: 64, y: tableTop - 13, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('QTY', { x: 340, y: tableTop - 13, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('UNIT PRICE', { x: 410, y: tableTop - 13, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('AMOUNT', { x: 500, y: tableTop - 13, size: 9, font: boldFont, color: rgb(1, 1, 1) });

    // Table Rows
    const items = [
      { desc: 'PDF Engine Studio Enterprise License (Annual)', qty: '1', price: '$2,499.00', amount: '$2,499.00' },
      { desc: 'Custom AcroForm Template Integration & Setup', qty: '1', price: '$450.00', amount: '$450.00' },
      { desc: 'Priority Compliance & IT Security Verification', qty: '1', price: '$250.00', amount: '$250.00' },
    ];

    let rowY = tableTop - 45;
    for (const item of items) {
      page.drawText(item.desc, { x: 64, y: rowY, size: 9, font: font, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(item.qty, { x: 345, y: rowY, size: 9, font: font, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(item.price, { x: 410, y: rowY, size: 9, font: font, color: rgb(0.2, 0.2, 0.2) });
      page.drawText(item.amount, { x: 500, y: rowY, size: 9, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
      page.drawLine({ start: { x: 54, y: rowY - 8 }, end: { x: pageW - 54, y: rowY - 8 }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
      rowY -= 25;
    }

    // Totals Box
    page.drawText('Subtotal:', { x: 380, y: rowY - 15, size: 9.5, font: font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('$3,199.00', { x: 500, y: rowY - 15, size: 9.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });

    page.drawText('Tax (0%):', { x: 380, y: rowY - 30, size: 9.5, font: font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('$0.00', { x: 500, y: rowY - 30, size: 9.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });

    page.drawRectangle({ x: 370, y: rowY - 60, width: 188, height: 22, color: rgb(0.06, 0.65, 0.85) });
    page.drawText('TOTAL DUE:', { x: 380, y: rowY - 53, size: 10, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('$3,199.00', { x: 500, y: rowY - 53, size: 10, font: boldFont, color: rgb(1, 1, 1) });

    // Payment Notes & Signature
    page.drawText('Thank you for your business! Please send payment via Wire or ACH to Isa Secure PDF LLC.', { x: 54, y: 70, size: 8.5, font: font, color: rgb(0.4, 0.4, 0.4) });

  } else if (template === 'contractor') {
    // 3. INDEPENDENT CONTRACTOR AGREEMENT
    page.drawText('INDEPENDENT CONTRACTOR AGREEMENT', {
      x: 54,
      y: pageH - 54,
      size: 16,
      font: boldFont,
      color: rgb(0.06, 0.11, 0.22),
    });

    page.drawLine({ start: { x: 54, y: pageH - 64 }, end: { x: pageW - 54, y: pageH - 64 }, thickness: 1.5, color: rgb(0.2, 0.4, 0.8) });

    const contractLines = [
      'This Independent Contractor Agreement ("Agreement") is made effective as of the date of execution.',
      'CLIENT: ___________________________________ CONTRACTOR: ___________________________________',
      '',
      '1. Scope of Work',
      'Contractor agrees to perform digital document engineering, security verification, and PDF form software',
      'development services as outlined in Statement of Work (SOW) attachments.',
      '',
      '2. Compensation and Payment Terms',
      'Client agrees to compensate Contractor at the agreed rate upon milestone completion. Invoices submitted',
      'by Contractor shall be payable within Net 30 days.',
      '',
      '3. Independent Contractor Status',
      'Contractor is an independent contractor and not an employee of Client. Contractor is solely responsible for',
      'all tax withholding, insurance, and licensing required by law.',
      '',
      '4. Intellectual Property Rights',
      'All work product, code, documents, and deliverables produced by Contractor under this Agreement shall belong',
      'exclusively to Client upon full payment of fees.',
    ];

    let cY = pageH - 95;
    for (const line of contractLines) {
      if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
        page.drawText(line, { x: 54, y: cY, size: 10.5, font: boldFont, color: rgb(0.1, 0.15, 0.3) });
      } else {
        page.drawText(line, { x: 54, y: cY, size: 9, font: font, color: rgb(0.25, 0.25, 0.25) });
      }
      cY -= 15;
    }

    // Signature Box
    page.drawRectangle({ x: 54, y: 80, width: pageW - 108, height: 130, color: rgb(0.98, 0.98, 0.98), borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page.drawText('CLIENT SIGNATURE:', { x: 70, y: 180, size: 9, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    page.drawLine({ start: { x: 70, y: 140 }, end: { x: 260, y: 140 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('Date: ____________________', { x: 70, y: 105, size: 8.5, font: font, color: rgb(0.3, 0.3, 0.3) });

    page.drawText('CONTRACTOR SIGNATURE:', { x: 320, y: 180, size: 9, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    page.drawLine({ start: { x: 320, y: 140 }, end: { x: 510, y: 140 }, thickness: 1, color: rgb(0.3, 0.3, 0.3) });
    page.drawText('Date: ____________________', { x: 320, y: 105, size: 8.5, font: font, color: rgb(0.3, 0.3, 0.3) });

  } else if (template === 'w9') {
    // 4. FORM W-9 TAXPAYER IDENTIFICATION REQUEST
    page.drawRectangle({ x: 40, y: pageH - 80, width: pageW - 80, height: 50, color: rgb(0.9, 0.9, 0.9), borderColor: rgb(0, 0, 0), borderWidth: 1.5 });
    page.drawText('Form W-9', { x: 50, y: pageH - 55, size: 18, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('Request for Taxpayer Identification Number and Certification', { x: 150, y: pageH - 50, size: 11, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('Department of the Treasury - Internal Revenue Service', { x: 150, y: pageH - 66, size: 8.5, font: font, color: rgb(0.2, 0.2, 0.2) });

    // Box 1: Name
    page.drawRectangle({ x: 40, y: pageH - 130, width: pageW - 80, height: 40, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText('1 Name (as shown on your income tax return). Name is required on this line.', { x: 46, y: pageH - 102, size: 8, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('John Doe / Enterprise Entity Name', { x: 46, y: pageH - 120, size: 10, font: font, color: rgb(0.1, 0.3, 0.7) });

    // Box 2: Business Name
    page.drawRectangle({ x: 40, y: pageH - 180, width: pageW - 80, height: 40, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText('2 Business name/disregarded entity name, if different from above', { x: 46, y: pageH - 152, size: 8, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('Isa Secure PDF Services', { x: 46, y: pageH - 170, size: 10, font: font, color: rgb(0.1, 0.3, 0.7) });

    // Box 3: Tax Classification
    page.drawRectangle({ x: 40, y: pageH - 260, width: pageW - 80, height: 70, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText('3 Check appropriate box for federal tax classification of the person/entity:', { x: 46, y: pageH - 202, size: 8, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('[X] Individual/sole proprietor or single-member LLC     [ ] C Corporation     [ ] S Corporation', { x: 56, y: pageH - 222, size: 8.5, font: font, color: rgb(0, 0, 0) });
    page.drawText('[ ] Partnership     [ ] Trust/estate     [ ] Limited Liability Company (LLC)', { x: 56, y: pageH - 240, size: 8.5, font: font, color: rgb(0, 0, 0) });

    // Part I: SSN / EIN Box
    page.drawRectangle({ x: 40, y: pageH - 340, width: pageW - 80, height: 70, color: rgb(0.96, 0.96, 0.96), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText('Part I   Taxpayer Identification Number (TIN)', { x: 46, y: pageH - 282, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('Social Security Number (SSN):   XXX - XX - 9876', { x: 60, y: pageH - 305, size: 9.5, font: boldFont, color: rgb(0.1, 0.2, 0.5) });
    page.drawText('Employer ID Number (EIN):        XX - XXXXXXX', { x: 60, y: pageH - 325, size: 9.5, font: boldFont, color: rgb(0.1, 0.2, 0.5) });

    // Part II: Certification
    page.drawRectangle({ x: 40, y: 90, width: pageW - 80, height: pageH - 440, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText('Part II  Certification', { x: 46, y: pageH - 362, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    const certText = [
      'Under penalties of perjury, I certify that:',
      '1. The number shown on this form is my correct taxpayer identification number, and',
      '2. I am not subject to backup withholding because: (a) I am exempt from backup withholding, or',
      '   (b) I have not been notified by the IRS that I am subject to backup withholding, and',
      '3. I am a U.S. citizen or other U.S. person.',
    ];
    let certY = pageH - 380;
    for (const line of certText) {
      page.drawText(line, { x: 46, y: certY, size: 8, font: font, color: rgb(0.2, 0.2, 0.2) });
      certY -= 14;
    }

    // Signature Area
    page.drawText('Sign Here', { x: 46, y: 125, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    page.drawLine({ start: { x: 110, y: 120 }, end: { x: 380, y: 120 }, thickness: 1, color: rgb(0, 0, 0) });
    page.drawText('Signature of U.S. Person', { x: 110, y: 105, size: 8, font: font, color: rgb(0.4, 0.4, 0.4) });
    page.drawText('Date: August 5, 2026', { x: 400, y: 120, size: 9, font: boldFont, color: rgb(0, 0, 0) });
  }

  return await pdfDoc.save();
}
