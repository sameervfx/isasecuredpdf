export type ToolMode =
  | 'select'
  | 'text'
  | 'form'
  | 'sign'
  | 'rotate'
  | 'checkmark'
  | 'crossmark'
  | 'strikeout'
  | 'draw'
  | 'highlight';

export interface TextAnnotation {
  id: string;
  pageIndex: number;
  x: number; // PDF Points (relative to page height 0,0 bottom-left or top-left converted)
  y: number;
  width?: number;
  height?: number;
  text: string;
  fontSize: number;
  color: string; // Hex e.g. '#000000'
  isRedact: boolean; // Solid white rectangle covering existing text before writing new text
  opacity?: number; // Transparency 0.05 to 1.0
  rotation?: number; // Rotation in degrees e.g. -45, 90
}

export interface SignatureAnnotation {
  id: string;
  pageIndex: number;
  x: number; // PDF points
  y: number;
  width: number;
  height: number;
  dataUrl: string; // PNG Base64
  opacity?: number; // Transparency 0.05 to 1.0
  rotation?: number; // Rotation in degrees e.g. -45, 90
}

export interface StampAnnotation {
  id: string;
  pageIndex: number;
  type: 'checkmark' | 'crossmark';
  x: number;
  y: number;
  size: number; // Size in PDF points
  color: string;
}

export interface StrikeoutAnnotation {
  id: string;
  pageIndex: number;
  x: number;
  y: number;
  width: number;
  thickness: number;
  color: string;
}

export interface FreehandDrawing {
  id: string;
  pageIndex: number;
  points: { x: number; y: number }[]; // PDF points relative to top-left
  color: string;
  thickness: number;
  opacity: number; // 1.0 for Pen, 0.4 for Highlighter
}

export interface AcroFormField {
  name: string;
  fieldName?: string;
  type: 'text' | 'checkbox';
  pageIndex: number;
  value: string | boolean;
  isMultiline?: boolean;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PageInfo {
  pageNumber: number; // 1-indexed
  pageIndex: number;  // 0-indexed
  width: number;       // PDF points at 72 dpi
  height: number;
  rotation: number;    // 0, 90, 180, 270
}

export interface PDFDocumentState {
  fileName: string;
  fileBytes: Uint8Array | null;
  numPages: number;
  pages: PageInfo[];
  pageRotations: Record<number, number>; // pageIndex -> rotation angle
  deletedPages: Set<number>;
  pageOrder: number[]; // Array of original pageIndex values in new sequence
  textAnnotations: TextAnnotation[];
  signatures: SignatureAnnotation[];
  stamps: StampAnnotation[];
  strikeouts: StrikeoutAnnotation[];
  drawings: FreehandDrawing[];
  formFields: AcroFormField[];
}
