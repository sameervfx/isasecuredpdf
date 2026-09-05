export interface DownloadOptions {
  fileName: string;
  blob: Blob;
  mimeType?: string;
}

/**
 * Robust file downloader that works seamlessly on desktop, iOS Safari, Android WebViews, and mobile PWA.
 * Uses Web Share API on mobile to open native iOS/Android share & save sheets, and falls back to File System Access API or Blob link downloads.
 */
export async function downloadFile(options: DownloadOptions): Promise<void> {
  const { fileName, blob, mimeType = blob.type || 'application/octet-stream' } = options;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (typeof window !== 'undefined' && window.innerWidth < 768);

  // 1. Try Web Share API on mobile devices if file sharing is supported
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
      if (shareErr?.name === 'AbortError') {
        // User cancelled native share sheet
        return;
      }
      console.warn('Web Share API failed, falling back to standard download methods:', shareErr);
    }
  }

  // 2. Try File System Access API (Desktop Chrome / Edge / Opera)
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

  // 3. Fallback: Standard Blob URL <a download> trigger
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up Blob URL after slight delay
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Universal print handler for PDF document blobs on Mobile & Desktop browsers.
 */
export async function printPdfBlob(blob: Blob): Promise<void> {
  const blobUrl = URL.createObjectURL(blob);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (typeof window !== 'undefined' && window.innerWidth < 768);

  if (isMobile) {
    const printWin = window.open(blobUrl, '_blank');
    if (printWin) {
      printWin.focus();
      setTimeout(() => {
        try {
          printWin.print();
        } catch (e) {
          console.log('Mobile print preview window opened:', e);
        }
      }, 500);
    } else {
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
        }, 300);
      };
    }
  } else {
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
}
