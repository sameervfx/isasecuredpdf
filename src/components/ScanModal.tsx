import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Camera, RefreshCw, Trash2, Check, Download, Image as ImageIcon, Sparkles, Sliders, 
  ShieldCheck, ArrowRight, RotateCw, QrCode, Smartphone, Crop, Scissors, Wand2, Maximize2, 
  RotateCcw, FileText, Eye, Sun, Contrast as ContrastIcon, SlidersHorizontal, Plus, ArrowLeft,
  Timer, Focus, Crosshair, CheckCircle2, Save, Eraser, Hand, ChevronLeft, ChevronRight
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { applyStandardMetadata } from '../utils/pdfMetadata';
import { downloadFile } from '../utils/mobileFileDownload';
import { ExportSaveModal, ExportItem } from './ExportSaveModal';
import { checkAndConsumeMonthlyQuota, FREE_MONTHLY_DOC_LIMIT } from '../utils/monthlyUsageLimit';
import { isNativeMobileApp } from '../utils/platform';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (pdfBytes: Uint8Array, fileName: string) => void;
  isProActive?: boolean;
  onRequirePro?: (msg?: string) => void;
}

interface ScannedPage {
  id: string;
  dataUrl: string;
  originalDataUrl: string;
  filter: 'flatten' | 'bw' | 'color' | 'grayscale' | 'none';
  rotation: number;
  brightness: number;
  contrast: number;
  midTone: number;
  cropLeft: number;
  cropRight: number;
  cropTop: number;
  cropBottom: number;
  corners?: { tl: Point; tr: Point; br: Point; bl: Point };
  removeShadow?: boolean;
  removeFingers?: boolean;
}

interface Point {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
}

const DEFAULT_5PCT_CORNERS = {
  tl: { x: 5, y: 5 },
  tr: { x: 95, y: 5 },
  br: { x: 95, y: 95 },
  bl: { x: 5, y: 95 },
};

/**
 * Intelligent client-side document corner & paper edge detector (0-100%).
 * Uses Otsu thresholding + extremal quad search on downsampled canvas. Runs in < 10ms.
 * If contrast detection is confused or low-contrast, cleanly defaults to 5% uniform trim.
 */
function autoDetectDocumentCorners(
  source: HTMLCanvasElement | HTMLImageElement
): { tl: Point; tr: Point; br: Point; bl: Point } {
  try {
    const origW = 'naturalWidth' in source ? (source.naturalWidth || source.width) : source.width;
    const origH = 'naturalHeight' in source ? (source.naturalHeight || source.height) : source.height;
    if (!origW || !origH) {
      return DEFAULT_5PCT_CORNERS;
    }

    // Downsample to max dimension 250px for fast <10ms client-side processing
    const maxDim = 250;
    const scale = Math.min(1, maxDim / Math.max(origW, origH));
    const w = Math.max(30, Math.round(origW * scale));
    const h = Math.max(30, Math.round(origH * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return DEFAULT_5PCT_CORNERS;
    }

    ctx.drawImage(source, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;

    // 1. Calculate luminance map
    const lums = new Uint8Array(w * h);
    let totalLum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      lums[p] = lum;
      totalLum += lum;
    }

    // 2. Otsu thresholding to distinguish document from background
    const hist = new Int32Array(256);
    for (let i = 0; i < lums.length; i++) hist[lums[i]]++;

    let sumB = 0;
    let wB = 0;
    let maxVariance = 0;
    let threshold = 128;
    const totalPixels = lums.length;

    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (wB === 0) continue;
      const wF = totalPixels - wB;
      if (wF === 0) break;

      sumB += t * hist[t];
      const mB = sumB / wB;
      const mF = (totalLum - sumB) / wF;
      const between = wB * wF * (mB - mF) * (mB - mF);
      if (between > maxVariance) {
        maxVariance = between;
        threshold = t;
      }
    }

    // Compare center vs border to detect paper vs darker desk
    let borderLumSum = 0;
    let borderCount = 0;
    for (let x = 0; x < w; x++) {
      borderLumSum += lums[x] + lums[(h - 1) * w + x];
      borderCount += 2;
    }
    for (let y = 1; y < h - 1; y++) {
      borderLumSum += lums[y * w] + lums[y * w + (w - 1)];
      borderCount += 2;
    }
    const avgBorder = borderLumSum / borderCount;

    let centerLumSum = 0;
    let centerCount = 0;
    const cxStart = Math.floor(w * 0.25), cxEnd = Math.floor(w * 0.75);
    const cyStart = Math.floor(h * 0.25), cyEnd = Math.floor(h * 0.75);
    for (let y = cyStart; y < cyEnd; y++) {
      for (let x = cxStart; x < cxEnd; x++) {
        centerLumSum += lums[y * w + x];
        centerCount++;
      }
    }
    const avgCenter = centerLumSum / centerCount;

    // Check contrast difference: if center and border are too similar (< 16 diff),
    // contrast detection is confused. Default cleanly to 5% uniform trim!
    const contrastDiff = Math.abs(avgCenter - avgBorder);
    if (contrastDiff < 16) {
      return DEFAULT_5PCT_CORNERS;
    }

    const isDocBrighter = avgCenter >= avgBorder;
    const isDocumentPixel = (val: number) => (isDocBrighter ? val >= threshold - 12 : val <= threshold + 12);

    // 3. Find bounding box of the document
    let minX = w, maxX = 0, minY = h, maxY = 0;
    let docCount = 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (isDocumentPixel(lums[y * w + x])) {
          docCount++;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    const coverage = docCount / totalPixels;
    // If detected document covers almost full frame (> 92%) or is negligible (< 18%), default cleanly to 5% corners
    if (coverage > 0.92 || coverage < 0.18 || minX >= maxX || minY >= maxY) {
      return DEFAULT_5PCT_CORNERS;
    }

    // 4. Find the 4 extremal corners closest to the 4 corners of the frame
    let bestTL = { x: minX, y: minY }, minScoreTL = Infinity;
    let bestTR = { x: maxX, y: minY }, minScoreTR = Infinity;
    let bestBR = { x: maxX, y: maxY }, minScoreBR = Infinity;
    let bestBL = { x: minX, y: maxY }, minScoreBL = Infinity;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (isDocumentPixel(lums[y * w + x])) {
          const sTL = x + y;
          if (sTL < minScoreTL) { minScoreTL = sTL; bestTL = { x, y }; }

          const sTR = (w - x) + y;
          if (sTR < minScoreTR) { minScoreTR = sTR; bestTR = { x, y }; }

          const sBR = (w - x) + (h - y);
          if (sBR < minScoreBR) { minScoreBR = sBR; bestBR = { x, y }; }

          const sBL = x + (h - y);
          if (sBL < minScoreBL) { minScoreBL = sBL; bestBL = { x, y }; }
        }
      }
    }

    const toPct = (pt: { x: number; y: number }) => ({
      x: Math.max(0, Math.min(100, Math.round((pt.x / w) * 100))),
      y: Math.max(0, Math.min(100, Math.round((pt.y / h) * 100))),
    });

    const cTL = toPct(bestTL);
    const cTR = toPct(bestTR);
    const cBR = toPct(bestBR);
    const cBL = toPct(bestBL);

    const wTop = cTR.x - cTL.x;
    const wBottom = cBR.x - cBL.x;
    const hLeft = cBL.y - cTL.y;
    const hRight = cBR.y - cTR.y;
    const topSkew = Math.abs(cTL.y - cTR.y);
    const bottomSkew = Math.abs(cBL.y - cBR.y);
    const leftSkew = Math.abs(cTL.x - cBL.x);
    const rightSkew = Math.abs(cTR.x - cBR.x);

    // Validate that the detected corners form a clear, non-confused quadrilateral:
    // Minimum 25% width/height, sane order (TL left of TR, etc.), and max 22% perspective skew
    const isValidQuad =
      cTL.x < cTR.x &&
      cBL.x < cBR.x &&
      cTL.y < cBL.y &&
      cTR.y < cBR.y &&
      wTop >= 25 &&
      wBottom >= 25 &&
      hLeft >= 25 &&
      hRight >= 25 &&
      topSkew <= 22 &&
      bottomSkew <= 22 &&
      leftSkew <= 22 &&
      rightSkew <= 22;

    if (isValidQuad) {
      return { tl: cTL, tr: cTR, br: cBR, bl: cBL };
    }

    // Fallback: If contrast detection gets confused or corners are irregular,
    // do not scatter corners here and there - cleanly default to 5% uniform trim!
    return DEFAULT_5PCT_CORNERS;
  } catch (e) {
    return DEFAULT_5PCT_CORNERS;
  }
}

/**
 * Web & Desktop Webcam Book / Document Page Boundary Detector (0-100%).
 * Specifically engineered for holding up a book or document page in front of a 16:9 webcam,
 * where room background (windows, head/ceiling at top, walls on sides) confuses global Otsu.
 * Scans directional color/luminance gradients along the 4 edges to lock onto the top, bottom,
 * left, and right boundaries of the held book/document page.
 */
function autoDetectBookOrDocumentWebcamPage(
  source: HTMLCanvasElement | HTMLImageElement
): { tl: Point; tr: Point; br: Point; bl: Point } {
  try {
    const origW = 'naturalWidth' in source ? (source.naturalWidth || source.width) : source.width;
    const origH = 'naturalHeight' in source ? (source.naturalHeight || source.height) : source.height;
    if (!origW || !origH) {
      return DEFAULT_5PCT_CORNERS;
    }

    const w = 240;
    const h = 150;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return DEFAULT_5PCT_CORNERS;
    }

    ctx.drawImage(source, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;

    const getRgb = (x: number, y: number): [number, number, number] => {
      const cx = Math.max(0, Math.min(w - 1, x));
      const cy = Math.max(0, Math.min(h - 1, y));
      const idx = (cy * w + cx) * 4;
      return [data[idx], data[idx + 1], data[idx + 2]];
    };

    // 1. TOP HORIZONTAL EDGE: Scan downward y in [7%..42%] across the middle X band [28%..72%]
    // Captures the top edge of a held book/document below the ceiling/user's head
    let bestTopY = Math.round(h * 0.16);
    let bestTopScore = 0;
    const xStart = Math.round(w * 0.28);
    const xEnd = Math.round(w * 0.72);
    const xSpan = Math.max(1, xEnd - xStart);

    for (let y = Math.round(h * 0.07); y <= Math.round(h * 0.42); y++) {
      let gradSum = 0;
      let hits = 0;
      for (let x = xStart; x < xEnd; x++) {
        const [r1, g1, b1] = getRgb(x, y - 2);
        const [r2, g2, b2] = getRgb(x, y + 2);
        const dy = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        gradSum += dy;
        if (dy > 28) hits++;
      }
      const hitRatio = hits / xSpan;
      const score = (gradSum / xSpan) * Math.pow(hitRatio, 1.5);
      if (score > bestTopScore) {
        bestTopScore = score;
        bestTopY = y;
      }
    }

    // 2. BOTTOM HORIZONTAL EDGE: Scan y in [58%..97%] across the middle X band [28%..72%]
    let bestBotY = Math.round(h * 0.96);
    let bestBotScore = 0;
    for (let y = Math.round(h * 0.58); y <= Math.round(h * 0.97); y++) {
      let gradSum = 0;
      let hits = 0;
      for (let x = xStart; x < xEnd; x++) {
        const [r1, g1, b1] = getRgb(x, y - 2);
        const [r2, g2, b2] = getRgb(x, y + 2);
        const dy = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        gradSum += dy;
        if (dy > 28) hits++;
      }
      const hitRatio = hits / xSpan;
      const score = (gradSum / xSpan) * Math.pow(hitRatio, 1.5);
      if (score > bestBotScore) {
        bestBotScore = score;
        bestBotY = y;
      }
    }

    // 3. LEFT VERTICAL EDGE: Scan x in [4%..42%] across the detected vertical span [bestTopY..bestBotY]
    const yStart = Math.max(Math.round(h * 0.10), bestTopY + 2);
    const yEnd = Math.min(Math.round(h * 0.92), bestBotY - 2);
    const ySpan = Math.max(1, yEnd - yStart);

    let bestLeftX = Math.round(w * 0.16);
    let bestLeftScore = 0;
    for (let x = Math.round(w * 0.04); x <= Math.round(w * 0.42); x++) {
      let gradSum = 0;
      let hits = 0;
      for (let y = yStart; y < yEnd; y++) {
        const [r1, g1, b1] = getRgb(x - 2, y);
        const [r2, g2, b2] = getRgb(x + 2, y);
        const dx = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        gradSum += dx;
        if (dx > 28) hits++;
      }
      const hitRatio = hits / ySpan;
      const score = (gradSum / ySpan) * Math.pow(hitRatio, 1.5);
      if (score > bestLeftScore) {
        bestLeftScore = score;
        bestLeftX = x;
      }
    }

    // 4. RIGHT VERTICAL EDGE: Scan x in [58%..96%] across the detected vertical span [bestTopY..bestBotY]
    let bestRightX = Math.round(w * 0.84);
    let bestRightScore = 0;
    for (let x = Math.round(w * 0.58); x <= Math.round(w * 0.96); x++) {
      let gradSum = 0;
      let hits = 0;
      for (let y = yStart; y < yEnd; y++) {
        const [r1, g1, b1] = getRgb(x - 2, y);
        const [r2, g2, b2] = getRgb(x + 2, y);
        const dx = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        gradSum += dx;
        if (dx > 28) hits++;
      }
      const hitRatio = hits / ySpan;
      const score = (gradSum / ySpan) * Math.pow(hitRatio, 1.5);
      if (score > bestRightScore) {
        bestRightScore = score;
        bestRightX = x;
      }
    }

    const topPct = Math.max(0, Math.min(40, Math.round((bestTopY / h) * 100)));
    const botPct = Math.max(60, Math.min(100, Math.round((bestBotY / h) * 100)));
    const leftPct = Math.max(0, Math.min(40, Math.round((bestLeftX / w) * 100)));
    const rightPct = Math.max(60, Math.min(100, Math.round((bestRightX / w) * 100)));

    // Verify reasonable page dimensions (at least 25% width and 30% height)
    if (rightPct - leftPct >= 25 && botPct - topPct >= 30 && bestTopScore > 12) {
      return {
        tl: { x: leftPct, y: topPct },
        tr: { x: rightPct, y: topPct },
        br: { x: rightPct, y: botPct },
        bl: { x: leftPct, y: botPct },
      };
    }

    // Fallback to standard Otsu detector if directional gradient is weak
    return autoDetectDocumentCorners(source);
  } catch (e) {
    return DEFAULT_5PCT_CORNERS;
  }
}


/**
 * Mathematically exact 4-point projective homography perspective unwarping.
 * Transforms an arbitrary perspective quadrilateral (e.g. document photographed on a table)
 * into a straight, upright, flat rectangular document image like CamScanner.
 */
function warpAndFlattenQuadrilateral(
  sourceImg: HTMLImageElement,
  corners: { tl: Point; tr: Point; br: Point; bl: Point }
): HTMLCanvasElement {
  const origW = sourceImg.naturalWidth || sourceImg.width;
  const origH = sourceImg.naturalHeight || sourceImg.height;

  // 1. Source quad coordinates in absolute image pixels
  const p0 = { x: (corners.tl.x / 100) * origW, y: (corners.tl.y / 100) * origH }; // Top-Left
  const p1 = { x: (corners.tr.x / 100) * origW, y: (corners.tr.y / 100) * origH }; // Top-Right
  const p2 = { x: (corners.br.x / 100) * origW, y: (corners.br.y / 100) * origH }; // Bottom-Right
  const p3 = { x: (corners.bl.x / 100) * origW, y: (corners.bl.y / 100) * origH }; // Bottom-Left

  // 2. Compute target rectangular dimensions based on Euclidean edge lengths
  const wTop = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  const wBot = Math.hypot(p2.x - p3.x, p2.y - p3.y);
  const rawW = Math.max(50, Math.round(Math.max(wTop, wBot)));

  const hLeft = Math.hypot(p3.x - p0.x, p3.y - p0.y);
  const hRight = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const rawH = Math.max(50, Math.round(Math.max(hLeft, hRight)));

  // Fast, Butter-Smooth Flattening: Cap max dimension to 1600px for instant <50ms processing without jerkiness
  const maxDim = 1600;
  let targetW = rawW;
  let targetH = rawH;
  if (targetW > maxDim || targetH > maxDim) {
    const scale = maxDim / Math.max(targetW, targetH);
    targetW = Math.max(50, Math.round(targetW * scale));
    targetH = Math.max(50, Math.round(targetH * scale));
  }

  // 3. Read source image pixels onto a canvas
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = origW;
  srcCanvas.height = origH;
  const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = targetW;
    fallbackCanvas.height = targetH;
    return fallbackCanvas;
  }
  srcCtx.drawImage(sourceImg, 0, 0);
  const srcImgData = srcCtx.getImageData(0, 0, origW, origH);
  const srcData = srcImgData.data;

  // 4. Create target destination canvas
  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = targetW;
  dstCanvas.height = targetH;
  const dstCtx = dstCanvas.getContext('2d', { willReadFrequently: true });
  if (!dstCtx) return dstCanvas;

  const dstImgData = dstCtx.createImageData(targetW, targetH);
  const dstData = dstImgData.data;

  // 5. Solve 3x3 projective homography matrix mapping unit square [0,1]x[0,1] to source quad
  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const sx = p0.x - p1.x + p2.x - p3.x;

  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;
  const sy = p0.y - p1.y + p2.y - p3.y;

  const det = dx1 * dy2 - dy1 * dx2;
  const a31 = Math.abs(det) > 1e-7 ? (sx * dy2 - sy * dx2) / det : 0;
  const a32 = Math.abs(det) > 1e-7 ? (dx1 * sy - dy1 * sx) / det : 0;

  const a11 = p1.x - p0.x + a31 * p1.x;
  const a12 = p3.x - p0.x + a32 * p3.x;
  const a13 = p0.x;

  const a21 = p1.y - p0.y + a31 * p1.y;
  const a22 = p3.y - p0.y + a32 * p3.y;
  const a23 = p0.y;

  const invW = 1 / targetW;
  const invH = 1 / targetH;

  // 6. Fast backward projective mapping with bilinear interpolation
  let dstIdx = 0;
  for (let y = 0; y < targetH; y++) {
    const v = y * invH;
    const a32_v_1 = a32 * v + 1;
    const a12_v_a13 = a12 * v + a13;
    const a22_v_a23 = a22 * v + a23;

    for (let x = 0; x < targetW; x++) {
      const u = x * invW;
      const d = a31 * u + a32_v_1;
      const invD = Math.abs(d) > 1e-7 ? 1 / d : 1;
      const sx_val = (a11 * u + a12_v_a13) * invD;
      const sy_val = (a21 * u + a22_v_a23) * invD;

      const x0 = Math.floor(sx_val);
      const y0 = Math.floor(sy_val);

      if (x0 >= 0 && x0 < origW - 1 && y0 >= 0 && y0 < origH - 1) {
        const fx = sx_val - x0;
        const fy = sy_val - y0;
        const fx1 = 1 - fx;
        const fy1 = 1 - fy;
        const w00 = fx1 * fy1;
        const w10 = fx * fy1;
        const w01 = fx1 * fy;
        const w11 = fx * fy;

        const idx00 = (y0 * origW + x0) << 2;
        const idx10 = idx00 + 4;
        const idx01 = idx00 + (origW << 2);
        const idx11 = idx01 + 4;

        dstData[dstIdx]     = (srcData[idx00] * w00 + srcData[idx10] * w10 + srcData[idx01] * w01 + srcData[idx11] * w11) | 0;
        dstData[dstIdx + 1] = (srcData[idx00 + 1] * w00 + srcData[idx10 + 1] * w10 + srcData[idx01 + 1] * w01 + srcData[idx11 + 1] * w11) | 0;
        dstData[dstIdx + 2] = (srcData[idx00 + 2] * w00 + srcData[idx10 + 2] * w10 + srcData[idx01 + 2] * w01 + srcData[idx11 + 2] * w11) | 0;
        dstData[dstIdx + 3] = 255;
      } else if (x0 >= 0 && x0 < origW && y0 >= 0 && y0 < origH) {
        const idx = (y0 * origW + x0) << 2;
        dstData[dstIdx]     = srcData[idx];
        dstData[dstIdx + 1] = srcData[idx + 1];
        dstData[dstIdx + 2] = srcData[idx + 2];
        dstData[dstIdx + 3] = 255;
      } else {
        dstData[dstIdx]     = 255;
        dstData[dstIdx + 1] = 255;
        dstData[dstIdx + 2] = 255;
        dstData[dstIdx + 3] = 255;
      }
      dstIdx += 4;
    }
  }

  dstCtx.putImageData(dstImgData, 0, 0);
  return dstCanvas;
}

const VirtualEdgeViewer: React.FC<{
  imageUrl: string;
  activeEdge: 'top' | 'bottom' | 'left' | 'right';
  cropTop: number;
  cropBottom: number;
  cropLeft: number;
  cropRight: number;
  onSelectEdge?: (edge: 'top' | 'bottom' | 'left' | 'right') => void;
}> = ({ imageUrl, activeEdge, cropTop, cropBottom, cropLeft, cropRight, onSelectEdge }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const nw = img.naturalWidth || img.width || 800;
      const nh = img.naturalHeight || img.height || 1000;

      const cw = 640;
      const ch = 180;
      canvas.width = cw;
      canvas.height = ch;

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, cw, ch);

      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(x, y, w, h, r);
        } else {
          ctx.rect(x, y, w, h);
        }
      };

      if (activeEdge === 'top') {
        const viewPct = Math.min(100, Math.max(cropTop + 18, 28));
        const srcH = (viewPct / 100) * nh;
        const srcY = 0;
        const srcX = (cropLeft / 100) * nw * 0.4;
        const srcW = nw - srcX - ((cropRight / 100) * nw * 0.4);

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, cw, ch);

        const cutY = (cropTop / viewPct) * ch;

        if (cutY > 0) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
          ctx.fillRect(0, 0, cw, cutY);

          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.fillText('TRIMMED (EXCLUDED)', 12, Math.max(16, cutY - 6));
        }

        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, cutY);
        ctx.lineTo(cw, cutY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        drawRoundRect(cw / 2 - 60, cutY - 11, 120, 22, 6);
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`✂ TOP CUT ${cropTop}%`, cw / 2, cutY);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';

        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('KEPT IN PDF ↓', cw - 12, ch - 6);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      } else if (activeEdge === 'bottom') {
        const viewPct = Math.min(100, Math.max(cropBottom + 18, 28));
        const srcH = (viewPct / 100) * nh;
        const srcY = nh - srcH;
        const srcX = (cropLeft / 100) * nw * 0.4;
        const srcW = nw - srcX - ((cropRight / 100) * nw * 0.4);

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, cw, ch);

        const cutY = ch - (cropBottom / viewPct) * ch;

        if (cutY < ch) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
          ctx.fillRect(0, cutY, cw, ch - cutY);

          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 11px system-ui, sans-serif';
          ctx.fillText('TRIMMED (EXCLUDED)', 12, Math.min(ch - 8, cutY + 16));
        }

        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(0, cutY);
        ctx.lineTo(cw, cutY);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        drawRoundRect(cw / 2 - 65, cutY - 11, 130, 22, 6);
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`✂ BOTTOM CUT ${cropBottom}%`, cw / 2, cutY);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';

        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('↑ KEPT IN PDF', cw - 12, 8);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      } else if (activeEdge === 'left') {
        const viewPct = Math.min(100, Math.max(cropLeft + 18, 28));
        const srcW = (viewPct / 100) * nw;
        const srcX = 0;
        const srcY = 0;
        const srcH = nh;

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, cw, ch);

        const cutX = (cropLeft / viewPct) * cw;

        if (cutX > 0) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
          ctx.fillRect(0, 0, cutX, ch);

          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 10px system-ui, sans-serif';
          ctx.fillText('TRIMMED', 8, 20);
        }

        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cutX, 0);
        ctx.lineTo(cutX, ch);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        drawRoundRect(Math.max(10, cutX - 50), ch / 2 - 11, 100, 22, 6);
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`✂ LEFT ${cropLeft}%`, Math.max(10, cutX - 50) + 50, ch / 2);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      } else if (activeEdge === 'right') {
        const viewPct = Math.min(100, Math.max(cropRight + 18, 28));
        const srcW = (viewPct / 100) * nw;
        const srcX = nw - srcW;
        const srcY = 0;
        const srcH = nh;

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, cw, ch);

        const cutX = cw - (cropRight / viewPct) * cw;

        if (cutX < cw) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
          ctx.fillRect(cutX, 0, cw - cutX, ch);

          ctx.fillStyle = '#f87171';
          ctx.font = 'bold 10px system-ui, sans-serif';
          ctx.fillText('TRIMMED', cutX + 8, 20);
        }

        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cutX, 0);
        ctx.lineTo(cutX, ch);
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        drawRoundRect(Math.min(cw - 110, cutX - 50), ch / 2 - 11, 100, 22, 6);
        ctx.fill();

        ctx.fillStyle = '#020617';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`✂ RIGHT ${cropRight}%`, Math.min(cw - 110, cutX - 50) + 50, ch / 2);
        ctx.textAlign = 'start';
        ctx.textBaseline = 'alphabetic';
      }
    };
    img.src = imageUrl;
  }, [imageUrl, activeEdge, cropTop, cropBottom, cropLeft, cropRight]);

  return (
    <div className="w-full bg-slate-950 rounded-2xl border-2 border-cyan-500/50 shadow-2xl overflow-hidden ring-2 ring-cyan-500/20 my-1">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-extrabold text-cyan-300 uppercase tracking-wider">
            Virtual View: {activeEdge} Edge Magnifier
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {(['top', 'bottom', 'left', 'right'] as const).map((edge) => (
            <button
              key={edge}
              type="button"
              onClick={() => onSelectEdge?.(edge)}
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition ${
                activeEdge === edge
                  ? 'bg-cyan-400 text-slate-950 shadow'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {edge}
            </button>
          ))}
        </div>
      </div>
      <div className="relative w-full h-24 sm:h-28 bg-slate-950">
        <canvas ref={canvasRef} className="w-full h-full object-cover" />
      </div>
    </div>
  );
};

const LoupeCanvas: React.FC<{
  imageUrl: string;
  targetPoint: { x: number; y: number };
  label: string;
}> = ({ imageUrl, targetPoint, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth || img.width || 1000;
      const naturalHeight = img.naturalHeight || img.height || 1000;

      const srcX = (targetPoint.x / 100) * naturalWidth;
      const srcY = (targetPoint.y / 100) * naturalHeight;

      const srcW = naturalWidth / 3;
      const srcH = naturalHeight / 3;

      const cropX = srcX - srcW / 2;
      const cropY = srcY - srcH / 2;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 120, 120);

      ctx.drawImage(img, cropX, cropY, srcW, srcH, 0, 0, 120, 120);
    };
    img.src = imageUrl;
  }, [imageUrl, targetPoint.x, targetPoint.y]);

  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full border-3 border-cyan-400 shadow-[0_0_40px_rgba(6,182,212,0.9)] overflow-hidden bg-slate-950 ring-4 ring-cyan-500/30">
      <canvas ref={canvasRef} width={120} height={120} className="w-full h-full object-cover" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-950 shadow ring-2 ring-amber-400/90 animate-pulse" />
        <div className="absolute w-10 h-[1.5px] bg-cyan-400/90 shadow" />
        <div className="absolute h-10 w-[1.5px] bg-cyan-400/90 shadow" />
      </div>
      <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase px-2 py-0.5 bg-slate-950/90 text-cyan-300 rounded-md border border-cyan-500/40 backdrop-blur z-20">
        {label} 3x Lens
      </span>
    </div>
  );
};

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  isProActive = false,
  onRequirePro,
}) => {
  // Step state: 'camera' (viewfinder) | 'edit' (post-snap crop & exposure) | 'summary' (pages tray & export)
  const [currentStep, setCurrentStep] = useState<'camera' | 'crop' | 'edit' | 'summary'>('camera');
  const [activeTab, setActiveTab] = useState<'camera' | 'qr'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [isAssembling, setIsAssembling] = useState<boolean>(false);
  const [exportFileName, setExportFileName] = useState<string>(
    `Scanned_Document_${new Date().toISOString().slice(0, 10)}`
  );

  // Dual Export Modal State (Save to Phone vs Share / Cloud Drive)
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportModalFiles, setExportModalFiles] = useState<ExportItem[]>([]);
  const [exportModalFileName, setExportModalFileName] = useState<string>('');
  const [exportModalMimeType, setExportModalMimeType] = useState<string>('');
  const [exportModalTitle, setExportModalTitle] = useState<string>('');
  const [scannerToast, setScannerToast] = useState<string | null>(null);

  // Focus & Steady Capture State
  const [focusRingPos, setFocusRingPos] = useState<{ x: number; y: number } | null>(null);
  const [isSteadyMode, setIsSteadyMode] = useState<boolean>(false);
  const [steadyCountdown, setSteadyCountdown] = useState<number | null>(null);

  // Post-snap Edit Controls (Crop, Exposure, Mid-Tone, Filter)
  const [editSubTab, setEditSubTab] = useState<'tools' | 'tone' | 'filter'>('tools');
  const [removeShadow, setRemoveShadow] = useState<boolean>(false);
  const [removeFingers, setRemoveFingers] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'flatten' | 'bw' | 'color' | 'grayscale' | 'none'>('none');
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [midTone, setMidTone] = useState<number>(0);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);

  // Crop Margin Sliders & Polygon Corners (Default 5% uniform margin)
  const [cropLeft, setCropLeft] = useState<number>(5);
  const [cropRight, setCropRight] = useState<number>(5);
  const [cropTop, setCropTop] = useState<number>(5);
  const [cropBottom, setCropBottom] = useState<number>(5);

  const [corners, setCorners] = useState<{ tl: Point; tr: Point; br: Point; bl: Point }>({
    tl: { x: 5, y: 5 },
    tr: { x: 95, y: 5 },
    br: { x: 95, y: 95 },
    bl: { x: 5, y: 95 },
  });
  const [draggingCorner, setDraggingCorner] = useState<'tl' | 'tr' | 'br' | 'bl' | null>(null);
  const [activeSlider, setActiveSlider] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const [inspectEdge, setInspectEdge] = useState<'top' | 'bottom' | 'left' | 'right'>('top');

  const [qrScanUrl, setQrScanUrl] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const liveEditCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewfinderRef = useRef<HTMLDivElement>(null);
  const isCameraStartingRef = useRef<boolean>(false);
  const cameraRequestIdRef = useRef<number>(0);

  // QR Code URL & Remote Sync Setup
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : '';

      const targetHost =
        hostname === 'localhost' || hostname === '127.0.0.1'
          ? `192.168.1.115${port}`
          : window.location.host;

      setQrScanUrl(`${protocol}//${targetHost}/?scan=1`);
    }

    const channel = new BroadcastChannel('isa_scanner_sync');
    channel.onmessage = (event) => {
      if (event.data?.type === 'REMOTE_SCAN_SYNC' && event.data?.dataUrl) {
        handleReceivedRemoteScan(event.data.dataUrl);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isa_remote_scan_data' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed?.dataUrl) {
            handleReceivedRemoteScan(parsed.dataUrl);
            localStorage.removeItem('isa_remote_scan_data');
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Guarantee Video Stream Assignment & Autoplay
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Video play error:', err);
      });
    }
  }, [stream, isCameraActive, activeTab, currentStep]);

  // Pointer Listeners for Freehand Corner Dragging
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingCorner || !cropContainerRef.current) return;
      if ('touches' in e && e.cancelable) {
        e.preventDefault();
      }
      const rect = cropContainerRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;

      const clampedX = Math.round(Math.max(0, Math.min(100, rawX)));
      const clampedY = Math.round(Math.max(0, Math.min(100, rawY)));

      setCorners((prev) => ({
        ...prev,
        [draggingCorner]: { x: clampedX, y: clampedY },
      }));
    };

    const handlePointerUp = () => {
      setDraggingCorner(null);
      setActiveSlider(null);
    };

    if (draggingCorner || activeSlider) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove, { passive: false });
      window.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [draggingCorner, activeSlider]);

  // Sync Crop Margins from Freehand Corner Dragging
  useEffect(() => {
    setCropLeft(Math.round(Math.min(corners.tl.x, corners.bl.x)));
    setCropRight(Math.round(100 - Math.max(corners.tr.x, corners.br.x)));
    setCropTop(Math.round(Math.min(corners.tl.y, corners.tr.y)));
    setCropBottom(Math.round(100 - Math.max(corners.bl.y, corners.br.y)));
  }, [corners]);

  // Live Real-Time Canvas Renderer for Post-Snap Edit Step (Race-Condition Free)
  useEffect(() => {
    let isCancelled = false;
    if (currentStep !== 'edit' || pages.length === 0 || activePageIndex >= pages.length) return;
    const page = pages[activePageIndex];
    if (!page || !page.originalDataUrl) return;

    const img = new Image();
    img.onload = () => {
      if (isCancelled) return;
      const canvas = liveEditCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      try {
        if (showOriginalComparison) {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          return;
        }

        // Live CamScanner un-warped & flattened preview
        const flattenedCanvas = warpAndFlattenQuadrilateral(img, corners);
        if (isCancelled) return;
        canvas.width = flattenedCanvas.width;
        canvas.height = flattenedCanvas.height;
        ctx.drawImage(flattenedCanvas, 0, 0);
        applyFilterAndToneToCanvas(ctx, canvas.width, canvas.height, selectedFilter, brightness, contrast, midTone, removeShadow, removeFingers);
      } catch (err) {
        console.warn('Real-time canvas render error:', err);
      }
    };
    img.src = page.originalDataUrl;

    return () => {
      isCancelled = true;
    };
  }, [currentStep, editSubTab, cropLeft, cropRight, cropTop, cropBottom, corners, activePageIndex, pages, brightness, contrast, midTone, selectedFilter, showOriginalComparison, removeShadow, removeFingers]);

  const handleReceivedRemoteScan = (rawDataUrl: string) => {
    const newPage: ScannedPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      dataUrl: rawDataUrl,
      originalDataUrl: rawDataUrl,
      filter: 'none',
      rotation: 0,
      brightness: 0,
      contrast: 0,
      midTone: 0,
      cropLeft: 5,
      cropRight: 5,
      cropTop: 5,
      cropBottom: 5,
      corners: { ...DEFAULT_5PCT_CORNERS },
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageIndex(pages.length);
    openCropStepForPage(newPage, pages.length);
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera' && currentStep === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, activeTab, currentStep]);

  // Auto-revive live camera stream when returning from native HD camera intent, minimize, or screen lock
  useEffect(() => {
    const handleResume = () => {
      if (isOpen && activeTab === 'camera' && currentStep === 'camera') {
        const v = videoRef.current;
        const tracks = stream ? stream.getVideoTracks() : [];
        const hasDeadTracks = tracks.length === 0 || tracks.some((t) => t.readyState === 'ended' || !t.enabled);
        if (hasDeadTracks || !isCameraActive || (v && v.paused)) {
          startCamera();
        }
      }
    };

    window.addEventListener('focus', handleResume);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(handleResume, 300); // 300ms delay to let OS camera hardware release cleanly from native app
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [isOpen, activeTab, currentStep, stream, isCameraActive]);

  const startCamera = async () => {
    setCameraError('');
    if (isCameraStartingRef.current) return;
    isCameraStartingRef.current = true;
    const currentReqId = ++cameraRequestIdRef.current;

    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          focusMode: { ideal: 'continuous' } as any,
        } as any,
        audio: false,
      });

      // If camera was stopped or another request was initiated while awaiting, discard stream immediately
      if (cameraRequestIdRef.current !== currentReqId) {
        mediaStream.getTracks().forEach((t) => t.stop());
        return;
      }

      // Apply continuous auto-focus track constraints if supported
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack && typeof videoTrack.applyConstraints === 'function') {
        try {
          const caps = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
          if (caps.focusMode && caps.focusMode.includes('continuous')) {
            await videoTrack.applyConstraints({
              advanced: [{ focusMode: 'continuous' } as any],
            });
          }
        } catch (e) {
          console.warn('Advanced focus constraint setting error:', e);
        }
      }

      setStream(mediaStream);
      setIsCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      if (cameraRequestIdRef.current === currentReqId) {
        console.warn('Camera access error:', err);
        setIsCameraActive(false);
        const isHttp = window.location.protocol === 'http:' && window.location.hostname !== 'localhost';
        if (isHttp) {
          setCameraError(
            'Mobile browsers restrict live camera on unencrypted HTTP IP. Tap "Snap Photo with Camera App" below!'
          );
        } else {
          setCameraError('Live camera stream is unavailable. Tap "Snap Photo with Camera App" below!');
        }
      }
    } finally {
      isCameraStartingRef.current = false;
    }
  };

  const stopCamera = () => {
    cameraRequestIdRef.current++; // Invalidate any in-flight request
    isCameraStartingRef.current = false;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Interactive Tap to Focus Handler (with auto-unfreeze)
  const handleTapToFocus = async (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const tracks = stream ? stream.getVideoTracks() : [];
    if (!isCameraActive || !stream || tracks.length === 0 || tracks.some((t) => t.readyState === 'ended') || (v && v.paused)) {
      startCamera();
      return;
    }

    if (!viewfinderRef.current || !stream) return;
    const rect = viewfinderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setFocusRingPos({ x, y });

    // Re-trigger hardware camera focus if track supports constraints
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack && typeof videoTrack.applyConstraints === 'function') {
      try {
        await videoTrack.applyConstraints({
          advanced: [{ focusMode: 'continuous' } as any],
        });
      } catch (err) {}
    }

    setTimeout(() => {
      setFocusRingPos(null);
    }, 1500);
  };

  // Trigger Capture with optional Steady 2s Countdown
  const triggerShutterCapture = () => {
    if (!isCameraActive) return;

    if (isSteadyMode) {
      setSteadyCountdown(2);
      const timer = setInterval(() => {
        setSteadyCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            capturePhoto();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      capturePhoto();
    }
  };

  // Filter, Shadow, Finger & Tone Processing Engine
  const applyFilterAndToneToCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    filter: 'flatten' | 'bw' | 'color' | 'grayscale' | 'none',
    bVal: number,
    cVal: number,
    mVal: number,
    optRemoveShadow?: boolean,
    optRemoveFingers?: boolean
  ) => {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    // 0. Connected-Component Finger & Thumb Removal (Zero-Speckle, Ink-Safe)
    if (optRemoveFingers) {
      // 1. Sample representative paper background color from the interior
      let paperR = 245, paperG = 242, paperB = 238;
      let paperCount = 0;
      for (let y = Math.round(height * 0.25); y < Math.round(height * 0.75); y += 6) {
        for (let x = Math.round(width * 0.3); x < Math.round(width * 0.7); x += 6) {
          const idx = (y * width + x) * 4;
          const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          if (lum > 170) {
            paperR += data[idx];
            paperG += data[idx + 1];
            paperB += data[idx + 2];
            paperCount++;
          }
        }
      }
      if (paperCount > 0) {
        paperR = Math.round(paperR / paperCount);
        paperG = Math.round(paperG / paperCount);
        paperB = Math.round(paperB / paperCount);
      }

      // 2. Identify candidate skin pixels strictly on side/bottom holding margins
      // (Top 18% of document is 100% immune: headers, logos, test strips never modified)
      const candidateMask = new Uint8Array(width * height);
      const minY = Math.round(height * 0.18);
      const maxY = Math.round(height * 0.95);

      for (let y = minY; y < maxY; y++) {
        for (let x = 0; x < width; x++) {
          const isLeft = x < width * 0.22;
          const isRight = x > width * 0.78;
          const isBottom = y > height * 0.85;
          if (!isLeft && !isRight && !isBottom) continue;

          const idx = (y * width + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          // STRICT INK SAFETY: Any printed text ink is NEVER considered skin!
          if (lum < 90 || (r < 80 && g < 80 && b < 80)) continue;

          // Precise skin discriminator:
          const isSkin = (
            (r > 115 && g > 55 && b > 35 && (r - g) > 30 && (r - b) > 42 && (r / (g + 0.1)) > 1.22) ||
            (r > 175 && g > 115 && (r - g) > 24 && (r - b) > 40)
          );

          if (isSkin) {
            candidateMask[y * width + x] = 1;
          }
        }
      }

      // 3. Connected-Component Flood Fill from outer border seeds
      // A finger is a continuous blob connected to the perimeter. Isolated pixels are rejected!
      const visited = new Uint8Array(width * height);
      const fingerMask = new Uint8Array(width * height);
      const queue = new Int32Array(width * height);

      for (let y = minY; y < maxY; y++) {
        // Left border seeds (x = 0 to 2)
        for (let sx = 0; sx <= 2; sx++) {
          const seedIdx = y * width + sx;
          if (candidateMask[seedIdx] === 1 && visited[seedIdx] === 0) {
            let qHead = 0, qTail = 0;
            queue[qTail++] = seedIdx;
            visited[seedIdx] = 1;
            const blob: number[] = [];

            while (qHead < qTail) {
              const curr = queue[qHead++];
              blob.push(curr);
              const cy = Math.floor(curr / width);
              const cx = curr % width;

              const neighbors = [
                cy > 0 ? (cy - 1) * width + cx : -1,
                cy < height - 1 ? (cy + 1) * width + cx : -1,
                cx > 0 ? cy * width + (cx - 1) : -1,
                cx < width - 1 ? cy * width + (cx + 1) : -1
              ];

              for (const n of neighbors) {
                if (n >= 0 && visited[n] === 0 && candidateMask[n] === 1) {
                  visited[n] = 1;
                  queue[qTail++] = n;
                }
              }
            }

            // Only retain substantial blobs (> 250 pixels). Eliminates 100% of noise speckles!
            if (blob.length > 250) {
              for (const p of blob) fingerMask[p] = 1;
            }
          }
        }

        // Right border seeds (x = width - 3 to width - 1)
        for (let sx = width - 3; sx < width; sx++) {
          const seedIdx = y * width + sx;
          if (candidateMask[seedIdx] === 1 && visited[seedIdx] === 0) {
            let qHead = 0, qTail = 0;
            queue[qTail++] = seedIdx;
            visited[seedIdx] = 1;
            const blob: number[] = [];

            while (qHead < qTail) {
              const curr = queue[qHead++];
              blob.push(curr);
              const cy = Math.floor(curr / width);
              const cx = curr % width;

              const neighbors = [
                cy > 0 ? (cy - 1) * width + cx : -1,
                cy < height - 1 ? (cy + 1) * width + cx : -1,
                cx > 0 ? cy * width + (cx - 1) : -1,
                cx < width - 1 ? cy * width + (cx + 1) : -1
              ];

              for (const n of neighbors) {
                if (n >= 0 && visited[n] === 0 && candidateMask[n] === 1) {
                  visited[n] = 1;
                  queue[qTail++] = n;
                }
              }
            }

            if (blob.length > 250) {
              for (const p of blob) fingerMask[p] = 1;
            }
          }
        }
      }

      // 4. Morphological Dilation (expand boundary by 4px so fingernails & finger shadows are fully covered)
      const dilatedMask = new Uint8Array(width * height);
      const radius = 4;
      for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
          if (fingerMask[y * width + x] === 1) {
            for (let dy = -radius; dy <= radius; dy++) {
              for (let dx = -radius; dx <= radius; dx++) {
                dilatedMask[(y + dy) * width + (x + dx)] = 1;
              }
            }
          }
        }
      }

      // 5. Inpainting with Clean Paper Tone
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const p = y * width + x;
          if (dilatedMask[p] === 1) {
            const idx = p * 4;
            const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            // STRICT TEXT INK IMMUNITY: Never erase text ink
            if (lum < 90) continue;

            data[idx] = paperR;
            data[idx + 1] = paperG;
            data[idx + 2] = paperB;
          }
        }
      }
    }

    // 0.5. Robust Illumination Equalization (Shadow Removal with zero color separation/halos)
    if (optRemoveShadow) {
      const blockSize = Math.max(16, Math.round(Math.min(width, height) / 24));
      const gridW = Math.ceil(width / blockSize);
      const gridH = Math.ceil(height / blockSize);
      const bgGrid = new Float32Array(gridW * gridH);

      for (let gy = 0; gy < gridH; gy++) {
        for (let gx = 0; gx < gridW; gx++) {
          const startX = gx * blockSize;
          const endX = Math.min(width, (gx + 1) * blockSize);
          const startY = gy * blockSize;
          const endY = Math.min(height, (gy + 1) * blockSize);

          const lums: number[] = [];
          for (let y = startY; y < endY; y += 2) {
            for (let x = startX; x < endX; x += 2) {
              const idx = (y * width + x) * 4;
              const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
              lums.push(lum);
            }
          }
          lums.sort((a, b) => a - b);
          // 80th percentile captures paper illumination while ignoring dark text and black bars
          const p80 = lums[Math.floor(lums.length * 0.80)] || 180;
          bgGrid[gy * gridW + gx] = p80;
        }
      }

      let maxBg = 0;
      for (let i = 0; i < bgGrid.length; i++) {
        if (bgGrid[i] > maxBg) maxBg = bgGrid[i];
      }
      const targetWhite = Math.min(252, Math.max(225, maxBg));

      for (let y = 0; y < height; y++) {
        const gy = (y / blockSize) - 0.5;
        const gy0 = Math.max(0, Math.min(gridH - 1, Math.floor(gy)));
        const gy1 = Math.max(0, Math.min(gridH - 1, gy0 + 1));
        const fy = Math.max(0, Math.min(1, gy - gy0));

        for (let x = 0; x < width; x++) {
          const gx = (x / blockSize) - 0.5;
          const gx0 = Math.max(0, Math.min(gridW - 1, Math.floor(gx)));
          const gx1 = Math.max(0, Math.min(gridW - 1, gx0 + 1));
          const fx = Math.max(0, Math.min(1, gx - gx0));

          const top = bgGrid[gy0 * gridW + gx0] * (1 - fx) + bgGrid[gy0 * gridW + gx1] * fx;
          const bot = bgGrid[gy1 * gridW + gx0] * (1 - fx) + bgGrid[gy1 * gridW + gx1] * fx;
          const localBg = Math.max(65, top * (1 - fy) + bot * fy);

          const idx = (y * width + x) * 4;
          const r = data[idx], g = data[idx + 1], b = data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          const gain = Math.min(2.5, targetWhite / localBg);

          if (lum < 75) {
            // Text ink stays deep black
            data[idx] = Math.max(0, Math.min(255, Math.round(r * Math.min(gain, 1.05))));
            data[idx + 1] = Math.max(0, Math.min(255, Math.round(g * Math.min(gain, 1.05))));
            data[idx + 2] = Math.max(0, Math.min(255, Math.round(b * Math.min(gain, 1.05))));
          } else {
            // Smoothly level paper illumination to bright white
            data[idx] = Math.max(0, Math.min(255, Math.round(r * gain)));
            data[idx + 1] = Math.max(0, Math.min(255, Math.round(g * gain)));
            data[idx + 2] = Math.max(0, Math.min(255, Math.round(b * gain)));
          }
        }
      }
    }

    if (filter === 'flatten' || filter === 'bw') {
      let blurData: Uint8ClampedArray | null = null;
      try {
        const blurCanvas = document.createElement('canvas');
        blurCanvas.width = width;
        blurCanvas.height = height;
        const blurCtx = blurCanvas.getContext('2d');
        if (blurCtx && ctx.canvas) {
          const radius = Math.max(12, Math.round(Math.min(width, height) / 35));
          blurCtx.filter = `blur(${radius}px)`;
          blurCtx.drawImage(ctx.canvas, 0, 0);
          blurData = blurCtx.getImageData(0, 0, width, height).data;
        }
      } catch (e) {
        blurData = null;
      }

      if (blurData) {
        if (filter === 'bw') {
          for (let i = 0; i < data.length; i += 4) {
            const origLum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const blurLum = 0.299 * blurData[i] + 0.587 * blurData[i + 1] + 0.114 * blurData[i + 2];
            const diff = origLum - blurLum;

            let val: number;
            if (diff >= -2) {
              val = 255;
            } else {
              val = Math.max(0, Math.min(255, Math.round(255 + diff * 2.8)));
            }
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          }
        } else {
          // filter === 'flatten': Whiten background, remove wrinkles while preserving ink hue & legibility
          for (let i = 0; i < data.length; i += 4) {
            const origLum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const blurLum = 0.299 * blurData[i] + 0.587 * blurData[i + 1] + 0.114 * blurData[i + 2];
            const diff = origLum - blurLum;

            if (diff >= -3) {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
            } else {
              const bgVal = Math.max(50, blurLum);
              const normFactor = 255 / bgVal;
              const contrast = diff < -20 ? 0.75 : 0.88;

              data[i] = Math.max(0, Math.min(255, Math.floor(data[i] * normFactor * contrast)));
              data[i + 1] = Math.max(0, Math.min(255, Math.floor(data[i + 1] * normFactor * contrast)));
              data[i + 2] = Math.max(0, Math.min(255, Math.floor(data[i + 2] * normFactor * contrast)));
            }
          }
        }
      } else {
        // Fallback if offscreen blur unavailable: smooth tone curve without harsh hard clipping
        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (filter === 'bw') {
            const val = Math.max(0, Math.min(255, Math.round(Math.pow(lum / 255, 1.3) * 270 - 15)));
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
          } else {
            const boost = lum > 200 ? 255 : Math.min(255, Math.round(data[i] * 1.15));
            data[i] = boost;
            data[i + 1] = Math.min(255, Math.round(data[i + 1] * 1.15));
            data[i + 2] = Math.min(255, Math.round(data[i + 2] * 1.15));
          }
        }
      }
    } else if (filter === 'grayscale') {
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
    } else if (filter === 'color') {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.2 + 128));
        data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.2 + 128));
        data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.2 + 128));
      }
    }

    if (bVal !== 0 || cVal !== 0 || mVal !== 0) {
      const contrastFactor = (259 * (cVal * 2.55 + 255)) / (255 * (259 - cVal * 2.55));
      const gamma = Math.pow(2, -mVal / 50);

      for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
          let val = data[i + c];

          if (bVal !== 0) {
            val = Math.min(255, Math.max(0, val + bVal * 2.2));
          }
          if (cVal !== 0) {
            val = Math.min(255, Math.max(0, contrastFactor * (val - 128) + 128));
          }
          if (mVal !== 0) {
            const norm = val / 255;
            val = Math.min(255, Math.max(0, Math.pow(norm, gamma) * 255));
          }

          data[i + c] = Math.round(val);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  // Step 1: Open Crop & Boundary Alignment Step
  const openCropStepForPage = (page: ScannedPage, index: number) => {
    setActivePageIndex(index);
    if (page.corners) {
      setCorners(page.corners);
    } else {
      const cL = page.cropLeft !== undefined ? page.cropLeft : 5;
      const cR = page.cropRight !== undefined ? page.cropRight : 5;
      const cT = page.cropTop !== undefined ? page.cropTop : 5;
      const cB = page.cropBottom !== undefined ? page.cropBottom : 5;
      setCorners({
        tl: { x: cL, y: cT },
        tr: { x: 100 - cR, y: cT },
        br: { x: 100 - cR, y: 100 - cB },
        bl: { x: cL, y: 100 - cB },
      });
    }
    setCurrentStep('crop');
  };

  // Step 1 -> Step 2: Apply Crop & Flatten, then proceed to Enhance Step
  const applyCropAndProceed = () => {
    if (pages.length === 0 || activePageIndex >= pages.length) return;
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex ? { ...p, corners } : p
      )
    );
    setEditSubTab('tools');
    setCurrentStep('edit');
  };

  // Step 2: Open Enhance & Edit Step for an existing Page
  const openEditStepForPage = (page: ScannedPage, index: number) => {
    setActivePageIndex(index);
    setSelectedFilter(page.filter || 'none');
    setRemoveShadow(page.removeShadow || false);
    setRemoveFingers(page.removeFingers || false);
    setBrightness(page.brightness || 0);
    setContrast(page.contrast || 0);
    setMidTone(page.midTone || 0);
    if (page.corners) {
      setCorners(page.corners);
    }
    setEditSubTab('tools');
    setCurrentStep('edit');
  };

  // Seamless Page Navigation during Crop or Edit step with auto-save
  const navigateToPageInCurrentStep = (newIndex: number) => {
    if (newIndex < 0 || newIndex >= pages.length || newIndex === activePageIndex) return;

    // Persist current page adjustments before switching
    setPages((prev) =>
      prev.map((p, idx) =>
        idx === activePageIndex
          ? {
              ...p,
              corners,
              filter: selectedFilter,
              removeShadow,
              brightness,
              contrast,
              midTone,
            }
          : p
      )
    );

    const targetPage = pages[newIndex];
    if (currentStep === 'crop') {
      openCropStepForPage(targetPage, newIndex);
    } else if (currentStep === 'edit') {
      openEditStepForPage(targetPage, newIndex);
    }
  };

  const handleLaunchNativeHdCamera = () => {
    stopCamera();
    cameraInputRef.current?.click();
  };

  // Snap Photo Handler -> Instantly Opens Post-Snap Edit View
  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const videoTrack = stream?.getVideoTracks()[0];
    const settings = videoTrack?.getSettings ? videoTrack.getSettings() : {};
    const w = (settings as any).width || video.videoWidth || 1920;
    const h = (settings as any).height || video.videoHeight || 1080;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, 0, 0, w, h);
    const rawDataUrl = canvas.toDataURL('image/png', 1.0);

    // On Web & Desktop, auto-detect book/document page edges (top, bottom, left, right);
    // on Native Mobile, default to clean 5% uniform trim.
    const initialCorners = !isNativeMobileApp()
      ? autoDetectBookOrDocumentWebcamPage(canvas)
      : { ...DEFAULT_5PCT_CORNERS };
    const initLeft = Math.round(Math.min(initialCorners.tl.x, initialCorners.bl.x));
    const initRight = Math.round(100 - Math.max(initialCorners.tr.x, initialCorners.br.x));
    const initTop = Math.round(Math.min(initialCorners.tl.y, initialCorners.tr.y));
    const initBottom = Math.round(100 - Math.max(initialCorners.bl.y, initialCorners.br.y));

    const newPage: ScannedPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      dataUrl: rawDataUrl,
      originalDataUrl: rawDataUrl,
      filter: 'none',
      rotation: 0,
      brightness: 0,
      contrast: 0,
      midTone: 0,
      cropLeft: initLeft,
      cropRight: initRight,
      cropTop: initTop,
      cropBottom: initBottom,
      corners: initialCorners,
    };

    stopCamera();
    setPages((prev) => {
      const updated = [...prev, newPage];
      const targetIndex = updated.length - 1;
      setTimeout(() => {
        openCropStepForPage(newPage, targetIndex);
      }, 50);
      return updated;
    });
  };

  // File Upload Handler -> Instantly Opens Post-Snap Edit View
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    const newPagesToAppend: ScannedPage[] = [];
    let processedCount = 0;

    fileList.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const rawDataUrl = evt.target?.result as string;
        if (rawDataUrl) {
          const img = new Image();
          img.onload = () => {
            const initialCorners = { ...DEFAULT_5PCT_CORNERS };
            const newPage: ScannedPage = {
              id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${idx}`,
              dataUrl: rawDataUrl,
              originalDataUrl: rawDataUrl,
              filter: 'none',
              rotation: 0,
              brightness: 0,
              contrast: 0,
              midTone: 0,
              cropLeft: 5,
              cropRight: 5,
              cropTop: 5,
              cropBottom: 5,
              corners: initialCorners,
            };
            newPagesToAppend.push(newPage);
            processedCount++;
            if (processedCount === fileList.length && newPagesToAppend.length > 0) {
              setPages((prev) => {
                const updated = [...prev, ...newPagesToAppend];
                const firstNewIndex = prev.length;
                const firstNewPage = newPagesToAppend[0];
                setTimeout(() => {
                  openCropStepForPage(firstNewPage, firstNewIndex);
                }, 50);
                return updated;
              });
            }
          };
          img.src = rawDataUrl;
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Confirm Post-Snap Edits & Save Page Changes
  const handleSavePageEdits = () => {
    if (pages.length === 0 || activePageIndex >= pages.length) return;
    const page = pages[activePageIndex];

    const img = new Image();
    img.onload = () => {
      // CamScanner-style 4-point perspective un-warping & flattening
      const flattenedCanvas = warpAndFlattenQuadrilateral(img, corners);
      const flatCtx = flattenedCanvas.getContext('2d', { willReadFrequently: true });
      if (flatCtx) {
        applyFilterAndToneToCanvas(flatCtx, flattenedCanvas.width, flattenedCanvas.height, selectedFilter, brightness, contrast, midTone, removeShadow, removeFingers);
      }
      const editedDataUrl = flattenedCanvas.toDataURL('image/png');

      setPages((prev) =>
        prev.map((p, idx) =>
          idx === activePageIndex
            ? {
                ...p,
                dataUrl: editedDataUrl,
                filter: selectedFilter,
                removeShadow,
                removeFingers,
                brightness,
                contrast,
                midTone,
                cropLeft,
                cropRight,
                cropTop,
                cropBottom,
              }
            : p
        )
      );

      setCurrentStep('summary');
    };
    img.src = page.originalDataUrl;
  };

  const setPresetCrop = (margin: number) => {
    setCropLeft(margin);
    setCropRight(margin);
    setCropTop(margin);
    setCropBottom(margin);

    setCorners({
      tl: { x: margin, y: margin },
      tr: { x: 100 - margin, y: margin },
      br: { x: 100 - margin, y: 100 - margin },
      bl: { x: margin, y: 100 - margin },
    });
  };

  const handleSliderMarginChange = (side: 'left' | 'right' | 'top' | 'bottom', val: number) => {
    if (side === 'left') {
      setCropLeft(val);
      setCorners((prev) => ({
        ...prev,
        tl: { x: val, y: prev.tl.y },
        bl: { x: val, y: prev.bl.y },
      }));
    } else if (side === 'right') {
      setCropRight(val);
      setCorners((prev) => ({
        ...prev,
        tr: { x: 100 - val, y: prev.tr.y },
        br: { x: 100 - val, y: prev.br.y },
      }));
    } else if (side === 'top') {
      setCropTop(val);
      setCorners((prev) => ({
        ...prev,
        tl: { x: prev.tl.x, y: val },
        tr: { x: prev.tr.x, y: val },
      }));
    } else if (side === 'bottom') {
      setCropBottom(val);
      setCorners((prev) => ({
        ...prev,
        bl: { x: prev.bl.x, y: 100 - val },
        br: { x: prev.br.x, y: 100 - val },
      }));
    }
  };

  const setPresetTone = (b: number, c: number, m: number) => {
    setBrightness(b);
    setContrast(c);
    setMidTone(m);
  };

  const handleDeletePage = (index: number) => {
    const updated = pages.filter((_, idx) => idx !== index);
    setPages(updated);
    if (updated.length === 0) {
      setCurrentStep('camera');
    } else {
      setActivePageIndex(Math.max(0, index - 1));
    }
  };

  const handleRotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  // Export Images as JPG or PNG with user-friendly naming & Save to Phone vs Share / Cloud Drive
  const handleDownloadImages = async (format: 'jpg' | 'png') => {
    if (pages.length === 0) return;
    const cleanBaseName = exportFileName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '_') || 'Scanned_Document';

    // Monthly 5-Document Limit check for free tier image export
    const quota = checkAndConsumeMonthlyQuota(isProActive, 'scan_export', cleanBaseName);
    if (!quota.allowed) {
      if (onRequirePro) {
        onRequirePro(`Monthly free limit reached (${FREE_MONTHLY_DOC_LIMIT} documents/month). Upgrade to Pro for unlimited exports!`);
      } else {
        alert(`Monthly free limit reached (${FREE_MONTHLY_DOC_LIMIT} documents/month). Upgrade to Pro for unlimited exports!`);
      }
      return;
    }

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';

    const items: ExportItem[] = [];
    for (let idx = 0; idx < pages.length; idx++) {
      const p = pages[idx];
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            if (format === 'jpg') {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
          }
          canvas.toBlob((blob) => {
            if (blob) {
              const fileName =
                pages.length === 1
                  ? `${cleanBaseName}.${format}`
                  : `${cleanBaseName}_Page_${idx + 1}.${format}`;
              items.push({ fileName, blob, mimeType });
            }
            resolve();
          }, mimeType, 0.95);
        };
        img.src = p.dataUrl;
      });
    }

    if (items.length > 0) {
      setExportModalFiles(items);
      setExportModalFileName(`${cleanBaseName}.${format}`);
      setExportModalMimeType(mimeType);
      setExportModalTitle(`Export Scanned ${format.toUpperCase()}`);
      setExportModalOpen(true);
    }
  };

  // Assemble Scanned PDF & Open Export Save Modal (Save to Phone or Cloud)
  const handleExportScannedPDF = async () => {
    if (pages.length === 0) return;
    const cleanBaseName = exportFileName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '_') || 'Scanned_Document';

    // Monthly 5-Document Limit check for free tier PDF export
    const quota = checkAndConsumeMonthlyQuota(isProActive, 'save', cleanBaseName);
    if (!quota.allowed) {
      if (onRequirePro) {
        onRequirePro(`Monthly free limit reached (${FREE_MONTHLY_DOC_LIMIT} documents/month). Upgrade to Pro for unlimited exports!`);
      } else {
        alert(`Monthly free limit reached (${FREE_MONTHLY_DOC_LIMIT} documents/month). Upgrade to Pro for unlimited exports!`);
      }
      return;
    }

    setIsAssembling(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const pageItem of pages) {
        const imageBytes = await fetch(pageItem.dataUrl).then((res) => res.arrayBuffer());
        const isPng = pageItem.dataUrl.startsWith('data:image/png');
        const imageEmbed = isPng
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);

        const stdWidth = 612;
        const aspectRatio = imageEmbed.height / imageEmbed.width;
        const stdHeight = stdWidth * aspectRatio;

        const page = pdfDoc.addPage([stdWidth, stdHeight]);
        page.drawImage(imageEmbed, {
          x: 0,
          y: 0,
          width: stdWidth,
          height: stdHeight,
        });

        if (pageItem.rotation !== 0) {
          page.setRotation({ type: 'degrees', angle: pageItem.rotation } as any);
        }
      }

      applyStandardMetadata(pdfDoc);
      const pdfBytes = await pdfDoc.save();
      const cleanBaseName = exportFileName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '_') || 'Scanned_Document';
      const fileName = `${cleanBaseName}.pdf`;
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

      setExportModalFiles([{ fileName, blob, mimeType: 'application/pdf' }]);
      setExportModalFileName(fileName);
      setExportModalMimeType('application/pdf');
      setExportModalTitle('Export Scanned PDF');
      setExportModalOpen(true);
    } catch (err: any) {
      console.error('Failed to generate scanned PDF:', err);
      alert('Failed to generate PDF from scanned images. Please try again.');
    } finally {
      setIsAssembling(false);
    }
  };

  // Assemble PDF & Launch in PDF Editor Workspace
  const handleAssemblePDF = async () => {
    if (pages.length === 0) return;
    setIsAssembling(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const pageItem of pages) {
        const imageBytes = await fetch(pageItem.dataUrl).then((res) => res.arrayBuffer());
        const isPng = pageItem.dataUrl.startsWith('data:image/png');
        const imageEmbed = isPng
          ? await pdfDoc.embedPng(imageBytes)
          : await pdfDoc.embedJpg(imageBytes);

        const stdWidth = 612;
        const aspectRatio = imageEmbed.height / imageEmbed.width;
        const stdHeight = stdWidth * aspectRatio;

        const page = pdfDoc.addPage([stdWidth, stdHeight]);
        page.drawImage(imageEmbed, {
          x: 0,
          y: 0,
          width: stdWidth,
          height: stdHeight,
        });

        if (pageItem.rotation !== 0) {
          page.setRotation({ type: 'degrees', angle: pageItem.rotation } as any);
        }
      }

      applyStandardMetadata(pdfDoc);
      const pdfBytes = await pdfDoc.save();
      const cleanBaseName = exportFileName.trim().replace(/[^a-zA-Z0-9_\-\s]/g, '_') || 'Scanned_Document';
      const fileName = `${cleanBaseName}.pdf`;

      onScanComplete(pdfBytes, fileName);
      onClose();
    } catch (err: any) {
      console.error('Failed to assemble scanned PDF:', err);
      alert('Failed to generate PDF from scanned images. Please try again.');
    } finally {
      setIsAssembling(false);
    }
  };

  const getLoupeStyle = (point: { x: number; y: number }) => {
    const isNearTop = point.y < 35;
    const isNearLeft = point.x < 20;
    const isNearRight = point.x > 80;

    let leftClamped = point.x;
    if (isNearLeft) leftClamped = Math.max(15, point.x);
    if (isNearRight) leftClamped = Math.min(85, point.x);

    return {
      left: `${leftClamped}%`,
      top: `${point.y}%`,
      transform: `translate(-50%, ${isNearTop ? '25%' : '-125%'})`,
    };
  };

  const activeLoupe = draggingCorner
    ? { point: corners[draggingCorner], label: draggingCorner.toUpperCase() }
    : activeSlider === 'top'
    ? { point: { x: 50, y: cropTop }, label: 'TOP TRIM' }
    : activeSlider === 'bottom'
    ? { point: { x: 50, y: 100 - cropBottom }, label: 'BOTTOM TRIM' }
    : activeSlider === 'left'
    ? { point: { x: cropLeft, y: 50 }, label: 'LEFT TRIM' }
    : activeSlider === 'right'
    ? { point: { x: 100 - cropRight, y: 50 }, label: 'RIGHT TRIM' }
    : null;

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    qrScanUrl
  )}&color=06b6d4&bgbw=0f172a`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-slate-100 w-screen h-screen overflow-hidden animate-fadeIn select-none">
      {/* ================= STEP 1: CAMERA VIEWFINDER (INSET & PUSHED DOWN FOR SAFE AREAS) ================= */}
      {currentStep === 'camera' && (
        <div className="relative flex flex-col w-full h-full bg-slate-950 overflow-hidden">
          {/* Top Header Toolbar - Pushed Down Inside Phone Safety Area */}
          <div className="pt-[max(2.5rem,env(safe-area-inset-top)+1.5rem)] px-5 pb-3 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-40">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-cyan-500/15 border border-cyan-500/30 rounded-xl text-cyan-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white tracking-wide">Document Camera Scanner</h2>
                <span className="text-[10px] text-cyan-400 font-bold flex items-center space-x-1">
                  <Focus className="w-3 h-3 text-cyan-400" />
                  <span>Tap screen to focus | Continuous Auto-Focus</span>
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 shadow-lg backdrop-blur-md transition transform active:scale-90 flex items-center justify-center"
              title="Close Camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Viewfinder Container (Full Native FOV for Laptops & Mobile) */}
          <div className="flex-1 relative w-full my-auto flex items-center justify-center p-3 sm:p-6 overflow-hidden bg-slate-950">
            {activeTab === 'camera' ? (
              isCameraActive ? (
                /* Wide Spacious Viewfinder Container */
                <div
                  ref={viewfinderRef}
                  onClick={handleTapToFocus}
                  className="relative w-full max-w-md sm:max-w-xl md:max-w-4xl lg:max-w-6xl aspect-[3/4] sm:aspect-[4/3] md:aspect-[16/9] max-h-[65vh] sm:max-h-[75vh] md:max-h-[82vh] lg:max-h-[85vh] rounded-3xl border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden bg-black flex items-center justify-center cursor-crosshair select-none transition-all duration-300"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain md:object-cover bg-black"
                  />

                  {/* Document Target Corner Bracket Guides */}
                  <div className="absolute inset-6 sm:inset-8 border-2 border-dashed border-cyan-400/60 rounded-2xl pointer-events-none flex items-center justify-center">
                    <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                    <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                    <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                    <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                  </div>

                  {/* Animated Tap-to-Focus Target Ring */}
                  {focusRingPos && (
                    <div
                      style={{ left: `${focusRingPos.x}px`, top: `${focusRingPos.y}px` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                    >
                      <div className="w-14 h-14 rounded-full border-2 border-cyan-400 animate-ping opacity-75" />
                      <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-amber-400 flex items-center justify-center">
                        <Crosshair className="w-6 h-6 text-amber-400 animate-spin" />
                      </div>
                    </div>
                  )}

                  {/* Steady Focus Snap Countdown Overlay */}
                  {steadyCountdown !== null && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col items-center justify-center space-y-3">
                      <div className="w-20 h-20 rounded-full border-4 border-cyan-400 bg-cyan-500/20 flex items-center justify-center text-3xl font-black text-white animate-pulse shadow-2xl">
                        {steadyCountdown}
                      </div>
                      <span className="text-xs font-extrabold text-cyan-300 tracking-wider uppercase">
                        Hold Phone Steady... Focusing...
                      </span>
                    </div>
                  )}

                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 bg-slate-950/80 text-slate-300 rounded-full border border-slate-700/80 backdrop-blur-md pointer-events-none">
                    🎯 Tap screen to trigger focus
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl backdrop-blur-md shadow-2xl">
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-3xl text-cyan-400">
                    <Camera className="w-12 h-12 animate-pulse" />
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                    {cameraError || 'Initializing document camera...'}
                  </p>
                  <button
                    onClick={handleLaunchNativeHdCamera}
                    className="px-6 py-4 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-2xl shadow-emerald-500/40 transition transform active:scale-95 flex items-center space-x-3 border border-emerald-400/40"
                  >
                    <Camera className="w-5 h-5 text-white" />
                    <span>📷 Snap Photo with Phone Camera</span>
                  </button>
                </div>
              )
            ) : (
              /* QR Code Sync Tab */
              <div className="flex flex-col items-center justify-center p-6 space-y-5 text-center bg-slate-900/90 border border-slate-800 rounded-3xl backdrop-blur-md max-w-md mx-auto shadow-2xl">
                <div className="space-y-1.5">
                  <span className="px-3 py-1 bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-500/30 text-xs font-bold">
                    📱 Wireless Mobile Scanner Sync
                  </span>
                  <h3 className="text-base font-bold text-white">Scan with Your Phone Camera</h3>
                  <p className="text-xs text-slate-400">
                    Scan this QR code with your phone. Documents snapped on your phone will stream directly into this workspace!
                  </p>
                </div>

                <div className="p-4 bg-slate-950 border-2 border-cyan-500/40 rounded-2xl shadow-2xl inline-block ring-4 ring-cyan-500/10">
                  <img src={qrImageUrl} alt="Scan QR" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Floating Control Toolbar - Pushed Down Inside Phone Safety Area */}
          {activeTab === 'camera' && (
            <div className="relative z-40 pt-3 px-2 sm:px-6 pb-[max(2rem,env(safe-area-inset-bottom)+1.25rem)] bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md flex flex-col space-y-2">
              {/* Guidance / Feature Banner */}
              <p className="text-[11px] text-slate-400 text-center font-medium">
                Auto-detects paper corners. Tap <span className="text-purple-400 font-bold">Image to PDF</span> to import JPG/PNG files.
              </p>

              <div className="flex items-end justify-around w-full max-w-lg mx-auto">
                {/* 1. Flip Camera */}
                <button
                  onClick={toggleCameraFacing}
                  className="flex flex-col items-center justify-center space-y-1 group active:scale-95 transition"
                  title="Switch between front and back camera"
                >
                  <div className="p-3 sm:p-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-md">
                    <RefreshCw className="w-5 h-5 text-cyan-300 group-hover:rotate-180 transition-transform duration-300" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 tracking-tight">Flip Cam</span>
                </button>

                {/* 2. HD Camera Launcher */}
                <button
                  onClick={handleLaunchNativeHdCamera}
                  className="flex flex-col items-center justify-center space-y-1 group active:scale-95 transition"
                  title="Capture high-resolution photo with device native camera"
                >
                  <div className="p-3 sm:p-3.5 bg-gradient-to-tr from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl border border-emerald-300/50 shadow-xl shadow-emerald-500/25 backdrop-blur-md">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 tracking-tight">HD Cam</span>
                </button>

                {/* 3. Main Shutter Snap Button */}
                <button
                  onClick={triggerShutterCapture}
                  disabled={!isCameraActive || steadyCountdown !== null}
                  className="flex flex-col items-center justify-center space-y-1 group active:scale-90 transition disabled:opacity-50"
                  title={isSteadyMode ? "Snap Steady 2s Focused Photo" : "Snap Document Page"}
                >
                  <div className="p-4 sm:p-5 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-full shadow-2xl shadow-cyan-500/60 border-4 border-white">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-3 border-white bg-white/30" />
                  </div>
                  <span className="text-[11px] font-black text-white tracking-wider uppercase">Snap</span>
                </button>

                {/* 4. Steady Focus Timer */}
                <button
                  onClick={() => setIsSteadyMode((prev) => !prev)}
                  className="flex flex-col items-center justify-center space-y-1 group active:scale-95 transition"
                  title="Toggle 2-second steady focus timer before snap"
                >
                  <div className={`p-3 sm:p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition ${
                    isSteadyMode
                      ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/50'
                      : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-700'
                  }`}>
                    <Timer className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold tracking-tight ${isSteadyMode ? 'text-amber-400' : 'text-slate-400'}`}>
                    Steady 2s
                  </span>
                </button>

                {/* 5. Image to PDF (Load JPG / PNG from phone) */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center space-y-1 group active:scale-95 transition relative"
                  title="Image to PDF: Import JPG or PNG images from phone gallery to convert into PDF"
                >
                  <div className="p-3 sm:p-3.5 bg-gradient-to-tr from-purple-600/90 to-blue-600/90 hover:from-purple-500 hover:to-blue-500 text-white rounded-2xl border border-purple-400/40 shadow-xl shadow-purple-500/20 backdrop-blur-md relative">
                    <ImageIcon className="w-5 h-5 text-purple-200" />
                    {pages.length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow">
                        {pages.length}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-black text-purple-300 tracking-tight">Image to PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= STEP 2: CROP & 4-CORNER BOUNDARY ALIGNMENT ================= */}
      {currentStep === 'crop' && pages[activePageIndex] && (
        <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 overflow-hidden">
          {/* Sleek Sticky Top Header */}
          <div className="pt-[max(1.5rem,env(safe-area-inset-top)+0.75rem)] px-4 py-3 bg-slate-900/95 backdrop-blur border-b border-slate-800 flex items-center justify-between z-30 shrink-0 shadow-md">
            <button
              onClick={() => setCurrentStep('camera')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Camera</span>
            </button>

            <div className="flex items-center space-x-2">
              {pages.length > 1 && (
                <button
                  type="button"
                  disabled={activePageIndex === 0}
                  onClick={() => navigateToPageInCurrentStep(activePageIndex - 1)}
                  className={`p-1.5 rounded-lg border transition ${
                    activePageIndex > 0
                      ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700 active:scale-95'
                      : 'bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <div className="text-center">
                <h3 className="text-sm font-extrabold text-white tracking-wide">
                  Crop Page {activePageIndex + 1} of {pages.length}
                </h3>
                <p className="text-[10px] text-cyan-400 font-semibold">Drag 4 corners to frame the document</p>
              </div>

              {pages.length > 1 && (
                <button
                  type="button"
                  disabled={activePageIndex >= pages.length - 1}
                  onClick={() => navigateToPageInCurrentStep(activePageIndex + 1)}
                  className={`p-1.5 rounded-lg border transition ${
                    activePageIndex < pages.length - 1
                      ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700 active:scale-95'
                      : 'bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={applyCropAndProceed}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition transform active:scale-95"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>

          {/* Multi-Page Quick Navigation Strip */}
          {pages.length > 1 && (
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
                Document Pages:
              </span>
              <div className="flex items-center space-x-1.5">
                {pages.map((p, idx) => (
                  <button
                    key={p.id || idx}
                    type="button"
                    onClick={() => navigateToPageInCurrentStep(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      idx === activePageIndex
                        ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-cyan-400/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <span>Page {idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable View for Corner Selector Overlay */}
          <div className="flex-1 overflow-y-auto overscroll-contain bg-slate-950 flex flex-col">
            <div className="w-full bg-black/95 flex items-center justify-center p-3 sm:p-6 min-h-[54vh] sm:min-h-[62vh] shrink-0 border-b border-slate-800/80">
              <div className="relative inline-block max-w-full select-none cursor-crosshair shadow-2xl bg-slate-950 touch-none">
                <div
                  ref={cropContainerRef}
                  className="relative max-w-full overflow-hidden rounded-2xl border-2 border-cyan-500/40 touch-none"
                >
                  <img
                    src={pages[activePageIndex].originalDataUrl}
                    alt="Crop Source"
                    className="max-w-full max-h-[70vh] sm:max-h-[78vh] w-auto h-auto object-contain pointer-events-none select-none touch-none"
                  />

                  <svg className="absolute inset-0 w-full h-full pointer-events-none touch-none">
                    <polygon
                      points={`
                        ${corners.tl.x}%,${corners.tl.y}% 
                        ${corners.tr.x}%,${corners.tr.y}% 
                        ${corners.br.x}%,${corners.br.y}% 
                        ${corners.bl.x}%,${corners.bl.y}%
                      `}
                      className="fill-cyan-500/20 stroke-cyan-400 stroke-2"
                      strokeDasharray="4 2"
                    />
                  </svg>

                  {[
                    { key: 'tl', label: 'TL', pos: corners.tl },
                    { key: 'tr', label: 'TR', pos: corners.tr },
                    { key: 'br', label: 'BR', pos: corners.br },
                    { key: 'bl', label: 'BL', pos: corners.bl },
                  ].map((c) => (
                    <div
                      key={c.key}
                      style={{ left: `${c.pos.x}%`, top: `${c.pos.y}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full shadow-2xl border-2 border-white flex items-center justify-center text-[10px] font-black z-30 transition-transform touch-none cursor-grab active:cursor-grabbing ${
                        draggingCorner === c.key
                          ? 'bg-amber-400 text-black scale-125 ring-4 ring-amber-400/50'
                          : 'bg-cyan-400 text-slate-950 hover:scale-125'
                      }`}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setDraggingCorner(c.key as any);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        setDraggingCorner(c.key as any);
                      }}
                    >
                      {c.label}
                    </div>
                  ))}
                </div>

                {/* Floating Precision Canvas Loupe Lens Glass */}
                {activeLoupe && (
                  <div
                    style={getLoupeStyle(activeLoupe.point)}
                    className="absolute z-50 pointer-events-none flex flex-col items-center shadow-2xl transition-all duration-75"
                  >
                    <LoupeCanvas
                      imageUrl={pages[activePageIndex].originalDataUrl}
                      targetPoint={activeLoupe.point}
                      label={activeLoupe.label}
                    />
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-cyan-400 -mt-0.5 drop-shadow" />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Controls for Crop Step */}
            <div className="p-4 pb-[max(2rem,env(safe-area-inset-bottom)+1.5rem)] bg-slate-900 border-t border-slate-800 space-y-3">
              {!isNativeMobileApp() ? (
                /* Web & Desktop Download Version: Full Quick Margin Presets + Book/Page Auto-Scanner + Edge Magnifier + 4 Manual Trim Sliders */
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1">
                      <Crop className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Quick Margin Presets:</span>
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPresetCrop(0)}
                        className={`px-2.5 py-1 text-[11px] font-black rounded-lg border shadow transition ${
                          cropTop === 0 && cropBottom === 0 && cropLeft === 0 && cropRight === 0
                            ? 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-700/60 ring-1 ring-cyan-500/40'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        Full Corners (0%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCrop(5)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                          cropTop === 5 && cropBottom === 5 && cropLeft === 5 && cropRight === 5
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-700 ring-1 ring-cyan-500/30'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        Trim 5%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCrop(10)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                          cropTop === 10 && cropBottom === 10 && cropLeft === 10 && cropRight === 10
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-700 ring-1 ring-cyan-500/30'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        Trim 10%
                      </button>
                      <button
                        type="button"
                        onClick={() => setPresetCrop(15)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                          cropTop === 15 && cropBottom === 15 && cropLeft === 15 && cropRight === 15
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-700 ring-1 ring-cyan-500/30'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                        }`}
                      >
                        Trim 15%
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCropTop(17);
                          setCropBottom(2);
                          setCropLeft(18);
                          setCropRight(22);
                          setCorners({
                            tl: { x: 18, y: 17 },
                            tr: { x: 78, y: 17 },
                            br: { x: 78, y: 98 },
                            bl: { x: 18, y: 98 },
                          });
                          setInspectEdge('top');
                        }}
                        className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border transition flex items-center space-x-1 ${
                          cropTop === 17 && cropBottom === 2 && cropLeft === 18 && cropRight === 22
                            ? 'bg-purple-950 text-purple-200 border-purple-500 ring-1 ring-purple-400/40'
                            : 'bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 border-purple-700/70'
                        }`}
                        title="Preset for holding a book or document page in front of a laptop/desktop webcam (trims top head/ceiling & wide side margins)"
                      >
                        <span>📖 Book / Page Preset</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const img = new Image();
                          img.onload = () => {
                            const detected = autoDetectBookOrDocumentWebcamPage(img);
                            setCorners(detected);
                            setInspectEdge('top');
                          };
                          img.src = pages[activePageIndex].originalDataUrl;
                        }}
                        className="px-3 py-1 bg-gradient-to-r from-cyan-950 to-teal-950 hover:from-cyan-900 hover:to-teal-900 text-cyan-300 text-[11px] font-extrabold rounded-lg border border-cyan-500/60 transition shadow flex items-center space-x-1"
                        title="Smart Top, Bottom, Left & Right Edge Detector for Documents and Books"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Auto-Detect Page / Book</span>
                      </button>
                    </div>
                  </div>

                  {/* Virtual Edge Magnifier View - Live view of the edge being trimmed */}
                  <VirtualEdgeViewer
                    imageUrl={pages[activePageIndex].originalDataUrl}
                    activeEdge={inspectEdge}
                    cropTop={cropTop}
                    cropBottom={cropBottom}
                    cropLeft={cropLeft}
                    cropRight={cropRight}
                    onSelectEdge={(edge) => setInspectEdge(edge)}
                  />

                  {/* 4 Fine-Tuning Crop Margin Sliders (Top, Bottom, Left, Right) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className={`p-2 rounded-xl transition ${inspectEdge === 'top' ? 'bg-cyan-950/40 border border-cyan-500/40 ring-1 ring-cyan-500/20' : 'bg-slate-950/50'}`}>
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className={inspectEdge === 'top' ? 'text-cyan-300 font-black' : 'text-slate-400'}>
                          Top Trim {inspectEdge === 'top' && '●'}
                        </span>
                        <span className="text-cyan-400">{cropTop}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={cropTop}
                        onMouseDown={() => {
                          setActiveSlider('top');
                          setInspectEdge('top');
                        }}
                        onTouchStart={() => {
                          setActiveSlider('top');
                          setInspectEdge('top');
                        }}
                        onMouseUp={() => setActiveSlider(null)}
                        onTouchEnd={() => setActiveSlider(null)}
                        onChange={(e) => {
                          setActiveSlider('top');
                          setInspectEdge('top');
                          handleSliderMarginChange('top', Number(e.target.value));
                        }}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <div className={`p-2 rounded-xl transition ${inspectEdge === 'bottom' ? 'bg-cyan-950/40 border border-cyan-500/40 ring-1 ring-cyan-500/20' : 'bg-slate-950/50'}`}>
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className={inspectEdge === 'bottom' ? 'text-cyan-300 font-black' : 'text-slate-400'}>
                          Bottom Trim {inspectEdge === 'bottom' && '●'}
                        </span>
                        <span className="text-cyan-400">{cropBottom}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={cropBottom}
                        onMouseDown={() => {
                          setActiveSlider('bottom');
                          setInspectEdge('bottom');
                        }}
                        onTouchStart={() => {
                          setActiveSlider('bottom');
                          setInspectEdge('bottom');
                        }}
                        onMouseUp={() => setActiveSlider(null)}
                        onTouchEnd={() => setActiveSlider(null)}
                        onChange={(e) => {
                          setActiveSlider('bottom');
                          setInspectEdge('bottom');
                          handleSliderMarginChange('bottom', Number(e.target.value));
                        }}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <div className={`p-2 rounded-xl transition ${inspectEdge === 'left' ? 'bg-cyan-950/40 border border-cyan-500/40 ring-1 ring-cyan-500/20' : 'bg-slate-950/50'}`}>
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className={inspectEdge === 'left' ? 'text-cyan-300 font-black' : 'text-slate-400'}>
                          Left Trim {inspectEdge === 'left' && '●'}
                        </span>
                        <span className="text-cyan-400">{cropLeft}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={cropLeft}
                        onMouseDown={() => {
                          setActiveSlider('left');
                          setInspectEdge('left');
                        }}
                        onTouchStart={() => {
                          setActiveSlider('left');
                          setInspectEdge('left');
                        }}
                        onMouseUp={() => setActiveSlider(null)}
                        onTouchEnd={() => setActiveSlider(null)}
                        onChange={(e) => {
                          setActiveSlider('left');
                          setInspectEdge('left');
                          handleSliderMarginChange('left', Number(e.target.value));
                        }}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                    <div className={`p-2 rounded-xl transition ${inspectEdge === 'right' ? 'bg-cyan-950/40 border border-cyan-500/40 ring-1 ring-cyan-500/20' : 'bg-slate-950/50'}`}>
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className={inspectEdge === 'right' ? 'text-cyan-300 font-black' : 'text-slate-400'}>
                          Right Trim {inspectEdge === 'right' && '●'}
                        </span>
                        <span className="text-cyan-400">{cropRight}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        value={cropRight}
                        onMouseDown={() => {
                          setActiveSlider('right');
                          setInspectEdge('right');
                        }}
                        onTouchStart={() => {
                          setActiveSlider('right');
                          setInspectEdge('right');
                        }}
                        onMouseUp={() => setActiveSlider(null)}
                        onTouchEnd={() => setActiveSlider(null)}
                        onChange={(e) => {
                          setActiveSlider('right');
                          setInspectEdge('right');
                          handleSliderMarginChange('right', Number(e.target.value));
                        }}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Native Mobile App: Keep existing compact 3-button layout untouched */
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setPresetCrop(0)}
                    className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition shadow"
                  >
                    Full Page (0%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetCrop(5)}
                    className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-xl border border-slate-800 transition shadow"
                  >
                    Trim 5%
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const img = new Image();
                      img.onload = () => {
                        const detected = autoDetectDocumentCorners(img);
                        setCorners(detected);
                      };
                      img.src = pages[activePageIndex].originalDataUrl;
                    }}
                    className="flex-1 py-2 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-xs font-bold rounded-xl border border-cyan-800 transition shadow flex items-center justify-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Auto Detect</span>
                  </button>
                </div>
              )}

              {/* Big Action Button: Apply Crop & Flatten */}
              <button
                type="button"
                onClick={applyCropAndProceed}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-cyan-500/20 flex items-center justify-center space-x-2 transition transform active:scale-[0.99]"
              >
                <Check className="w-5 h-5 text-slate-950" />
                <span>Apply Crop & Flatten ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 2.5: ENHANCE, CLEANUP & FILTERS (ON FLATTENED DOCUMENT) ================= */}
      {currentStep === 'edit' && pages[activePageIndex] && (
        <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 overflow-hidden">
          {/* Sleek Sticky Top Header */}
          <div className="pt-[max(1.5rem,env(safe-area-inset-top)+0.75rem)] px-4 py-3 bg-slate-900/95 backdrop-blur border-b border-slate-800 flex items-center justify-between z-30 shrink-0 shadow-md">
            <button
              onClick={() => setCurrentStep('crop')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1"
              title="Return to Crop Corners"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Crop</span>
            </button>

            <div className="flex items-center space-x-2">
              {pages.length > 1 && (
                <button
                  type="button"
                  disabled={activePageIndex === 0}
                  onClick={() => navigateToPageInCurrentStep(activePageIndex - 1)}
                  className={`p-1.5 rounded-lg border transition ${
                    activePageIndex > 0
                      ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700 active:scale-95'
                      : 'bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              <div className="text-center">
                <h3 className="text-sm font-extrabold text-white tracking-wide">
                  Edit Page {activePageIndex + 1} of {pages.length}
                </h3>
                <p className="text-[10px] text-cyan-400 font-semibold">Real-time tone, cleanup & filters</p>
              </div>

              {pages.length > 1 && (
                <button
                  type="button"
                  disabled={activePageIndex >= pages.length - 1}
                  onClick={() => navigateToPageInCurrentStep(activePageIndex + 1)}
                  className={`p-1.5 rounded-lg border transition ${
                    activePageIndex < pages.length - 1
                      ? 'bg-slate-800 border-slate-700 text-cyan-400 hover:bg-slate-700 active:scale-95'
                      : 'bg-slate-900/40 border-slate-800/40 text-slate-600 cursor-not-allowed opacity-40'
                  }`}
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={handleSavePageEdits}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition transform active:scale-95"
            >
              <Check className="w-4 h-4 text-slate-950" />
              <span>Confirm</span>
            </button>
          </div>

          {/* Multi-Page Quick Navigation Strip */}
          {pages.length > 1 && (
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">
                Document Pages:
              </span>
              <div className="flex items-center space-x-1.5">
                {pages.map((p, idx) => (
                  <button
                    key={p.id || idx}
                    type="button"
                    onClick={() => navigateToPageInCurrentStep(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      idx === activePageIndex
                        ? 'bg-cyan-500 text-slate-950 shadow-md ring-2 ring-cyan-400/50'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
                    }`}
                  >
                    <span>Page {idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable View for Large Flattened Document Preview + Edit Controls Below */}
          <div className="flex-1 overflow-y-auto overscroll-contain bg-slate-950 flex flex-col">
            {/* Real-Time Live Flattened Document Canvas */}
            <div className="w-full bg-black/95 flex items-center justify-center p-3 sm:p-6 min-h-[52vh] sm:min-h-[64vh] shrink-0 border-b border-slate-800/80">
              <div className="relative flex items-center justify-center max-w-full overflow-hidden rounded-2xl border-2 border-cyan-500/40 bg-slate-950 p-2 shadow-2xl">
                <canvas
                  ref={liveEditCanvasRef}
                  className="max-w-full max-h-[70vh] sm:max-h-[78vh] w-auto h-auto object-contain rounded-xl shadow-lg"
                />

                {showOriginalComparison && (
                  <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase px-3 py-1 bg-amber-500 text-black rounded-lg shadow backdrop-blur">
                    Showing Unadjusted Original
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Edit Controls Toolbar & Sub-tabs */}
            <div className="p-4 pb-[max(2rem,env(safe-area-inset-bottom)+1.5rem)] bg-slate-900 border-t border-slate-800 space-y-3">
              {/* Balanced Equal 3-Column Tab Grid with Uniform Height & Typography */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 w-full shadow-inner">
                <button
                  type="button"
                  onClick={() => setEditSubTab('tools')}
                  className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center min-h-[52px] ${
                    editSubTab === 'tools'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-cyan-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eraser className="w-3.5 h-3.5 text-cyan-300 mb-0.5 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight">Clean & Tools</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditSubTab('tone')}
                  className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center min-h-[52px] ${
                    editSubTab === 'tone'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-cyan-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300 mb-0.5 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight">Brightness & Contrast</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditSubTab('filter')}
                  className={`py-2 px-1 rounded-xl transition flex flex-col items-center justify-center min-h-[52px] ${
                    editSubTab === 'filter'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-cyan-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Wand2 className="w-3.5 h-3.5 text-cyan-300 mb-0.5 shrink-0" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-center leading-tight">Filters</span>
                </button>
              </div>

              {/* Hold to Compare Strip */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-400">
                  {editSubTab === 'tools' && 'Smart Document Cleanup (Real-Time):'}
                  {editSubTab === 'tone' && 'Adjust Brightness & Contrast (Real-Time):'}
                  {editSubTab === 'filter' && 'Select Document Enhancement Filter:'}
                </span>
                <button
                  type="button"
                  onMouseDown={() => setShowOriginalComparison(true)}
                  onMouseUp={() => setShowOriginalComparison(false)}
                  onTouchStart={() => setShowOriginalComparison(true)}
                  onTouchEnd={() => setShowOriginalComparison(false)}
                  className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-cyan-300 text-[11px] font-extrabold rounded-xl border border-slate-800 transition flex items-center space-x-1 active:scale-95 shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Hold to Compare</span>
                </button>
              </div>

              {/* Sub-tab 1: Smart Cleanup & Tools */}
              {editSubTab === 'tools' && (
                <div className="space-y-3 pt-1">
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="whitespace-nowrap">Smart Document Cleanup Beta version</span>
                    </div>

                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setRemoveShadow((prev) => !prev)}
                        className={`w-full px-4 py-3 rounded-xl border text-xs font-extrabold transition flex items-center justify-center space-x-2 shadow-sm active:scale-95 ${
                          removeShadow
                            ? 'bg-amber-500/25 text-amber-300 border-amber-500/80 ring-2 ring-amber-400/40'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                        }`}
                      >
                        <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="truncate">{removeShadow ? '✓ Shadow Removal Active' : 'Remove Shadow'}</span>
                      </button>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setCurrentStep('crop')}
                        className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded-xl border border-cyan-800/60 text-xs font-extrabold transition flex items-center justify-center space-x-1.5 shadow"
                      >
                        <Crop className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Re-Adjust 4 Crop Corners</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Brightness & Contrast Controls */}
              {editSubTab === 'tone' && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center space-x-1.5 overflow-x-auto py-1 scrollbar-thin">
                    <button
                      type="button"
                      onClick={() => setPresetTone(15, 20, 0)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-cyan-300 rounded-lg border border-slate-800 text-[11px] font-bold shrink-0"
                    >
                      Boost Text
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetTone(20, 10, -10)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-yellow-300 rounded-lg border border-slate-800 text-[11px] font-bold shrink-0"
                    >
                      Whiten Paper
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetTone(0, 35, 0)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-emerald-300 rounded-lg border border-slate-800 text-[11px] font-bold shrink-0"
                    >
                      High Contrast Ink
                    </button>
                    <button
                      type="button"
                      onClick={() => setPresetTone(0, 0, 0)}
                      className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-400 rounded-lg border border-slate-800 text-[11px] font-bold shrink-0"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                        <span className="flex items-center space-x-1">
                          <Sun className="w-3 h-3 text-yellow-400" />
                          <span>Brightness</span>
                        </span>
                        <span className="text-yellow-400 font-black">{brightness > 0 ? `+${brightness}` : brightness}</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={brightness}
                        onChange={(e) => setBrightness(Number(e.target.value))}
                        className="w-full accent-yellow-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                        <span className="flex items-center space-x-1">
                          <ContrastIcon className="w-3 h-3 text-cyan-400" />
                          <span>Contrast</span>
                        </span>
                        <span className="text-cyan-400 font-black">{contrast > 0 ? `+${contrast}` : contrast}</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={contrast}
                        onChange={(e) => setContrast(Number(e.target.value))}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                        <span className="flex items-center space-x-1">
                          <Sliders className="w-3 h-3 text-emerald-400" />
                          <span>Mid-Tone Balance</span>
                        </span>
                        <span className="text-emerald-400 font-black">{midTone > 0 ? `+${midTone}` : midTone}</span>
                      </div>
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        value={midTone}
                        onChange={(e) => setMidTone(Number(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Document Filters */}
              {editSubTab === 'filter' && (
                <div className="flex items-center space-x-2.5 overflow-x-auto py-1 scrollbar-thin">
                  {[
                    { id: 'none', label: '📷 Original (Zero Loss)' },
                    { id: 'flatten', label: '✨ Flatten & Remove Wrinkles' },
                    { id: 'bw', label: '📄 Soft B&W' },
                    { id: 'color', label: '🎨 High Contrast' },
                    { id: 'grayscale', label: '🌙 Grayscale' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFilter(f.id as any)}
                      className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition whitespace-nowrap shrink-0 ${
                        selectedFilter === f.id
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-cyan-400/50'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Primary Confirm Button at Bottom of Scrollable View */}
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleSavePageEdits}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 transition transform active:scale-98"
                >
                  <CheckCircle2 className="w-5 h-5 text-slate-950" />
                  <span>Confirm Page Edits & Continue ➔</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: SCAN SUMMARY & EXPORT OPTIONS ================= */}
      {currentStep === 'summary' && (
        <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 overflow-hidden">
          {/* Top Bar Pushed Down Below Status Bar */}
          <div className="pt-[max(2rem,env(safe-area-inset-top)+1rem)] px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Scanned Document Package</h3>
                <p className="text-xs text-slate-400">{pages.length} {pages.length === 1 ? 'Page' : 'Pages'} Scanned & Processed</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Pages Tray Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl mx-auto w-full">
            {/* Custom File Name Input Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center space-x-2.5 w-full sm:w-auto">
                <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Document File Name</span>
                  <span className="text-[10px] text-slate-400">Specify name before saving to phone or PDF editor</span>
                </div>
              </div>
              <input
                type="text"
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                placeholder="e.g. My_Scanned_Invoice"
                className="w-full sm:w-80 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-3.5 py-2 text-xs font-extrabold text-cyan-300 outline-none transition shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-400">Document Pages Overview</h4>
              <button
                onClick={() => setCurrentStep('camera')}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg flex items-center space-x-1.5 transition transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Page</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {pages.map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => openEditStepForPage(p, idx)}
                  className={`group relative bg-slate-900 border-2 rounded-2xl overflow-hidden cursor-pointer transition transform hover:scale-105 ${
                    activePageIndex === idx ? 'border-cyan-400 shadow-xl ring-2 ring-cyan-400/40' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="aspect-[3/4] w-full overflow-hidden bg-black relative">
                    <img
                      src={p.dataUrl}
                      alt={`Page ${idx + 1}`}
                      className="w-full h-full object-contain"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                    />
                    <span className="absolute bottom-2 left-2 text-[10px] font-black px-2 py-0.5 bg-slate-950/90 text-cyan-300 rounded-lg border border-cyan-500/30">
                      Page {idx + 1}
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-950 flex items-center justify-between border-t border-slate-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditStepForPage(p, idx);
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[11px] font-bold rounded-lg border border-slate-700 flex items-center space-x-1"
                    >
                      <Crop className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotatePage(idx);
                        }}
                        className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700"
                        title="Rotate Page"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(idx);
                        }}
                        className="p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg border border-rose-800/60"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Action Bar Footer - Compact Sleek Proportional Buttons */}
          <div className="p-3.5 pb-[max(1.5rem,env(safe-area-inset-bottom)+1rem)] bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5 max-w-4xl mx-auto w-full">
            <button
              onClick={() => setCurrentStep('camera')}
              className="w-full sm:w-auto px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-extrabold rounded-xl border border-slate-700 transition flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Snap More Pages</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleDownloadImages('jpg')}
                disabled={pages.length === 0}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl border border-slate-700 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                title="Save as JPG images (Save to Phone or Cloud)"
              >
                <Download className="w-3.5 h-3.5 text-yellow-400" />
                <span>Download JPG</span>
              </button>

              <button
                onClick={() => handleDownloadImages('png')}
                disabled={pages.length === 0}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl border border-slate-700 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                title="Save as PNG images (Save to Phone or Cloud)"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download PNG</span>
              </button>

              <button
                onClick={handleExportScannedPDF}
                disabled={pages.length === 0 || isAssembling}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold rounded-xl shadow-md transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
                title="Save PDF to Phone Storage or Cloud Drive"
              >
                <Save className="w-3.5 h-3.5 text-white" />
                <span>Save PDF</span>
              </button>

              <div className="relative group p-[1.5px] rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-lg hover:shadow-cyan-500/40 transition-all duration-300 flex-1 sm:flex-none">
                <button
                  onClick={handleAssemblePDF}
                  disabled={pages.length === 0 || isAssembling}
                  className="w-full px-3.5 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-extrabold rounded-[10px] transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1.5"
                  title="Open scanned document directly in PDF Editor Workspace"
                >
                  {isAssembling ? (
                    <span>Opening Editor...</span>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Open in Editor</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Universal Export Save Modal (Save to Phone vs Share / Cloud Drive) */}
      <ExportSaveModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        initialFileName={exportModalFileName}
        files={exportModalFiles}
        mimeType={exportModalMimeType}
        title={exportModalTitle}
        onSaveSuccess={(msg) => {
          setScannerToast(msg);
          setTimeout(() => setScannerToast(null), 4000);
        }}
      />

      {/* Scanner Storage Toast Alert */}
      {scannerToast && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[110] bg-emerald-950/95 border border-emerald-500/60 text-emerald-100 px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center space-x-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{scannerToast}</span>
        </div>
      )}
      {/* Hidden Native Phone Camera 4K Launcher Input */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Hidden Gallery / File Upload Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};
