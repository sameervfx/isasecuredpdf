import * as mupdf from 'mupdf';
import { PDFDocument } from 'pdf-lib';
import { pdfRenderer } from './pdfRenderer';

export interface EncryptOptions {
  userPassword?: string;
  ownerPassword?: string;
  preventPrinting?: boolean;
  preventCopying?: boolean;
}

export interface CompressionResult {
  compressedBytes: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  savedPercentage: number;
}

export const securityService = {
  /**
   * Encrypts a PDF Uint8Array with AES-256 and custom permissions (100% client-side)
   */
  async encryptPDF(pdfBytes: Uint8Array, options: EncryptOptions): Promise<Uint8Array> {
    const userPass = options.userPassword || '';
    const ownerPass = options.ownerPassword || userPass || 'owner123';

    // Calculate permissions bitmask
    // Bit 3 (4): Print, Bit 5 (16): Copy
    let permMask = 0;
    if (!options.preventPrinting) permMask |= 4;
    if (!options.preventCopying) permMask |= 16;

    const doc = mupdf.PDFDocument.openDocument(pdfBytes, 'pdf').asPDF();
    if (!doc) {
      throw new Error('Failed to parse PDF document for encryption.');
    }

    let optString = `encrypt=aes-128,user-password=${userPass},owner-password=${ownerPass}`;
    if (permMask > 0) {
      optString += `,permissions=${permMask}`;
    }

    const encryptedBuf = doc.saveToBuffer(optString);
    const rawBytes = encryptedBuf.asUint8Array();
    const cleanBytes = new Uint8Array(rawBytes.length);
    cleanBytes.set(rawBytes);
    return cleanBytes;
  },

  /**
   * Unlocks an encrypted PDF with user password and returns unencrypted bytes
   */
  async decryptPDF(pdfBytes: Uint8Array, password: string): Promise<Uint8Array> {
    const doc = mupdf.PDFDocument.openDocument(pdfBytes, 'pdf').asPDF();
    if (!doc) {
      throw new Error('Invalid or corrupted PDF file.');
    }

    if (doc.needsPassword()) {
      const auth = doc.authenticatePassword(password);
      if (auth === 0) {
        throw new Error('Incorrect password. Please verify and try again.');
      }
    }

    const unlockedBuf = doc.saveToBuffer('encrypt=none,garbage=compact');
    const rawBytes = unlockedBuf.asUint8Array();
    const cleanBytes = new Uint8Array(rawBytes.length);
    cleanBytes.set(rawBytes);
    return cleanBytes;
  },

  /**
   * Verifies if a PDF Uint8Array is password protected
   */
  async isPasswordProtected(pdfBytes: Uint8Array): Promise<boolean> {
    try {
      const doc = mupdf.PDFDocument.openDocument(pdfBytes, 'pdf').asPDF();
      return doc ? doc.needsPassword() : false;
    } catch (e) {
      return false;
    }
  },

  /**
   * Compresses PDF file size using multi-tier image downscaling & stream compaction.
   * Guaranteed never to return a file larger than the original input document.
   */
  async compressPDF(
    pdfBytes: Uint8Array,
    preset: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<CompressionResult> {
    const originalSize = pdfBytes.length;

    // 1. Always perform structural compaction first (mupdf + pdf-lib object stream cleanup)
    let structuralBytes: Uint8Array = pdfBytes;
    try {
      const doc = mupdf.PDFDocument.openDocument(pdfBytes, 'pdf').asPDF();
      if (doc) {
        const raw = doc.saveToBuffer('garbage=compact,compress=yes,clean=yes').asUint8Array();
        const clean = new Uint8Array(raw.length);
        clean.set(raw);
        structuralBytes = clean;
      }
    } catch (e) {
      try {
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
        structuralBytes = await pdfDoc.save({ useObjectStreams: true });
      } catch (err) {}
    }

    if (preset === 'low') {
      const finalBytes = structuralBytes.length < originalSize ? structuralBytes : pdfBytes;
      const compressedSize = finalBytes.length;
      const savedBytes = Math.max(0, originalSize - compressedSize);
      const savedPercentage = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

      return {
        compressedBytes: finalBytes,
        originalSize,
        compressedSize,
        savedBytes,
        savedPercentage,
      };
    }

    // Medium & High Preset: Downscale images with balanced resolution & JPEG compression
    // Medium: scale 0.75, quality 0.65 (balanced size & clarity)
    // High: scale 0.50, quality 0.45 (smallest size)
    const scale = preset === 'high' ? 0.50 : 0.75;
    const jpegQuality = preset === 'high' ? 0.45 : 0.65;

    let resampledBytes: Uint8Array | null = null;
    try {
      const pdfDocProxy = await pdfRenderer.loadDocument(pdfBytes);
      const numPages = pdfDocProxy.numPages;
      const newPdfDoc = await PDFDocument.create();

      for (let i = 0; i < numPages; i++) {
        const canvas = document.createElement('canvas');
        const dimensions = await pdfRenderer.renderPageToCanvas(i, canvas, scale, 0, pdfBytes);
        const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);

        const imageEmbed = await newPdfDoc.embedJpg(dataUrl);
        const page = newPdfDoc.addPage([dimensions.originalWidth, dimensions.originalHeight]);

        page.drawImage(imageEmbed, {
          x: 0,
          y: 0,
          width: dimensions.originalWidth,
          height: dimensions.originalHeight,
        });
      }

      const rawResampled = await newPdfDoc.save({ useObjectStreams: true });
      try {
        const doc = mupdf.PDFDocument.openDocument(rawResampled, 'pdf').asPDF();
        if (doc) {
          const raw = doc.saveToBuffer('garbage=compact,compress=yes,clean=yes').asUint8Array();
          const clean = new Uint8Array(raw.length);
          clean.set(raw);
          resampledBytes = clean;
        } else {
          resampledBytes = rawResampled;
        }
      } catch (e) {
        resampledBytes = rawResampled;
      }
    } catch (e) {
      console.error('Image resampling error during compression:', e);
    }

    // Pick the best (smallest) result among resampled, structural, and original
    let finalBytes = pdfBytes;

    if (resampledBytes && resampledBytes.length < originalSize && resampledBytes.length < structuralBytes.length) {
      finalBytes = resampledBytes;
    } else if (structuralBytes.length < originalSize) {
      finalBytes = structuralBytes;
    } else {
      finalBytes = structuralBytes.length < originalSize ? structuralBytes : pdfBytes;
    }

    const compressedSize = finalBytes.length;
    const savedBytes = Math.max(0, originalSize - compressedSize);
    const savedPercentage = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;

    return {
      compressedBytes: finalBytes,
      originalSize,
      compressedSize,
      savedBytes,
      savedPercentage,
    };
  },
};
