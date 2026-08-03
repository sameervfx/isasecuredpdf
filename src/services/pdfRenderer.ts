import { getDocument, GlobalWorkerOptions, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

export class PDFRendererService {
  private pdfDoc: PDFDocumentProxy | null = null;
  private workerReady = false;

  private ensureWorker() {
    if (!this.workerReady) {
      GlobalWorkerOptions.workerSrc = workerUrl;
      this.workerReady = true;
    }
  }

  async loadDocument(data: Uint8Array): Promise<PDFDocumentProxy> {
    this.ensureWorker();
    const copyData = data.slice(0);
    const loadingTask = getDocument({ data: copyData });
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
    rotationAngle: number = 0
  ): Promise<{ width: number; height: number; originalWidth: number; originalHeight: number }> {
    if (!this.pdfDoc) throw new Error('PDF document not loaded');

    const page = await this.pdfDoc.getPage(pageIndex + 1);
    const totalRotation = (page.rotate + rotationAngle) % 360;
    const viewport = page.getViewport({ scale, rotation: totalRotation });
    const dpr = Math.max(window.devicePixelRatio || 1, 2.0);
    const scaledViewport = page.getViewport({ scale: scale * dpr, rotation: totalRotation });

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Could not get 2d canvas context');

    canvas.width = Math.floor(scaledViewport.width);
    canvas.height = Math.floor(scaledViewport.height);
    canvas.style.width = `${Math.floor(viewport.width)}px`;
    canvas.style.height = `${Math.floor(viewport.height)}px`;

    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
    }).promise;

    const unscaledViewport = page.getViewport({ scale: 1.0, rotation: totalRotation });
    return {
      width: viewport.width,
      height: viewport.height,
      originalWidth: unscaledViewport.width,
      originalHeight: unscaledViewport.height,
    };
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
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';
      await page.render({ canvasContext: ctx, viewport }).promise;
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (err) {
      console.error('Thumbnail error page', pageIndex, err);
      return '';
    }
  }
}

export const pdfRenderer = new PDFRendererService();
