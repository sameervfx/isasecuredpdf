const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require(path.join(__dirname, '..', 'node_modules', 'pdf-lib'));

async function createQAPdf() {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageW = 595.28;
  const pageH = 841.89;

  function createPage(pageNum, totalPages) {
    const page = pdfDoc.addPage([pageW, pageH]);
    
    // Header Banner
    page.drawRectangle({
      x: 0,
      y: pageH - 75,
      width: pageW,
      height: 75,
      color: rgb(0.08, 0.12, 0.22),
    });

    page.drawText('PARAZA PHARMA MEETING — EXECUTIVE Q&A CHEAT SHEET', {
      x: 35,
      y: pageH - 38,
      size: 14,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText('Straight 1-Line Technical & Business Talking Points | CEO • Andrew (IT) • Faizan (Data Science)', {
      x: 35,
      y: pageH - 58,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.65, 0.8, 1),
    });

    // Footer
    page.drawLine({
      start: { x: 35, y: 35 },
      end: { x: pageW - 35, y: 35 },
      thickness: 0.5,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText('CONFIDENTIAL & PROPRIETARY — PREPARED FOR PARAZA PHARMA BRIEFING', {
      x: 35,
      y: 22,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    page.drawText('Page ' + pageNum + ' of ' + totalPages, {
      x: pageW - 85,
      y: 22,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    return page;
  }

  function splitText(text, maxChars) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length <= maxChars) {
        cur = (cur + ' ' + w).trim();
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function drawQABlock(page, startY, qText, aText) {
    const boxW = pageW - 70;
    const qLines = splitText(qText, 85);
    const aLines = splitText(aText, 85);
    const blockH = 16 + qLines.length * 13 + aLines.length * 12 + 6;

    page.drawRectangle({
      x: 35,
      y: startY - blockH,
      width: boxW,
      height: blockH,
      color: rgb(0.98, 0.99, 1),
      borderColor: rgb(0.85, 0.88, 0.94),
      borderWidth: 1,
    });

    page.drawRectangle({
      x: 35,
      y: startY - blockH,
      width: 3.5,
      height: blockH,
      color: rgb(0.12, 0.45, 0.85),
    });

    let curY = startY - 14;
    for (let i = 0; i < qLines.length; i++) {
      page.drawText((i === 0 ? 'Q: ' : '   ') + qLines[i], {
        x: 46,
        y: curY,
        size: 9.5,
        font: fontBold,
        color: rgb(0.1, 0.15, 0.3),
      });
      curY -= 13;
    }

    curY -= 2;
    for (let i = 0; i < aLines.length; i++) {
      page.drawText((i === 0 ? 'A: ' : '   ') + aLines[i], {
        x: 46,
        y: curY,
        size: 9,
        font: fontRegular,
        color: rgb(0.2, 0.25, 0.35),
      });
      curY -= 12;
    }

    return startY - blockH - 7;
  }

  function drawSectionHeader(page, y, title) {
    page.drawText(title.toUpperCase(), {
      x: 35,
      y: y - 14,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.18, 0.35),
    });

    page.drawRectangle({
      x: 35,
      y: y - 18,
      width: pageW - 70,
      height: 1.5,
      color: rgb(0.2, 0.4, 0.75),
    });

    return y - 28;
  }

  // ================= PAGE 1 =================
  const page1 = createPage(1, 2);
  let y1 = pageH - 95;

  y1 = drawSectionHeader(page1, y1, '1. Security & Data Privacy (For Andrew — Head of IT)');

  y1 = drawQABlock(page1, y1, 
    'Where are our sensitive preclinical & research files processed?',
    '100% locally on the user\'s machine in WebAssembly memory. Zero document bytes are ever uploaded to cloud servers.'
  );

  y1 = drawQABlock(page1, y1, 
    'Do you store or retain any copies of our documents or reports?',
    'No. We have no document ingestion server or remote storage buckets. There is literally no server to store them on.'
  );

  y1 = drawQABlock(page1, y1, 
    'Can our lab scientists use this completely offline on air-gapped workstations?',
    'Yes. Once installed or loaded, it edits, annotates, redacts, signs, and compresses with zero active internet connection.'
  );

  y1 = drawQABlock(page1, y1, 
    'How can our IT team independently verify zero network leakage?',
    'Open Wireshark or browser Network DevTools, run all tools — 0 bytes of document payload leave your workstation perimeter.'
  );

  y1 = drawQABlock(page1, y1, 
    'What encryption do you use for password protection?',
    'Military-grade AES-256 (ISO 32000-2) by default, with AES-128 compatibility for legacy document systems.'
  );

  y1 -= 6;
  y1 = drawSectionHeader(page1, y1, '2. Comparison vs. Adobe Acrobat, Smallpdf & iLovePDF');

  y1 = drawQABlock(page1, y1, 
    'Adobe Acrobat Desktop can run offline too, so why should Paraza consider you?',
    'Adobe enables Cloud sync, telemetry, and Generative AI by default, requiring complex IT GPO lockdowns. ISASecuredPDF has zero cloud backend by design.'
  );

  y1 = drawQABlock(page1, y1, 
    'What about Smallpdf and iLovePDF desktop apps?',
    'They use a hybrid model where web tools upload to cloud. If an employee drags a file into their browser, it leaks. ISASecuredPDF is 100% local everywhere.'
  );

  y1 = drawQABlock(page1, y1, 
    'Is ISASecuredPDF as capable for daily pharmaceutical workflows?',
    'Yes: direct text editing, AcroForm filling, redaction, wet-ink vector signatures, AES-256 encryption, flattening, and multi-page reorganization.'
  );


  // ================= PAGE 2 =================
  const page2 = createPage(2, 2);
  let y2 = pageH - 95;

  y2 = drawSectionHeader(page2, y2, '3. Data Science & Technical Engine (For Faizan — Data Scientist)');

  y2 = drawQABlock(page2, y2, 
    'What is the underlying cryptographic and rendering technology stack?',
    'Client-side WebAssembly compiling MuPDF, PDF.js, and PDF-Lib directly into browser/Electron native memory threads.'
  );

  y2 = drawQABlock(page2, y2, 
    'Does any AI or third-party Large Language Model see our confidential research?',
    'Zero AI processing touches your files. No data is ingested into any training set or sent to external LLM APIs.'
  );

  y2 = drawQABlock(page2, y2, 
    'Do your redactions truly sanitize the PDF or just draw a colored box over it?',
    'Redaction stamps an opaque vector occlusion path blocking Ctrl+A and Ctrl+F, with MuPDF stream-level glyph sanitization supported.'
  );

  y2 = drawQABlock(page2, y2, 
    'Can the engine handle high-resolution scanned pathology and assay reports?',
    'Yes. Processing is constrained only by client RAM, not arbitrary server upload limits or third-party timeouts.'
  );

  y2 -= 6;
  y2 = drawSectionHeader(page2, y2, '4. Business, Licensing & Enterprise Rollout (For CEO)');

  y2 = drawQABlock(page2, y2, 
    'What operating systems and platforms are supported?',
    'Windows 10/11 desktop application, secure web (isasecuredpdf.com), Android, and iOS.'
  );

  y2 = drawQABlock(page2, y2, 
    'How does Paraza IT deploy and manage seats across our scientific teams?',
    'Standard Windows MSI/EXE installer deployable via Microsoft Intune or SCCM with offline corporate site-license keys.'
  );

  y2 = drawQABlock(page2, y2, 
    'What is the pricing model compared to Adobe Acrobat enterprise subscriptions?',
    'Predictable per-seat licensing at up to 70-80% cost savings compared to recurring Adobe Acrobat Pro subscription tiers.'
  );

  y2 = drawQABlock(page2, y2, 
    'Can we run a formal enterprise pilot with our medicinal chemistry group?',
    'Yes. We offer an immediate 30-day proof-of-concept pilot for Paraza teams with dedicated founder-level onboarding and support.'
  );

  // SECTION 5: QUICK MEETING TIPS BOX
  y2 -= 10;
  page2.drawRectangle({
    x: 35,
    y: y2 - 75,
    width: pageW - 70,
    height: 75,
    color: rgb(0.94, 0.97, 1),
    borderColor: rgb(0.2, 0.5, 0.8),
    borderWidth: 1.5,
  });

  page2.drawText('CRITICAL AUDIT & DEMO TALKING POINTS (KEEP HANDY):', {
    x: 48,
    y: y2 - 18,
    size: 9.5,
    font: fontBold,
    color: rgb(0.1, 0.3, 0.7),
  });

  const tips = [
    '• Wireshark Proof: Challenge Andrew to monitor outbound packets while you edit & save — 0 bytes egress.',
    '• AES-256 Support: Both the web and desktop app execute AES-256 client-side encryption via MuPDF WASM.',
    '• Compliance Ready: Perfect for HIPAA, FDA 21 CFR Part 11, and EMA Policy 0070 air-gapped environments.'
  ];
  let tY = y2 - 32;
  for (const t of tips) {
    page2.drawText(t, { x: 48, y: tY, size: 8.5, font: fontRegular, color: rgb(0.15, 0.2, 0.3) });
    tY -= 13;
  }

  const pdfBytes = await pdfDoc.save();
  const outPath1 = 'C:/work/ISA_SECURE_PDF/Marketing_Collateral/assets/PARAZA/PARAZA_EXECUTIVE_MEETING_QA_CHEAT_SHEET.pdf';
  const outPath2 = 'C:/Users/samee/.gemini/antigravity/scratch/pdf-editor-suite/PARAZA_EXECUTIVE_MEETING_QA_CHEAT_SHEET.pdf';
  const outPath3 = 'C:/Users/samee/.gemini/antigravity/brain/9ad90e8b-b385-4913-8602-7b0205d5bb53/PARAZA_EXECUTIVE_MEETING_QA_CHEAT_SHEET.pdf';

  fs.writeFileSync(outPath1, Buffer.from(pdfBytes));
  fs.writeFileSync(outPath2, Buffer.from(pdfBytes));
  fs.writeFileSync(outPath3, Buffer.from(pdfBytes));
  console.log('SUCCESS: Written to all 3 paths!');
}

createQAPdf().catch(console.error);
