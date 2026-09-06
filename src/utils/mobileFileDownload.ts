import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface DownloadOptions {
  fileName: string;
  blob: Blob;
  mimeType?: string;
}

/**
 * Helper to convert Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || dataUrl;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
}

/**
 * Robust file downloader that works seamlessly on desktop, iOS, Android WebViews, and mobile PWA.
 * On native Android/iOS (Capacitor), uses Filesystem + Share API so native save/share sheets open instantly.
 */
export async function downloadFile(options: DownloadOptions): Promise<void> {
  const { fileName, blob, mimeType = blob.type || 'application/octet-stream' } = options;

  // 1. Native Capacitor (Android / iOS app)
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      if (await Share.canShare()) {
        await Share.share({
          title: fileName,
          text: `Export ${fileName}`,
          url: savedFile.uri,
          dialogTitle: `Save or Share ${fileName}`,
        });
      } else {
        // Fallback to Documents directory
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });
      }
      return;
    } catch (nativeErr) {
      console.warn('Capacitor native download error, falling back:', nativeErr);
    }
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (typeof window !== 'undefined' && window.innerWidth < 768);

  // 2. Web Share API (Mobile Web Browsers)
  if (isMobile && typeof navigator !== 'undefined' && navigator.share) {
    try {
      const file = new File([blob], fileName, { type: mimeType });
      if (!navigator.canShare || navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: `Download ${fileName}`,
        });
        return;
      }
    } catch (shareErr: any) {
      if (shareErr?.name === 'AbortError') return;
      console.warn('Web Share API failed, falling back:', shareErr);
    }
  }

  // 3. Desktop File System Access API
  if ('showSaveFilePicker' in window && !isMobile) {
    try {
      const ext = fileName.split('.').pop() || 'pdf';
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: `${ext.toUpperCase()} File`,
            accept: { [mimeType]: [`.${ext}`] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (pickerErr: any) {
      if (pickerErr?.name === 'AbortError') return;
      console.warn('showSaveFilePicker failed, falling back:', pickerErr);
    }
  }

  // 4. Standard Browser Link Download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Universal print handler for PDF document blobs on Mobile & Desktop.
 */
export async function printPdfBlob(blob: Blob, fileName: string = 'document.pdf'): Promise<void> {
  // Native Capacitor App
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await blobToBase64(blob);
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });
      await Share.share({
        title: fileName,
        url: savedFile.uri,
        dialogTitle: `Print ${fileName}`,
      });
      return;
    } catch (nativeErr) {
      console.warn('Capacitor native print fallback:', nativeErr);
    }
  }

  const blobUrl = URL.createObjectURL(blob);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (typeof window !== 'undefined' && window.innerWidth < 768);

  if (isMobile) {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: fileName,
            text: `Print ${fileName}`,
          });
          URL.revokeObjectURL(blobUrl);
          return;
        }
      } catch (shareErr: any) {
        if (shareErr?.name === 'AbortError') {
          URL.revokeObjectURL(blobUrl);
          return;
        }
      }
    }

    const printWin = window.open(blobUrl, '_blank');
    if (printWin) {
      printWin.focus();
      setTimeout(() => {
        try {
          printWin.print();
        } catch (e) {
          console.log('Mobile print window:', e);
        }
      }, 600);
      return;
    }
  }

  // Desktop / Standard iframe print method
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = blobUrl;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Print iframe error:', e);
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        URL.revokeObjectURL(blobUrl);
      }, 3000);
    }, 300);
  };
}
