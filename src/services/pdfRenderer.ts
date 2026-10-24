import * as pdfjsLib from 'pdfjs-dist';
import { getDocument, GlobalWorkerOptions, PDFDocumentProxy, AnnotationMode, VerbosityLevel } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Silence non-fatal PDF.js worker & console formatting warnings
try {
  const libRef: any = pdfjsLib;
  if (libRef && typeof libRef === 'object') {
    libRef.verbosity = VerbosityLevel.ERRORS;
  }
} catch (e) {}

export class PDFRendererService {
  private pdfDoc: PDFDocumentProxy | null = null;
  private workerReady = false;
  private activeRenderTasks: Map<HTMLCanvasElement, any> = new Map();

  private ensureWorker() {
    if (!this.workerReady) {
      try {
        if (typeof window !== 'undefined') {
          // Priority 1: Use local bundled / public worker file relative to origin
          const localWorkerUrl = new URL('pdf.worker.min.js', window.location.href).href;
          GlobalWorkerOptions.workerSrc = localWorkerUrl || workerUrl;
        } else {
          GlobalWorkerOptions.workerSrc = workerUrl || '/pdf.worker.min.js';
        }
      } catch (e) {
        GlobalWorkerOptions.workerSrc = workerUrl || '/pdf.worker.min.js';
      }
      this.workerReady = true;
    }
  }

  cancelRender(canvas: HTMLCanvasElement) {
    const task = this.activeRenderTasks.get(canvas);
    if (task) {
      try {
        task.cancel();
      } catch (e) {}
      this.activeRenderTasks.delete(canvas);
    }
  }

  cancelAllRenders() {
    for (const [, task] of this.activeRenderTasks.entries()) {
      try {
        task.cancel();
      } catch (e) {}
    }
    this.activeRenderTasks.clear();
  }

  async loadDocument(data: Uint8Array, password?: string): Promise<PDFDocumentProxy> {
    this.ensureWorker();
    this.cancelAllRenders();
    this.clearTextCache();
    const copyData = data.slice(0);
    const loadingTask = getDocument({
      data: copyData,
      password,
      verbosity: VerbosityLevel.ERRORS,
    });
    this.pdfDoc = await loadingTask.promise;
    return this.pdfDoc;
  }

  getDoc(): PDFDocumentProxy | null {
    return this.pdfDoc;
  }

  async renderPageToCanvas(
    pageIndex: number,
    canvas: HTMLCanvasElement,
    scale: number = 1.0,
    rotationAngle: number = 0,
    fallbackFileBytes?: Uint8Array | null
  ): Promise<{ width: number; height: number; originalWidth: number; originalHeight: number }> {
    if (!this.pdfDoc && fallbackFileBytes) {
      await this.loadDocument(fallbackFileBytes);
    }
    if (!this.pdfDoc) throw new Error('PDF document not loaded');

    // Cancel any previous in-flight render task for this specific canvas
    this.cancelRender(canvas);

    const page = await this.pdfDoc.getPage(pageIndex + 1);
    const totalRotation = (page.rotate + rotationAngle) % 360;
    const viewport = page.getViewport({ scale, rotation: totalRotation });

    // Retina / High-DPI crystal-clear vector rendering:
    // Scale canvas pixels by DPR (minimum 2.0 for razor-sharp vector text matching Adobe)
    const deviceDPR = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const dpr = Math.max(deviceDPR, 2.0);
    const scaledViewport = page.getViewport({ scale: scale * dpr, rotation: totalRotation });

    const targetWidth = Math.max(1, Math.floor(scaledViewport.width));
    const targetHeight = Math.max(1, Math.floor(scaledViewport.height));

    // DOUBLE BUFFERING: Render into an offscreen scratch canvas first!
    // Keeps previous page visible on screen with zero white flash
    const offscreen = document.createElement('canvas');
    offscreen.width = targetWidth;
    offscreen.height = targetHeight;
    const offscreenCtx = offscreen.getContext('2d', { alpha: true, willReadFrequently: true });
    if (!offscreenCtx) throw new Error('Could not get 2d canvas context');

    offscreenCtx.fillStyle = '#ffffff';
    offscreenCtx.fillRect(0, 0, targetWidth, targetHeight);

    const renderTask = page.render({
      canvasContext: offscreenCtx,
      viewport: scaledViewport,
      annotationMode: AnnotationMode.DISABLE,
    });

    this.activeRenderTasks.set(canvas, renderTask);

    try {
      await renderTask.promise;
    } catch (err: any) {
      if (err?.name === 'RenderingCancelledException') {
        const unscaledViewport = page.getViewport({ scale: 1.0, rotation: totalRotation });
        return {
          width: viewport.width,
          height: viewport.height,
          originalWidth: unscaledViewport.width,
          originalHeight: unscaledViewport.height,
        };
      }
      throw err;
    } finally {
      if (this.activeRenderTasks.get(canvas) === renderTask) {
        this.activeRenderTasks.delete(canvas);
      }
    }

    // ATOMIC BLIT: Transfer the newly rendered image from offscreen to DOM canvas in a single instant paint
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(offscreen, 0, 0);
    }

    const unscaledViewport = page.getViewport({ scale: 1.0, rotation: totalRotation });
    return {
      width: viewport.width,
      height: viewport.height,
      originalWidth: unscaledViewport.width,
      originalHeight: unscaledViewport.height,
    };
  }

  private textLinesCache: Map<number, DetectedPDFTextLine[]> = new Map();

  clearTextCache() {
    this.textLinesCache.clear();
  }

  async extractPageTextLines(pageIndex: number): Promise<DetectedPDFTextLine[]> {
    if (this.textLinesCache.has(pageIndex)) {
      return this.textLinesCache.get(pageIndex)!;
    }
    if (!this.pdfDoc) return [];
    try {
      const page = await this.pdfDoc.getPage(pageIndex + 1);
      const vp = page.getViewport({ scale: 1.0 });
      const opList = await page.getOperatorList();
      const textContent = await page.getTextContent();
      const rawItems = (textContent.items as any[]).filter((i) => i.str && i.str.trim());

      // 1. Extract RGB & Gray fill colors from operator list with graphics state stack tracking
      const OPS = (pdfjsLib as any).OPS || {};
      const stateStack: { fillRGB: number[]; isRGB: boolean; fillGray: number }[] = [];
      let curState = { fillRGB: [0, 0, 0], isRGB: true, fillGray: 0 };
      const opChars: { char: string; color: string }[] = [];

      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i];
        const args = opList.argsArray[i];
        if (fn === OPS.save) {
          stateStack.push({ fillRGB: [...curState.fillRGB], isRGB: curState.isRGB, fillGray: curState.fillGray });
        } else if (fn === OPS.restore) {
          if (stateStack.length > 0) curState = stateStack.pop()!;
        } else if (fn === OPS.setFillRGBColor) {
          curState.fillRGB = [Math.round(args[0]), Math.round(args[1]), Math.round(args[2])];
          curState.isRGB = true;
        } else if (fn === OPS.setFillGray) {
          curState.fillGray = args[0];
          curState.isRGB = false;
        } else if (fn === OPS.showText || fn === OPS.showSpans) {
          let col = '#000000';
          if (curState.isRGB) {
            col = '#' + curState.fillRGB.map((x) => x.toString(16).padStart(2, '0')).join('');
          } else {
            const g = Math.round(curState.fillGray * 255);
            col = '#' + [g, g, g].map((x) => x.toString(16).padStart(2, '0')).join('');
          }

          const glyphs = Array.isArray(args[0]) ? args[0] : [args[0]];
          for (const g of glyphs) {
            const char = typeof g === 'string' ? g : (g?.unicode || '');
            for (const c of char) {
              if (c && c.trim()) {
                opChars.push({ char: c, color: col });
              }
            }
          }
        }
      }

      // 2. Resolve font family, weight, ascent & descent from commonObjs and tc.styles
      const fontInfoMap = new Map<string, { fontFamily: string; fontWeight: string; ascent: number; descent: number }>();
      const styles = (textContent as any).styles || {};
      for (const [fontId, style] of Object.entries<any>(styles)) {
        let cleanFamily = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        let weight = 'normal';

        let postscriptName = '';
        if ((page as any).commonObjs && (page as any).commonObjs.has(fontId)) {
          const fontObj = (page as any).commonObjs.get(fontId);
          postscriptName = (fontObj?.name || fontObj?.fallbackName || '').replace(/^[A-Z]{6}\+/, '');
        }

        const nameLower = (postscriptName || fontId || '').toLowerCase();
        if (/bold|black|heavy|w7|w8|w9/i.test(nameLower)) {
          weight = 'bold';
        } else if (/semibold|demi|w6/i.test(nameLower)) {
          weight = '600';
        } else if (/light|thin|w2|w3/i.test(nameLower)) {
          weight = '300';
        } else {
          weight = 'normal';
        }

        // Comprehensive worldwide font family detection
        // Receipts & Point of Sale (POS) / Dot Matrix / Monospace
        if (/courier|mono|consolas|monaco|ocr|receipt|thermal|typewriter/i.test(nameLower) || style.fontFamily === 'monospace') {
          cleanFamily = "'Courier New', Courier, 'Roboto Mono', Consolas, Monaco, monospace";
        }
        // Formal / Legal / Accounting / Classic serif
        else if (/times|georgia|garamond|serif|cambria|palatino|baskerville/i.test(nameLower) || style.fontFamily === 'serif') {
          cleanFamily = "'Times New Roman', Times, Georgia, Garamond, serif";
        }
        // Friendly / Rounded / Creative
        else if (/rounded|vag/i.test(nameLower)) {
          cleanFamily = "'Nunito', 'VAG Rounded', 'Arial Rounded MT Bold', sans-serif";
        }
        // Corporate / Invoice / SaaS / Banking standard sans-serif (Inter, Helvetica, Arial, Roboto, Open Sans)
        else {
          cleanFamily = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
        }

        // CSS line-box ascent ratio calibrated to HTML textarea rendering (line-height: 1)
        // Standard digital typographic ascent to baseline is ~0.83 for sans-serif, 0.84 for monospace, 0.80 for serif
        let cssAscent = 0.83;
        if (/courier|mono|consolas/i.test(cleanFamily)) {
          cssAscent = 0.84;
        } else if (/times|georgia|serif/i.test(cleanFamily)) {
          cssAscent = 0.80;
        }

        const ascent = cssAscent;
        const descent = typeof style.descent === 'number' && style.descent < 0 ? style.descent : -0.22;

        fontInfoMap.set(fontId, { fontFamily: cleanFamily, fontWeight: weight, ascent, descent });
      }

      // 3. Match items and group lines with exact sub-pixel decimal precision and vector color
      const lines: DetectedPDFTextLine[] = [];
      let opIdx = 0;

      for (const item of rawItems) {
        const rawFontSize = Math.hypot(item.transform[0], item.transform[1]) || item.height || 12;
        const itemFontSize = parseFloat(rawFontSize.toFixed(2));
        const fontMeta = fontInfoMap.get(item.fontName) || {
          fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontWeight: 'normal',
          ascent: 0.83,
          descent: -0.22,
        };

        const cleanStr = item.str.replace(/\s+/g, '');
        let itemColor = '#000000';
        if (opIdx < opChars.length) {
          itemColor = opChars[opIdx].color;
          opIdx += cleanStr.length;
        }

        const baselineY = parseFloat((vp.height - item.transform[5]).toFixed(2));
        const topY = parseFloat((baselineY - (fontMeta.ascent * itemFontSize)).toFixed(2));
        const itemH = parseFloat(((fontMeta.ascent - fontMeta.descent) * itemFontSize).toFixed(2));
        const itemX = parseFloat(item.transform[4].toFixed(2));
        const itemW = parseFloat((item.width || itemFontSize * item.str.length * 0.5).toFixed(2));

        const lastLine = lines[lines.length - 1];
        if (
          lastLine &&
          Math.abs(baselineY - lastLine.baselineY) < 2.5 &&
          Math.abs(itemFontSize - lastLine.fontSize) < 1.5 &&
          itemX - (lastLine.x + lastLine.width) < itemFontSize * 2.2
        ) {
          lastLine.text += (lastLine.text.endsWith(' ') ? '' : ' ') + item.str;
          lastLine.width = parseFloat((itemX + itemW - lastLine.x).toFixed(2));
          lastLine.height = Math.max(lastLine.height, itemH);
        } else {
          lines.push({
            id: `line_${pageIndex}_${lines.length}_${Math.round(itemX)}_${Math.round(topY)}`,
            pageIndex,
            text: item.str,
            x: itemX,
            y: topY,
            baselineY,
            ascent: fontMeta.ascent,
            descent: fontMeta.descent,
            width: itemW,
            height: itemH,
            fontSize: itemFontSize,
            fontFamily: fontMeta.fontFamily,
            fontWeight: fontMeta.fontWeight,
            color: itemColor,
          });
        }
      }
      this.textLinesCache.set(pageIndex, lines);
      return lines;
    } catch (err) {
      console.error('Error extracting page text lines:', err);
      return [];
    }
  }

  async getPageThumbnail(pageIndex: number, targetWidth: number = 160): Promise<string> {
    if (!this.pdfDoc) return '';
    try {
      const page = await this.pdfDoc.getPage(pageIndex + 1);
      const initialViewport = page.getViewport({ scale: 1.0 });
      const scale = targetWidth / initialViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return '';
      await page.render({ canvasContext: ctx, viewport, annotationMode: AnnotationMode.DISABLE }).promise;
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (err) {
      console.error('Thumbnail error page', pageIndex, err);
      return '';
    }
  }
}

export interface DetectedPDFTextLine {
  id: string;
  pageIndex: number;
  text: string;
  x: number;
  y: number;
  baselineY: number;
  ascent: number;
  descent: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  fontWeight?: string | number;
  color?: string;
  backgroundColor?: string;
}

export const pdfRenderer = new PDFRendererService();

