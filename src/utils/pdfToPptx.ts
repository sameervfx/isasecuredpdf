import pptxgen from 'pptxgenjs';
import * as pdfjsLib from 'pdfjs-dist';

interface TextItem {
  str: string;
  x: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  color: string;
}

interface LineGroup {
  top: number;
  height: number;
  items: TextItem[];
}

/**
 * Extracts all text items from a PDF page while accurately tracking
 * sequential text fill colors from the PDF operator stream (RGB & Grayscale).
 */
async function extractItemsWithColors(page: any, viewport: any): Promise<TextItem[]> {
  const textContent = await page.getTextContent();
  const opList = await page.getOperatorList();

  const OPS = (pdfjsLib as any).OPS || (page as any).OPS || {};
  const stateStack: { fillRGB: number[]; isRGB: boolean; fillGray: number }[] = [];
  let curState = { fillRGB: [0, 0, 0], isRGB: true, fillGray: 0 };
  const opChars: { char: string; color: string }[] = [];

  const fnArray = opList.fnArray || [];
  const argsArray = opList.argsArray || [];

  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    const args = argsArray[i];

    if (fn === OPS.save) {
      stateStack.push({ fillRGB: [...curState.fillRGB], isRGB: curState.isRGB, fillGray: curState.fillGray });
    } else if (fn === OPS.restore) {
      if (stateStack.length > 0) curState = stateStack.pop()!;
    } else if (fn === OPS.setFillRGBColor && args && args.length >= 3) {
      curState.fillRGB = [Math.round(args[0]), Math.round(args[1]), Math.round(args[2])];
      curState.isRGB = true;
    } else if (fn === OPS.setFillGray && args && args.length >= 1) {
      curState.fillGray = args[0];
      curState.isRGB = false;
    } else if (fn === OPS.showText || fn === OPS.showSpacedText) {
      let col = '000000';
      if (curState.isRGB) {
        col = curState.fillRGB
          .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
      } else {
        const g = Math.max(0, Math.min(255, Math.round(curState.fillGray * 255)));
        col = [g, g, g].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
      }

      const glyphs = Array.isArray(args[0]) ? args[0] : [args[0]];
      for (const g of glyphs) {
        const char = typeof g === 'string' ? g : (g && g.unicode ? g.unicode : '');
        for (const c of char) {
          if (c && c.trim()) {
            opChars.push({ char: c, color: col });
          }
        }
      }
    }
  }

  const rawItems = (textContent.items || []).filter((it: any) => it.str && it.str.trim().length > 0);
  let opIdx = 0;

  const items: TextItem[] = rawItems.map((it: any) => {
    const x = it.transform[4];
    const yFromBottom = it.transform[5];
    const top = viewport.height - yFromBottom;
    const fontSize = Math.hypot(it.transform[0], it.transform[1]) || it.height || 10;
    const fontName = (it.fontName || '').toLowerCase();
    const isBold =
      fontName.includes('bold') ||
      fontName.includes('black') ||
      fontName.includes('heavy') ||
      fontName.includes('semibold');
    const isItalic = fontName.includes('italic') || fontName.includes('oblique');

    const cleanStr = it.str.replace(/\s+/g, '');
    let color = '000000';
    if (opIdx < opChars.length) {
      color = opChars[opIdx].color;
      opIdx += cleanStr.length;
    }

    return {
      str: it.str.trim(),
      x,
      top,
      width: it.width || 0,
      height: it.height || fontSize,
      fontSize,
      isBold,
      isItalic,
      color
    };
  });

  return items;
}

/**
 * Converts a loaded PDF.js document into a real Microsoft PowerPoint presentation (.pptx)
 * 100% client-side with zero cloud transmission.
 */
export async function convertPdfToPptxBlob(
  pdfDoc: any,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const numPages = pdfDoc.numPages || 1;
  const pres = new pptxgen();

  // Determine slide dimensions from Page 1 (convert points to inches)
  const page1 = await pdfDoc.getPage(1);
  const vp1 = page1.getViewport({ scale: 1.0 });
  const slideW = Number((vp1.width / 72).toFixed(2));
  const slideH = Number((vp1.height / 72).toFixed(2));

  pres.defineLayout({ name: 'CUSTOM_PDF', width: slideW, height: slideH });
  pres.layout = 'CUSTOM_PDF';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(Math.round(((pageNum - 1) / numPages) * 85) + 5);
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const rawItems = await extractItemsWithColors(page, viewport);

    const slide = pres.addSlide();

    // Separate top header banner if present (e.g. note/amount banner)
    let bannerItem: TextItem | null = null;
    const bodyItems: TextItem[] = [];
    for (const item of rawItems) {
      if (item.top <= 75 && (item.str.toLowerCase().includes('note') || item.str.includes('%'))) {
        bannerItem = item;
      } else {
        bodyItems.push(item);
      }
    }

    // Render top banner with rich dark blue accent
    if (bannerItem) {
      slide.addShape(pres.ShapeType.rect, {
        x: 0,
        y: 0,
        w: slideW,
        h: 0.35,
        fill: { color: '283592' },
        line: { color: '283592' }
      });
      slide.addText(bannerItem.str, {
        x: 0,
        y: 0.05,
        w: slideW,
        h: 0.25,
        fontSize: Math.round(bannerItem.fontSize * 0.95),
        color: 'FFFFFF',
        align: 'center',
        valign: 'middle',
        fontFace: 'Calibri'
      });
    }

    bodyItems.sort((a, b) => a.top - b.top || a.x - b.x);

    // Group items into visual lines
    const lines: LineGroup[] = [];
    for (const item of bodyItems) {
      let placed = false;
      for (const line of lines) {
        if (Math.abs(line.top - item.top) <= Math.max(3.5, Math.min(line.height, item.height) * 0.55)) {
          line.items.push(item);
          line.top = Math.min(line.top, item.top);
          placed = true;
          break;
        }
      }
      if (!placed) {
        lines.push({ top: item.top, height: item.height, items: [item] });
      }
    }

    lines.forEach((l) => l.items.sort((a, b) => a.x - b.x));
    lines.sort((a, b) => a.top - b.top);

    for (const line of lines) {
      // Cluster items that are close horizontally (gap <= 18 points)
      const clusters: TextItem[][] = [];
      let curCluster: TextItem[] = [line.items[0]];

      for (let j = 1; j < line.items.length; j++) {
        const prev = line.items[j - 1];
        const cur = line.items[j];
        const gap = cur.x - (prev.x + prev.width);
        if (gap > 18) {
          clusters.push(curCluster);
          curCluster = [cur];
        } else {
          curCluster.push(cur);
        }
      }
      clusters.push(curCluster);

      // Check if this line is a table header row (e.g. Description, Total price)
      const lineText = line.items.map((i) => i.str.toLowerCase()).join(' ');
      const isHeaderRow =
        (lineText.includes('description') && lineText.includes('price')) ||
        (lineText.includes('item') && lineText.includes('total'));

      if (isHeaderRow && clusters.length >= 2) {
        // Draw subtle table header highlight bar behind header text
        const firstX = line.items[0].x / 72;
        const lastItem = line.items[line.items.length - 1];
        const lastX = (lastItem.x + lastItem.width) / 72;
        slide.addShape(pres.ShapeType.rect, {
          x: Math.max(0, firstX - 0.05),
          y: Math.max(0, (line.top - 2) / 72),
          w: Math.max(1, (lastX - firstX) + 0.1),
          h: Math.max(0.24, (line.height + 4) / 72),
          fill: { color: 'F3F3F3' },
          line: { color: 'E0E0E0', width: 0.75 }
        });
      }

      for (const cluster of clusters) {
        const first = cluster[0];
        const last = cluster[cluster.length - 1];
        const clusterW = Math.max(20, last.x + last.width - first.x);

        const xIn = Math.max(0, first.x / 72);
        const yIn = Math.max(0, (line.top - 2) / 72);
        const wIn = Math.max(0.4, (clusterW + 15) / 72);
        const hIn = Math.max(0.2, (line.height + 4) / 72);

        const runs = cluster.map((it) => ({
          text: it.str + ' ',
          options: {
            fontSize: Math.round(it.fontSize * 0.95),
            color: it.color,
            bold: it.isBold,
            italic: it.isItalic,
            fontFace: 'Calibri'
          }
        }));

        slide.addText(runs, {
          x: xIn,
          y: yIn,
          w: wIn,
          h: hIn,
          valign: 'top',
          margin: 0
        });
      }
    }
  }

  if (onProgress) onProgress(95);

  const output = await pres.write({ outputType: 'blob' });
  const blob =
    output instanceof Blob
      ? output
      : new Blob([output as any], {
          type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        });

  if (onProgress) onProgress(100);
  return blob;
}
