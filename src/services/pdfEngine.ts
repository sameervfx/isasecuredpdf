import { PDFDocument, rgb, degrees, StandardFonts, PDFTextField, PDFCheckBox, PDFOperator, PDFName, PDFString } from 'pdf-lib';
import { TextAnnotation, SignatureAnnotation, AcroFormField, PDFDocumentState, StampAnnotation, StrikeoutAnnotation, FreehandDrawing } from '../types/pdf';
import { createZipBundle, ZipFileEntry } from '../utils/zipBuilder';

function parseHexColor(hexColor: string) {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;
  return rgb(r, g, b);
}

export class PDFEngineService {
  async extractFormFields(pdfDoc: PDFDocument): Promise<AcroFormField[]> {
    const fields: AcroFormField[] = [];
    try {
      const form = pdfDoc.getForm();
      const rawFields = form.getFields();

      for (const field of rawFields) {
        const name = field.getName();
        let type: 'text' | 'checkbox' = 'text';
        let value: string | boolean = '';

        let isMultiline = false;
        if (field instanceof PDFTextField) {
          type = 'text';
          value = field.getText() || '';
          try { isMultiline = field.isMultiline(); } catch (e) {}
        } else if (field instanceof PDFCheckBox) {
          type = 'checkbox';
          value = field.isChecked();
        } else {
          continue;
        }

        const widgets = field.acroField.getWidgets();
        const pages = pdfDoc.getPages();

        for (let wIdx = 0; wIdx < widgets.length; wIdx++) {
          const widget = widgets[wIdx];
          const rect = widget.getRectangle();
          
          let pageIndex = 0;
          const widgetPageRef = widget.P();
          if (widgetPageRef) {
            const foundIdx = pages.findIndex(p => p.ref && p.ref.objectNumber === widgetPageRef.objectNumber && p.ref.generationNumber === widgetPageRef.generationNumber);
            if (foundIdx !== -1) {
              pageIndex = foundIdx;
            }
          }

          let originX = 0;
          let originY = 0;
          const page = pages[pageIndex];
          if (page) {
            try {
              const crop = page.getCropBox();
              originX = crop.x || 0;
              originY = crop.y || 0;
            } catch (e) {}
          }

          fields.push({
            name: widgets.length > 1 ? `${name}_w${wIdx}` : name,
            fieldName: name,
            type,
            pageIndex,
            value,
            isMultiline,
            rect: {
              x: rect.x - originX,
              y: rect.y - originY,
              width: rect.width,
              height: rect.height,
            },
          });
        }
      }
    } catch (err) {
      console.warn('Form extraction warning:', err);
    }
    return fields;
  }

  async exportDocument(state: PDFDocumentState): Promise<Uint8Array> {
    if (!state.fileBytes) {
      throw new Error('No PDF file loaded');
    }

    // 1. Load original document using isolated bytes copy
    const copyBytes = new Uint8Array(state.fileBytes.slice(0));
    const pdfDoc = await PDFDocument.load(copyBytes, { ignoreEncryption: true });
    
    // Embed core vector fonts matching user selected text styles
    const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);
    const font = fontTimes;

    const getFontForFamily = (family?: string) => {
      if (!family) return fontTimes;
      const fam = family.toLowerCase();
      if (fam.includes('courier') || fam.includes('mono') || fam.includes('lucida')) {
        return fontCourier;
      }
      if (
        fam.includes('arial') ||
        fam.includes('helvetica') ||
        fam.includes('sans') ||
        fam.includes('tahoma') ||
        fam.includes('trebuchet') ||
        fam.includes('impact') ||
        fam.includes('segoe') ||
        fam.includes('gothic')
      ) {
        return fontHelvetica;
      }
      return fontTimes;
    };

    // 2. Fill AcroForms and Update Appearance Streams (/AP) ONLY if form fields exist
    if (state.formFields && state.formFields.length > 0) {
      try {
        const form = pdfDoc.getForm();
        for (const fieldState of state.formFields) {
          try {
            if (fieldState.type === 'text') {
              const targetName = fieldState.fieldName || fieldState.name;
              const cleanVal = String(fieldState.value ?? '').replace(/[^\x00-\x7F]/g, '');

              try {
                const tf = form.getTextField(targetName);
                tf.setText(cleanVal);
                if (fieldState.fontSize) {
                  try { tf.setFontSize(fieldState.fontSize); } catch (e) {}
                }
              } catch (tErr) {
                // Ignore missing field or lookup error
              }
            } else if (fieldState.type === 'checkbox') {
              const targetName = fieldState.fieldName || fieldState.name;
              try {
                const cb = form.getCheckBox(targetName);
                if (fieldState.value) cb.check();
                else cb.uncheck();
              } catch (cErr) {
                // Ignore missing checkbox lookup error
              }
            }
          } catch (err) {}
        }

        // Rebuild /AP appearance streams for Adobe / Chrome print previewers
        try {
          form.updateFieldAppearances(font);
        } catch (appErr) {
          console.warn('Form updateFieldAppearances non-fatal warning:', appErr);
        }
        try {
          form.flatten();
        } catch (flattenErr) {
          console.warn('Form flatten warning:', flattenErr);
        }
      } catch (formErr) {
        console.warn('Form updating non-fatal warning:', formErr);
      }
    }

    // 3. Render Freehand Drawings & Whiteout Eraser Strokes
    // Rendering whiteout strokes AFTER form flattening ensures white erased areas wipe out original content cleanly.
    // Whiteout strokes draw 100% smooth, crisp, solid white rectangles (zero jagged/bumpy line segments).
    for (const drawing of state.drawings || []) {
      if (drawing.pageIndex < 0 || drawing.pageIndex >= pdfDoc.getPageCount()) continue;
      if (!drawing.points || drawing.points.length < 1) continue;

      const targetPage = pdfDoc.getPage(drawing.pageIndex);
      const { height: pageH } = targetPage.getSize();
      const isWhiteout = drawing.color === '#ffffff' || drawing.color?.toLowerCase() === '#fff';
      const strokeThickness = drawing.thickness || 8;

      if (isWhiteout) {
        let minX = drawing.points[0].x;
        let minY = drawing.points[0].y;
        let maxX = drawing.points[0].x;
        let maxY = drawing.points[0].y;

        for (const p of drawing.points) {
          if (p.x < minX) minX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.x > maxX) maxX = p.x;
          if (p.y > maxY) maxY = p.y;
        }

        const padding = strokeThickness / 2;
        const rectX = Math.max(0, minX - padding);
        const rectY = Math.max(0, minY - padding);
        const rectW = (maxX - minX) + strokeThickness;
        const rectH = (maxY - minY) + strokeThickness;

        targetPage.drawRectangle({
          x: rectX,
          y: pageH - rectY - rectH,
          width: rectW,
          height: rectH,
          color: rgb(1, 1, 1),
          borderWidth: 0,
        });
      } else {
        const drawColor = parseHexColor(drawing.color);
        for (let i = 0; i < drawing.points.length - 1; i++) {
          const pt1 = drawing.points[i];
          const pt2 = drawing.points[i + 1];
          targetPage.drawLine({
            start: { x: pt1.x, y: pageH - pt1.y },
            end: { x: pt2.x, y: pageH - pt2.y },
            thickness: strokeThickness,
            color: drawColor,
            opacity: drawing.opacity || 1.0,
          });
        }
      }
    }

    // 4. Render Text Annotations (Multi-line & Pasted Text Support)
    // Rendering text annotations AFTER whiteout drawings ensures newly written text sits ON TOP of erased areas!
    for (const textAnn of state.textAnnotations) {
      if (textAnn.pageIndex < 0 || textAnn.pageIndex >= pdfDoc.getPageCount()) continue;

      const targetPage = pdfDoc.getPage(textAnn.pageIndex);
      const { height: pageH } = targetPage.getSize();
      const textColor = parseHexColor(textAnn.color || '#000000');

      const lines = (textAnn.text || '').split(/\r?\n/);
      const lineHeight = textAnn.fontSize * 1.3;
      const totalHeight = textAnn.height || Math.max(lines.length * lineHeight + 8, textAnn.fontSize * 1.4 + 8);
      const totalWidth = textAnn.width || 320;
      const pdfY = pageH - textAnn.y - totalHeight;

      if (textAnn.isRedact) {
        targetPage.drawRectangle({
          x: textAnn.x,
          y: pdfY,
          width: totalWidth,
          height: totalHeight,
          color: rgb(1, 1, 1),
          borderWidth: 0,
        });
      }

      const annFont = getFontForFamily(textAnn.fontFamily);

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const cleanLine = lines[lineIdx].replace(/[^\x00-\x7F]/g, '');
        if (cleanLine) {
          let drawX = textAnn.x + 2;
          let drawY = pageH - textAnn.y - (lineIdx * lineHeight) - textAnn.fontSize * 0.85;

          if (textAnn.rotation && textAnn.rotation !== 0) {
            const rotDeg = -textAnn.rotation;
            const rad = (rotDeg * Math.PI) / 180;
            const estimatedWidth = annFont.widthOfTextAtSize(cleanLine, textAnn.fontSize);
            const estimatedHeight = textAnn.fontSize;
            const pdfCx = textAnn.x;
            const pdfCy = pageH - textAnn.y;
            const halfW = estimatedWidth / 2;
            const halfH = estimatedHeight / 2;
            const rotatedDx = halfW * Math.cos(rad) - halfH * Math.sin(rad);
            const rotatedDy = halfW * Math.sin(rad) + halfH * Math.cos(rad);
            drawX = pdfCx - rotatedDx;
            drawY = pdfCy - rotatedDy;
          }

          targetPage.drawText(cleanLine, {
            x: drawX,
            y: drawY,
            size: textAnn.fontSize,
            font: annFont,
            color: textColor,
            opacity: textAnn.opacity !== undefined ? textAnn.opacity : 1.0,
            rotate: textAnn.rotation ? degrees(-textAnn.rotation) : undefined,
          });
        }
      }
    }

    // 4. Render Checkmarks & Crossmarks
    for (const stamp of state.stamps || []) {
      if (stamp.pageIndex < 0 || stamp.pageIndex >= pdfDoc.getPageCount()) continue;
      const targetPage = pdfDoc.getPage(stamp.pageIndex);
      const { height: pageH } = targetPage.getSize();
      const stampColor = parseHexColor(stamp.color);
      const pdfY = pageH - stamp.y - stamp.size;
      const s = stamp.size;
      const th = Math.max(2, s * 0.12);

      if (stamp.type === 'checkmark') {
        const p1 = { x: stamp.x, y: pdfY + s * 0.45 };
        const p2 = { x: stamp.x + s * 0.35, y: pdfY + s * 0.1 };
        const p3 = { x: stamp.x + s * 0.95, y: pdfY + s * 0.85 };
        targetPage.drawLine({ start: p1, end: p2, thickness: th, color: stampColor });
        targetPage.drawLine({ start: p2, end: p3, thickness: th, color: stampColor });
      } else if (stamp.type === 'crossmark') {
        targetPage.drawLine({ start: { x: stamp.x, y: pdfY + s }, end: { x: stamp.x + s, y: pdfY }, thickness: th, color: stampColor });
        targetPage.drawLine({ start: { x: stamp.x, y: pdfY }, end: { x: stamp.x + s, y: pdfY + s }, thickness: th, color: stampColor });
      }
    }

    // 5. Render Strikeout Lines
    for (const strike of state.strikeouts || []) {
      if (strike.pageIndex < 0 || strike.pageIndex >= pdfDoc.getPageCount()) continue;
      const targetPage = pdfDoc.getPage(strike.pageIndex);
      const { height: pageH } = targetPage.getSize();
      const strikeColor = parseHexColor(strike.color);
      const pdfY = pageH - strike.y;

      targetPage.drawLine({
        start: { x: strike.x, y: pdfY },
        end: { x: strike.x + strike.width, y: pdfY },
        thickness: strike.thickness || 2,
        color: strikeColor,
      });
    }

    // 7. Render Signature Images (Robust JPG/PNG embedding with fallbacks)
    for (const sig of state.signatures) {
      if (sig.pageIndex < 0 || sig.pageIndex >= pdfDoc.getPageCount()) continue;

      const targetPage = pdfDoc.getPage(sig.pageIndex);
      const { height: pageH } = targetPage.getSize();

      try {
        let embeddedImage;
        const dataUrl = sig.dataUrl;
        if (dataUrl.includes('image/jpeg') || dataUrl.includes('image/jpg')) {
          embeddedImage = await pdfDoc.embedJpg(dataUrl);
        } else {
          try {
            embeddedImage = await pdfDoc.embedPng(dataUrl);
          } catch (pngErr) {
            embeddedImage = await pdfDoc.embedJpg(dataUrl);
          }
        }

        let drawX = sig.x;
        let drawY = pageH - sig.y - sig.height;

        if (sig.rotation && sig.rotation !== 0) {
          const rotDeg = -sig.rotation;
          const rad = (rotDeg * Math.PI) / 180;
          const pdfCx = sig.x;
          const pdfCy = pageH - sig.y;
          const halfW = sig.width / 2;
          const halfH = sig.height / 2;
          const rotatedDx = halfW * Math.cos(rad) - halfH * Math.sin(rad);
          const rotatedDy = halfW * Math.sin(rad) + halfH * Math.cos(rad);
          drawX = pdfCx - rotatedDx;
          drawY = pdfCy - rotatedDy;
        }

        targetPage.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: sig.width,
          height: sig.height,
          opacity: sig.opacity !== undefined ? sig.opacity : 1.0,
          rotate: sig.rotation ? degrees(-sig.rotation) : undefined,
        });
      } catch (sigErr) {
        console.error('Failed to embed signature image:', sigErr);
      }
    }

    // 8. Apply rotations
    for (let i = 0; i < pdfDoc.getPageCount(); i++) {
      const userRot = state.pageRotations[i] || 0;
      if (userRot !== 0) {
        const page = pdfDoc.getPage(i);
        const currentRot = page.getRotation().angle;
        page.setRotation(degrees((currentRot + userRot) % 360));
      }
    }

    // 9. Handle page deletions or page reordering if modified
    const isReordered = state.pageOrder.some((origIdx, seqIdx) => origIdx !== seqIdx);
    const hasDeletions = state.deletedPages.size > 0;

    if (isReordered || hasDeletions) {
      const reorderDoc = await PDFDocument.create();
      const activePages = state.pageOrder.filter((idx) => !state.deletedPages.has(idx));

      const copiedPages = await reorderDoc.copyPages(pdfDoc, activePages);
      for (const page of copiedPages) {
        reorderDoc.addPage(page);
      }

      return await reorderDoc.save({ useObjectStreams: false });
    }

    return await pdfDoc.save({ useObjectStreams: false });
  }

  async mergePDFDocuments(fileList: Uint8Array[]): Promise<Uint8Array> {
    if (fileList.length === 0) {
      throw new Error('No PDF files provided to merge');
    }

    const mergedDoc = await PDFDocument.create();

    for (const fileBytes of fileList) {
      const srcDoc = await PDFDocument.load(fileBytes, { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      for (const page of copiedPages) {
        mergedDoc.addPage(page);
      }
    }

    return await mergedDoc.save();
  }

  async exportMultiplePDFs(
    state: PDFDocumentState,
    mode: 'split_all' | 'custom_range',
    customRanges?: string
  ): Promise<{ fileName: string; data: Uint8Array }> {
    const masterBytes = await this.exportDocument(state);
    const pdfDoc = await PDFDocument.load(masterBytes, { ignoreEncryption: true });
    const totalPages = pdfDoc.getPageCount();
    const filesToZip: ZipFileEntry[] = [];
    const baseName = (state.fileName || 'document.pdf').replace(/\.pdf$/i, '');

    if (mode === 'split_all') {
      for (let i = 0; i < totalPages; i++) {
        const subDoc = await PDFDocument.create();
        const [copiedPage] = await subDoc.copyPages(pdfDoc, [i]);
        subDoc.addPage(copiedPage);
        const subBytes = await subDoc.save();
        filesToZip.push({
          name: `${baseName}_Page_${i + 1}.pdf`,
          data: subBytes,
        });
      }
    } else if (mode === 'custom_range' && customRanges) {
      const groups = customRanges.split(',').map((s) => s.trim()).filter(Boolean);
      for (let gIdx = 0; gIdx < groups.length; gIdx++) {
        const groupStr = groups[gIdx];
        const pageIndices: number[] = [];
        if (groupStr.includes('-')) {
          const [startStr, endStr] = groupStr.split('-');
          const start = Math.max(1, parseInt(startStr.trim(), 10) || 1);
          const end = Math.min(totalPages, parseInt(endStr.trim(), 10) || start);
          for (let p = start; p <= end; p++) pageIndices.push(p - 1);
        } else {
          const single = parseInt(groupStr, 10);
          if (!isNaN(single) && single >= 1 && single <= totalPages) {
            pageIndices.push(single - 1);
          }
        }

        if (pageIndices.length > 0) {
          const subDoc = await PDFDocument.create();
          const copiedPages = await subDoc.copyPages(pdfDoc, pageIndices);
          copiedPages.forEach((p) => subDoc.addPage(p));
          const subBytes = await subDoc.save();
          const label = groupStr.replace(/[^a-zA-Z0-9-_]/g, '_');
          filesToZip.push({
            name: `${baseName}_Part_${gIdx + 1}_Pages_${label}.pdf`,
            data: subBytes,
          });
        }
      }
    }

    const zipBytes = createZipBundle(filesToZip);
    return {
      fileName: `${baseName}_Multiple_PDFs.zip`,
      data: zipBytes,
    };
  }
}

export const pdfEngine = new PDFEngineService();
