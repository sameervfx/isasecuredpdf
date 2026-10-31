import * as XLSX from 'xlsx';

interface RawItem {
  str: string;
  x: number;
  top: number;
  width: number;
  height: number;
}

interface VisualLine {
  top: number;
  height: number;
  items: RawItem[];
}

/**
 * Converts a loaded PDF.js document into a real Microsoft Excel workbook (.xlsx)
 * 100% client-side with zero cloud transmission.
 */
export async function convertPdfToExcelBlob(
  pdfDoc: any,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const numPages = pdfDoc.numPages || 1;
  const wb = XLSX.utils.book_new();

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(Math.round(((pageNum - 1) / numPages) * 85) + 5);
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const rawItems: RawItem[] = (textContent.items || [])
      .filter((it: any) => it.str && it.str.trim().length > 0)
      .map((it: any) => ({
        str: it.str.trim(),
        x: Math.round(it.transform[4]),
        top: Math.round(viewport.height - it.transform[5]),
        width: Math.round(it.width || 0),
        height: Math.round(it.height || 10)
      }));

    if (rawItems.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([['[Blank Page]']]);
      XLSX.utils.book_append_sheet(wb, ws, numPages === 1 ? 'Sheet1' : `Page ${pageNum}`);
      continue;
    }

    // Sort top to bottom, left to right
    rawItems.sort((a, b) => a.top - b.top || a.x - b.x);

    // Group items into visual horizontal lines
    const lines: VisualLine[] = [];
    for (const item of rawItems) {
      let placed = false;
      for (const line of lines) {
        if (Math.abs(line.top - item.top) <= Math.max(4, line.height * 0.6)) {
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

    // Group close items horizontally on the same line into word/cell clusters
    const lineClusters = lines.map((line) => {
      const clusters: { x: number; text: string }[] = [];
      let cur = [line.items[0]];

      for (let i = 1; i < line.items.length; i++) {
        const prev = line.items[i - 1];
        const it = line.items[i];
        if (it.x - (prev.x + prev.width) > 8) {
          clusters.push({
            x: cur[0].x,
            text: cur.map((item) => item.str).join(' ')
          });
          cur = [it];
        } else {
          cur.push(it);
        }
      }
      clusters.push({
        x: cur[0].x,
        text: cur.map((item) => item.str).join(' ')
      });
      return clusters;
    });

    // Detect column anchors across all lines
    const allX: number[] = [];
    lineClusters.forEach((clusters) => {
      clusters.forEach((c) => allX.push(c.x));
    });
    allX.sort((a, b) => a - b);

    const colAnchors: { avg: number; points: number[] }[] = [];
    for (const x of allX) {
      const match = colAnchors.find((a) => Math.abs(a.avg - x) <= 15);
      if (match) {
        match.points.push(x);
        match.avg = match.points.reduce((s, p) => s + p, 0) / match.points.length;
      } else {
        colAnchors.push({ avg: x, points: [x] });
      }
    }
    colAnchors.sort((a, b) => a.avg - b.avg);

    // Map each line to row cells
    const rows: string[][] = [];
    for (const clusters of lineClusters) {
      const row = new Array(colAnchors.length).fill('');
      for (const c of clusters) {
        let bestCol = 0;
        let minDiff = 99999;
        for (let ci = 0; ci < colAnchors.length; ci++) {
          const diff = Math.abs(colAnchors[ci].avg - c.x);
          if (diff < minDiff) {
            minDiff = diff;
            bestCol = ci;
          }
        }
        if (row[bestCol]) {
          row[bestCol] += ' ' + c.text;
        } else {
          row[bestCol] = c.text;
        }
      }
      rows.push(row);
    }

    // Prune columns that are completely empty
    const activeCols: number[] = [];
    for (let c = 0; c < colAnchors.length; c++) {
      if (rows.some((r) => r[c] && r[c].trim().length > 0)) {
        activeCols.push(c);
      }
    }

    const prunedRows = rows.map((r) => activeCols.map((c) => r[c] || ''));

    // Create Worksheet
    const ws = XLSX.utils.aoa_to_sheet(prunedRows);

    // Compute column widths with padding
    const colWidths = activeCols.map((_, idx) => {
      let maxLen = 8;
      prunedRows.forEach((r) => {
        const val = r[idx] || '';
        if (val.length > maxLen) maxLen = val.length;
      });
      return { wch: Math.min(65, maxLen + 3) };
    });
    ws['!cols'] = colWidths;

    const sheetName = numPages === 1 ? 'Sheet1' : `Page ${pageNum}`;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  if (onProgress) onProgress(95);

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  if (onProgress) onProgress(100);
  return blob;
}
