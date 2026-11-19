import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { applyStandardMetadata } from './pdfMetadata';

export async function createSamplePDF(): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);

  // ----------------------------------------------------
  // Page 1: Preclinical Study Report & Interactive Suite
  // ----------------------------------------------------
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions
  const { width: p1W, height: p1H } = page1.getSize();

  // Header Banner
  page1.drawRectangle({
    x: 0,
    y: p1H - 85,
    width: p1W,
    height: 85,
    color: rgb(0.08, 0.12, 0.22),
  });

  page1.drawText('CONFIDENTIAL PRECLINICAL STUDY & SERVICE REPORT', {
    x: 40,
    y: p1H - 42,
    size: 16,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('100% Client-Side Local PDF Suite Demo Document', {
    x: 40,
    y: p1H - 64,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.6, 0.8, 1),
  });

  // Section 1: Executive Summary & Security Overview
  page1.drawText('1. EXECUTIVE SUMMARY & SECURITY OVERVIEW', {
    x: 40,
    y: p1H - 115,
    size: 13,
    font: fontHelveticaBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  const body1 = [
    'Welcome to the ultra-secure client-side PDF Editor Suite.',
    'All processing, text redacting, signature embedding, and form filling takes place',
    'entirely inside your local device WebAssembly memory. Zero document data is sent to cloud servers.',
    '',
    '• REDACT / WHITEOUT TEST: Obscure confidential compound IDs and patient metrics in Section 2.',
    '• FORM FILLING TEST: The interactive fields in Section 3 can be edited directly in the viewer.',
    '• VECTOR SIGNATURE TEST: Apply a cryptographic handwritten signature or stamp in Section 4.',
    '• AES-256 ENCRYPTION: Use Header Toolbar -> PDF Security to protect this file with AES-256.',
  ];

  let currentY = p1H - 138;
  for (const line of body1) {
    page1.drawText(line, {
      x: 40,
      y: currentY,
      size: 10.5,
      font: fontHelvetica,
      color: rgb(0.2, 0.2, 0.25),
    });
    currentY -= 17;
  }

  // Section 2: Redaction Test Area
  currentY -= 12;
  page1.drawRectangle({
    x: 40,
    y: currentY - 105,
    width: p1W - 80,
    height: 120,
    color: rgb(0.97, 0.98, 1),
    borderColor: rgb(0.2, 0.4, 0.8),
    borderWidth: 1.5,
  });

  page1.drawText('2. CONFIDENTIAL TARGET DATA FOR REDACTION TESTING', {
    x: 52,
    y: currentY - 2,
    size: 11,
    font: fontHelveticaBold,
    color: rgb(0.8, 0.1, 0.1),
  });

  const redactItems = [
    'Proprietary Compound ID: PRZ-9481-X (Novel Kinase Inhibitor)',
    'Clinical Trial Patient ID: #PT-883014  |  DOB: 1984-05-12  |  Site: Montreal General',
    'Assay Potency IC50: 1.84 nM (Confidential Discovery Screen)',
    'Manufacturing Unit Cost: $148.50 / gram (Commercial Trade Secret)',
  ];

  let rY = currentY - 24;
  for (const item of redactItems) {
    page1.drawText(item, {
      x: 52,
      y: rY,
      size: 11,
      font: fontCourier,
      color: rgb(0.1, 0.1, 0.1),
    });
    rY -= 21;
  }

  // Section 3: Interactive AcroForm Fields
  const form = pdfDoc.getForm();
  currentY -= 130;

  page1.drawText('3. INTERACTIVE ACROFORM & AUDIT APPROVAL', {
    x: 40,
    y: currentY,
    size: 12,
    font: fontHelveticaBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  currentY -= 26;
  page1.drawText('Investigator Name:', {
    x: 40,
    y: currentY,
    size: 10.5,
    font: fontHelveticaBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  const nameField = form.createTextField('investigator_name');
  nameField.setText('Dr. Andrew Miller');
  nameField.addToPage(page1, {
    x: 160,
    y: currentY - 5,
    width: 170,
    height: 22,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.7, 0.8),
  });

  page1.drawText('Protocol Number:', {
    x: 345,
    y: currentY,
    size: 10.5,
    font: fontHelveticaBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  const protocolField = form.createTextField('protocol_number');
  protocolField.setText('PRZ-2026-PH2B');
  protocolField.addToPage(page1, {
    x: 440,
    y: currentY - 5,
    width: 115,
    height: 22,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.7, 0.8),
  });

  currentY -= 32;
  page1.drawText('Review Notes:', {
    x: 40,
    y: currentY,
    size: 10.5,
    font: fontHelveticaBold,
    color: rgb(0.3, 0.3, 0.3),
  });
  const notesField = form.createTextField('review_notes');
  notesField.setText('Preclinical screening data validated. Ready for executive review.');
  notesField.addToPage(page1, {
    x: 160,
    y: currentY - 5,
    width: 395,
    height: 22,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.7, 0.8),
  });

  currentY -= 30;
  const compliantBox = form.createCheckBox('audit_compliant');
  compliantBox.check();
  compliantBox.addToPage(page1, {
    x: 160,
    y: currentY - 2,
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.7, 0.8),
  });
  page1.drawText('Audit & Data Integrity Compliant (FDA 21 CFR Part 11 / Air-Gapped Local)', {
    x: 185,
    y: currentY + 1,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Section 4: Signature Area
  currentY -= 55;
  page1.drawRectangle({
    x: 40,
    y: currentY - 60,
    width: p1W - 80,
    height: 72,
    color: rgb(0.99, 0.99, 0.99),
    borderColor: rgb(0.8, 0.8, 0.8),
    borderWidth: 1,
  });

  page1.drawText('4. AUTHORIZED SIGNATURE & STAMP LOCATION (Place Handwritten Signature Here):', {
    x: 52,
    y: currentY - 12,
    size: 9.5,
    font: fontHelveticaBold,
    color: rgb(0.4, 0.4, 0.4),
  });

  page1.drawLine({
    start: { x: 52, y: currentY - 42 },
    end: { x: 280, y: currentY - 42 },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.6),
  });
  page1.drawText('Lead Investigator Signature', {
    x: 52,
    y: currentY - 54,
    size: 8.5,
    font: fontHelvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  page1.drawLine({
    start: { x: 330, y: currentY - 42 },
    end: { x: 500, y: currentY - 42 },
    thickness: 1,
    color: rgb(0.6, 0.6, 0.6),
  });
  page1.drawText('Date of Verification', {
    x: 330,
    y: currentY - 54,
    size: 8.5,
    font: fontHelvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // ----------------------------------------------------
  // Page 2: Multi-Page Operations & Verification
  // ----------------------------------------------------
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  const { width: p2W, height: p2H } = page2.getSize();

  page2.drawRectangle({
    x: 0,
    y: p2H - 85,
    width: p2W,
    height: 85,
    color: rgb(0.12, 0.18, 0.3),
  });

  page2.drawText('APPENDIX & PAGE MANAGEMENT TEST', {
    x: 40,
    y: p2H - 45,
    size: 16,
    font: fontHelveticaBold,
    color: rgb(1, 1, 1),
  });

  page2.drawText('Page 2 of 2 - Multi-Page Document Verification', {
    x: 40,
    y: p2H - 65,
    size: 10,
    font: fontHelvetica,
    color: rgb(0.65, 0.8, 1),
  });

  page2.drawText('This is Page 2 of the demonstration document.', {
    x: 40,
    y: p2H - 120,
    size: 12,
    font: fontHelveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  const page2Instructions = [
    'You can test multi-page workflows in ISASecuredPDF:',
    '• Sidebar Thumbnails: Click on page thumbnails to quickly navigate.',
    '• Page Rotation: Rotate this page 90°, 180°, or 270° clockwise.',
    '• Reordering: Drag thumbnails in the sidebar to reorder pages.',
    '• Page Extraction & Deletion: Delete or extract this appendix page independently.',
    '• Batch Watermark & Stamp: Apply corporate seals or watermarks across all pages simultaneously.',
  ];

  let p2Y = p2H - 148;
  for (const item of page2Instructions) {
    page2.drawText(item, {
      x: 40,
      y: p2Y,
      size: 10.5,
      font: fontHelvetica,
      color: rgb(0.3, 0.35, 0.4),
    });
    p2Y -= 20;
  }

  applyStandardMetadata(pdfDoc);
  return await pdfDoc.save();
}
