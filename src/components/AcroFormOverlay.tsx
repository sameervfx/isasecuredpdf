import React from 'react';
import { AcroFormField, SignatureAnnotation } from '../types/pdf';

interface AcroFormOverlayProps {
  fields: AcroFormField[];
  pageIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  originalWidth: number;
  originalHeight: number;
  rotation?: number;
  unrotatedWidth?: number;
  unrotatedHeight?: number;
  textFontSize?: number;
  textFontFamily?: string;
  textColor?: string;
  textIsRedact?: boolean;
  pendingSignatureDataUrl?: string | null;
  onUpdateFieldValue: (fieldName: string, value: string | boolean) => void;
  onAddSignatureAtCoords?: (sig: Omit<SignatureAnnotation, 'id'>) => void;
  onFocusFormField?: (fieldName: string) => void;
}

export const AcroFormOverlay: React.FC<AcroFormOverlayProps> = ({
  fields,
  pageIndex,
  canvasWidth,
  canvasHeight,
  originalWidth,
  originalHeight,
  rotation = 0,
  unrotatedWidth,
  unrotatedHeight,
  textFontSize = 10,
  textFontFamily,
  textColor = '#000000',
  textIsRedact = false,
  pendingSignatureDataUrl,
  onUpdateFieldValue,
  onAddSignatureAtCoords,
  onFocusFormField,
}) => {
  const [customFontScales, setCustomFontScales] = React.useState<Record<string, number>>({});

  const pageFields = fields.filter((f) => f.pageIndex === pageIndex);

  if (pageFields.length === 0 || originalWidth <= 0 || originalHeight <= 0) {
    return null;
  }

  const scaleX = canvasWidth / originalWidth;
  const scaleY = canvasHeight / originalHeight;

  const rotDeg = (rotation % 360 + 360) % 360;
  const unrotatedW = unrotatedWidth && unrotatedWidth > 0 ? unrotatedWidth : (rotDeg % 180 !== 0 ? originalHeight : originalWidth);
  const unrotatedH = unrotatedHeight && unrotatedHeight > 0 ? unrotatedHeight : (rotDeg % 180 !== 0 ? originalWidth : originalHeight);

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
    >
      {pageFields.map((field) => {
        // PDF rect coordinates: x, y (from bottom-left), width, height
        let pdfLeft = field.rect.x;
        let pdfTop = unrotatedH - field.rect.y - field.rect.height;
        let pdfW = field.rect.width;
        let pdfH = field.rect.height;
        let transformStr = 'none';

        if (rotDeg === 90) {
          pdfLeft = field.rect.y + field.rect.height;
          pdfTop = field.rect.x;
          pdfW = field.rect.width;
          pdfH = field.rect.height;
          transformStr = 'rotate(90deg)';
        } else if (rotDeg === 180) {
          pdfLeft = unrotatedW - field.rect.x;
          pdfTop = field.rect.y + field.rect.height;
          pdfW = field.rect.width;
          pdfH = field.rect.height;
          transformStr = 'rotate(180deg)';
        } else if (rotDeg === 270) {
          pdfLeft = field.rect.y;
          pdfTop = unrotatedW - field.rect.x - field.rect.width;
          pdfW = field.rect.width;
          pdfH = field.rect.height;
          transformStr = 'rotate(270deg)';
        }

        const scaledX = pdfLeft * scaleX;
        const scaledY = pdfTop * scaleY;
        const scaledWidth = pdfW * scaleX;
        const scaledHeight = pdfH * scaleY;

        const isMulti = Boolean(field.isMultiline || scaledHeight >= 24);
        const hasVal = Boolean(field.value);
        const isSigField = field.name.toLowerCase().includes('sig');

        const boxW = Math.max(scaledWidth, 12);
        const boxH = Math.max(scaledHeight, 12);
        const textVal = String(field.value || '');

        const targetName = field.fieldName || field.name;

        const handleFieldClick = () => {
          if (isSigField && pendingSignatureDataUrl && onAddSignatureAtCoords) {
            onAddSignatureAtCoords({
              pageIndex,
              x: field.rect.x,
              y: field.rect.y,
              width: field.rect.width || 150,
              height: field.rect.height || 40,
              dataUrl: pendingSignatureDataUrl,
            });
          }
        };

        // Base document font size is dynamic based on global toolbar textFontSize (default 10pt/14pt)
        const baseDocFontSize = textFontSize * scaleY;

        const userCustomScale = customFontScales[field.name] || 1.0;
        const finalFontSize = baseDocFontSize * userCustomScale;

        const fieldColor = field.fontColor || textColor || '#000000';
        const fieldIsRedact = field.isRedact !== undefined ? field.isRedact : textIsRedact;

        const activeBgClass = fieldIsRedact
          ? 'bg-white text-slate-900 border border-slate-300 font-serif focus:outline-none transition-all duration-150'
          : hasVal
          ? 'bg-white text-black border-b border-black font-serif focus:bg-blue-50 focus:outline-none transition-all duration-150'
          : 'bg-blue-100/70 hover:bg-blue-200/90 text-blue-950 border-b border-blue-500/80 font-serif focus:bg-white focus:outline-none transition-all duration-150';

        return (
          <div
            key={field.name}
            className="absolute pointer-events-auto z-20"
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${boxW}px`,
              height: `${boxH}px`,
              maxWidth: `${boxW}px`,
              maxHeight: `${boxH}px`,
              transform: transformStr !== 'none' ? transformStr : undefined,
              transformOrigin: transformStr !== 'none' ? '0 0' : undefined,
            }}
            onClick={handleFieldClick}
          >
            {field.type === 'text' ? (
              isMulti ? (
                <textarea
                  value={textVal}
                  onFocus={() => onFocusFormField && onFocusFormField(targetName)}
                  onChange={(e) => onUpdateFieldValue(targetName, e.target.value)}
                  style={{
                    fontSize: `${finalFontSize}px`,
                    color: fieldColor,
                    lineHeight: '1.25',
                    padding: '0 2px',
                    resize: 'none',
                    fontFamily: field.fontFamily || textFontFamily || "'Times New Roman', Times, serif",
                    maxWidth: `${boxW}px`,
                    maxHeight: `${boxH}px`,
                  }}
                  className={`w-full h-full pdf-overlay-field ${activeBgClass} font-normal box-border overflow-hidden shadow-none rounded-none`}
                  placeholder={isSigField ? '[ Click to Sign ]' : ''}
                />
              ) : (
                <input
                  type="text"
                  value={textVal}
                  onFocus={() => onFocusFormField && onFocusFormField(targetName)}
                  onChange={(e) => onUpdateFieldValue(targetName, e.target.value)}
                  style={{
                    fontSize: `${finalFontSize}px`,
                    color: fieldColor,
                    padding: '0 2px',
                    lineHeight: `${boxH}px`,
                    fontFamily: field.fontFamily || textFontFamily || "'Times New Roman', Times, serif",
                    maxWidth: `${boxW}px`,
                    maxHeight: `${boxH}px`,
                  }}
                  className={`w-full h-full pdf-overlay-field ${activeBgClass} font-normal box-border shadow-none rounded-none flex items-end pb-0.5 leading-none`}
                  placeholder={isSigField ? '[ Click to Sign ]' : ''}
                />
              )
            ) : (
              <input
                type="checkbox"
                checked={Boolean(field.value)}
                onFocus={() => onFocusFormField && onFocusFormField(targetName)}
                onChange={(e) => onUpdateFieldValue(targetName, e.target.checked)}
                className="w-full h-full bg-blue-100/70 border border-blue-400 accent-blue-600 focus:ring-1 focus:ring-blue-500 cursor-pointer z-20 shadow-none m-0 p-0 block rounded-none"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
