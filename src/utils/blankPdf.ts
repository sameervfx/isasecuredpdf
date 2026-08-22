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
  | 'offer_letter'
  | 'pro_commercial_lease'
  | 'pro_nda'
  | 'pro_roommate_agreement'
  | 'pro_real_estate_purchase';

export interface CreatePDFOptions {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  pageCount: number;
  templateType?: TemplateType;
  jurisdiction?: 'US' | 'CA';
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
    addField('offer_accept_date', '2026-08-05', 70, 120, 140);
  } else if (template === 'pro_commercial_lease') {
    // AUTHENTIC TRADITIONAL COMMERCIAL LEASE AGREEMENT (4 PAGES, FULL-LENGTH VERBATIM)
    const p1 = page;
    const p2 = pdfDoc.addPage(dims);
    const p3 = pdfDoc.addPage(dims);
    const p4 = pdfDoc.addPage(dims);

    const drawFooter = (targetPage: any, pageNum: number) => {
      const footerStr = `Commercial Lease Agreement, page ${pageNum} of 4`;
      const numW = font.widthOfTextAtSize(footerStr, 9);
      targetPage.drawLine({ start: { x: 54, y: 40 }, end: { x: 558, y: 40 }, thickness: 0.5, color: rgb(0, 0, 0) });
      targetPage.drawText(footerStr, { x: 558 - numW, y: 25, size: 9, font, color: rgb(0, 0, 0) });
    };

    const addFieldTo = (targetPage: any, name: string, x: number, y: number, width: number, height: number = 12) => {
      const tf = form.createTextField(name);
      tf.setText('');
      tf.addToPage(targetPage, { x: x, y: y + 3, width, height, borderWidth: 0, font });
      try { tf.setFontSize(8.5); } catch (e) {}
    };

    const drawPara = (targetPage: any, textStr: string, startY: number, fontSize: number = 10, leading: number = 14) => {
      const words = textStr.split(' ');
      let currentLine = '';
      let curY = startY;
      const marginX = 54;
      const maxWidth = 504;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxWidth && currentLine) {
          targetPage.drawText(currentLine, { x: marginX, y: curY, size: fontSize, font, color: rgb(0, 0, 0) });
          curY -= leading;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        targetPage.drawText(currentLine, { x: marginX, y: curY, size: fontSize, font, color: rgb(0, 0, 0) });
        curY -= leading;
      }
      return curY;
    };

    const drawSectionHeader = (targetPage: any, numStr: string, titleStr: string, startY: number) => {
      targetPage.drawText(numStr, { x: 54, y: startY, size: 10.5, font: boldFont, color: rgb(0, 0, 0) });
      const numW = boldFont.widthOfTextAtSize(numStr, 10.5);
      const titleX = 54 + numW + 16;
      targetPage.drawText(titleStr, { x: titleX, y: startY, size: 10.5, font: boldFont, color: rgb(0, 0, 0) });
      const titleW = boldFont.widthOfTextAtSize(titleStr, 10.5);
      targetPage.drawLine({
        start: { x: titleX, y: startY - 2 },
        end: { x: titleX + titleW, y: startY - 2 },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });
      return startY - 18;
    };

    // ================= PAGE 1 OF 4 =================
    drawFooter(p1, 1);
    let y1 = pageH - 54;

    const titleStr1 = 'COMMERCIAL LEASE AGREEMENT';
    const titleW1 = boldFont.widthOfTextAtSize(titleStr1, 14);
    const titleX1 = (pageW - titleW1) / 2;
    p1.drawText(titleStr1, { x: titleX1, y: y1, size: 14, font: boldFont, color: rgb(0, 0, 0) });
    p1.drawLine({ start: { x: titleX1, y: y1 - 3 }, end: { x: titleX1 + titleW1, y: y1 - 3 }, thickness: 1, color: rgb(0, 0, 0) });
    y1 -= 32;

    // Line 1: THIS COMMERCIAL LEASE AGREEMENT (the "Lease") is executed on this _____ day of
    const l1_pref = 'THIS COMMERCIAL LEASE AGREEMENT (the "Lease") is executed on this ';
    const l1_prefW = font.widthOfTextAtSize(l1_pref, 10);
    p1.drawText(l1_pref, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const l1_und = '_____';
    const l1_undW = font.widthOfTextAtSize(l1_und, 10);
    p1.drawText(l1_und, { x: 54 + l1_prefW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_day', 54 + l1_prefW, y1 - 2, l1_undW);

    p1.drawText(' day of', { x: 54 + l1_prefW + l1_undW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 16;

    // Line 2: __________________, 20___, by and between ____________________________________ (the "Lessor"),
    const l2_und1 = '__________________';
    const l2_und1W = font.widthOfTextAtSize(l2_und1, 10);
    p1.drawText(l2_und1, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_month_yr', 54, y1 - 2, l2_und1W);

    const l2_mid = ', 20___, by and between ';
    const l2_midW = font.widthOfTextAtSize(l2_mid, 10);
    p1.drawText(l2_mid, { x: 54 + l2_und1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const l2_und2 = '____________________________________';
    const l2_und2W = font.widthOfTextAtSize(l2_und2, 10);
    p1.drawText(l2_und2, { x: 54 + l2_und1W + l2_midW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_lessor_name', 54 + l2_und1W + l2_midW, y1 - 2, l2_und2W);

    p1.drawText(' (the "Lessor"),', { x: 54 + l2_und1W + l2_midW + l2_und2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 16;

    // Line 3: and ____________________________________ (the "Lessee").
    const l3_pref = 'and ';
    const l3_prefW = font.widthOfTextAtSize(l3_pref, 10);
    p1.drawText(l3_pref, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const l3_und = '____________________________________';
    const l3_undW = font.widthOfTextAtSize(l3_und, 10);
    p1.drawText(l3_und, { x: 54 + l3_prefW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_lessee_name', 54 + l3_prefW, y1 - 2, l3_undW);

    p1.drawText(' (the "Lessee").', { x: 54 + l3_prefW + l3_undW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 22;

    y1 = drawPara(p1, 'WITNESSETH: In consideration of the mutual covenants, terms, and conditions contained herein, and other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, Lessor leases to Lessee and Lessee hires from Lessor the Leased Premises subject to the following terms:', y1);
    y1 -= 12;

    y1 = drawSectionHeader(p1, '1.', 'Leased Premises.', y1);
    const p1_1a = 'Lessor hereby demises and leases unto Lessee, and Lessee hires from Lessor, the commercial real property';
    p1.drawText(p1_1a, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 14;

    const p1_1a2 = 'and improvements situated at ';
    const p1_1a2W = font.widthOfTextAtSize(p1_1a2, 10);
    p1.drawText(p1_1a2, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const p1_1u1 = '____________________________________';
    const p1_1u1W = font.widthOfTextAtSize(p1_1u1, 10);
    p1.drawText(p1_1u1, { x: 54 + p1_1a2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_address_full', 54 + p1_1a2W, y1 - 2, p1_1u1W);

    p1.drawText(' (the "Premises").', { x: 54 + p1_1a2W + p1_1u1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 14;

    const p1_1b = 'The Premises contains approximately ';
    const p1_1bW = font.widthOfTextAtSize(p1_1b, 10);
    p1.drawText(p1_1b, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const p1_1u2 = '__________';
    const p1_1u2W = font.widthOfTextAtSize(p1_1u2, 10);
    p1.drawText(p1_1u2, { x: 54 + p1_1bW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_sqft', 54 + p1_1bW, y1 - 2, p1_1u2W);

    p1.drawText(' square feet of interior commercial space together', { x: 54 + p1_1bW + p1_1u2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 14;
    p1.drawText('with non-exclusive rights to common parking and ingress/egress routes.', { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 18;

    y1 = drawSectionHeader(p1, '2.', 'Lease Term & Commencement.', y1);
    const p1_2a = 'The primary term of this Lease shall be for a period of ';
    const p1_2aW = font.widthOfTextAtSize(p1_2a, 10);
    p1.drawText(p1_2a, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const p1_2u1 = '_____';
    const p1_2u1W = font.widthOfTextAtSize(p1_2u1, 10);
    p1.drawText(p1_2u1, { x: 54 + p1_2aW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_term_years', 54 + p1_2aW, y1 - 2, p1_2u1W);

    const p1_2b = ' years, commencing on ';
    const p1_2bW = font.widthOfTextAtSize(p1_2b, 10);
    p1.drawText(p1_2b, { x: 54 + p1_2aW + p1_2u1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const p1_2u2 = '__________________';
    const p1_2u2W = font.widthOfTextAtSize(p1_2u2, 10);
    p1.drawText(p1_2u2, { x: 54 + p1_2aW + p1_2u1W + p1_2bW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_start_date', 54 + p1_2aW + p1_2u1W + p1_2bW, y1 - 2, p1_2u2W);

    p1.drawText(', 20___,', { x: 54 + p1_2aW + p1_2u1W + p1_2bW + p1_2u2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 14;

    const p1_2c = 'and expiring at midnight on ';
    const p1_2cW = font.widthOfTextAtSize(p1_2c, 10);
    p1.drawText(p1_2c, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const p1_2u3 = '__________________';
    const p1_2u3W = font.widthOfTextAtSize(p1_2u3, 10);
    p1.drawText(p1_2u3, { x: 54 + p1_2cW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_end_date', 54 + p1_2cW, y1 - 2, p1_2u3W);

    p1.drawText(', 20___, unless sooner terminated or renewed as provided herein.', { x: 54 + p1_2cW + p1_2u3W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 14;
    p1.drawText('Lessee shall have the option to renew this Lease for an additional term upon giving at least sixty (60) days prior written notice.', { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 18;

    y1 = drawSectionHeader(p1, '3.', 'Base Rent & Monthly Installments.', y1);
    const p1_3a = 'Lessee covenants and agrees to pay to Lessor as annual base rent the total sum of $';
    const p1_3aW = font.widthOfTextAtSize(p1_3a, 10);
    p1.drawText(p1_3a, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const p1_3u1 = '____________________';
    const p1_3u1W = font.widthOfTextAtSize(p1_3u1, 10);
    p1.drawText(p1_3u1, { x: 54 + p1_3aW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_annual_rent', 54 + p1_3aW, y1 - 2, p1_3u1W);

    p1.drawText(',', { x: 54 + p1_3aW + p1_3u1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 14;

    const p1_3b = 'payable in equal consecutive monthly installments of $';
    const p1_3bW = font.widthOfTextAtSize(p1_3b, 10);
    p1.drawText(p1_3b, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const p1_3u2 = '____________________';
    const p1_3u2W = font.widthOfTextAtSize(p1_3u2, 10);
    p1.drawText(p1_3u2, { x: 54 + p1_3bW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_monthly_rent', 54 + p1_3bW, y1 - 2, p1_3u2W);

    p1.drawText(' on or before the first (1st) day', { x: 54 + p1_3bW + p1_3u2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 14;
    p1.drawText('of each calendar month during the term. Payments shall be delivered to Lessor at designated billing address.', { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 18;

    y1 = drawSectionHeader(p1, '4.', 'Security Deposit.', y1);
    const p1_4a = 'Upon execution of this Lease, Lessee shall deposit with Lessor the sum of $';
    const p1_4aW = font.widthOfTextAtSize(p1_4a, 10);
    p1.drawText(p1_4a, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const p1_4u1 = '____________________';
    const p1_4u1W = font.widthOfTextAtSize(p1_4u1, 10);
    p1.drawText(p1_4u1, { x: 54 + p1_4aW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'comm_deposit', 54 + p1_4aW, y1 - 2, p1_4u1W);

    p1.drawText(' as a Security Deposit.', { x: 54 + p1_4aW + p1_4u1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 14;
    p1.drawText('The Security Deposit shall be held by Lessor without liability for interest as security for faithful performance.', { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    
    // ================= PAGE 2 OF 4 =================
    drawFooter(p2, 2);
    let y2 = pageH - 54;

    y2 = drawSectionHeader(p2, '5.', 'Permitted Use & Operating Restrictions.', y2);
    y2 = drawPara(p2, 'The Premises shall be used and occupied by Lessee solely for general commercial offices, executive business operations, software technology development, and related lawful administrative purposes, and for no other purpose without the prior written consent of Lessor. Lessee shall not permit any hazardous activities, excessive noise, or unlawful nuisances on the Premises.', y2);
    y2 -= 14;

    y2 = drawSectionHeader(p2, '6.', 'Utilities & Building Services.', y2);
    y2 = drawPara(p2, 'Lessee shall contract directly for and pay all charges for electricity, gas, water, sanitation, sewer, HVAC maintenance, telephone, data, and janitorial services consumed on the Premises during the Lease term. Lessor shall not be liable for any interruption or failure of utility supply beyond Lessor reasonable control.', y2);
    y2 -= 14;

    y2 = drawSectionHeader(p2, '7.', 'Repairs & Structural Maintenance.', y2);
    y2 = drawPara(p2, 'Lessor shall keep and maintain the structural exterior walls, roof membrane, foundation, and structural load-bearing components of the building in good repair. Lessee shall, at Lessee sole cost and expense, keep and maintain all interior portions of the Premises, glass windows, doors, interior plumbing fixtures, electrical panels, and HVAC equipment in clean, safe, and operable condition.', y2);
    y2 -= 14;

    y2 = drawSectionHeader(p2, '8.', 'Insurance & Indemnification.', y2);
    y2 = drawPara(p2, 'Lessee agrees to indemnify, defend, and hold harmless Lessor from any claims, suits, liabilities, or damages arising from Lessee use or occupancy of the Premises. Lessee shall maintain Commercial General Liability (CGL) insurance with coverage limits of not less than $2,000,000 per occurrence, naming Lessor as an additional insured.', y2);
    y2 -= 14;

    y2 = drawSectionHeader(p2, '9.', 'Alterations & Mechanic Liens.', y2);
    y2 = drawPara(p2, 'Lessee shall make no structural alterations, additions, or improvements to the Premises without first obtaining Lessor written approval. Lessee shall keep the Premises free and clear of all mechanic, materialmen, or contractor liens.', y2);

    // ================= PAGE 3 OF 4 =================
    drawFooter(p3, 3);
    let y3 = pageH - 54;

    y3 = drawSectionHeader(p3, '10.', 'Default Events & Lessor Remedies.', y3);
    y3 = drawPara(p3, 'If Lessee fails to pay any installment of rent within ten (10) days after written notice, or fails to perform any non-monetary covenant within thirty (30) days after notice, Lessor may declare Lessee in default. Upon default, Lessor shall have the right to re-enter the Premises, terminate this Lease, re-let the space, and recover all damages and accelerated rent allowed by law.', y3);
    y3 -= 14;

    y3 = drawSectionHeader(p3, '11.', 'Fire & Casualty Damage.', y3);
    y3 = drawPara(p3, 'If the Premises are damaged by fire or casualty rendering them un-tenantable, rent shall abate proportionately. If repairs cannot be completed within ninety (90) days, either party may terminate this Lease by written notice.', y3);
    y3 -= 14;

    y3 = drawSectionHeader(p3, '12.', 'Subletting & Assignment.', y3);
    y3 = drawPara(p3, 'Lessee shall not assign this Lease or sublet any portion of the Premises without the prior written consent of Lessor, which consent shall not be unreasonably withheld.', y3);
    y3 -= 14;

    y3 = drawSectionHeader(p3, '13.', 'Governing Law & Attorney Fees.', y3);
    const p3_gov = 'This Lease shall be governed by and construed in accordance with the laws of ';
    const p3_govW = font.widthOfTextAtSize(p3_gov, 10);
    p3.drawText(p3_gov, { x: 54, y: y3, size: 10, font, color: rgb(0, 0, 0) });

    const p3_und = '_____________________';
    const p3_undW = font.widthOfTextAtSize(p3_und, 10);
    p3.drawText(p3_und, { x: 54 + p3_govW, y: y3, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p3, 'comm_gov_law', 54 + p3_govW, y3 - 2, p3_undW);

    p3.drawText(' (state/province).', { x: 54 + p3_govW + p3_undW, y: y3, size: 10, font, color: rgb(0, 0, 0) });
    y3 -= 14;
    p3.drawText('In any action or litigation arising hereunder, the prevailing party shall be entitled to recover attorney fees.', { x: 54, y: y3, size: 10, font, color: rgb(0, 0, 0) });
    y3 -= 18;

    y3 = drawSectionHeader(p3, '14.', 'Notices.', y3);
    y3 = drawPara(p3, 'All formal notices required hereunder shall be in writing and delivered by hand, overnight courier, or certified mail to the respective addresses set forth herein.', y3);

    // ================= PAGE 4 OF 4 =================
    drawFooter(p4, 4);
    let y4 = pageH - 54;

    y4 = drawSectionHeader(p4, '15.', 'Special Stipulations & Additional Terms.', y4);
    y4 = drawPara(p4, 'The following custom stipulations, additions, or modifications are hereby incorporated into this Commercial Lease Agreement:', y4);
    y4 -= 10;

    addFieldTo(p4, 'comm_custom_p4', 54, y4 - 50, 504, 50);
    y4 -= 65;

    const witStr = 'IN WITNESS WHEREOF, the parties hereto have executed this Lease as of the date first written above.';
    const witW = boldFont.widthOfTextAtSize(witStr, 9.5);
    p4.drawText(witStr, { x: (pageW - witW) / 2, y: y4, size: 9.5, font: boldFont, color: rgb(0, 0, 0) });
    y4 -= 45;

    p4.drawText('LESSOR (LANDLORD)', { x: 64, y: y4, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    p4.drawText('LESSEE (TENANT)', { x: 340, y: y4, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    y4 -= 35;

    p4.drawText('By: _________________________________', { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    p4.drawText('By: _________________________________', { x: 330, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    addFieldTo(p4, 'lessor_sig_line', 78, y4 - 2, 150);
    addFieldTo(p4, 'lessee_sig_line', 354, y4 - 2, 150);
    y4 -= 22;

    p4.drawText('Name: _______________________________', { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    p4.drawText('Name: _______________________________', { x: 330, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    addFieldTo(p4, 'lessor_name_line', 95, y4 - 2, 140);
    addFieldTo(p4, 'lessee_name_line', 370, y4 - 2, 140);
    y4 -= 22;

    p4.drawText('Title: ______________________________', { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    p4.drawText('Title: ______________________________', { x: 330, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    addFieldTo(p4, 'lessor_title_line', 88, y4 - 2, 140);
    addFieldTo(p4, 'lessee_title_line', 364, y4 - 2, 140);

  } else if (template === 'pro_roommate_agreement') {
    // AUTHENTIC ROOMMATE AGREEMENT (4 PAGES, FULL-LENGTH VERBATIM)
    const p1 = page;
    const p2 = pdfDoc.addPage(dims);
    const p3 = pdfDoc.addPage(dims);
    const p4 = pdfDoc.addPage(dims);

    const drawFooter = (targetPage: any, pageNum: number) => {
      const footerStr = `Roommate Agreement, page ${pageNum} of 4`;
      const numW = font.widthOfTextAtSize(footerStr, 9);
      targetPage.drawLine({ start: { x: 54, y: 40 }, end: { x: 558, y: 40 }, thickness: 0.5, color: rgb(0, 0, 0) });
      targetPage.drawText(footerStr, { x: 558 - numW, y: 25, size: 9, font, color: rgb(0, 0, 0) });
    };

    const addFieldTo = (targetPage: any, name: string, x: number, y: number, width: number, height: number = 12) => {
      const tf = form.createTextField(name);
      tf.setText('');
      tf.addToPage(targetPage, { x: x, y: y + 3, width, height, borderWidth: 0, font });
      try { tf.setFontSize(8.5); } catch (e) {}
    };

    const drawPara = (targetPage: any, textStr: string, startY: number, fontSize: number = 10, leading: number = 14) => {
      const words = textStr.split(' ');
      let currentLine = '';
      let curY = startY;
      const marginX = 54;
      const maxWidth = 504;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxWidth && currentLine) {
          targetPage.drawText(currentLine, { x: marginX, y: curY, size: fontSize, font, color: rgb(0, 0, 0) });
          curY -= leading;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        targetPage.drawText(currentLine, { x: marginX, y: curY, size: fontSize, font, color: rgb(0, 0, 0) });
        curY -= leading;
      }
      return curY;
    };

    const drawSectionHeader = (targetPage: any, numStr: string, titleStr: string, startY: number) => {
      targetPage.drawText(numStr, { x: 54, y: startY, size: 10.5, font: boldFont, color: rgb(0, 0, 0) });
      const numW = boldFont.widthOfTextAtSize(numStr, 10.5);
      const titleX = 54 + numW + 16;
      targetPage.drawText(titleStr, { x: titleX, y: startY, size: 10.5, font: boldFont, color: rgb(0, 0, 0) });
      const titleW = boldFont.widthOfTextAtSize(titleStr, 10.5);
      targetPage.drawLine({
        start: { x: titleX, y: startY - 2 },
        end: { x: titleX + titleW, y: startY - 2 },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });
      return startY - 18;
    };

    // ================= PAGE 1 OF 4 =================
    drawFooter(p1, 1);
    let y1 = pageH - 54;

    const titleStr1 = 'ROOMMATE & SHARED HOUSING AGREEMENT';
    const titleW1 = boldFont.widthOfTextAtSize(titleStr1, 14);
    const titleX1 = (pageW - titleW1) / 2;
    p1.drawText(titleStr1, { x: titleX1, y: y1, size: 14, font: boldFont, color: rgb(0, 0, 0) });
    p1.drawLine({ start: { x: titleX1, y: y1 - 3 }, end: { x: titleX1 + titleW1, y: y1 - 3 }, thickness: 1, color: rgb(0, 0, 0) });
    y1 -= 32;

    // Line 1: THIS ROOMMATE AGREEMENT is entered into on this _____ day of __________________, 20___,
    const r1_p1 = 'THIS ROOMMATE AGREEMENT is entered into on this ';
    const r1_p1W = font.widthOfTextAtSize(r1_p1, 10);
    p1.drawText(r1_p1, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const r1_u1 = '_____';
    const r1_u1W = font.widthOfTextAtSize(r1_u1, 10);
    p1.drawText(r1_u1, { x: 54 + r1_p1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'room_day', 54 + r1_p1W, y1 - 2, r1_u1W);

    const r1_p2 = ' day of ';
    const r1_p2W = font.widthOfTextAtSize(r1_p2, 10);
    p1.drawText(r1_p2, { x: 54 + r1_p1W + r1_u1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const r1_u2 = '__________________';
    const r1_u2W = font.widthOfTextAtSize(r1_u2, 10);
    p1.drawText(r1_u2, { x: 54 + r1_p1W + r1_u1W + r1_p2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'room_month_yr', 54 + r1_p1W + r1_u1W + r1_p2W, y1 - 2, r1_u2W);

    p1.drawText(', 20___,', { x: 54 + r1_p1W + r1_u1W + r1_p2W + r1_u2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 16;

    // Line 2: by and between Roommate A: ________________________ and Roommate B: ________________________,
    const r2_p1 = 'by and between Roommate A: ';
    const r2_p1W = font.widthOfTextAtSize(r2_p1, 10);
    p1.drawText(r2_p1, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const r2_u1 = '________________________';
    const r2_u1W = font.widthOfTextAtSize(r2_u1, 10);
    p1.drawText(r2_u1, { x: 54 + r2_p1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'room_a_name', 54 + r2_p1W, y1 - 2, r2_u1W);

    const r2_p2 = ' and Roommate B: ';
    const r2_p2W = font.widthOfTextAtSize(r2_p2, 10);
    p1.drawText(r2_p2, { x: 54 + r2_p1W + r2_u1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const r2_u2 = '________________________';
    const r2_u2W = font.widthOfTextAtSize(r2_u2, 10);
    p1.drawText(r2_u2, { x: 54 + r2_p1W + r2_u1W + r2_p2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'room_b_name', 54 + r2_p1W + r2_u1W + r2_p2W, y1 - 2, r2_u2W);

    p1.drawText(',', { x: 54 + r2_p1W + r2_u1W + r2_p2W + r2_u2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 16;

    // Line 3: for the shared residential premises located at: ________________________________________________________
    const r3_p1 = 'for the shared residential premises located at: ';
    const r3_p1W = font.widthOfTextAtSize(r3_p1, 10);
    p1.drawText(r3_p1, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const r3_u1 = '________________________________________________________';
    const r3_u1W = font.widthOfTextAtSize(r3_u1, 10);
    p1.drawText(r3_u1, { x: 54 + r3_p1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'room_address', 54 + r3_p1W, y1 - 2, r3_u1W);
    y1 -= 22;

    y1 = drawPara(p1, 'Co-roommates hereby agree to co-habitate at the premises under the Master Lease agreement with Landlord. All roommates agree to comply strictly with the terms, house rules, rent splits, and shared living covenants set forth below:', y1);
    y1 -= 12;

    y1 = drawSectionHeader(p1, '1.', 'Rent Split & Payment Obligations.', y1);
    const rm1_a = 'The total monthly rent for the entire premises is $';
    const rm1_aW = font.widthOfTextAtSize(rm1_a, 10);
    p1.drawText(rm1_a, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const rm1_u1 = '____________________';
    const rm1_u1W = font.widthOfTextAtSize(rm1_u1, 10);
    p1.drawText(rm1_u1, { x: 54 + rm1_aW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'room_rent_total', 54 + rm1_aW, y1 - 2, rm1_u1W);

    p1.drawText('.', { x: 54 + rm1_aW + rm1_u1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 14;

    const rm1_b = 'Roommate A agrees to pay $';
    const rm1_bW = font.widthOfTextAtSize(rm1_b, 10);
    p1.drawText(rm1_b, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const rm1_u2 = '____________________';
    const rm1_u2W = font.widthOfTextAtSize(rm1_u2, 10);
    p1.drawText(rm1_u2, { x: 54 + rm1_bW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'room_a_rent', 54 + rm1_bW, y1 - 2, rm1_u2W);

    const rm1_c = ' per month, and Roommate B agrees to pay $';
    const rm1_cW = font.widthOfTextAtSize(rm1_c, 10);
    p1.drawText(rm1_c, { x: 54 + rm1_bW + rm1_u2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const rm1_u3 = '____________________';
    const rm1_u3W = font.widthOfTextAtSize(rm1_u3, 10);
    p1.drawText(rm1_u3, { x: 54 + rm1_bW + rm1_u2W + rm1_cW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'room_b_rent', 54 + rm1_bW + rm1_u2W + rm1_cW, y1 - 2, rm1_u3W);
    y1 -= 14;

    p1.drawText('per month, due on or before the first (1st) day of each calendar month directly to Landlord.', { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 18;

    y1 = drawSectionHeader(p1, '2.', 'Security Deposit Allocation.', y1);
    const rm2_a = 'The total security deposit paid for the premises is $';
    const rm2_aW = font.widthOfTextAtSize(rm2_a, 10);
    p1.drawText(rm2_a, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const rm2_u1 = '____________________';
    const rm2_u1W = font.widthOfTextAtSize(rm2_u1, 10);
    p1.drawText(rm2_u1, { x: 54 + rm2_aW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'room_deposit_total', 54 + rm2_aW, y1 - 2, rm2_u1W);

    p1.drawText('.', { x: 54 + rm2_aW + rm2_u1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 14;

    const rm2_b = 'Roommate A contributed $';
    const rm2_bW = font.widthOfTextAtSize(rm2_b, 10);
    p1.drawText(rm2_b, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const rm2_u2 = '____________________';
    const rm2_u2W = font.widthOfTextAtSize(rm2_u2, 10);
    p1.drawText(rm2_u2, { x: 54 + rm2_bW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'room_a_dep', 54 + rm2_bW, y1 - 2, rm2_u2W);

    const rm2_c = ' and Roommate B contributed $';
    const rm2_cW = font.widthOfTextAtSize(rm2_c, 10);
    p1.drawText(rm2_c, { x: 54 + rm2_bW + rm2_u2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const rm2_u3 = '____________________';
    const rm2_u3W = font.widthOfTextAtSize(rm2_u3, 10);
    p1.drawText(rm2_u3, { x: 54 + rm2_bW + rm2_u2W + rm2_cW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'room_b_dep', 54 + rm2_bW + rm2_u2W + rm2_cW, y1 - 2, rm2_u3W);
    y1 -= 14;

    p1.drawText('Upon termination of tenancy, security deposit refunds from Landlord shall be distributed in exact proportion.', { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 18;

    y1 = drawSectionHeader(p1, '3.', 'Utility Expenses & Shared Bills.', y1);
    y1 = drawPara(p1, 'All shared utility bills including electricity, gas, water, trash, internet, and streaming services shall be split 50/50 between co-roommates. Each roommate shall reimburse the primary utility account holder within five (5) days of bill presentation.', y1);

    // ================= PAGE 2 OF 4 =================
    drawFooter(p2, 2);
    let y2 = pageH - 54;

    y2 = drawSectionHeader(p2, '4.', 'Bedrooms & Common Area Rights.', y2);
    y2 = drawPara(p2, 'Roommate A shall occupy designated Bedroom #1 and Roommate B shall occupy designated Bedroom #2. All common areas including kitchen, living room, dining areas, and hallways shall remain accessible to all roommates equally and kept free of personal clutter.', y2);
    y2 -= 14;

    y2 = drawSectionHeader(p2, '5.', 'House Rules & Quiet Hours.', y2);
    y2 = drawPara(p2, 'Quiet hours shall be observed from 10:00 PM to 7:00 AM on weeknights (Sunday through Thursday) and midnight to 8:00 AM on weekends. Kitchen counter spaces and cookware shall be cleaned promptly after food preparation.', y2);
    y2 -= 14;

    y2 = drawSectionHeader(p2, '6.', 'Overnight Guests & Visitor Policy.', y2);
    y2 = drawPara(p2, 'Overnight guests are permitted for a maximum of three (3) consecutive nights in any thirty (30) day period with prior verbal notice to co-roommate. Extended guest stays beyond 3 nights require advance written agreement of all roommates.', y2);

    // ================= PAGE 3 OF 4 =================
    drawFooter(p3, 3);
    let y3 = pageH - 54;

    y3 = drawSectionHeader(p3, '7.', 'Pets & Property Damage Liability.', y3);
    y3 = drawPara(p3, 'Each roommate shall be individually responsible for any physical property damage caused to the premises, furniture, or appliances by themselves, their guests, or authorized pets.', y3);
    y3 -= 14;

    y3 = drawSectionHeader(p3, '8.', 'Departure & Replacement Roommate.', y3);
    y3 = drawPara(p3, 'A departing roommate must provide at least thirty (30) days written notice and locate an acceptable replacement roommate approved by remaining co-roommates and Landlord.', y3);

    // ================= PAGE 4 OF 4 =================
    drawFooter(p4, 4);
    let y4 = pageH - 54;

    y4 = drawSectionHeader(p4, '9.', 'Additional House Rules & Agreements.', y4);
    y4 = drawPara(p4, 'The following custom house rules or stipulations are hereby agreed upon:', y4);
    y4 -= 10;

    addFieldTo(p4, 'room_custom_p4', 54, y4 - 50, 504, 50);
    y4 -= 65;

    const witStr2 = 'IN WITNESS WHEREOF, the roommates have executed this Agreement as of the date written above.';
    const witW2 = boldFont.widthOfTextAtSize(witStr2, 9.5);
    p4.drawText(witStr2, { x: (pageW - witW2) / 2, y: y4, size: 9.5, font: boldFont, color: rgb(0, 0, 0) });
    y4 -= 45;

    p4.drawText('ROOMMATE A', { x: 64, y: y4, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    p4.drawText('ROOMMATE B', { x: 340, y: y4, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    y4 -= 35;

    p4.drawText('By: _________________________________', { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    p4.drawText('By: _________________________________', { x: 330, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    addFieldTo(p4, 'room_a_sig', 78, y4 - 2, 150);
    addFieldTo(p4, 'room_b_sig', 354, y4 - 2, 150);

  } else if (template === 'pro_nda') {
    // EXACT VERBATIM 5-PAGE NON-DISCLOSURE AGREEMENT (STRICT MARGINS & CENTERED TYPESETTING)
    const p1 = page;
    const p2 = pdfDoc.addPage(dims);
    const p3 = pdfDoc.addPage(dims);
    const p4 = pdfDoc.addPage(dims);
    const p5 = pdfDoc.addPage(dims);

    const drawFooter = (targetPage: any, pageNum: number) => {
      const footerStr = `Non-Disclosure Agreement, page ${pageNum} of 5`;
      const numW = font.widthOfTextAtSize(footerStr, 9);
      targetPage.drawLine({ start: { x: 54, y: 40 }, end: { x: 558, y: 40 }, thickness: 0.5, color: rgb(0, 0, 0) });
      targetPage.drawText(footerStr, { x: 558 - numW, y: 25, size: 9, font, color: rgb(0, 0, 0) });
    };

    const addFieldTo = (targetPage: any, name: string, x: number, y: number, width: number, height: number = 12) => {
      const tf = form.createTextField(name);
      tf.setText(''); // Empty fillable area as requested
      tf.addToPage(targetPage, { x: x, y: y + 3, width, height, borderWidth: 0, font });
      try { tf.setFontSize(8.5); } catch (e) {}
    };

    const drawPara = (targetPage: any, textStr: string, startY: number, fontSize: number = 10, leading: number = 14) => {
      const words = textStr.split(' ');
      let currentLine = '';
      let curY = startY;
      const marginX = 54;
      const maxWidth = 504;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxWidth && currentLine) {
          targetPage.drawText(currentLine, { x: marginX, y: curY, size: fontSize, font, color: rgb(0, 0, 0) });
          curY -= leading;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        targetPage.drawText(currentLine, { x: marginX, y: curY, size: fontSize, font, color: rgb(0, 0, 0) });
        curY -= leading;
      }
      return curY;
    };

    const drawSectionHeader = (targetPage: any, numStr: string, titleStr: string, startY: number) => {
      targetPage.drawText(numStr, { x: 54, y: startY, size: 10.5, font: boldFont, color: rgb(0, 0, 0) });
      const numW = boldFont.widthOfTextAtSize(numStr, 10.5);
      const titleX = 54 + numW + 16;
      targetPage.drawText(titleStr, { x: titleX, y: startY, size: 10.5, font: boldFont, color: rgb(0, 0, 0) });
      const titleW = boldFont.widthOfTextAtSize(titleStr, 10.5);
      targetPage.drawLine({
        start: { x: titleX, y: startY - 2 },
        end: { x: titleX + titleW, y: startY - 2 },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });
      return startY - 18;
    };

    // ================= PAGE 1 OF 5 =================
    drawFooter(p1, 1);
    let y1 = pageH - 54;

    const titleStr1 = 'NON-DISCLOSURE AGREEMENT';
    const titleW1 = boldFont.widthOfTextAtSize(titleStr1, 14);
    const titleX1 = (pageW - titleW1) / 2;
    p1.drawText(titleStr1, { x: titleX1, y: y1, size: 14, font: boldFont, color: rgb(0, 0, 0) });
    p1.drawLine({ start: { x: titleX1, y: y1 - 3 }, end: { x: titleX1 + titleW1, y: y1 - 3 }, thickness: 1, color: rgb(0, 0, 0) });
    y1 -= 32;

    // Line 1: THIS AGREEMENT (the "Agreement") is entered into on this _____ day of __________________ by and
    const n1_p1 = 'THIS AGREEMENT (the "Agreement") is entered into on this ';
    p1.drawText(n1_p1, { x: 54, y: 722, size: 10, font, color: rgb(0, 0, 0) });

    const n1_u1 = '_____';
    p1.drawText(n1_u1, { x: 380, y: 722, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'nda_day', 380, 719, 30); // y: 722 (719 + 3)

    const n1_p2 = ' day of ';
    p1.drawText(n1_p2, { x: 415, y: 722, size: 10, font, color: rgb(0, 0, 0) });

    const n1_u2 = '________________';
    p1.drawText(n1_u2, { x: 460, y: 722, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'nda_month_yr', 460, 719, 80);

    p1.drawText('by and', { x: 540, y: 722, size: 10, font, color: rgb(0, 0, 0) });

    // Line 2: between ____________________________________, located at
    const n2_p1 = 'between ';
    p1.drawText(n2_p1, { x: 54, y: 704, size: 10, font, color: rgb(0, 0, 0) });

    const n2_u1 = '_____________________________________________________';
    p1.drawText(n2_u1, { x: 120, y: 704, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'nda_disclosing_name', 120, 701, 260); // y: 704 (701 + 3)

    p1.drawText(', located at ', { x: 385, y: 704, size: 10, font, color: rgb(0, 0, 0) });

    // Line 3: ____________________________________ (the "Disclosing Party"), and
    const n2_u2 = '_____________________________________________________';
    p1.drawText(n2_u2, { x: 120, y: 686, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'nda_disclosing_addr', 120, 683, 260); // y: 686 (683 + 3)

    p1.drawText('(the "Disclosing Party"), and ', { x: 385, y: 686, size: 10, font, color: rgb(0, 0, 0) });

    // Line 4: ____________________________________ with an address at
    const n3_u1 = '_____________________________________________________';
    p1.drawText(n3_u1, { x: 120, y: 668, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'nda_receiving_name', 120, 665, 260); // y: 668 (665 + 3)

    p1.drawText('with an address at', { x: 385, y: 668, size: 10, font, color: rgb(0, 0, 0) });

    // Line 5: ____________________________________ (the "Recipient" or the "Receiving Party").
    const n4_u1 = '_____________________________________________________';
    p1.drawText(n4_u1, { x: 120, y: 650, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'nda_receiving_addr', 120, 647, 260); // y: 650 (647 + 3)

    p1.drawText('(the "Recipient" or the "Receiving Party").', { x: 385, y: 650, size: 10, font, color: rgb(0, 0, 0) });
    
    y1 = 628;


    // Line 5: The Recipient hereto desires to participate in discussions regarding ____________________________________
    const n5_p1 = 'The Recipient hereto desires to participate in discussions regarding ';
    const n5_p1W = font.widthOfTextAtSize(n5_p1, 10);
    p1.drawText(n5_p1, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const n5_u1 = '____________________________________';
    const n5_u1W = font.widthOfTextAtSize(n5_u1, 10);
    p1.drawText(n5_u1, { x: 54 + n5_p1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 'nda_transaction', 54 + n5_p1W, y1 - 2, n5_u1W);
    y1 -= 16;

    y1 = drawPara(p1, '(the "Transaction"). During these discussions, Disclosing Party may share certain proprietary information with the Recipient. Therefore, in consideration of the mutual promises and covenants contained in this Agreement, and other good and valuable consideration, the receipt and sufficiency of which is hereby acknowledged, the parties hereto agree as follows:', y1);
    y1 -= 12;

    y1 = drawSectionHeader(p1, '1.', 'Definition of Confidential Information.', y1);

    y1 = drawPara(p1, '(a) For purposes of this Agreement, "Confidential Information" means any data or information that is proprietary to the Disclosing Party and not generally known to the public, whether in tangible or intangible form, whenever and however disclosed, including, but not limited to: (i) any marketing strategies, plans, financial information, or projections, operations, sales estimates, business plans and performance results relating to the past, present or future business activities of such party, its affiliates, subsidiaries and affiliated companies; (ii) plans for products or services, and customer or supplier lists; (iii) any scientific or technical information, invention, design, process, procedure, formula, improvement, technology or method; (iv) any concepts, reports, data, know-how, works-in-progress, designs, development tools, specifications, computer software, source code, object code, flow charts, databases, inventions, information and trade secrets; and (v) any other information that should reasonably be recognized as confidential information of the Disclosing Party. Confidential Information need not be novel, unique, patentable, copyrightable or constitute a trade secret in order to be designated Confidential Information. The Receiving Party acknowledges that the Confidential Information is proprietary to the Disclosing Party, has been developed and obtained through great efforts by the Disclosing Party and that Disclosing Party regards all of its Confidential Information as trade secrets.', y1);
    y1 -= 10;

    y1 = drawPara(p1, '(b) Notwithstanding anything in the foregoing to the contrary, Confidential Information shall not include information which: (i) was known by the Receiving Party prior to receiving the Confidential Information from the Disclosing Party; (b) becomes rightfully known to the Receiving Party from a third-party source not known (after diligent inquiry) by the Receiving Party to be under an obligation to Disclosing Party to maintain confidentiality; (c) is or becomes publicly available through no fault of or failure to act by the Receiving Party in breach of this Agreement; (d) is required to be disclosed in a judicial or administrative proceeding, or is otherwise requested or required to be disclosed by law or regulation, although the requirements of paragraph 4 hereof shall apply prior to any disclosure being made; and (e) is or has been independently developed by employees, consultants or agents of the Receiving Party without violation of the terms of this Agreement or reference or access to any Confidential Information.', y1);
    y1 -= 10;

    y1 = drawSectionHeader(p1, '2.', 'Disclosure of Confidential Information.', y1);

    y1 = drawPara(p1, 'From time to time, the Disclosing Party may disclose Confidential Information to the Receiving Party. The Receiving Party will: (a) limit disclosure of any Confidential Information to its directors, officers, employees, agents or representatives (collectively "Representatives") who have a need to know such Confidential Information in connection with the current or contemplated business relationship between the parties to which this Agreement relates, and only for that purpose; (b) advise its Representatives of the proprietary nature of the Confidential Information and of the obligations set forth', y1);

    // ================= PAGE 2 OF 5 =================
    drawFooter(p2, 2);
    let y2 = pageH - 54;

    y2 = drawPara(p2, 'in this Agreement and require such Representatives to keep the Confidential Information confidential; (c) shall keep all Confidential Information strictly confidential by using a reasonable degree of care, but not less than the degree of care used by it in safeguarding its own confidential information; and (d) not disclose any Confidential Information received by it to any third parties (except as otherwise provided for herein).', y2);
    y2 -= 10;

    y2 = drawPara(p2, 'Each party shall be responsible for any breach of this Agreement by any of their respective Representatives.', y2);
    y2 -= 12;

    y2 = drawSectionHeader(p2, '3.', 'Use of Confidential Information.', y2);

    y2 = drawPara(p2, 'The Receiving Party agrees to use the Confidential Information solely in connection with the current or contemplated business relationship between the parties and not for any purpose other than as authorized by this Agreement without the prior written consent of an authorized representative of the Disclosing Party. No other right or license, whether expressed or implied, in the Confidential Information is granted to the Receiving Party hereunder. Title to the Confidential Information will remain solely in the Disclosing Party. All use of Confidential Information by the Receiving Party shall be for the benefit of the Disclosing Party and any modifications and improvements thereof by the Receiving Party shall be the sole property of the Disclosing Party. Nothing contained herein is intended to modify the parties\' existing agreement that their discussions in furtherance of a potential business relationship are governed by Federal Rule of Evidence 408.', y2);
    y2 -= 14;

    y2 = drawSectionHeader(p2, '4.', 'Compelled Disclosure of Confidential Information.', y2);

    y2 = drawPara(p2, 'Notwithstanding anything in the foregoing to the contrary, the Receiving Party may disclose Confidential Information pursuant to any governmental, judicial, or administrative order, subpoena, discovery request, regulatory request or similar method, provided that the Receiving Party promptly notifies, to the extent practicable, the Disclosing Party in writing of such demand for disclosure so that the Disclosing Party, at its sole expense, may seek to make such disclosure subject to a protective order or other appropriate remedy to preserve the confidentiality of the Confidential Information; provided in the case of a broad regulatory request with respect to the Receiving Party\'s business (not targeted at Disclosing Party), the Receiving Party may promptly comply with such request provided the Receiving Party give (if permitted by such regulator) the Disclosing Party prompt notice of such disclosure. The Receiving Party agrees that it shall not oppose and shall cooperate with efforts by, to the extent practicable, the Disclosing Party with respect to any such request for a protective order or other relief. Notwithstanding the foregoing, if the Disclosing Party is unable to obtain or does not seek a protective order and the Receiving Party is legally requested or required to disclose such Confidential Information, disclosure of such Confidential Information may be made without liability.', y2);
    y2 -= 14;

    y2 = drawSectionHeader(p2, '5.', 'Term.', y2);

    y2 = drawPara(p2, 'This Agreement shall remain in effect for a two-year term (subject to a one year extension if the parties are still discussing and considering the Transaction at the end of the second year). Notwithstanding the foregoing, the parties\' duty to hold in confidence Confidential Information that was disclosed during term shall remain in effect indefinitely.', y2);
    y2 -= 14;

    y2 = drawSectionHeader(p2, '6.', 'Remedies.', y2);

    y2 = drawPara(p2, 'Both parties acknowledge that the Confidential Information to be disclosed hereunder is of a unique and valuable character, and that the unauthorized dissemination of the Confidential', y2);

    // ================= PAGE 3 OF 5 =================
    drawFooter(p3, 3);
    let y3 = pageH - 54;

    y3 = drawPara(p3, 'Information would destroy or diminish the value of such information. The damages to Disclosing Party that would result from the unauthorized dissemination of the Confidential Information would be impossible to calculate. Therefore, both parties hereby agree that the Disclosing Party shall be entitled to injunctive relief preventing the dissemination of any Confidential Information in violation of the terms hereof. Such injunctive relief shall be in addition to any other remedies available hereunder, whether at law or in equity. Disclosing Party shall be entitled to recover its costs and fees, including reasonable attorneys\' fees, incurred in obtaining any such relief. Further, in the event of litigation relating to this Agreement, the prevailing party shall be entitled to recover its reasonable attorney\'s fees and expenses.', y3);
    y3 -= 14;

    y3 = drawSectionHeader(p3, '7.', 'Return of Confidential Information.', y3);

    y3 = drawPara(p3, 'Receiving Party shall immediately return and redeliver to the other all tangible material embodying the Confidential Information provided hereunder and all notes, summaries, memoranda, drawings, manuals, records, excerpts or derivative information deriving there from and all other documents or materials ("Notes") (and all copies of any of the foregoing, including "copies" that have been converted to computerized media in the form of image, data or word processing files either manually or by image capture) based on or including any Confidential Information, in whatever form of storage or retrieval, upon the earlier of (i) the completion or termination of the dealings between the parties contemplated hereunder; (ii) the termination of this Agreement; or (iii) at such time as the Disclosing Party may so request; provided however that the Receiving Party may retain such of its documents as is necessary to enable it to comply with its document retention policies. Alternatively, the Receiving Party, with the written consent of the Disclosing Party may (or in the case of Notes, at the Receiving Party\'s option) immediately destroy any of the foregoing embodying Confidential Information (or the reasonably nonrecoverable data erasure of computerized data) and, upon request, certify in writing such destruction by an authorized officer of the Receiving Party supervising the destruction).', y3);
    y3 -= 14;

    y3 = drawSectionHeader(p3, '8.', 'Notice of Breach.', y3);

    y3 = drawPara(p3, 'Receiving Party shall notify the Disclosing Party immediately upon discovery of any unauthorized use or disclosure of Confidential Information by Receiving Party or its Representatives, or any other breach of this Agreement by Receiving Party or its Representatives, and will cooperate with efforts by the Disclosing Party to help the Disclosing Party regain possession of Confidential Information and prevent its further unauthorized use.', y3);
    y3 -= 14;

    y3 = drawSectionHeader(p3, '9.', 'No Binding Agreement for Transaction.', y3);

    y3 = drawPara(p3, 'The parties agree that neither party will be under any legal obligation of any kind whatsoever with respect to a Transaction by virtue of this Agreement, except for the matters specifically agreed to herein. The parties further acknowledge and agree that they each reserve the right, in their sole and absolute discretion, to reject any and all proposals and to terminate discussions and negotiations with respect to a Transaction at any time. This Agreement does not create a joint venture or partnership between the parties. If a Transaction goes forward, the non-disclosure provisions of any applicable transaction documents entered into between the parties (or their respective affiliates) for the Transaction shall supersede this Agreement. In the event such provision is not provided for in said transaction documents, this Agreement shall control.', y3);
    y3 -= 14;

    y3 = drawSectionHeader(p3, '10.', 'Warranty.', y3);

    // ================= PAGE 4 OF 5 =================
    drawFooter(p4, 4);
    let y4 = pageH - 54;

    y4 = drawPara(p4, 'Each party warrants that it has the right to make the disclosures under this Agreement. NO WARRANTIES ARE MADE BY EITHER PARTY UNDER THIS AGREEMENT WHATSOEVER. The parties acknowledge that although they shall each endeavor to include in the Confidential Information all information that they each believe relevant for the purpose of the evaluation of a Transaction, the parties understand that no representation or warranty as to the accuracy or completeness of the Confidential Information is being made by either party as the Disclosing Party. Further, neither party is under any obligation under this Agreement to disclose any Confidential Information it chooses not to disclose. Neither Party hereto shall have any liability to the other party or to the other party\'s Representatives resulting from any use of the Confidential Information except with respect to disclosure of such Confidential Information in violation of this Agreement.', y4);
    y4 -= 14;

    y4 = drawSectionHeader(p4, '11.', 'Miscellaneous.', y4);

    y4 = drawPara(p4, '(a) This Agreement constitutes the entire understanding between the parties and supersedes any and all prior or contemporaneous understandings and agreements, whether oral or written, between the parties, with respect to the subject matter hereof. This Agreement can only be modified by a written amendment signed by the party against whom enforcement of such modification is sought.', y4, 10, 14);
    y4 -= 8;

    p4.drawText('(b) The validity, construction and performance of this Agreement shall be governed and construed in accordance', { x: 54, y: y4, size: 10, font, color: rgb(0, 0, 0) });
    y4 -= 14;

    const b_pref = 'with the laws of ';
    const b_prefW = font.widthOfTextAtSize(b_pref, 10);
    p4.drawText(b_pref, { x: 54, y: y4, size: 10, font, color: rgb(0, 0, 0) });

    const b_und1 = '_____________________';
    const b_und1W = font.widthOfTextAtSize(b_und1, 10);
    p4.drawText(b_und1, { x: 54 + b_prefW, y: y4, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p4, 'nda_gov_state', 54 + b_prefW, y4 - 2, b_und1W);

    p4.drawText(' (state) applicable to contracts made and to be', { x: 54 + b_prefW + b_und1W, y: y4, size: 10, font, color: rgb(0, 0, 0) });
    y4 -= 14;

    p4.drawText('wholly performed within such state, without giving effect to any conflict of laws provisions thereof.', { x: 54, y: y4, size: 10, font, color: rgb(0, 0, 0) });
    y4 -= 14;

    p4.drawText('The Federal and state courts located in ', { x: 54, y: y4, size: 10, font, color: rgb(0, 0, 0) });
    const b_midW = font.widthOfTextAtSize('The Federal and state courts located in ', 10);

    const b_und2 = '_______________';
    const b_und2W = font.widthOfTextAtSize(b_und2, 10);
    p4.drawText(b_und2, { x: 54 + b_midW, y: y4, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p4, 'nda_court_state', 54 + b_midW, y4 - 2, b_und2W);

    p4.drawText(' (state) shall have sole and exclusive jurisdiction', { x: 54 + b_midW + b_und2W, y: y4, size: 10, font, color: rgb(0, 0, 0) });
    y4 -= 14;

    p4.drawText('over any disputes arising under the terms of this Agreement.', { x: 54, y: y4, size: 10, font, color: rgb(0, 0, 0) });
    y4 -= 18;

    y4 = drawPara(p4, '(c) Any failure by either party to enforce the other party\'s strict performance of any provision of this Agreement will not constitute a waiver of its right to subsequently enforce such provision or any other provision of this Agreement.', y4, 10, 14);

    // ================= PAGE 5 OF 5 =================
    drawFooter(p5, 5);
    let y5 = pageH - 54;

    y5 = drawPara(p5, '(d) Although the restrictions contained in this Agreement are considered by the parties to be reasonable for the purpose of protecting the Confidential Information, if any such restriction is found by a court of competent jurisdiction to be unenforceable, such provision will be modified, rewritten or interpreted to include as much of its nature and scope as will render it enforceable. If it cannot be so modified, rewritten or interpreted to be enforceable in any respect, it will not be given effect, and the remainder of the Agreement will be enforced as if such provision was not included.', y5, 10, 14);
    y5 -= 8;

    y5 = drawPara(p5, '(e) Any notices or communications required or permitted to be given hereunder may be delivered by hand, deposited with a nationally recognized overnight carrier, electronic-mail, or mailed by certified mail, return receipt requested, postage prepaid, in each case, to the address of the other party first indicated above (or such other addressee as may be furnished by a party in accordance with this paragraph). All such notices or communications shall be deemed to have been given and received (a) in the case of personal delivery or electronic-mail, on the date of such delivery, (b) in the case of delivery by a nationally recognized overnight carrier, on the third business day following dispatch and (c) in the case of mailing, on the seventh business day following such mailing.', y5, 10, 14);
    y5 -= 8;

    y5 = drawPara(p5, '(f) This Agreement is personal in nature, and neither party may directly or indirectly assign or transfer it by operation of law or otherwise without the prior written consent of the other party, which consent will not be unreasonably withheld. All obligations contained in this Agreement shall extend to and be binding upon the parties to this Agreement and their respective successors, assigns and designees.', y5, 10, 14);
    y5 -= 8;

    y5 = drawPara(p5, '(g) The receipt of Confidential Information pursuant to this Agreement will not prevent or in any way limit either party from: (i) developing, making or marketing products or services that are or may be competitive with the products or services of the other; or (ii) providing products or services to others who compete with the other.', y5, 10, 14);
    y5 -= 10;

    y5 = drawPara(p5, '(h) Paragraph headings used in this Agreement are for reference only and shall not be used or relied upon in the interpretation of this Agreement.', y5, 10, 14);
    y5 -= 24;

    const witStr = 'IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first above written.';
    const witW = boldFont.widthOfTextAtSize(witStr, 9.5);
    p5.drawText(witStr, { x: (pageW - witW) / 2, y: y5, size: 9.5, font: boldFont, color: rgb(0, 0, 0) });
    y5 -= 45;

    p5.drawText('Disclosing Party', { x: 64, y: y5, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    p5.drawText('Receiving Party', { x: 340, y: y5, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    y5 -= 35;

    p5.drawText('By: _________________________________', { x: 54, y: y5, size: 9.5, font, color: rgb(0, 0, 0) });
    p5.drawText('By: _________________________________', { x: 330, y: y5, size: 9.5, font, color: rgb(0, 0, 0) });
    addFieldTo(p5, 'nda_sig_a', 78, y5 - 2, 150);
    addFieldTo(p5, 'nda_sig_b', 354, y5 - 2, 150);
    y5 -= 22;

    p5.drawText('Name: _______________________________', { x: 54, y: y5, size: 9.5, font, color: rgb(0, 0, 0) });
    p5.drawText('Name: _______________________________', { x: 330, y: y5, size: 9.5, font, color: rgb(0, 0, 0) });
    addFieldTo(p5, 'nda_name_a', 95, y5 - 2, 140);
    addFieldTo(p5, 'nda_name_b', 370, y5 - 2, 140);
    y5 -= 22;

    p5.drawText('Title: ______________________________', { x: 54, y: y5, size: 9.5, font, color: rgb(0, 0, 0) });
    p5.drawText('Title: ______________________________', { x: 330, y: y5, size: 9.5, font, color: rgb(0, 0, 0) });
    addFieldTo(p5, 'nda_title_a', 88, y5 - 2, 140);
    addFieldTo(p5, 'nda_title_b', 364, y5 - 2, 140);
  } else if (template === 'pro_real_estate_purchase') {
    // AUTHENTIC RESIDENTIAL REAL ESTATE PURCHASE & SALE AGREEMENT (4 PAGES, FULL-LENGTH VERBATIM)
    const p1 = page;
    const p2 = pdfDoc.addPage(dims);
    const p3 = pdfDoc.addPage(dims);
    const p4 = pdfDoc.addPage(dims);

    const drawFooter = (targetPage: any, pageNum: number) => {
      const footerStr = `Real Estate Purchase Agreement, page ${pageNum} of 4`;
      const numW = font.widthOfTextAtSize(footerStr, 9);
      targetPage.drawLine({ start: { x: 54, y: 40 }, end: { x: 558, y: 40 }, thickness: 0.5, color: rgb(0, 0, 0) });
      targetPage.drawText(footerStr, { x: 558 - numW, y: 25, size: 9, font, color: rgb(0, 0, 0) });
    };

    const addFieldTo = (targetPage: any, name: string, x: number, y: number, width: number, height: number = 12) => {
      const tf = form.createTextField(name);
      tf.setText('');
      tf.addToPage(targetPage, { x: x, y: y + 3, width, height, borderWidth: 0, font });
      try { tf.setFontSize(8.5); } catch (e) {}
    };

    const drawPara = (targetPage: any, textStr: string, startY: number, fontSize: number = 10, leading: number = 14) => {
      const words = textStr.split(' ');
      let currentLine = '';
      let curY = startY;
      const marginX = 54;
      const maxWidth = 504;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxWidth && currentLine) {
          targetPage.drawText(currentLine, { x: marginX, y: curY, size: fontSize, font, color: rgb(0, 0, 0) });
          curY -= leading;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        targetPage.drawText(currentLine, { x: marginX, y: curY, size: fontSize, font, color: rgb(0, 0, 0) });
        curY -= leading;
      }
      return curY;
    };

    const drawSectionHeader = (targetPage: any, numStr: string, titleStr: string, startY: number) => {
      targetPage.drawText(numStr, { x: 54, y: startY, size: 10.5, font: boldFont, color: rgb(0, 0, 0) });
      const numW = boldFont.widthOfTextAtSize(numStr, 10.5);
      const titleX = 54 + numW + 16;
      targetPage.drawText(titleStr, { x: titleX, y: startY, size: 10.5, font: boldFont, color: rgb(0, 0, 0) });
      const titleW = boldFont.widthOfTextAtSize(titleStr, 10.5);
      targetPage.drawLine({
        start: { x: titleX, y: startY - 2 },
        end: { x: titleX + titleW, y: startY - 2 },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });
      return startY - 18;
    };

    // ================= PAGE 1 OF 4 =================
    drawFooter(p1, 1);
    let y1 = pageH - 54;

    const titleStr1 = 'REAL ESTATE PURCHASE & SALE AGREEMENT';
    const titleW1 = boldFont.widthOfTextAtSize(titleStr1, 14);
    const titleX1 = (pageW - titleW1) / 2;
    p1.drawText(titleStr1, { x: titleX1, y: y1, size: 14, font: boldFont, color: rgb(0, 0, 0) });
    p1.drawLine({ start: { x: titleX1, y: y1 - 3 }, end: { x: titleX1 + titleW1, y: y1 - 3 }, thickness: 1, color: rgb(0, 0, 0) });
    y1 -= 32;

    // Line 1: THIS REAL ESTATE AGREEMENT is entered into on this _____ day of __________________, 20___,
    const re1_p1 = 'THIS REAL ESTATE AGREEMENT is entered into on this ';
    const re1_p1W = font.widthOfTextAtSize(re1_p1, 10);
    p1.drawText(re1_p1, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const re1_u1 = '_____';
    const re1_u1W = font.widthOfTextAtSize(re1_u1, 10);
    p1.drawText(re1_u1, { x: 54 + re1_p1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 're_day', 54 + re1_p1W, y1 - 2, re1_u1W);

    const re1_p2 = ' day of ';
    const re1_p2W = font.widthOfTextAtSize(re1_p2, 10);
    p1.drawText(re1_p2, { x: 54 + re1_p1W + re1_u1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const re1_u2 = '__________________';
    const re1_u2W = font.widthOfTextAtSize(re1_u2, 10);
    p1.drawText(re1_u2, { x: 54 + re1_p1W + re1_u1W + re1_p2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 're_month_yr', 54 + re1_p1W + re1_u1W + re1_p2W, y1 - 2, re1_u2W);

    p1.drawText(', 20___,', { x: 54 + re1_p1W + re1_u1W + re1_p2W + re1_u2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 16;

    // Line 2: by and between Buyer: ________________________ and Seller: ________________________.
    const re2_p1 = 'by and between Buyer: ';
    const re2_p1W = font.widthOfTextAtSize(re2_p1, 10);
    p1.drawText(re2_p1, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const re2_u1 = '________________________';
    const re2_u1W = font.widthOfTextAtSize(re2_u1, 10);
    p1.drawText(re2_u1, { x: 54 + re2_p1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 're_buyer_name', 54 + re2_p1W, y1 - 2, re2_u1W);

    const re2_p2 = ' and Seller: ';
    const re2_p2W = font.widthOfTextAtSize(re2_p2, 10);
    p1.drawText(re2_p2, { x: 54 + re2_p1W + re2_u1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const re2_u2 = '________________________';
    const re2_u2W = font.widthOfTextAtSize(re2_u2, 10);
    p1.drawText(re2_u2, { x: 54 + re2_p1W + re2_u1W + re2_p2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 're_seller_name', 54 + re2_p1W + re2_u1W + re2_p2W, y1 - 2, re2_u2W);

    p1.drawText('.', { x: 54 + re2_p1W + re2_u1W + re2_p2W + re2_u2W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 22;

    y1 = drawPara(p1, 'WITNESSETH: Seller agrees to sell and convey, and Buyer agrees to purchase, the real property together with all improvements, appurtenances, and fixtures subject to the covenants and conditions set forth herein:', y1);
    y1 -= 12;

    y1 = drawSectionHeader(p1, '1.', 'Real Property Description.', y1);
    y1 = drawPara(p1, 'Seller hereby agrees to sell and convey to Buyer, and Buyer agrees to purchase from Seller, that certain residential real property located at:', y1);
    y1 -= 4;

    const re1_addr_u = '_____________________________________________________';
    const re1_addr_uW = font.widthOfTextAtSize(re1_addr_u, 10);
    p1.drawText(re1_addr_u, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 're_address', 54, y1 - 2, re1_addr_uW);
    y1 -= 16;

    y1 = drawPara(p1, 'together with all permanent improvements, built-in home appliances, plumbing fixtures, heating systems, electrical wiring, and attached window coverings.', y1);
    y1 -= 14;

    y1 = drawSectionHeader(p1, '2.', 'Purchase Price & Earnest Money Deposit.', y1);
    const re2_pr_a = 'The total purchase price for the real property shall be $';
    const re2_pr_aW = font.widthOfTextAtSize(re2_pr_a, 10);
    p1.drawText(re2_pr_a, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const re2_pr_u = '____________________';
    const re2_pr_uW = font.widthOfTextAtSize(re2_pr_u, 10);
    p1.drawText(re2_pr_u, { x: 54 + re2_pr_aW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 're_price', 54 + re2_pr_aW, y1 - 2, re2_pr_uW);
    p1.drawText('.', { x: 54 + re2_pr_aW + re2_pr_uW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 16;

    const re2_dep_b = 'Buyer shall deposit the sum of $';
    const re2_dep_bW = font.widthOfTextAtSize(re2_dep_b, 10);
    p1.drawText(re2_dep_b, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });

    const re2_dep_u = '____________________';
    const re2_dep_uW = font.widthOfTextAtSize(re2_dep_u, 10);
    p1.drawText(re2_dep_u, { x: 54 + re2_dep_bW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 're_deposit', 54 + re2_dep_bW, y1 - 2, re2_dep_uW);
    p1.drawText(' as Earnest Money Deposit', { x: 54 + re2_dep_bW + re2_dep_uW, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 14;

    y1 = drawPara(p1, 'to be held by designated Escrow Holder upon execution of this Agreement.', y1);
    y1 -= 14;

    y1 = drawSectionHeader(p1, '3.', 'Financing & Loan Contingency.', y1);
    y1 = drawPara(p1, 'Buyer obligations under this Agreement are contingent upon Buyer securing a commitment for a mortgage loan in the principal amount of:', y1);
    y1 -= 4;

    const re3_u1 = '____________________';
    const re3_u1W = font.widthOfTextAtSize(re3_u1, 10);
    p1.drawText(re3_u1, { x: 54, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p1, 're_loan_amt', 54, y1 - 2, re3_u1W);

    p1.drawText(' at prevailing market interest rates within 21 days.', { x: 54 + re3_u1W, y: y1, size: 10, font, color: rgb(0, 0, 0) });
    y1 -= 16;

    // ================= PAGE 2 OF 4 =================
    drawFooter(p2, 2);
    let y2 = pageH - 54;

    y2 = drawSectionHeader(p2, '4.', 'Closing of Escrow & Settlement.', y2);
    const re_close = 'Escrow shall close on or before ';
    const re_closeW = font.widthOfTextAtSize(re_close, 10);
    p2.drawText(re_close, { x: 54, y: y2, size: 10, font, color: rgb(0, 0, 0) });
    const re_closeU = '__________________';
    const re_closeUW = font.widthOfTextAtSize(re_closeU, 10);
    p2.drawText(re_closeU, { x: 54 + re_closeW, y: y2, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p2, 're_close_date', 54 + re_closeW, y2 - 2, re_closeUW);
    p2.drawText(', 20___, or at such other date as agreed in writing.', { x: 54 + re_closeW + re_closeUW, y: y2, size: 10, font, color: rgb(0, 0, 0) });
    y2 -= 16;

    y2 = drawPara(p2, 'Settlement and closing shall occur through a licensed escrow holder. All closing costs, title insurance premiums, escrow fees, transfer taxes, and recording fees shall be allocated between Buyer and Seller in accordance with customary local real estate practices, unless expressly agreed otherwise herein.', y2);
    y2 -= 12;

    y2 = drawSectionHeader(p2, '5.', 'Property Inspection & Disclosures.', y2);
    y2 = drawPara(p2, 'Buyer shall have fourteen (14) days from the Effective Date ("Inspection Period") to conduct physical, environmental, and structural inspections of the Property by qualified inspectors at Buyer\'s sole expense. If Buyer disapproves of any inspection report, Buyer may terminate this Agreement in writing prior to the expiration of the Inspection Period and receive a full refund of the Earnest Money Deposit.', y2);
    y2 -= 10;

    y2 = drawPara(p2, 'Seller shall provide Buyer with all legally required disclosures, including the Seller Property Condition Disclosure Statement and Lead-Based Paint Disclosure (for homes built prior to 1978), within five (5) days of the Effective Date.', y2);
    y2 -= 12;

    y2 = drawSectionHeader(p2, '6.', 'Title & Encumbrances.', y2);
    y2 = drawPara(p2, 'Seller warrants that Seller holds marketable and insurable title to the Property, free and clear of all liens, mortgages, claims, and encumbrances, except covenants, conditions, restrictions, rights-of-way, and easements of record that do not materially impair the residential use of the Property. Seller shall provide Buyer with an Owner\'s Policy of Title Insurance at closing.', y2);
    y2 -= 12;

    y2 = drawSectionHeader(p2, '7.', 'Risk of Loss & Casualty.', y2);
    y2 = drawPara(p2, 'Risk of loss or damage to the Property by fire, storm, or other casualty remains with Seller until closing and transfer of possession. In the event of material damage prior to closing exceeding ten percent (10%) of the Purchase Price, Buyer may elect to terminate this Agreement and receive a full refund of Earnest Money.', y2);

    // ================= PAGE 3 OF 4 =================
    drawFooter(p3, 3);
    let y3 = pageH - 54;

    y3 = drawSectionHeader(p3, '8.', 'Default & Liquidated Damages.', y3);
    y3 = drawPara(p3, 'If Buyer fails to complete the purchase of the Property in breach of this Agreement, Seller shall be released from all obligations to sell the Property and may retain the Earnest Money Deposit as liquidated damages, which the parties agree is a reasonable estimate of Seller\'s damages. If Seller fails to perform any obligation under this Agreement, Buyer may seek specific performance or terminate this Agreement and demand immediate return of the Earnest Money Deposit.', y3);
    y3 -= 12;

    y3 = drawSectionHeader(p3, '9.', 'Prorations & Adjustments.', y3);
    y3 = drawPara(p3, 'Real property taxes, personal property taxes, home association dues, municipal assessments, utilities, and rents shall be prorated as of the Date of Closing. If tax amounts for the current year are not finalized prior to closing, prorations shall be calculated based upon the most recent tax bill.', y3);
    y3 -= 12;

    y3 = drawSectionHeader(p3, '10.', 'Governing Law & Dispute Resolution.', y3);
    const re_gov = 'This Agreement shall be governed by and construed under the laws of ';
    const re_govW = font.widthOfTextAtSize(re_gov, 10);
    p3.drawText(re_gov, { x: 54, y: y3, size: 10, font, color: rgb(0, 0, 0) });
    const re_govU = '_____________________';
    const re_govUW = font.widthOfTextAtSize(re_govU, 10);
    p3.drawText(re_govU, { x: 54 + re_govW, y: y3, size: 10, font, color: rgb(0, 0, 0) });
    addFieldTo(p3, 're_gov_state', 54 + re_govW, y3 - 2, re_govUW);
    p3.drawText(' (state/province).', { x: 54 + re_govW + re_govUW, y: y3, size: 10, font, color: rgb(0, 0, 0) });
    y3 -= 16;

    y3 = drawPara(p3, 'In the event of any dispute arising out of this Agreement, Buyer and Seller agree to participate in non-binding mediation prior to initiating formal legal proceedings. The prevailing party in any litigation or arbitration shall be entitled to recover reasonable attorneys\' fees and court costs.', y3);
    y3 -= 12;

    y3 = drawSectionHeader(p3, '11.', 'Entirety of Agreement & Amendments.', y3);
    y3 = drawPara(p3, 'This Agreement, including all attached riders, exhibits, and disclosures, constitutes the entire agreement between Buyer and Seller. No prior representations, warranties, or verbal statements shall be binding unless reduced to writing and signed by both Buyer and Seller.', y3);

    // ================= PAGE 4 OF 4 =================
    drawFooter(p4, 4);
    let y4 = pageH - 54;

    y4 = drawSectionHeader(p4, '10.', 'Additional Agreements & Rider Stipulations.', y4);
    y4 = drawPara(p4, 'The following custom provisions, rider addendums, or disclosures are incorporated herein:', y4);
    y4 -= 10;

    addFieldTo(p4, 're_custom_p4', 54, y4 - 50, 504, 50);
    y4 -= 65;

    const witStr3 = 'IN WITNESS WHEREOF, Buyer and Seller have executed this Agreement as of the date written above.';
    const witW3 = boldFont.widthOfTextAtSize(witStr3, 9.5);
    p4.drawText(witStr3, { x: (pageW - witW3) / 2, y: y4, size: 9.5, font: boldFont, color: rgb(0, 0, 0) });
    y4 -= 45;

    p4.drawText('BUYER SIGNATURE', { x: 64, y: y4, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    p4.drawText('SELLER SIGNATURE', { x: 340, y: y4, size: 10, font: boldFont, color: rgb(0, 0, 0) });
    y4 -= 35;

    p4.drawText('By: _________________________________', { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    p4.drawText('By: _________________________________', { x: 330, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    addFieldTo(p4, 're_buyer_sig', 78, y4 - 2, 150);
    addFieldTo(p4, 're_seller_sig', 354, y4 - 2, 150);
    y4 -= 22;

    p4.drawText('Name: _______________________________', { x: 54, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    p4.drawText('Name: _______________________________', { x: 330, y: y4, size: 9.5, font, color: rgb(0, 0, 0) });
    addFieldTo(p4, 're_buyer_name_line', 95, y4 - 2, 140);
    addFieldTo(p4, 're_seller_name_line', 370, y4 - 2, 140);
  }

  return await pdfDoc.save();
}
