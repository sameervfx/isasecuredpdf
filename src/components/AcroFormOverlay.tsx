import React from 'react';
import { AcroFormField, SignatureAnnotation } from '../types/pdf';

interface AcroFormOverlayProps {
  fields: AcroFormField[];
  pageIndex: number;
  canvasWidth: number;
  canvasHeight: number;
  originalWidth: number;
  originalHeight: number;
  pendingSignatureDataUrl?: string | null;
  onUpdateFieldValue: (fieldName: string, value: string | boolean) => void;
  onAddSignatureAtCoords?: (sig: Omit<SignatureAnnotation, 'id'>) => void;
}

export const AcroFormOverlay: React.FC<AcroFormOverlayProps> = ({
  fields,
  pageIndex,
  canvasWidth,
  canvasHeight,
  originalWidth,
  originalHeight,
  pendingSignatureDataUrl,
  onUpdateFieldValue,
  onAddSignatureAtCoords,
}) => {
  const pageFields = fields.filter((f) => f.pageIndex === pageIndex);

  if (pageFields.length === 0 || originalWidth <= 0 || originalHeight <= 0) {
    return null;
  }

  const scaleX = canvasWidth / originalWidth;
  const scaleY = canvasHeight / originalHeight;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
    >
      {pageFields.map((field) => {
        // PDF rect coordinates: x, y (from bottom-left), width, height
        const scaledX = field.rect.x * scaleX;
        const scaledWidth = field.rect.width * scaleX;
        const scaledHeight = field.rect.height * scaleY;
        // Invert Y coordinate because HTML top is PDF top
        const scaledY = (originalHeight - field.rect.y - field.rect.height) * scaleY;

        const isMulti = Boolean(field.isMultiline || scaledHeight >= 24);
        const fontSize = isMulti
          ? Math.max(9, Math.min(scaledHeight * 0.35, 13))
          : Math.max(8, Math.min(scaledHeight * 0.65, 14));

        const hasVal = Boolean(field.value);
        const bgClass = hasVal
          ? 'bg-white text-slate-900 border border-blue-400 focus:border-cyan-600 focus:bg-white focus:ring-2 focus:ring-cyan-500/40'
          : 'bg-blue-100/70 hover:bg-blue-200/80 text-slate-900 border border-blue-400/80 focus:bg-white focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/40';

        const boxW = Math.max(scaledWidth, 8);
        const boxH = Math.max(scaledHeight, 8);

        const targetName = field.fieldName || field.name;

        return (
          <div
            key={field.name}
            className="absolute pointer-events-auto"
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              width: `${boxW}px`,
              height: `${boxH}px`,
            }}
          >
            {field.type === 'text' ? (
              isMulti ? (
                <textarea
                  value={String(field.value || '')}
                  onChange={(e) => onUpdateFieldValue(targetName, e.target.value)}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.25',
                    padding: '2px 4px',
                    resize: 'none',
                    overflowWrap: 'break-word',
                    wordBreak: 'break-word',
                  }}
                  className={`w-full h-full ${bgClass} font-sans font-medium transition outline-none box-border z-20 overflow-hidden shadow-none rounded-sm`}
                  placeholder=""
                />
              ) : (
                <input
                  type="text"
                  value={String(field.value || '')}
                  onChange={(e) => onUpdateFieldValue(targetName, e.target.value)}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: `${boxH}px`,
                    padding: '0 4px',
                  }}
                  className={`w-full h-full ${bgClass} font-sans font-medium transition outline-none box-border leading-none z-20 shadow-none rounded-sm`}
                  placeholder=""
                />
              )
            ) : (
              <input
                type="checkbox"
                checked={Boolean(field.value)}
                onChange={(e) => onUpdateFieldValue(targetName, e.target.checked)}
                className="w-full h-full bg-blue-100/70 border border-blue-400 accent-cyan-600 focus:ring-2 focus:ring-cyan-500 cursor-pointer z-20 shadow-none m-0 p-0 block rounded-sm"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
