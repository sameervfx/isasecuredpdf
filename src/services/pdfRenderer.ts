import { getDocument, GlobalWorkerOptions, PDFDocumentProxy, AnnotationMode } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

export class PDFRendererService {
  private pdfDoc: PDFDocumentProxy | null = null;
  private workerReady = false;
  private activeRenderTasks: Map<HTMLCanvasElement, any> = new Map();

  private ensureWorker() {
    if (!this.workerReady) {
      try {
        // Primary bundled worker asset URL with cdnjs fallback for production web servers
        GlobalWorkerOptions.workerSrc = workerUrl || 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      } catch (e) {
        GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
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
    const copyData = data.slice(0);
    const loadingTask = getDocument({ data: copyData, password });
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

    // Balanced DPR calculation: high-DPI crispness without massive memory bloat
    const deviceDPR = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    // When scale is already large (>= 1.5), vector coordinates are magnified, so DPR can be capped to 1.5
    const dpr = scale >= 1.5 ? Math.min(deviceDPR, 1.5) : Math.min(deviceDPR, 2.0);
    const scaledViewport = page.getViewport({ scale: scale * dpr, rotation: totalRotation });

    const targetWidth = Math.max(1, Math.floor(scaledViewport.width));
    const targetHeight = Math.max(1, Math.floor(scaledViewport.height));

    // DOUBLE BUFFERING: Render into an offscreen scratch canvas first!
    // The currently displayed canvas on the screen remains completely intact and visible.
    // It NEVER goes blank white while rendering is in progress.
    const offscreen = document.createElement('canvas');
    offscreen.width = targetWidth;
    offscreen.height = targetHeight;
    const offscreenCtx = offscreen.getContext('2d', { alpha: false });
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
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }
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
      await page.render({ canvasContext: ctx, viewport, annotationMode: AnnotationMode.DISABLE }).promise;
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (err) {
      console.error('Thumbnail error page', pageIndex, err);
      return '';
    }
  }
}

export const pdfRenderer = new PDFRendererService();
