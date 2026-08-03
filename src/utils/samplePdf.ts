import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function createSamplePDF(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Sample Business Document & Editable Form
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
  const { width: p1W, height: p1H } = page1.getSize();

  // Header Banner
  page1.drawRectangle({
    x: 0,
    y: p1H - 100,
    width: p1W,
    height: 100,
    color: rgb(0.05, 0.1, 0.25),
  });

  page1.drawText('CONFIDENTIAL CONTRACT & SERVICE AGREEMENT', {
    x: 40,
    y: p1H - 55,
    size: 18,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('100% Client-Side Local PDF Suite Demo Document', {
    x: 40,
    y: p1H - 78,
    size: 11,
    font: fontHelvetica,
    color: rgb(0.7, 0.85, 1),
  });

  // Section 1: Instructions
  page1.drawText('1. OVERVIEW & INSTRUCTIONS', {
    x: 40,
    y: p1H - 140,
    size: 14,
    font: fontHelveticaBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  const bodyText = [
    'Welcome to the ultra-secure client-side PDF Editor Suite.',
    'All processing, text redacting, signature embedding, and form filling takes place',
    'entirely inside your local web browser memory. No data is sent to external servers.',
    '',
    '• Select [Text / Edit] mode from toolbar to insert new text or cover & redact text.',
    '• Select [Fill Form] mode to edit the interactive fields below.',
    '• Select [Sign] to draw your signature and place it anywhere on this page.',
    '• Select [Page Manager] or Sidebar thumbnail controls to rotate, delete, or reorder pages.',
  ];

  let currentY = p1H - 170;
  for (const line of bodyText) {
    page1.drawText(line, {
      x: 40,
      y: currentY,
      size: 10.5,
      font: fontHelvetica,
      color: rgb(0.2, 0.2, 0.25),
    });
    currentY -= 18;
  }

  // Section 2: Text to Redact / Overwrite Test
  currentY -= 20;
  page1.drawRectangle({
    x: 40,
    y: currentY - 50,
    width: p1W - 80,
    height: 60,
    color: rgb(0.95, 0.96, 0.98),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  page1.drawText('TEXT OVERWRITING & REDACTION TEST BOX:', {
    x: 50,
    y: currentY - 12,
    size: 10,
    font: fontHelveticaBold,
    color: rgb(0.7, 0.2, 0.2),
  });

  page1.drawText('Original Secret Value: Confidential-Project-Delta-889', {
    x: 50,
    y: currentY - 35,
    size: 11,
    font: fontHelvetica,
    color: rgb(0.1, 0.1, 0.1),
  });

  // Section 3: Interactive AcroForm Fields
  currentY -= 80;
  page1.drawText('2. INTERACTIVE ACROFORM FIELDS', {
    x: 40,
    y: currentY,
    size: 14,
    font: fontHelveticaBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  currentY -= 30;

  const form = pdfDoc.getForm();

  // Field 1: Client Name
  page1.drawText('Client Full Name:', {
    x: 40,
    y: currentY,
    size: 10.5,
    font: fontHelveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  const clientNameField = form.createTextField('client_name');
  clientNameField.setText('Jane Doe');
  clientNameField.addToPage(page1, {
    x: 160,
    y: currentY - 5,
    width: 220,
    height: 22,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.7, 0.8),
  });

  // Field 2: Date
  page1.drawText('Agreement Date:', {
    x: 400,
    y: currentY,
    size: 10.5,
    font: fontHelveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  const dateField = form.createTextField('agreement_date');
  dateField.setText('2026-07-27');
  dateField.addToPage(page1, {
    x: 490,
    y: currentY - 5,
    width: 70,
    height: 22,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.7, 0.8),
  });

  currentY -= 40;

  // Field 3: Terms Accepted Checkbox
  const termsCheckbox = form.createCheckBox('accept_terms');
  termsCheckbox.check();
  termsCheckbox.addToPage(page1, {
    x: 40,
    y: currentY - 2,
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.7, 0.8),
  });

  page1.drawText('I confirm that I have reviewed and agree to the client-side data privacy policy.', {
    x: 68,
    y: currentY,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Signature placement box hint
  currentY -= 120;
  page1.drawRectangle({
    x: 40,
    y: currentY,
    width: 260,
    height: 80,
    color: rgb(0.98, 0.98, 0.99),
    borderColor: rgb(0.7, 0.75, 0.85),
    borderWidth: 1,
  });

  page1.drawText('AUTHORIZED SIGNATURE LOCATION', {
    x: 50,
    y: currentY + 62,
    size: 9,
    font: fontHelveticaBold,
    color: rgb(0.4, 0.5, 0.6),
  });

  page1.drawText('(Drag & place handwritten signature here)', {
    x: 50,
    y: currentY + 12,
    size: 9,
    font: fontHelvetica,
    color: rgb(0.6, 0.65, 0.7),
  });

  // Page 2: Additional Page for Page Management Test
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  const { width: p2W, height: p2H } = page2.getSize();

  page2.drawRectangle({
    x: 0,
    y: p2H - 80,
    width: p2W,
    height: 80,
    color: rgb(0.15, 0.2, 0.35),
  });

  page2.drawText('APPENDIX & PAGE MANAGEMENT TEST', {
    x: 40,
    y: p2H - 50,
    size: 16,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  page2.drawText('This is Page 2 of the sample document.', {
    x: 40,
    y: p2H - 120,
    size: 12,
    font: fontHelvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  page2.drawText('You can test page rotation (90°), reordering, or deleting this page in the sidebar.', {
    x: 40,
    y: p2H - 145,
    size: 11,
    font: fontHelvetica,
    color: rgb(0.4, 0.4, 0.45),
  });

  return await pdfDoc.save();
}
