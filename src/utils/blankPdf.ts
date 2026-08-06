import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type TemplateType =
  | 'blank'
  | 'nda'
  | 'invoice'
  | 'contractor'
  | 'w9'
  | 'canada_t4'
  | 'canada_lease'
  | 'canada_bill_of_sale'
  | 'offer_letter';

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

  // Generate Preset Document Templates with Interactive AcroForm Fields
  const page = pdfDoc.addPage(dims);
  const { width: pageW, height: pageH } = page.getSize();
  const form = pdfDoc.getForm();

  // Helper to add interactive fillable text field
  const addField = (
    name: string,
    defaultVal: string,
    x: number,
    y: number,
    width: number,
    height: number = 18,
    fontSize: number = 9
  ) => {
    const tf = form.createTextField(name);
    tf.setText(defaultVal);
    tf.addToPage(page, {
      x,
      y,
      width,
      height,
      borderWidth: 1,
      borderColor: rgb(0.78, 0.82, 0.9),
      backgroundColor: rgb(0.97, 0.98, 1),
      font,
    });
    if (fontSize) {
      try {
        tf.setFontSize(fontSize);
      } catch (e) {}
    }
  };

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

    page.drawText('Effective Date:', { x: 54, y: pageH - 85, size: 9.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('nda_effective_date', 'August 5, 2026', 130, pageH - 90, 140);

    const bodyText = [
      'This Mutual Non-Disclosure Agreement ("Agreement") is entered into as of the Effective Date above,',
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

    let currentY = pageH - 120;
    for (const line of bodyText) {
      if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
        page.drawText(line, { x: 54, y: currentY, size: 10, font: boldFont, color: rgb(0.1, 0.15, 0.3) });
      } else {
        page.drawText(line, { x: 54, y: currentY, size: 9, font: font, color: rgb(0.2, 0.25, 0.35) });
      }
      currentY -= 14;
    }

    // Signature Block Box
    page.drawRectangle({
      x: 54,
      y: 65,
      width: pageW - 108,
      height: 155,
      color: rgb(0.96, 0.98, 1),
      borderColor: rgb(0.8, 0.85, 0.95),
      borderWidth: 1,
    });

    page.drawText('EXECUTED AND AGREED BY THE PARTIES (FILLABLE):', {
      x: 70,
      y: 198,
      size: 9.5,
      font: boldFont,
      color: rgb(0.06, 0.11, 0.22),
    });

    // Party A & Party B fields
    page.drawText('DISCLOSING PARTY NAME:', { x: 70, y: 175, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('nda_disclosing_party', 'Acme Enterprises Inc.', 70, 150, 190);
    page.drawText('Signature / Date:', { x: 70, y: 130, size: 8, font: font, color: rgb(0.4, 0.4, 0.4) });
    addField('nda_disclosing_sig', 'John Doe (Authorized Signatory)', 70, 105, 190);
    addField('nda_disclosing_date', '2026-08-05', 70, 80, 120);

    page.drawText('RECEIVING PARTY NAME:', { x: 320, y: 175, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('nda_receiving_party', 'Global Tech Solutions Ltd.', 320, 150, 190);
    page.drawText('Signature / Date:', { x: 320, y: 130, size: 8, font: font, color: rgb(0.4, 0.4, 0.4) });
    addField('nda_receiving_sig', 'Jane Smith (Authorized Signatory)', 320, 105, 190);
    addField('nda_receiving_date', '2026-08-05', 320, 80, 120);

  } else if (template === 'invoice') {
    // 2. COMMERCIAL INVOICE TEMPLATE (100% Fully Editable & Fillable)
    addField('inv_title', 'COMMERCIAL INVOICE', 54, pageH - 55, 230, 26, 16);
    addField('inv_subtitle', 'Business & Professional Services Invoice', 54, pageH - 76, 230, 16, 9);

    // Invoice Metadata Block (Right Aligned)
    page.drawText('Invoice #:', { x: pageW - 195, y: pageH - 45, size: 9, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('inv_number', 'INV-2026-001', pageW - 134, pageH - 49, 80, 18);

    page.drawText('Date:', { x: pageW - 195, y: pageH - 68, size: 9, font: font, color: rgb(0.4, 0.4, 0.4) });
    addField('inv_date', '2026-08-05', pageW - 134, pageH - 72, 80, 18);

    page.drawText('Due Date:', { x: pageW - 195, y: pageH - 91, size: 9, font: font, color: rgb(0.4, 0.4, 0.4) });
    addField('inv_due_date', 'Upon Receipt', pageW - 134, pageH - 95, 80, 18);

    // Billed To & From Boxes (504 total width: two 240px boxes with 24px gap)
    page.drawRectangle({ x: 54, y: pageH - 200, width: 240, height: 100, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.85, 0.9, 0.95), borderWidth: 1 });
    page.drawText('ISSUED BY:', { x: 64, y: pageH - 112, size: 8.5, font: boldFont, color: rgb(0.06, 0.65, 0.85) });
    addField('inv_issuer_name', 'Isa Secure PDF Services LLC', 64, pageH - 136, 220, 20);
    addField('inv_issuer_addr1', '100 Enterprise Way, Suite 400', 64, pageH - 162, 220, 18);
    addField('inv_issuer_addr2', 'Toronto, ON M5V 2T6 Canada', 64, pageH - 186, 220, 18);

    page.drawRectangle({ x: 318, y: pageH - 200, width: 240, height: 100, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.85, 0.9, 0.95), borderWidth: 1 });
    page.drawText('BILLED TO:', { x: 328, y: pageH - 112, size: 8.5, font: boldFont, color: rgb(0.06, 0.65, 0.85) });
    addField('inv_client_name', 'Client Corporation / Customer Name', 328, pageH - 136, 220, 20);
    addField('inv_client_addr1', '500 Business Avenue, Suite 100', 328, pageH - 162, 220, 18);
    addField('inv_client_addr2', 'Vancouver, BC V6B 1A1 Canada', 328, pageH - 186, 220, 18);

    // Itemized Table Header Bar (Width 504: 54 to 558)
    const tableTop = pageH - 215;
    page.drawRectangle({ x: 54, y: tableTop - 24, width: 504, height: 24, color: rgb(0.06, 0.11, 0.22) });
    page.drawText('DESCRIPTION', { x: 64, y: tableTop - 16, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('QTY', { x: 340, y: tableTop - 16, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('UNIT PRICE', { x: 396, y: tableTop - 16, size: 9, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('AMOUNT', { x: 488, y: tableTop - 16, size: 9, font: boldFont, color: rgb(1, 1, 1) });

    // Table Rows (6 Customizable Rows: Widths 268, 48, 76, 88 = 504 total width)
    const items = [
      { id: '1', desc: 'PDF Engine Studio Enterprise License', qty: '1', price: '$2,499.00', amount: '$2,499.00' },
      { id: '2', desc: 'Custom AcroForm Template Integration', qty: '1', price: '$450.00', amount: '$450.00' },
      { id: '3', desc: 'Priority Compliance & IT Security Audit', qty: '1', price: '$250.00', amount: '$250.00' },
      { id: '4', desc: '', qty: '', price: '', amount: '' },
      { id: '5', desc: '', qty: '', price: '', amount: '' },
      { id: '6', desc: '', qty: '', price: '', amount: '' },
    ];

    let rowY = tableTop - 50;
    for (const item of items) {
      addField(`inv_desc_${item.id}`, item.desc, 54, rowY, 268, 20);
      addField(`inv_qty_${item.id}`, item.qty, 330, rowY, 48, 20);
      addField(`inv_price_${item.id}`, item.price, 386, rowY, 76, 20);
      addField(`inv_amt_${item.id}`, item.amount, 470, rowY, 88, 20);
      rowY -= 24;
    }

    // Totals Box (Right Aligned to 558)
    const totalY = rowY - 10;
    page.drawText('Subtotal:', { x: 386, y: totalY - 14, size: 9, font: boldFont, color: rgb(0.3, 0.3, 0.3) });
    addField('inv_subtotal', '$3,199.00', 470, totalY - 18, 88, 20);

    addField('inv_tax_label', 'Tax (13% HST):', 345, totalY - 44, 115, 18, 8.5);
    addField('inv_tax', '$415.87', 470, totalY - 44, 88, 20);

    page.drawRectangle({ x: 360, y: totalY - 78, width: 198, height: 26, color: rgb(0.06, 0.65, 0.85) });
    page.drawText('TOTAL DUE:', { x: 370, y: totalY - 70, size: 9.5, font: boldFont, color: rgb(1, 1, 1) });
    addField('inv_total', '$3,614.87', 466, totalY - 75, 88, 20);

    // Payment Notes Footnote Block (Fillable)
    page.drawText('Payment Notes & Wire Instructions (Fillable):', { x: 54, y: 92, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('inv_notes', 'Please send payment via Interac e-Transfer, ACH, or Wire Transfer to billing@isasecuredpdf.com', 54, 68, 504, 20);

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

    page.drawText('CLIENT NAME:', { x: 54, y: pageH - 90, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('ctr_client', 'Apex Technology Inc.', 130, pageH - 94, 160);

    page.drawText('CONTRACTOR NAME:', { x: 310, y: pageH - 90, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('ctr_worker', 'John Smith Development', 410, pageH - 94, 150);

    const contractLines = [
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

    let cY = pageH - 125;
    for (const line of contractLines) {
      if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.') || line.startsWith('4.')) {
        page.drawText(line, { x: 54, y: cY, size: 10, font: boldFont, color: rgb(0.1, 0.15, 0.3) });
      } else {
        page.drawText(line, { x: 54, y: cY, size: 8.5, font: font, color: rgb(0.25, 0.25, 0.25) });
      }
      cY -= 14;
    }

    // Signature Box
    page.drawRectangle({ x: 54, y: 70, width: pageW - 108, height: 140, color: rgb(0.98, 0.98, 0.98), borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1 });
    page.drawText('CLIENT SIGNATURE:', { x: 70, y: 185, size: 8.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    addField('ctr_client_sig', 'Apex Rep Authorized Signature', 70, 160, 190);
    page.drawText('Date:', { x: 70, y: 135, size: 8, font: font, color: rgb(0.3, 0.3, 0.3) });
    addField('ctr_client_date', '2026-08-05', 105, 131, 155);

    page.drawText('CONTRACTOR SIGNATURE:', { x: 320, y: 185, size: 8.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    addField('ctr_worker_sig', 'John Smith Contractor Signature', 320, 160, 190);
    page.drawText('Date:', { x: 320, y: 135, size: 8, font: font, color: rgb(0.3, 0.3, 0.3) });
    addField('ctr_worker_date', '2026-08-05', 355, 131, 155);

  } else if (template === 'w9') {
    // 4. FORM W-9 TAXPAYER IDENTIFICATION REQUEST
    page.drawRectangle({ x: 40, y: pageH - 80, width: pageW - 80, height: 50, color: rgb(0.9, 0.9, 0.9), borderColor: rgb(0, 0, 0), borderWidth: 1.5 });
    page.drawText('Form W-9', { x: 50, y: pageH - 55, size: 18, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('Request for Taxpayer Identification Number and Certification', { x: 150, y: pageH - 50, size: 11, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('Department of the Treasury - Internal Revenue Service', { x: 150, y: pageH - 66, size: 8.5, font: font, color: rgb(0.2, 0.2, 0.2) });

    // Box 1: Name
    page.drawRectangle({ x: 40, y: pageH - 130, width: pageW - 80, height: 40, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText('1 Name (as shown on your income tax return). Name is required on this line.', { x: 46, y: pageH - 102, size: 8, font: boldFont, color: rgb(0, 0, 0) });
    addField('w9_name', 'John Doe / Enterprise Entity Name', 46, pageH - 124, 510);

    // Box 2: Business Name
    page.drawRectangle({ x: 40, y: pageH - 180, width: pageW - 80, height: 40, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText('2 Business name/disregarded entity name, if different from above', { x: 46, y: pageH - 152, size: 8, font: boldFont, color: rgb(0, 0, 0) });
    addField('w9_business_name', 'Isa Secure PDF Services', 46, pageH - 174, 510);

    // Part I: SSN / EIN Box
    page.drawRectangle({ x: 40, y: pageH - 270, width: pageW - 80, height: 75, color: rgb(0.96, 0.96, 0.96), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText('Part I   Taxpayer Identification Number (TIN)', { x: 46, y: pageH - 208, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    page.drawText('Social Security Number (SSN):', { x: 50, y: pageH - 232, size: 8.5, font: boldFont, color: rgb(0.1, 0.2, 0.5) });
    addField('w9_ssn', '123-45-6789', 200, pageH - 236, 140);

    page.drawText('Employer ID Number (EIN):', { x: 50, y: pageH - 258, size: 8.5, font: boldFont, color: rgb(0.1, 0.2, 0.5) });
    addField('w9_ein', '98-7654321', 200, pageH - 262, 140);

    // Signature Area
    page.drawText('Sign Here: Signature of U.S. Person', { x: 46, y: 125, size: 9, font: boldFont, color: rgb(0, 0, 0) });
    addField('w9_signature', 'John Doe Digital Signature', 46, 100, 320);
    addField('w9_date', '2026-08-05', 380, 100, 140);

  } else if (template === 'canada_t4') {
    // 5. 🇨🇦 CANADIAN T4 STATEMENT OF REMUNERATION PAID
    page.drawRectangle({ x: 40, y: pageH - 75, width: pageW - 80, height: 45, color: rgb(0.88, 0.1, 0.15), borderColor: rgb(0, 0, 0), borderWidth: 1 });
    page.drawText('T4  CANADA  STATEMENT OF REMUNERATION PAID', { x: 50, y: pageH - 52, size: 14, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText('État de la rémunération payée - Canada Revenue Agency / Agence du revenu du Canada', { x: 50, y: pageH - 67, size: 8, font: font, color: rgb(1, 1, 1) });

    // Employer & Employee Boxes
    page.drawRectangle({ x: 40, y: pageH - 165, width: 255, height: 80, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.7, 0.75, 0.85), borderWidth: 1 });
    page.drawText("Employer's Name & Address / Nom de l'employeur:", { x: 46, y: pageH - 98, size: 8, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
    addField('t4_employer_name', 'Canadian Digital Tech Corp.', 46, pageH - 120, 243);
    addField('t4_employer_cra_bn', 'CRA BN: 12345 6789 RP0001', 46, pageH - 145, 243);

    page.drawRectangle({ x: 305, y: pageH - 165, width: 267, height: 80, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.7, 0.75, 0.85), borderWidth: 1 });
    page.drawText("Employee's Name & Address / Nom de l'employé:", { x: 311, y: pageH - 98, size: 8, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
    addField('t4_employee_name', 'Jane Doe', 311, pageH - 120, 255);
    addField('t4_employee_sin', 'SIN: 987 654 321', 311, pageH - 145, 255);

    // Box 14: Employment Income
    page.drawText('Box 14 - Employment Income / Revenus d’emploi:', { x: 40, y: pageH - 190, size: 8.5, font: boldFont, color: rgb(0, 0, 0) });
    addField('t4_box14', '$85,000.00 CAD', 40, pageH - 212, 160);

    // Box 16: CPP Contributions
    page.drawText("Box 16 - Employee's CPP contributions:", { x: 220, y: pageH - 190, size: 8.5, font: boldFont, color: rgb(0, 0, 0) });
    addField('t4_box16', '$3,867.50 CAD', 220, pageH - 212, 160);

    // Box 18: EI Premiums
    page.drawText("Box 18 - Employee's EI premiums:", { x: 400, y: pageH - 190, size: 8.5, font: boldFont, color: rgb(0, 0, 0) });
    addField('t4_box18', '$1,049.12 CAD', 400, pageH - 212, 172);

    // Box 22: Income Tax Deducted
    page.drawText('Box 22 - Income Tax Deducted / Impôt sur le revenu:', { x: 40, y: pageH - 245, size: 8.5, font: boldFont, color: rgb(0, 0, 0) });
    addField('t4_box22', '$18,450.00 CAD', 40, pageH - 267, 160);

    // Box 24: EI Insurable Earnings
    page.drawText('Box 24 - EI Insurable Earnings:', { x: 220, y: pageH - 245, size: 8.5, font: boldFont, color: rgb(0, 0, 0) });
    addField('t4_box24', '$63,200.00 CAD', 220, pageH - 267, 160);

    // Box 26: CPP Pensionable Earnings
    page.drawText('Box 26 - CPP Pensionable Earnings:', { x: 400, y: pageH - 245, size: 8.5, font: boldFont, color: rgb(0, 0, 0) });
    addField('t4_box26', '$68,500.00 CAD', 400, pageH - 267, 172);

    page.drawText('Official CRA Form T4 Copy for Tax Filer Record', { x: 40, y: 100, size: 8, font: font, color: rgb(0.5, 0.5, 0.5) });

  } else if (template === 'canada_lease') {
    // 6. 🇨🇦 CANADIAN RESIDENTIAL TENANCY LEASE AGREEMENT
    page.drawText('🇨🇦 CANADIAN RESIDENTIAL LEASE AGREEMENT', {
      x: 54,
      y: pageH - 54,
      size: 16,
      font: boldFont,
      color: rgb(0.06, 0.11, 0.22),
    });

    page.drawLine({ start: { x: 54, y: pageH - 64 }, end: { x: pageW - 54, y: pageH - 64 }, thickness: 2, color: rgb(0.88, 0.1, 0.15) });

    page.drawText('LANDLORD NAME:', { x: 54, y: pageH - 90, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('lease_landlord', 'Robert Sterling (Landlord)', 140, pageH - 94, 160);

    page.drawText('TENANT NAME:', { x: 310, y: pageH - 90, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('lease_tenant', 'Alex Mercer (Tenant)', 390, pageH - 94, 170);

    page.drawText('RENTAL PROPERTY ADDRESS:', { x: 54, y: pageH - 125, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('lease_address', '100 Yonge Street, Suite 1402, Toronto, ON M5C 1T4', 210, pageH - 129, 350);

    page.drawText('MONTHLY RENT (CAD$):', { x: 54, y: pageH - 160, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('lease_rent', '$2,450.00 CAD / month', 180, pageH - 164, 130);

    page.drawText('SECURITY DEPOSIT:', { x: 330, y: pageH - 160, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('lease_deposit', '$2,450.00 CAD', 430, pageH - 164, 130);

    const leaseTerms = [
      '',
      '1. Rent Payments and Utilities',
      'Tenant agrees to pay monthly rent in advance on or before the 1st day of each month via Interac e-Transfer,',
      'pre-authorized debit, or certified cheque.',
      '',
      '2. Maintenance and Repair Obligations',
      'Tenant shall keep the rental unit in clean, sanitary condition and promptly notify Landlord of any damage or',
      'necessary repairs in accordance with provincial Residential Tenancies Acts.',
      '',
      '3. Termination and Notice',
      'Either party may terminate fixed-term tenancy by providing 60 days written notice prior to end of lease.',
    ];

    let lY = pageH - 195;
    for (const line of leaseTerms) {
      if (line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
        page.drawText(line, { x: 54, y: lY, size: 9.5, font: boldFont, color: rgb(0.1, 0.15, 0.3) });
      } else {
        page.drawText(line, { x: 54, y: lY, size: 8.5, font: font, color: rgb(0.25, 0.25, 0.25) });
      }
      lY -= 14;
    }

    // Signatures
    page.drawRectangle({ x: 54, y: 70, width: pageW - 108, height: 130, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.8, 0.85, 0.95), borderWidth: 1 });
    page.drawText('LANDLORD SIGNATURE:', { x: 70, y: 175, size: 8.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    addField('lease_landlord_sig', 'Robert Sterling Landlord Signature', 70, 150, 190);

    page.drawText('TENANT SIGNATURE:', { x: 320, y: 175, size: 8.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    addField('lease_tenant_sig', 'Alex Mercer Tenant Signature', 320, 150, 190);

  } else if (template === 'canada_bill_of_sale') {
    // 7. 🇨🇦 CANADIAN BILL OF SALE (VEHICLE / EQUIPMENT)
    page.drawText('🇨🇦 CANADIAN BILL OF SALE (VEHICLE / PROPERTY)', {
      x: 54,
      y: pageH - 54,
      size: 15,
      font: boldFont,
      color: rgb(0.06, 0.11, 0.22),
    });

    page.drawLine({ start: { x: 54, y: pageH - 64 }, end: { x: pageW - 54, y: pageH - 64 }, thickness: 2, color: rgb(0.88, 0.1, 0.15) });

    page.drawText('SELLER NAME:', { x: 54, y: pageH - 95, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('bos_seller_name', 'David Miller (Seller)', 130, pageH - 99, 160);

    page.drawText('BUYER NAME:', { x: 310, y: pageH - 95, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('bos_buyer_name', 'Sarah Connor (Buyer)', 390, pageH - 99, 170);

    page.drawText('VEHICLE YEAR / MAKE / MODEL:', { x: 54, y: pageH - 130, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('bos_vehicle_desc', '2023 Honda CR-V Touring AWD', 210, pageH - 134, 350);

    page.drawText('VIN / SERIAL NUMBER:', { x: 54, y: pageH - 165, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('bos_vin', '2HKRW2H87PH123456', 170, pageH - 169, 160);

    page.drawText('ODOMETER (KM):', { x: 340, y: pageH - 165, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('bos_km', '32,450 km', 430, pageH - 169, 130);

    page.drawText('FINAL PURCHASE PRICE (CAD$):', { x: 54, y: pageH - 200, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('bos_price', '$34,500.00 CAD', 210, pageH - 204, 160);

    // Signatures
    page.drawRectangle({ x: 54, y: 80, width: pageW - 108, height: 130, color: rgb(0.97, 0.98, 1), borderColor: rgb(0.8, 0.85, 0.95), borderWidth: 1 });
    page.drawText('SELLER SIGNATURE:', { x: 70, y: 180, size: 8.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    addField('bos_seller_sig', 'David Miller Seller Signature', 70, 155, 190);

    page.drawText('BUYER SIGNATURE:', { x: 320, y: 180, size: 8.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    addField('bos_buyer_sig', 'Sarah Connor Buyer Signature', 320, 155, 190);

  } else if (template === 'offer_letter') {
    // 8. STANDARD EMPLOYMENT OFFER LETTER
    page.drawText('EMPLOYMENT OFFER LETTER', {
      x: 54,
      y: pageH - 54,
      size: 18,
      font: boldFont,
      color: rgb(0.06, 0.11, 0.22),
    });

    page.drawLine({ start: { x: 54, y: pageH - 64 }, end: { x: pageW - 54, y: pageH - 64 }, thickness: 2, color: rgb(0.06, 0.72, 0.84) });

    page.drawText('CANDIDATE NAME:', { x: 54, y: pageH - 95, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('offer_candidate', 'Michael Chen', 150, pageH - 99, 180);

    page.drawText('POSITION TITLE:', { x: 54, y: pageH - 125, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('offer_title', 'Senior Software Engineer', 150, pageH - 129, 180);

    page.drawText('BASE SALARY:', { x: 54, y: pageH - 155, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('offer_salary', '$120,000.00 / year', 150, pageH - 159, 140);

    page.drawText('START DATE:', { x: 320, y: pageH - 155, size: 8.5, font: boldFont, color: rgb(0.2, 0.2, 0.2) });
    addField('offer_start_date', 'September 1, 2026', 390, pageH - 159, 130);

    const offerBody = [
      '',
      'Dear Candidate,',
      'We are pleased to offer you employment with our organization. This letter sets forth the initial terms',
      'and conditions of your employment offer.',
      '',
      '1. Duties and Responsibilities',
      'You will perform duties customary to your position title and report directly to your assigned supervisor.',
      '',
      '2. Benefits and Paid Time Off',
      'You will be eligible for standard employee benefit programs including health, dental, and paid vacation days.',
    ];

    let oY = pageH - 190;
    for (const line of offerBody) {
      if (line.startsWith('1.') || line.startsWith('2.')) {
        page.drawText(line, { x: 54, y: oY, size: 9.5, font: boldFont, color: rgb(0.1, 0.15, 0.3) });
      } else {
        page.drawText(line, { x: 54, y: oY, size: 8.5, font: font, color: rgb(0.25, 0.25, 0.25) });
      }
      oY -= 14;
    }

    // Acceptance Block
    page.drawRectangle({ x: 54, y: 70, width: pageW - 108, height: 130, color: rgb(0.96, 0.98, 1), borderColor: rgb(0.8, 0.85, 0.95), borderWidth: 1 });
    page.drawText('CANDIDATE ACCEPTANCE SIGNATURE:', { x: 70, y: 175, size: 8.5, font: boldFont, color: rgb(0.1, 0.1, 0.1) });
    addField('offer_candidate_sig', 'Michael Chen Signature', 70, 150, 190);
    addField('offer_accept_date', '2026-08-05', 70, 120, 140);
  }

  return await pdfDoc.save();
}
