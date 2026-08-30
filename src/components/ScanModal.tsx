import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, RefreshCw, Trash2, Check, Download, Image as ImageIcon, Sparkles, Sliders, ShieldCheck, ArrowRight, RotateCw, QrCode, Smartphone, Crop, Scissors, Wand2, Maximize2, RotateCcw, FileText, Eye, Sun, Contrast as ContrastIcon, SlidersHorizontal } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

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
}

interface Point {
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'qr'>('camera');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [isAssembling, setIsAssembling] = useState<boolean>(false);

  // Set default filter to 'none' (📷 Original Zero Loss)
  const [selectedFilter, setSelectedFilter] = useState<'flatten' | 'bw' | 'color' | 'grayscale' | 'none'>('none');
  const [qrScanUrl, setQrScanUrl] = useState<string>('');

  // Brightness, Contrast & Mid-Tone Balance Controls & Live Viewer Modal
  const [brightness, setBrightness] = useState<number>(0);
  const [contrast, setContrast] = useState<number>(0);
  const [midTone, setMidTone] = useState<number>(0);
  const [isToneModalOpen, setIsToneModalOpen] = useState<boolean>(false);
  const [showOriginalComparison, setShowOriginalComparison] = useState<boolean>(false);

  // Interactive Crop & Freehand Polygon Corners (Percentages)
  const [isCropModalOpen, setIsCropModalOpen] = useState<boolean>(false);
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const cropContainerRef = useRef<HTMLDivElement>(null);
  const liveCropCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveToneCanvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR Code URL with Network IP fallback
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

  // Guarantee Video Stream Assignment & Autoplay on Mount
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.warn('Video play error:', err);
      });
    }
  }, [stream, isCameraActive, activeTab]);

  // Mouse & Touch Event Listeners for Freehand Corner Dragging
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
    };

    if (draggingCorner) {
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
  }, [draggingCorner]);

  // Sync Margin Sliders from Freehand Corners
  useEffect(() => {
    setCropLeft(Math.round(Math.min(corners.tl.x, corners.bl.x)));
    setCropRight(Math.round(100 - Math.max(corners.tr.x, corners.br.x)));
    setCropTop(Math.round(Math.min(corners.tl.y, corners.tr.y)));
    setCropBottom(Math.round(100 - Math.max(corners.bl.y, corners.br.y)));
  }, [corners]);

  // Real-Time Live Crop Canvas Render Listener
  useEffect(() => {
    if (!isCropModalOpen || pages.length === 0 || activePageIndex >= pages.length) return;
    const page = pages[activePageIndex];

    const img = new Image();
    img.onload = () => {
      const canvas = liveCropCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const cropX = Math.floor((cropLeft / 100) * img.width);
      const cropY = Math.floor((cropTop / 100) * img.height);
      const cropW = Math.max(50, Math.floor(img.width * (1 - (cropLeft + cropRight) / 100)));
      const cropH = Math.max(50, Math.floor(img.height * (1 - (cropTop + cropBottom) / 100)));

      canvas.width = cropW;
      canvas.height = cropH;

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      applyFilterAndToneToCanvas(ctx, cropW, cropH, page.filter, brightness, contrast, midTone);
    };
    img.src = page.originalDataUrl;
  }, [isCropModalOpen, cropLeft, cropRight, cropTop, cropBottom, activePageIndex, pages, brightness, contrast, midTone]);

  // Real-Time Live Exposure & Tone Fine-Tuning Viewer Listener
  useEffect(() => {
    if (!isToneModalOpen || pages.length === 0 || activePageIndex >= pages.length) return;
    const page = pages[activePageIndex];

    const img = new Image();
    img.onload = () => {
      const canvas = liveToneCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);

      if (!showOriginalComparison) {
        applyFilterAndToneToCanvas(ctx, img.width, img.height, page.filter, brightness, contrast, midTone);
      }
    };
    img.src = page.originalDataUrl;
  }, [isToneModalOpen, brightness, contrast, midTone, showOriginalComparison, activePageIndex, pages]);

  const handleReceivedRemoteScan = (rawDataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      applyFilterAndToneToCanvas(ctx, canvas.width, canvas.height, selectedFilter, 0, 0, 0);
      const filteredDataUrl = canvas.toDataURL('image/png');

      const newPage: ScannedPage = {
        id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        dataUrl: filteredDataUrl,
        originalDataUrl: rawDataUrl,
        filter: selectedFilter,
        rotation: 0,
        brightness: 0,
        contrast: 0,
        midTone: 0,
      };

      setPages((prev) => [...prev, newPage]);
      setActiveTab('camera');
    };
    img.src = rawDataUrl;
  };

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, activeTab]);

  // Request Maximum Native Camera Resolution (4K / 8K / Full Uncompressed Sensor)
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
        },
        audio: false,
      });

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
          'Mobile browsers restrict live video streams on unencrypted HTTP IP addresses. Tap "Snap Photo with Phone Camera" below to use your phone camera app!'
        );
      } else {
        setCameraError(
          'Live camera stream is blocked or unavailable. Tap "Snap Photo with Phone Camera" below to take a picture!'
        );
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

  /**
   * Filter & Tone Adjustments Processing Pipeline
   */
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

    // Step 1: Base Document Filter
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

    // Step 2: Brightness, Contrast & Mid-Tone Balance Fine-Tuning
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

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const w = video.videoWidth || 1920;
    const h = video.videoHeight || 1080;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);
    const rawDataUrl = canvas.toDataURL('image/png');

    applyFilterAndToneToCanvas(ctx, w, h, selectedFilter, brightness, contrast, midTone);
    const filteredDataUrl = canvas.toDataURL('image/png');

    const newPage: ScannedPage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      dataUrl: filteredDataUrl,
      originalDataUrl: rawDataUrl,
      filter: selectedFilter,
      rotation: 0,
      brightness,
      contrast,
      midTone,
    };

    setPages((prev) => [...prev, newPage]);
    setActivePageIndex(pages.length);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const rawDataUrl = evt.target?.result as string;
        if (!rawDataUrl) return;

        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          ctx.drawImage(img, 0, 0);
          applyFilterAndToneToCanvas(ctx, canvas.width, canvas.height, selectedFilter, brightness, contrast, midTone);
          const filteredDataUrl = canvas.toDataURL('image/png');

          const newPage: ScannedPage = {
            id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            dataUrl: filteredDataUrl,
            originalDataUrl: rawDataUrl,
            filter: selectedFilter,
            rotation: 0,
            brightness,
            contrast,
            midTone,
          };

          setPages((prev) => [...prev, newPage]);
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  // Open Tone Fine-Tuning Viewer Modal
  const handleOpenToneModal = () => {
    if (pages.length === 0 || activePageIndex >= pages.length) return;
    const page = pages[activePageIndex];
    setBrightness(page.brightness || 0);
    setContrast(page.contrast || 0);
    setMidTone(page.midTone || 0);
    setIsToneModalOpen(true);
  };

  // Apply Tone Adjustments to active page
  const handleApplyToneAdjustments = () => {
    if (pages.length === 0 || activePageIndex >= pages.length) return;

    const page = pages[activePageIndex];
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      applyFilterAndToneToCanvas(ctx, canvas.width, canvas.height, page.filter, brightness, contrast, midTone);
      const updatedDataUrl = canvas.toDataURL('image/png');

      setPages((prev) =>
        prev.map((p, idx) =>
          idx === activePageIndex
            ? { ...p, brightness, contrast, midTone, dataUrl: updatedDataUrl }
            : p
        )
      );

      setIsToneModalOpen(false);
    };
    img.src = page.originalDataUrl;
  };

  const setPresetTone = (b: number, c: number, m: number) => {
    setBrightness(b);
    setContrast(c);
    setMidTone(m);
  };

  const handleFilterChange = (filter: 'flatten' | 'bw' | 'color' | 'grayscale' | 'none') => {
    setSelectedFilter(filter);
    if (pages.length === 0 || activePageIndex >= pages.length) return;

    const page = pages[activePageIndex];
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(img, 0, 0);
      applyFilterAndToneToCanvas(ctx, canvas.width, canvas.height, filter, brightness, contrast, midTone);
      const updatedDataUrl = canvas.toDataURL('image/png');

      setPages((prev) =>
        prev.map((p, idx) =>
          idx === activePageIndex ? { ...p, filter, dataUrl: updatedDataUrl } : p
        )
      );
    };
    img.src = page.originalDataUrl;
  };

  const handleDeletePage = (index: number) => {
    setPages((prev) => prev.filter((_, idx) => idx !== index));
    if (activePageIndex >= pages.length - 1) {
      setActivePageIndex(Math.max(0, pages.length - 2));
    }
  };

  const handleRotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const handleOpenCropModal = () => {
    if (pages.length === 0 || activePageIndex >= pages.length) return;
    setIsCropModalOpen(true);
  };

  const handleApplyCrop = () => {
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

      applyFilterAndToneToCanvas(ctx, cropW, cropH, page.filter, brightness, contrast, midTone);
      const croppedDataUrl = canvas.toDataURL('image/png');

      setPages((prev) =>
        prev.map((p, idx) =>
          idx === activePageIndex
            ? { ...p, dataUrl: croppedDataUrl, originalDataUrl: croppedDataUrl }
            : p
        )
      );

      setCorners({
        tl: { x: 0, y: 0 },
        tr: { x: 100, y: 0 },
        br: { x: 100, y: 100 },
        bl: { x: 0, y: 100 },
      });
      setIsCropModalOpen(false);
    };
    img.src = page.originalDataUrl;
  };

  const setPresetCrop = (margin: number) => {
    setCorners({
      tl: { x: margin, y: margin },
      tr: { x: 100 - margin, y: margin },
      br: { x: 100 - margin, y: 100 - margin },
      bl: { x: margin, y: 100 - margin },
    });
  };

  const handleDownloadImages = (format: 'jpg' | 'png') => {
    if (pages.length === 0) return;
    pages.forEach((p, idx) => {
      const a = document.createElement('a');
      a.download = `Scanned_Page_${idx + 1}.${format}`;
      a.href = p.dataUrl;
      a.click();
    });
  };

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
      const timeStamp = new Date().toISOString().slice(0, 10);
      const fileName = `Scanned_Document_${timeStamp}.pdf`;

      onScanComplete(pdfBytes, fileName);
      onClose();
    } catch (err: any) {
      console.error('Failed to assemble scanned PDF:', err);
      alert('Failed to generate PDF from scanned images. Please try again.');
    } finally {
      setIsAssembling(false);
    }
  };

  if (!isOpen) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    qrScanUrl
  )}&color=06b6d4&bgbw=0f172a`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4 animate-fadeIn">
      {/* Outer Glowing Gradient Frame Wrapper */}
      <div className="relative p-[2px] rounded-[24px] bg-gradient-to-r from-cyan-500 via-purple-500 to-blue-500 shadow-2xl shadow-cyan-500/20 w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="bg-slate-900 rounded-[22px] w-full overflow-hidden text-slate-100 flex flex-col h-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:px-5 sm:py-3 border-b border-slate-800 bg-slate-950/90 gap-2">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 sm:p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Document Camera Scanner
                </h2>
              </div>

              <button
                onClick={onClose}
                className="sm:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end space-x-2 w-full sm:w-auto">
              <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
                <button
                  onClick={() => setActiveTab('camera')}
                  className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                    activeTab === 'camera'
                      ? 'bg-cyan-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Camera Stream</span>
                </button>

                <button
                  onClick={() => setActiveTab('qr')}
                  className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1 text-xs font-bold rounded-lg transition flex items-center justify-center space-x-1.5 ${
                    activeTab === 'qr'
                      ? 'bg-cyan-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan with Phone QR</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="hidden sm:block p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Viewfinder / Capture Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'camera' ? (
              <>
                {/* Live Native Camera Viewfinder Box */}
                <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-800 aspect-[4/3] sm:aspect-[16/9] flex items-center justify-center group shadow-inner">
                  {isCameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <Camera className="w-12 h-12 text-cyan-400/60 animate-pulse" />
                      <p className="text-xs text-slate-300 max-w-md font-medium leading-relaxed">
                        {cameraError || 'Initializing camera stream...'}
                      </p>
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-xl shadow-cyan-500/30 transition transform active:scale-95 flex items-center space-x-2.5 border border-cyan-400/40"
                      >
                        <Camera className="w-4 h-4 text-white" />
                        <span>📷 Snap Photo with Phone Camera</span>
                      </button>
                    </div>
                  )}

                  {isCameraActive && (
                    <div className="absolute inset-4 border-2 border-dashed border-cyan-400/60 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                      <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                      <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                      <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
                    </div>
                  )}

                  {/* Compact Status Badge in Top-Left Corner Out of Document's Way */}
                  {isCameraActive && (
                    <div className="absolute top-3 left-3 flex items-center space-x-1.5 bg-slate-950/80 px-2.5 py-1 rounded-full border border-cyan-500/40 backdrop-blur-md z-10 pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span className="text-[9px] sm:text-[10px] font-extrabold text-cyan-300">
                        Live Stream Ready
                      </span>
                    </div>
                  )}

                  {isCameraActive && (
                    <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center space-x-4 px-4 z-20">
                      <button
                        onClick={toggleCameraFacing}
                        className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-full border border-slate-700 shadow-lg backdrop-blur-md transition active:scale-95"
                        title="Switch Camera"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={capturePhoto}
                        className="p-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-full shadow-2xl shadow-cyan-500/50 border-2 border-white transition transform active:scale-90 flex items-center justify-center"
                        title="Snap Page"
                      >
                        <div className="w-5 h-5 rounded-full border-2 border-white" />
                      </button>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 bg-slate-900/80 hover:bg-slate-800 text-slate-200 rounded-full border border-slate-700 shadow-lg backdrop-blur-md transition active:scale-95"
                        title="Upload Photo Files from Device Gallery"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Photo Library / File Picker Input (NO capture attribute) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.jpg,.jpeg,.png,.webp"
                  multiple
                  className="hidden"
                />

                {/* Camera Direct Fallback Input (WITH capture attribute) */}
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />

                {/* Filter Selection Bar with Zero Text Overlap & Generous Left Breathing Space */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs gap-2">
                  <span className="text-slate-400 font-bold flex items-center space-x-1.5 shrink-0 sm:pr-2">
                    <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Filter:</span>
                  </span>

                  <div className="flex items-center space-x-2.5 overflow-x-auto pl-3 pr-3 py-1 scrollbar-thin w-full sm:w-auto">
                    {[
                      { id: 'none', label: '📷 Original (Zero Loss)' },
                      { id: 'flatten', label: '✨ Flatten & Remove Wrinkles' },
                      { id: 'bw', label: '📄 Soft B&W' },
                      { id: 'color', label: '🎨 High Contrast' },
                      { id: 'grayscale', label: '🌙 Grayscale' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        onClick={() => handleFilterChange(f.id as any)}
                        className={`px-3.5 py-1.5 rounded-xl font-extrabold text-[11px] transition whitespace-nowrap shrink-0 ${
                          selectedFilter === f.id
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg ring-2 ring-cyan-400/50 scale-105'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Snapped Pages Tray & Exposure/Crop Buttons with Animated Glowing Moving Outlines */}
                {pages.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold text-slate-300 gap-2">
                      <span>Captured Pages ({pages.length})</span>
                      <div className="flex items-center space-x-2">
                        {/* Animated Glowing Moving Outline for Exposure Button */}
                        <div className="relative group p-[1.5px] rounded-xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-md hover:shadow-cyan-500/50 transition-all duration-300">
                          <button
                            onClick={handleOpenToneModal}
                            className={`px-3 py-1.5 text-xs font-bold rounded-[10px] transition flex items-center space-x-1.5 ${
                              brightness !== 0 || contrast !== 0 || midTone !== 0
                                ? 'bg-blue-600 text-white shadow'
                                : 'bg-slate-900 text-slate-200 hover:bg-slate-800'
                            }`}
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-300" />
                            <span>🎛️ Exposure & Mid-Tone</span>
                          </button>
                        </div>

                        {/* Animated Glowing Moving Outline for Freehand Crop Button */}
                        <div className="relative group p-[1.5px] rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400 shadow-md hover:shadow-cyan-500/50 transition-all duration-300">
                          <button
                            onClick={handleOpenCropModal}
                            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs rounded-[10px] shadow-md transition flex items-center space-x-1.5"
                          >
                            <Crop className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Freehand Crop & Trim ✂️</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 overflow-x-auto p-2 bg-slate-950 rounded-xl border border-slate-800 scrollbar-thin">
                      {pages.map((p, idx) => (
                        <div
                          key={p.id}
                          onClick={() => setActivePageIndex(idx)}
                          className={`relative flex-shrink-0 w-20 h-28 rounded-lg overflow-hidden border-2 cursor-pointer transition ${
                            activePageIndex === idx
                              ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-105'
                              : 'border-slate-700 hover:border-slate-500'
                          }`}
                        >
                          <img
                            src={p.dataUrl}
                            alt={`Page ${idx + 1}`}
                            className="w-full h-full object-cover"
                            style={{ transform: `rotate(${p.rotation}deg)` }}
                          />
                          <span className="absolute bottom-1 left-1 text-[9px] font-extrabold px-1.5 py-0.5 bg-slate-950/80 text-white rounded">
                            P{idx + 1}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRotatePage(idx);
                            }}
                            className="absolute top-1 left-1 p-1 bg-slate-900/80 text-cyan-300 hover:text-white rounded transition"
                            title="Rotate Page"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePage(idx);
                            }}
                            className="absolute top-1 right-1 p-1 bg-rose-950/90 text-rose-300 hover:text-white rounded transition"
                            title="Delete Page"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* QR Code Scan with Mobile Phone Tab */
              <div className="flex flex-col items-center justify-center p-6 space-y-6 text-center bg-slate-950 rounded-2xl border border-slate-800">
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 bg-cyan-500/10 text-cyan-300 rounded-full border border-cyan-500/30 text-xs font-bold">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Scan Document Lying Flat on Desk</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Scan with Your Mobile Phone Camera</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Point your iPhone or Android camera at the QR code below. It will open the mobile document scanner on your phone, and the scanned PDF will automatically appear here on your laptop screen!
                  </p>
                </div>

                {/* QR Code Container */}
                <div className="p-4 bg-slate-900 border-2 border-cyan-500/40 rounded-2xl shadow-2xl inline-block ring-4 ring-cyan-500/10">
                  <img
                    src={qrImageUrl}
                    alt="Scan with Phone QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl object-contain mx-auto"
                  />
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Listening for phone scan connection...</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 sm:px-5 sm:py-3.5 border-t border-slate-800 bg-slate-950/90 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center justify-between w-full sm:w-auto space-x-2">
              <button
                onClick={onClose}
                className="px-3.5 sm:px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-1.5 sm:hidden">
                <button
                  onClick={() => handleDownloadImages('jpg')}
                  disabled={pages.length === 0}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition disabled:opacity-50 flex items-center space-x-1"
                  title="Save as JPG"
                >
                  <Download className="w-3.5 h-3.5 text-yellow-400" />
                  <span>JPG</span>
                </button>

                <button
                  onClick={() => handleDownloadImages('png')}
                  disabled={pages.length === 0}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition disabled:opacity-50 flex items-center space-x-1"
                  title="Save as PNG"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>PNG</span>
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleDownloadImages('jpg')}
                disabled={pages.length === 0}
                className="hidden sm:flex px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition disabled:opacity-50 items-center space-x-1.5"
                title="Save all pages as JPG images"
              >
                <Download className="w-3.5 h-3.5 text-yellow-400" />
                <span>Export JPG</span>
              </button>

              <button
                onClick={() => handleDownloadImages('png')}
                disabled={pages.length === 0}
                className="hidden sm:flex px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition disabled:opacity-50 items-center space-x-1.5"
                title="Save all pages as PNG images"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export PNG</span>
              </button>

              {/* Open PDF Button with Glowing Moving Gradient Outline */}
              <div className="relative group p-[1.5px] rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 shadow-xl hover:shadow-cyan-500/50 transition-all duration-300 w-full sm:w-auto">
                <button
                  onClick={handleAssemblePDF}
                  disabled={pages.length === 0 || isAssembling}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2 bg-slate-950 hover:bg-slate-900 text-white text-xs font-extrabold rounded-[10px] transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isAssembling ? (
                    <span>Generating PDF...</span>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>Open PDF in Editor ({pages.length} {pages.length === 1 ? 'Page' : 'Pages'})</span>
                      <ArrowRight className="w-4 h-4 text-cyan-400" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exposure, Brightness & Mid-Tone Live Fine-Tuning Modal */}
      {isToneModalOpen && pages[activePageIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-3 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white">Exposure, Brightness & Mid-Tone Live Fine-Tuning</h3>
              </div>
              <button
                onClick={() => setIsToneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto flex flex-col items-center justify-center bg-black space-y-2">
              <div className="relative flex items-center justify-center max-w-full max-h-[48vh] overflow-hidden rounded-xl border border-cyan-500/40 bg-slate-950 p-2 shadow-2xl">
                <canvas
                  ref={liveToneCanvasRef}
                  className="max-w-full max-h-[45vh] object-contain rounded shadow-lg"
                />

                {showOriginalComparison && (
                  <span className="absolute top-3 left-3 text-[10px] font-extrabold uppercase px-2.5 py-1 bg-amber-500 text-black rounded-lg shadow backdrop-blur">
                    Showing Unadjusted Original
                  </span>
                )}
              </div>

              <button
                onMouseDown={() => setShowOriginalComparison(true)}
                onMouseUp={() => setShowOriginalComparison(false)}
                onTouchStart={() => setShowOriginalComparison(true)}
                onTouchEnd={() => setShowOriginalComparison(false)}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center space-x-1.5 active:scale-95"
              >
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hold to Compare with Original</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Fine-Tuning Presets:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setPresetTone(10, 25, 15)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-700 text-[11px]"
                  >
                    Boost Text
                  </button>
                  <button
                    onClick={() => setPresetTone(20, 15, 10)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-yellow-300 rounded border border-slate-700 text-[11px]"
                  >
                    Whiten Paper
                  </button>
                  <button
                    onClick={() => setPresetTone(0, 35, 0)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 rounded border border-slate-700 text-[11px]"
                  >
                    High Contrast Ink
                  </button>
                  <button
                    onClick={() => setPresetTone(0, 0, 0)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded border border-slate-700 text-[11px]"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                    <span className="flex items-center space-x-1">
                      <Sun className="w-3 h-3 text-yellow-400" />
                      <span>Brightness</span>
                    </span>
                    <span className="text-yellow-400">{brightness > 0 ? `+${brightness}` : brightness}</span>
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
                    <span className="text-cyan-400">{contrast > 0 ? `+${contrast}` : contrast}</span>
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
                    <span className="text-emerald-400">{midTone > 0 ? `+${midTone}` : midTone}</span>
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

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs text-slate-400">Live preview updates in real-time</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsToneModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyToneAdjustments}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Exposure & Tone</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Freehand Polygon & 4-Side Crop Modal with Fluid Mouse & Touch Dragging */}
      {isCropModalOpen && pages[activePageIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 backdrop-blur-md p-3 sm:p-6 animate-fadeIn select-none">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-2">
                <Crop className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Freehand Document Crop & Corner Selector</h3>
              </div>
              <button
                onClick={() => setIsCropModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto grid grid-cols-1 md:grid-cols-2 gap-4 bg-black items-center justify-center">
              <div className="flex flex-col items-center justify-center space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 flex items-center space-x-1">
                  <span>1. Drag Corners or Sliders</span>
                </span>
                <div
                  ref={cropContainerRef}
                  className="relative inline-block max-w-full max-h-[40vh] overflow-hidden rounded-xl border border-slate-800 select-none cursor-crosshair"
                >
                  <img
                    ref={cropImageRef}
                    src={pages[activePageIndex].originalDataUrl}
                    alt="Crop Preview"
                    className="max-w-full max-h-[40vh] object-contain select-none pointer-events-none"
                  />

                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <polygon
                      points={`
                        ${corners.tl.x}%,${corners.tl.y}% 
                        ${corners.tr.x}%,${corners.tr.y}% 
                        ${corners.br.x}%,${corners.br.y}% 
                        ${corners.bl.x}%,${corners.bl.y}%
                      `}
                      className="fill-cyan-500/15 stroke-cyan-400 stroke-2"
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
                      className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full shadow-2xl border-2 border-white flex items-center justify-center text-[10px] font-black z-30 transition-transform ${
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
              </div>

              <div className="flex flex-col items-center justify-center space-y-1.5">
                <span className="text-[11px] font-bold text-cyan-400 flex items-center space-x-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>2. Live Real-Time Crop Result</span>
                </span>
                <div className="relative flex items-center justify-center max-w-full max-h-[40vh] overflow-hidden rounded-xl border border-cyan-500/40 bg-slate-950 p-2 shadow-inner">
                  <canvas
                    ref={liveCropCanvasRef}
                    className="max-w-full max-h-[38vh] object-contain rounded shadow-lg"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Trim Margins (% of Page)</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setPresetCrop(5)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-700 text-[11px]"
                  >
                    Trim 5%
                  </button>
                  <button
                    onClick={() => setPresetCrop(10)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-cyan-300 rounded border border-slate-700 text-[11px]"
                  >
                    Trim 10%
                  </button>
                  <button
                    onClick={() => setPresetCrop(0)}
                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded border border-slate-700 text-[11px]"
                  >
                    Reset Corners
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                    <span>Left Side Trim</span>
                    <span className="text-cyan-400">{cropLeft}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={cropLeft}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCropLeft(val);
                      setCorners((prev) => ({
                        ...prev,
                        tl: { ...prev.tl, x: val },
                        bl: { ...prev.bl, x: val },
                      }));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                    <span>Right Side Trim</span>
                    <span className="text-cyan-400">{cropRight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={cropRight}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCropRight(val);
                      setCorners((prev) => ({
                        ...prev,
                        tr: { ...prev.tr, x: 100 - val },
                        br: { ...prev.br, x: 100 - val },
                      }));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                    <span>Top Side Trim</span>
                    <span className="text-cyan-400">{cropTop}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={cropTop}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCropTop(val);
                      setCorners((prev) => ({
                        ...prev,
                        tl: { ...prev.tl, y: val },
                        tr: { ...prev.tr, y: val },
                      }));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold mb-1">
                    <span>Bottom Side Trim</span>
                    <span className="text-cyan-400">{cropBottom}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={cropBottom}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setCropBottom(val);
                      setCorners((prev) => ({
                        ...prev,
                        bl: { ...prev.bl, y: 100 - val },
                        br: { ...prev.br, y: 100 - val },
                      }));
                    }}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs text-slate-400">Trims out table background & desk edges</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setIsCropModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCrop}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-cyan-500/25 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Freehand Crop</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
