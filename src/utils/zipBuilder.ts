// Zero-dependency PKZIP builder for bundling multiple PDF files in-browser and desktop environments

const makeCrcTable = () => {
  let c;
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
};

const crcTable = makeCrcTable();

export const calculateCrc32 = (data: Uint8Array): number => {
  let crc = 0 ^ -1;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
};

export interface ZipFileEntry {
  name: string;
  data: Uint8Array;
}

export const createZipBundle = (files: ZipFileEntry[]): Uint8Array => {
  const encoder = new TextEncoder();
  const entriesData: {
    fileNameBytes: Uint8Array;
    fileData: Uint8Array;
    crc32: number;
    offset: number;
  }[] = [];

  let currentOffset = 0;
  const parts: Uint8Array[] = [];

  for (const file of files) {
    const fileNameBytes = encoder.encode(file.name);
    const crc = calculateCrc32(file.data);

    const header = new Uint8Array(30 + fileNameBytes.length);
    const view = new DataView(header.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 10, true); // Version needed to extract
    view.setUint16(6, 0, true); // General purpose bit flag
    view.setUint16(8, 0, true); // Compression method (0 = store)
    view.setUint16(10, 0, true); // Last mod file time
    view.setUint16(12, 0, true); // Last mod file date
    view.setUint32(14, crc, true); // CRC-32
    view.setUint32(18, file.data.length, true); // Compressed size
    view.setUint32(22, file.data.length, true); // Uncompressed size
    view.setUint16(26, fileNameBytes.length, true); // File name length
    view.setUint16(28, 0, true); // Extra field length

    header.set(fileNameBytes, 30);

    entriesData.push({
      fileNameBytes,
      fileData: file.data,
      crc32: crc,
      offset: currentOffset,
    });

    parts.push(header);
    parts.push(file.data);

    currentOffset += header.length + file.data.length;
  }

  const centralDirectoryOffset = currentOffset;
  let centralDirectorySize = 0;

  for (const entry of entriesData) {
    const cdHeader = new Uint8Array(46 + entry.fileNameBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central directory file header signature
    view.setUint16(4, 20, true); // Version made by
    view.setUint16(6, 10, true); // Version needed to extract
    view.setUint16(8, 0, true); // General purpose bit flag
    view.setUint16(10, 0, true); // Compression method (0 = store)
    view.setUint16(12, 0, true); // Last mod file time
    view.setUint16(14, 0, true); // Last mod file date
    view.setUint32(16, entry.crc32, true); // CRC-32
    view.setUint32(20, entry.fileData.length, true); // Compressed size
    view.setUint32(24, entry.fileData.length, true); // Uncompressed size
    view.setUint16(28, entry.fileNameBytes.length, true); // File name length
    view.setUint16(30, 0, true); // Extra field length
    view.setUint16(32, 0, true); // File comment length
    view.setUint16(34, 0, true); // Disk number start
    view.setUint16(36, 0, true); // Internal file attributes
    view.setUint32(38, 0, true); // External file attributes
    view.setUint32(42, entry.offset, true); // Relative offset of local header

    cdHeader.set(entry.fileNameBytes, 46);

    parts.push(cdHeader);
    centralDirectorySize += cdHeader.length;
  }

  // End of Central Directory Record
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true); // Number of this disk
  eocdView.setUint16(6, 0, true); // Disk where central directory starts
  eocdView.setUint16(8, entriesData.length, true); // Number of central directory records on this disk
  eocdView.setUint16(10, entriesData.length, true); // Total number of central directory records
  eocdView.setUint32(12, centralDirectorySize, true); // Size of central directory
  eocdView.setUint32(16, centralDirectoryOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true); // Comment length

  parts.push(eocd);

  // Concatenate all parts into single Uint8Array
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }

  return result;
};
