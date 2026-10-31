import * as pdfjsLib from 'pdfjs-dist';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType
} from 'docx';

interface TextItem {
  str: string;
  x: number;
  top: number;
  width: number;
  height: number;
  fontSize: number;
  isBold: boolean;
  isItalic: boolean;
  color: string;
}

interface LineGroup {
  top: number;
  height: number;
  items: TextItem[];
}

interface ColumnCluster {
  avg: number;
  points: number[];
}

async function extractItemsWithColors(page: any, viewport: any): Promise<TextItem[]> {
  const textContent = await page.getTextContent();
  const opList = await page.getOperatorList();

  const OPS = (pdfjsLib as any).OPS || (page as any).OPS || {};
  const stateStack: { fillRGB: number[]; isRGB: boolean; fillGray: number }[] = [];
  let curState = { fillRGB: [0, 0, 0], isRGB: true, fillGray: 0 };
  const opChars: { char: string; color: string }[] = [];

  const fnArray = opList.fnArray || [];
  const argsArray = opList.argsArray || [];

  for (let i = 0; i < fnArray.length; i++) {
    const fn = fnArray[i];
    const args = argsArray[i];

    if (fn === OPS.save) {
      stateStack.push({ fillRGB: [...curState.fillRGB], isRGB: curState.isRGB, fillGray: curState.fillGray });
    } else if (fn === OPS.restore) {
      if (stateStack.length > 0) curState = stateStack.pop()!;
    } else if (fn === OPS.setFillRGBColor && args && args.length >= 3) {
      curState.fillRGB = [Math.round(args[0]), Math.round(args[1]), Math.round(args[2])];
      curState.isRGB = true;
    } else if (fn === OPS.setFillGray && args && args.length >= 1) {
      curState.fillGray = args[0];
      curState.isRGB = false;
    } else if (fn === OPS.showText || fn === OPS.showSpacedText) {
      let col = '000000';
      if (curState.isRGB) {
        col = curState.fillRGB
          .map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
      } else {
        const g = Math.max(0, Math.min(255, Math.round(curState.fillGray * 255)));
        col = [g, g, g].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
      }

      const glyphs = Array.isArray(args[0]) ? args[0] : [args[0]];
      for (const g of glyphs) {
        const char = typeof g === 'string' ? g : (g && g.unicode ? g.unicode : '');
        for (const c of char) {
          if (c && c.trim()) {
            opChars.push({ char: c, color: col });
          }
        }
      }
    }
  }

  const rawItems = (textContent.items || []).filter((it: any) => it.str && it.str.trim().length > 0);
  let opIdx = 0;

  const items: TextItem[] = rawItems.map((it: any) => {
    const x = it.transform[4];
    const yFromBottom = it.transform[5];
    const top = viewport.height - yFromBottom;
    const fontSize = Math.hypot(it.transform[0], it.transform[1]) || it.height || 10;
    const fontName = (it.fontName || '').toLowerCase();
    const isBold =
      fontName.includes('bold') ||
      fontName.includes('black') ||
      fontName.includes('heavy') ||
      fontName.includes('semibold');
    const isItalic = fontName.includes('italic') || fontName.includes('oblique');

    const cleanStr = it.str.replace(/\s+/g, '');
    let color = '000000';
    if (opIdx < opChars.length) {
      color = opChars[opIdx].color;
      opIdx += cleanStr.length;
    }

    return {
      str: it.str.trim(),
      x,
      top,
      width: it.width || 0,
      height: it.height || fontSize,
      fontSize,
      isBold,
      isItalic,
      color
    };
  });

  return items;
}

export async function convertPdfToDocxBlob(
  pdfDoc: any,
  onProgress?: (percent: number) => void
): Promise<Blob> {
  const numPages = pdfDoc.numPages || 1;
  const sections: any[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (onProgress) {
      onProgress(Math.round(((pageNum - 1) / numPages) * 80) + 10);
    }

    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const rawItems = await extractItemsWithColors(page, viewport);

    const pageWidthTwips = Math.round(viewport.width * 20);
    const pageHeightTwips = Math.round(viewport.height * 20);
    const contentWidthTwips = pageWidthTwips - 1800;

    // Check for top banner note (top <= 75 and containing note / %)
    let bannerItem: TextItem | null = null;
    const bodyItems: TextItem[] = [];
    for (const item of rawItems) {
      if (item.top <= 75 && (item.str.toLowerCase().includes('note') || item.str.includes('%'))) {
        bannerItem = item;
      } else {
        bodyItems.push(item);
      }
    }

    bodyItems.sort((a, b) => a.top - b.top || a.x - b.x);

    // Group into visual lines
    const lines: LineGroup[] = [];
    for (const item of bodyItems) {
      let placed = false;
      for (const line of lines) {
        if (Math.abs(line.top - item.top) <= Math.max(3.5, Math.min(line.height, item.height) * 0.55)) {
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

    lines.forEach(l => l.items.sort((a, b) => a.x - b.x));
    lines.sort((a, b) => a.top - b.top);

    const children: any[] = [];

    // 1. Top Banner (Dark Blue bar across top, exactly matching PDFgear)
    if (bannerItem) {
      children.push(
        new Table({
          width: { size: contentWidthTwips, type: WidthType.DXA },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: contentWidthTwips, type: WidthType.DXA },
                  shading: { fill: '283592', type: ShadingType.CLEAR, color: 'auto' },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 80, after: 80 },
                      children: [
                        new TextRun({
                          text: bannerItem.str,
                          font: 'Calibri',
                          size: 15,
                          bold: true,
                          color: 'FFFFFF'
                        })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        })
      );
      children.push(new Paragraph({ text: '', spacing: { before: 100, after: 100 } }));
    }

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      const hasColumns = line.items.length > 1 && line.items[line.items.length - 1].x - line.items[0].x > 140;
      const isItemsTable = line.items.some(it => it.str === 'Description' || it.str === 'Total price');

      if (isItemsTable || hasColumns) {
        const tableLines: LineGroup[] = [line];
        i++;
        while (i < lines.length) {
          const nextLine = lines[i];
          const verticalGap = nextLine.top - tableLines[tableLines.length - 1].top;
          if (verticalGap > 50) break;
          if (nextLine.items.some(it => it.str === 'Bank Details' || it.str === 'Description')) break;
          tableLines.push(nextLine);
          i++;
        }

        const allX: number[] = [];
        for (const tl of tableLines) {
          for (const it of tl.items) allX.push(it.x);
        }
        allX.sort((a, b) => a - b);

        const colClusters: ColumnCluster[] = [];
        for (const x of allX) {
          let placed = false;
          for (const c of colClusters) {
            if (Math.abs(c.avg - x) < 30) {
              c.points.push(x);
              c.avg = c.points.reduce((a, b) => a + b, 0) / c.points.length;
              placed = true;
              break;
            }
          }
          if (!placed) colClusters.push({ avg: x, points: [x] });
        }
        colClusters.sort((a, b) => a.avg - b.avg);

        const colCount = colClusters.length;
        const colWidthsTwips: number[] = [];
        for (let cIdx = 0; cIdx < colCount; cIdx++) {
          const startX = cIdx === 0 ? 0 : (colClusters[cIdx - 1].avg + colClusters[cIdx].avg) / 2;
          const endX =
            cIdx === colCount - 1 ? viewport.width : (colClusters[cIdx].avg + colClusters[cIdx + 1].avg) / 2;
          const fraction = Math.max(0.1, (endX - startX) / viewport.width);
          colWidthsTwips.push(Math.round(contentWidthTwips * fraction));
        }
        const sumWidths = colWidthsTwips.reduce((a, b) => a + b, 0);
        colWidthsTwips[colWidthsTwips.length - 1] += contentWidthTwips - sumWidths;

        const isLineItemsGrid = tableLines[0].items.some(it => it.str === 'Description');

        const rows = tableLines.map((tl, rIdx) => {
          const isHeaderRow = isLineItemsGrid && rIdx === 0;

          const cells: TableCell[] = [];
          for (let cIdx = 0; cIdx < colCount; cIdx++) {
            const cluster = colClusters[cIdx];
            const cellItems = tl.items.filter(it => {
              if (!cluster) return false;
              const closestClusterIdx = colClusters.reduce((bestIdx, curr, idx) => {
                return Math.abs(curr.avg - it.x) < Math.abs(colClusters[bestIdx].avg - it.x) ? idx : bestIdx;
              }, 0);
              return closestClusterIdx === cIdx;
            });

            const runs = cellItems.map((it, idx) => {
              const prefix = idx > 0 ? ' ' : '';
              const fontSizeHalfPts = Math.max(15, Math.min(48, Math.round(it.fontSize * 2.2)));
              return new TextRun({
                text: prefix + it.str,
                font: 'Calibri',
                size: fontSizeHalfPts,
                bold: it.isBold || isHeaderRow || it.fontSize > 11,
                color: it.color
              });
            });

            const align =
              cIdx >= colCount - 2 && tl.items.some(it => it.str.includes('$') || it.str.includes('%'))
                ? AlignmentType.RIGHT
                : AlignmentType.LEFT;

            cells.push(
              new TableCell({
                width: { size: colWidthsTwips[cIdx], type: WidthType.DXA },
                shading: isHeaderRow
                  ? { fill: 'F3F3F3', type: ShadingType.CLEAR, color: 'auto' }
                  : undefined,
                borders: isLineItemsGrid
                  ? {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E0E0E0' },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    }
                  : {
                      top: { style: BorderStyle.NONE },
                      bottom: { style: BorderStyle.NONE },
                      left: { style: BorderStyle.NONE },
                      right: { style: BorderStyle.NONE }
                    },
                children: [
                  new Paragraph({
                    children: runs.length > 0 ? runs : [new TextRun({ text: ' ', size: 14 })],
                    alignment: align,
                    spacing: { before: 60, after: 60 }
                  })
                ]
              })
            );
          }
          return new TableRow({ children: cells });
        });

        children.push(
          new Table({
            width: { size: contentWidthTwips, type: WidthType.DXA },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE }
            },
            rows
          })
        );

        children.push(new Paragraph({ text: '', spacing: { before: 60, after: 60 } }));
      } else {
        // Standard single paragraph
        const runs = line.items.map((it, idx) => {
          const prefix = idx > 0 ? ' ' : '';
          const fontSizeHalfPts = Math.max(15, Math.min(54, Math.round(it.fontSize * 2.2)));
          const isHeading = it.fontSize >= 15;
          return new TextRun({
            text: prefix + it.str,
            font: 'Calibri',
            size: fontSizeHalfPts,
            bold: it.isBold || isHeading,
            italics: it.isItalic,
            color: it.color
          });
        });

        const isCentered =
          line.items.length === 1 &&
          Math.abs(line.items[0].x + line.items[0].width / 2 - viewport.width / 2) < 40;
        const isRight = line.items[line.items.length - 1].x > viewport.width * 0.65;

        children.push(
          new Paragraph({
            children: runs,
            alignment: isCentered ? AlignmentType.CENTER : isRight ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: {
              before: line.items[0].fontSize > 16 ? 160 : 35,
              after: 35
            }
          })
        );

        i++;
      }
    }

    sections.push({
      properties: {
        page: {
          size: { width: pageWidthTwips, height: pageHeightTwips },
          margin: { top: 900, bottom: 900, left: 900, right: 900 }
        }
      },
      children
    });
  }

  if (onProgress) {
    onProgress(95);
  }

  const doc = new Document({ sections });
  return await Packer.toBlob(doc);
}
