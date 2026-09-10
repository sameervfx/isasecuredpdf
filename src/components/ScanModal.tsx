import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Camera, RefreshCw, Trash2, Check, Download, Image as ImageIcon, Sparkles, Sliders, 
  ShieldCheck, ArrowRight, RotateCw, QrCode, Smartphone, Crop, Scissors, Wand2, Maximize2, 
  RotateCcw, FileText, Eye, Sun, Contrast as ContrastIcon, SlidersHorizontal, Plus, ArrowLeft,
  Timer, Focus, Crosshair
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { downloadFile } from '../utils/mobileFileDownload';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (pdfBytes: Uint8Array, fileName: string) => void;
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
}

interface Point {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
}

const LoupeCanvas: React.FC<{
  imageUrl: string;
  targetPoint: { x: number; y: number };
  label: string;
}> = ({ imageUrl, targetPoint, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
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
}) => {
  // Step state: 'camera' (viewfinder) | 'edit' (post-snap crop & exposure) | 'summary' (pages tray & export)
  const [currentStep, setCurrentStep] = useState<'camera' | 'edit' | 'summary'>('camera');
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

  // Focus & Steady Capture State
  const [focusRingPos, setFocusRingPos] = useState<{ x: number; y: number } | null>(null);
  const [isSteadyMode, setIsSteadyMode] = useState<boolean>(false);
  const [steadyCountdown, setSteadyCountdown] = useState<number | null>(null);

  // Post-snap Edit Controls (Crop, Exposure, Mid-Tone, Filter)
  const [editSubTab, setEditSubTab] = useState<'crop' | 'tone' | 'filter'>('crop');
  const [selectedFilter, setSelectedFilter] = useState<'flatten' | 'bw' | 'color' | 'grayscale' | 'none'>('none');
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [midTone, setMidTone] = useState<number>(0);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);

  // Crop Margin Sliders & Polygon Corners
  const [cropLeft, setCropLeft] = useState<number>(5);
  const [cropRight, setCropRight] = useState<number>(5);
  const [cropTop, setCropTop] = useState<number>(15);
  const [cropBottom, setCropBottom] = useState<number>(15);

  const [corners, setCorners] = useState<{ tl: Point; tr: Point; br: Point; bl: Point }>({
    tl: { x: 5, y: 15 },
    tr: { x: 95, y: 15 },
    br: { x: 95, y: 85 },
    bl: { x: 5, y: 85 },
  });
  const [draggingCorner, setDraggingCorner] = useState<'tl' | 'tr' | 'br' | 'bl' | null>(null);
  const [activeSlider, setActiveSlider] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);

  const [qrScanUrl, setQrScanUrl] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const liveEditCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewfinderRef = useRef<HTMLDivElement>(null);

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
      window.addEventListener('touchmove', handlePointerMove);
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

  // Live Real-Time Canvas Renderer for Post-Snap Edit Step
  useEffect(() => {
    if (currentStep !== 'edit' || pages.length === 0 || activePageIndex >= pages.length) return;
    const page = pages[activePageIndex];

    const img = new Image();
    img.onload = () => {
      const canvas = liveEditCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (showOriginalComparison) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        return;
      }

      const cropX = Math.floor((cropLeft / 100) * img.width);
      const cropY = Math.floor((cropTop / 100) * img.height);
      const cropW = Math.max(50, Math.floor(img.width * (1 - (cropLeft + cropRight) / 100)));
      const cropH = Math.max(50, Math.floor(img.height * (1 - (cropTop + cropBottom) / 100)));

      canvas.width = cropW;
      canvas.height = cropH;

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      applyFilterAndToneToCanvas(ctx, cropW, cropH, selectedFilter, brightness, contrast, midTone);
    };
    img.src = page.originalDataUrl;
  }, [currentStep, editSubTab, cropLeft, cropRight, cropTop, cropBottom, activePageIndex, pages, brightness, contrast, midTone, selectedFilter, showOriginalComparison]);

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
      cropTop: 15,
      cropBottom: 15,
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageIndex(pages.length);
    openEditStepForPage(newPage, pages.length);
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

  const startCamera = async () => {
    setCameraError('');
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
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Interactive Tap to Focus Handler
  const handleTapToFocus = async (e: React.MouseEvent<HTMLDivElement>) => {
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

  // Filter & Tone Processing Engine
  const applyFilterAndToneToCanvas = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    filter: 'flatten' | 'bw' | 'color' | 'grayscale' | 'none',
    bVal: number,
    cVal: number,
    mVal: number
  ) => {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    if (filter === 'flatten') {
      const sampleStep = 8;
      let bgLumSum = 0;
      let count = 0;

      for (let i = 0; i < data.length; i += 4 * sampleStep) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum > 130) {
          bgLumSum += lum;
          count++;
        }
      }
      const avgBg = count > 0 ? bgLumSum / count : 220;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        if (lum > avgBg - 40) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else {
          data[i] = Math.max(0, Math.floor(r * 0.85));
          data[i + 1] = Math.max(0, Math.floor(g * 0.85));
          data[i + 2] = Math.max(0, Math.floor(b * 0.85));
        }
      }
    } else if (filter === 'bw') {
      for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (lum > 140) {
          data[i] = 255;
          data[i + 1] = 255;
          data[i + 2] = 255;
        } else if (lum < 90) {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
        } else {
          const v = Math.floor((lum - 90) * (255 / 50));
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
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

  // Open Edit Step for a Page
  const openEditStepForPage = (page: ScannedPage, index: number) => {
    setActivePageIndex(index);
    setSelectedFilter(page.filter || 'none');
    setBrightness(page.brightness || 0);
    setContrast(page.contrast || 0);
    setMidTone(page.midTone || 0);
    setCropLeft(page.cropLeft !== undefined ? page.cropLeft : 5);
    setCropRight(page.cropRight !== undefined ? page.cropRight : 5);
    setCropTop(page.cropTop !== undefined ? page.cropTop : 15);
    setCropBottom(page.cropBottom !== undefined ? page.cropBottom : 15);

    const cL = page.cropLeft !== undefined ? page.cropLeft : 5;
    const cR = page.cropRight !== undefined ? page.cropRight : 5;
    const cT = page.cropTop !== undefined ? page.cropTop : 15;
    const cB = page.cropBottom !== undefined ? page.cropBottom : 15;

    setCorners({
      tl: { x: cL, y: cT },
      tr: { x: 100 - cR, y: cT },
      br: { x: 100 - cR, y: 100 - cB },
      bl: { x: cL, y: 100 - cB },
    });

    setCurrentStep('edit');
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
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(video, 0, 0, w, h);
    const rawDataUrl = canvas.toDataURL('image/png', 1.0);

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
      cropTop: 15,
      cropBottom: 15,
    };

    stopCamera();
    setPages((prev) => {
      const updated = [...prev, newPage];
      const targetIndex = updated.length - 1;
      setTimeout(() => {
        openEditStepForPage(newPage, targetIndex);
      }, 50);
      return updated;
    });
  };

  // File Upload Handler -> Instantly Opens Post-Snap Edit View
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const rawDataUrl = evt.target?.result as string;
        if (!rawDataUrl) return;

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
          cropTop: 15,
          cropBottom: 15,
        };

        setPages((prev) => {
          const updated = [...prev, newPage];
          if (idx === 0) {
            const targetIndex = updated.length - 1;
            setTimeout(() => {
              openEditStepForPage(newPage, targetIndex);
            }, 50);
          }
          return updated;
        });
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
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cropX = Math.floor((cropLeft / 100) * img.width);
      const cropY = Math.floor((cropTop / 100) * img.height);
      const cropW = Math.max(50, Math.floor(img.width * (1 - (cropLeft + cropRight) / 100)));
      const cropH = Math.max(50, Math.floor(img.height * (1 - (cropTop + cropBottom) / 100)));

      canvas.width = cropW;
      canvas.height = cropH;

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      applyFilterAndToneToCanvas(ctx, cropW, cropH, selectedFilter, brightness, contrast, midTone);
      const editedDataUrl = canvas.toDataURL('image/png');

      setPages((prev) =>
        prev.map((p, idx) =>
          idx === activePageIndex
            ? {
                ...p,
                dataUrl: editedDataUrl,
                filter: selectedFilter,
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

  // Export Images as JPG or PNG
  const handleDownloadImages = async (format: 'jpg' | 'png') => {
    if (pages.length === 0) return;
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const cleanBaseName = exportFileName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Scanned_Document';

    for (let idx = 0; idx < pages.length; idx++) {
      const p = pages[idx];
      const img = new Image();
      await new Promise<void>((resolve) => {
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            if (format === 'jpg') {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            ctx.drawImage(img, 0, 0);
          }
          canvas.toBlob(async (blob) => {
            if (blob) {
              const fileName =
                pages.length === 1
                  ? `${cleanBaseName}.${format}`
                  : `${cleanBaseName}_Page_${idx + 1}.${format}`;
              await downloadFile({ fileName, blob, mimeType });
            }
            resolve();
          }, mimeType, 0.95);
        };
        img.src = p.dataUrl;
      });
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

      const pdfBytes = await pdfDoc.save();
      const cleanBaseName = exportFileName.trim().replace(/[^a-zA-Z0-9_-]/g, '_') || 'Scanned_Document';
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
                    onClick={() => cameraInputRef.current?.click()}
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
            <div className="relative z-40 pt-4 px-4 sm:px-8 pb-[max(2.5rem,env(safe-area-inset-bottom)+1.5rem)] bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-md flex items-center justify-around">
              {/* Flip Camera */}
              <button
                onClick={toggleCameraFacing}
                className="p-3.5 sm:p-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-full border border-slate-700 shadow-xl backdrop-blur-md transition transform active:scale-90 flex flex-col items-center justify-center"
                title="Switch Camera"
              >
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300" />
              </button>

              {/* Native Phone Camera 4K Launcher Button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-full border border-emerald-300/50 shadow-xl shadow-emerald-500/30 backdrop-blur-md transition transform active:scale-90 flex flex-col items-center justify-center group"
                title="Snap Photo with Phone's Native 4K Camera App"
              >
                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>

              {/* Main Glowing Web Shutter Snap Button */}
              <button
                onClick={triggerShutterCapture}
                disabled={!isCameraActive || steadyCountdown !== null}
                className="p-5 sm:p-6 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-full shadow-2xl shadow-cyan-500/60 border-4 border-white transition transform active:scale-85 disabled:opacity-50 flex items-center justify-center relative"
                title={isSteadyMode ? "Snap Steady 2s Focused Photo" : "Snap Document Page"}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-3 border-white bg-white/30" />
              </button>

              {/* Steady Focus Mode Toggle Button */}
              <button
                onClick={() => setIsSteadyMode((prev) => !prev)}
                className={`p-3.5 sm:p-4 rounded-full border shadow-xl backdrop-blur-md transition transform active:scale-90 flex flex-col items-center justify-center ${
                  isSteadyMode
                    ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400/50'
                    : 'bg-slate-900/90 text-slate-400 hover:text-white border-slate-700'
                }`}
                title="Toggle Steady 2s Focus Delay Mode"
              >
                <Timer className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Upload Gallery Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 sm:p-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 rounded-full border border-slate-700 shadow-xl backdrop-blur-md transition transform active:scale-90 relative"
                title="Upload Photo Files"
              >
                <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-300" />
                {pages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow">
                    {pages.length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.jpg,.jpeg,.png,.webp"
            multiple
            className="hidden"
          />
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />
        </div>
      )}

      {/* ================= STEP 2: POST-SNAP CROP, EXPOSURE & TONE FINE-TUNING ================= */}
      {currentStep === 'edit' && pages[activePageIndex] && (
        <div className="flex flex-col w-full h-full bg-slate-950 text-slate-100 overflow-hidden">
          {/* Sleek Modernized Top Header Pushed Down Below Status Bar */}
          <div className="pt-[max(2rem,env(safe-area-inset-top)+1rem)] px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <button
              onClick={() => setCurrentStep('camera')}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">Back</span>
            </button>

            <div className="text-center">
              <h3 className="text-sm font-extrabold text-white tracking-wide">
                Edit Page {activePageIndex + 1} of {pages.length}
              </h3>
            </div>

            <button
              onClick={handleSavePageEdits}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 flex items-center space-x-1.5 transition transform active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>Confirm</span>
            </button>
          </div>

          {/* Main Edit Canvas Viewer Container */}
          <div className="flex-1 relative bg-black flex items-center justify-center p-3 overflow-hidden">
            {editSubTab === 'crop' ? (
              /* Interactive Crop Corner Selector Overlay with Precision Canvas Magnifying Lens */
              <div className="relative inline-block max-w-full max-h-[58vh] select-none cursor-crosshair shadow-2xl bg-slate-950 touch-none">
                <div
                  ref={cropContainerRef}
                  className="relative max-w-full max-h-[58vh] overflow-hidden rounded-2xl border-2 border-cyan-500/40 touch-none"
                >
                  <img
                    src={pages[activePageIndex].originalDataUrl}
                    alt="Crop Source"
                    className="max-w-full max-h-[58vh] object-contain pointer-events-none select-none touch-none"
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
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full shadow-2xl border-2 border-white flex items-center justify-center text-[10px] font-black z-30 transition-transform touch-none ${
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
            ) : (
              /* Real-Time Exposure & Tone Canvas Preview */
              <div className="relative flex items-center justify-center max-w-full max-h-[58vh] overflow-hidden rounded-2xl border-2 border-cyan-500/40 bg-slate-950 p-2 shadow-2xl">
                <canvas
                  ref={liveEditCanvasRef}
                  className="max-w-full max-h-[55vh] object-contain rounded-xl shadow-lg"
                />

                {showOriginalComparison && (
                  <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase px-3 py-1 bg-amber-500 text-black rounded-lg shadow backdrop-blur">
                    Showing Unadjusted Original
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Bottom Edit Controls Toolbar & Sub-tabs */}
          <div className="p-4 pb-[max(2rem,env(safe-area-inset-bottom)+1.5rem)] bg-slate-900 border-t border-slate-800 space-y-3">
            {/* Mobile-Optimized Equal 3-Column Tab Grid */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800/80 w-full shadow-inner">
              <button
                onClick={() => setEditSubTab('crop')}
                className={`py-2.5 px-2 text-[11px] sm:text-xs font-black rounded-xl transition flex items-center justify-center space-x-1.5 ${
                  editSubTab === 'crop'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-cyan-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Scissors className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 shrink-0" />
                <span className="truncate">Crop & Trim</span>
              </button>

              <button
                onClick={() => setEditSubTab('tone')}
                className={`py-2.5 px-2 text-[11px] sm:text-xs font-black rounded-xl transition flex items-center justify-center space-x-1.5 ${
                  editSubTab === 'tone'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-cyan-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 shrink-0" />
                <span className="truncate">Tone & Light</span>
              </button>

              <button
                onClick={() => setEditSubTab('filter')}
                className={`py-2.5 px-2 text-[11px] sm:text-xs font-black rounded-xl transition flex items-center justify-center space-x-1.5 ${
                  editSubTab === 'filter'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-cyan-400/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-300 shrink-0" />
                <span className="truncate">Filters</span>
              </button>
            </div>

            {/* Hold to Compare Strip */}
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold text-slate-400">
                {editSubTab === 'crop' && 'Drag corner handles or margin sliders:'}
                {editSubTab === 'tone' && 'Adjust Brightness, Contrast & Mid-Tone:'}
                {editSubTab === 'filter' && 'Select document enhancement filter:'}
              </span>
              <button
                onMouseDown={() => setShowOriginalComparison(true)}
                onMouseUp={() => setShowOriginalComparison(false)}
                onTouchStart={() => setShowOriginalComparison(true)}
                onTouchEnd={() => setShowOriginalComparison(false)}
                className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-cyan-300 text-[11px] font-extrabold rounded-xl border border-slate-800 transition flex items-center space-x-1 active:scale-95 shrink-0"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hold to Compare</span>
              </button>
            </div>

            {/* Sub-tab 1: Perspective Crop & Margin Sliders Controls */}
            {editSubTab === 'crop' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1">
                    <Crop className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Quick Margin Presets:</span>
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => setPresetCrop(15)}
                      className="px-2 py-0.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 text-[11px] font-extrabold rounded-lg border border-cyan-700/60 shadow"
                    >
                      Default 15%
                    </button>
                    <button
                      onClick={() => setPresetCrop(5)}
                      className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 text-[11px] font-extrabold rounded-lg border border-slate-800"
                    >
                      Trim 5%
                    </button>
                    <button
                      onClick={() => setPresetCrop(10)}
                      className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-cyan-300 text-[11px] font-extrabold rounded-lg border border-slate-800"
                    >
                      Trim 10%
                    </button>
                    <button
                      onClick={() => setPresetCrop(0)}
                      className="px-2 py-0.5 bg-slate-950 hover:bg-slate-800 text-slate-400 text-[11px] font-bold rounded-lg border border-slate-800"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* 4 Fine-Tuning Crop Margin Sliders (Top, Bottom, Left, Right) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                      <span>Top Trim</span>
                      <span className="text-cyan-400">{cropTop}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={cropTop}
                      onMouseDown={() => setActiveSlider('top')}
                      onTouchStart={() => setActiveSlider('top')}
                      onMouseUp={() => setActiveSlider(null)}
                      onTouchEnd={() => setActiveSlider(null)}
                      onChange={(e) => {
                        setActiveSlider('top');
                        handleSliderMarginChange('top', Number(e.target.value));
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                      <span>Bottom Trim</span>
                      <span className="text-cyan-400">{cropBottom}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={cropBottom}
                      onMouseDown={() => setActiveSlider('bottom')}
                      onTouchStart={() => setActiveSlider('bottom')}
                      onMouseUp={() => setActiveSlider(null)}
                      onTouchEnd={() => setActiveSlider(null)}
                      onChange={(e) => {
                        setActiveSlider('bottom');
                        handleSliderMarginChange('bottom', Number(e.target.value));
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                      <span>Left Trim</span>
                      <span className="text-cyan-400">{cropLeft}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={cropLeft}
                      onMouseDown={() => setActiveSlider('left')}
                      onTouchStart={() => setActiveSlider('left')}
                      onMouseUp={() => setActiveSlider(null)}
                      onTouchEnd={() => setActiveSlider(null)}
                      onChange={(e) => {
                        setActiveSlider('left');
                        handleSliderMarginChange('left', Number(e.target.value));
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                      <span>Right Trim</span>
                      <span className="text-cyan-400">{cropRight}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      value={cropRight}
                      onMouseDown={() => setActiveSlider('right')}
                      onTouchStart={() => setActiveSlider('right')}
                      onMouseUp={() => setActiveSlider(null)}
                      onTouchEnd={() => setActiveSlider(null)}
                      onChange={(e) => {
                        setActiveSlider('right');
                        handleSliderMarginChange('right', Number(e.target.value));
                      }}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Confirm Crop & Move directly to Tone & Light */}
                <button
                  onClick={() => setEditSubTab('tone')}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition transform active:scale-98 border border-cyan-400/30 mt-2"
                >
                  <Check className="w-4 h-4 text-cyan-200" />
                  <span>Confirm Crop & Move to Tone & Light ➔</span>
                </button>
              </div>
            )}

            {/* Sub-tab 2: Exposure & Mid-Tone Controls */}
            {editSubTab === 'tone' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-end space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setPresetTone(10, 25, 15)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-cyan-300 rounded-lg border border-slate-800 text-[11px] font-bold shrink-0"
                  >
                    Boost Text
                  </button>
                  <button
                    onClick={() => setPresetTone(20, 15, 10)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-yellow-300 rounded-lg border border-slate-800 text-[11px] font-bold shrink-0"
                  >
                    Whiten Paper
                  </button>
                  <button
                    onClick={() => setPresetTone(0, 35, 0)}
                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-emerald-300 rounded-lg border border-slate-800 text-[11px] font-bold shrink-0"
                  >
                    High Contrast Ink
                  </button>
                  <button
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

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleDownloadImages('jpg')}
                disabled={pages.length === 0}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl border border-slate-700 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-yellow-400" />
                <span>Download JPG</span>
              </button>

              <button
                onClick={() => handleDownloadImages('png')}
                disabled={pages.length === 0}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-extrabold rounded-xl border border-slate-700 transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download PNG</span>
              </button>

              <div className="relative group p-[1.5px] rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-lg hover:shadow-cyan-500/40 transition-all duration-300 flex-1 sm:flex-none">
                <button
                  onClick={handleAssemblePDF}
                  disabled={pages.length === 0 || isAssembling}
                  className="w-full px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-extrabold rounded-[10px] transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-1.5"
                >
                  {isAssembling ? (
                    <span>Exporting PDF...</span>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Export as PDF</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
