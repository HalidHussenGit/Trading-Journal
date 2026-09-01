export interface ZipEntry {
  path: string;
  data: Uint8Array;
}

export class SimpleZip {
  private entries: ZipEntry[] = [];

  public addFile(path: string, content: string | Uint8Array) {
    let bytes: Uint8Array;
    if (typeof content === 'string') {
      bytes = new TextEncoder().encode(content);
    } else {
      bytes = content;
    }
    this.entries.push({ path, data: bytes });
  }

  public async generateBlob(): Promise<Blob> {
    const parts: Uint8Array[] = [];
    const cdEntries: Uint8Array[] = [];
    let offset = 0;

    for (const entry of this.entries) {
      const fileNameBytes = new TextEncoder().encode(entry.path);
      const crc = crc32(entry.data);
      const size = entry.data.length;

      // Local File Header
      const header = new Uint8Array(30 + fileNameBytes.length);
      const view = new DataView(header.buffer);
      view.setUint32(0, 0x04034b50, true); // Local header signature
      view.setUint16(4, 20, true); // Version needed
      view.setUint16(6, 0, true); // General flags
      view.setUint16(8, 0, true); // Compression method (0 = Store)
      view.setUint16(10, 0, true); // Time
      view.setUint16(12, 0, true); // Date
      view.setUint32(14, crc, true); // CRC-32
      view.setUint32(18, size, true); // Compressed size
      view.setUint32(22, size, true); // Uncompressed size
      view.setUint16(26, fileNameBytes.length, true); // File name length
      view.setUint16(28, 0, true); // Extra field length
      header.set(fileNameBytes, 30);

      // Central Directory Header
      const cdHeader = new Uint8Array(46 + fileNameBytes.length);
      const cdView = new DataView(cdHeader.buffer);
      cdView.setUint32(0, 0x02014b50, true); // Central header signature
      cdView.setUint16(4, 20, true); // Version made by
      cdView.setUint16(6, 20, true); // Version needed
      cdView.setUint16(8, 0, true); // General flags
      cdView.setUint16(10, 0, true); // Compression method
      cdView.setUint16(12, 0, true); // Time
      cdView.setUint16(14, 0, true); // Date
      cdView.setUint32(16, crc, true); // CRC-32
      cdView.setUint32(20, size, true); // Compressed size
      cdView.setUint32(24, size, true); // Uncompressed size
      cdView.setUint16(28, fileNameBytes.length, true);
      cdView.setUint16(30, 0, true); // Extra field length
      cdView.setUint16(32, 0, true); // Comment length
      cdView.setUint16(34, 0, true); // Disk number start
      cdView.setUint16(36, 0, true); // Internal attributes
      cdView.setUint32(38, 0, true); // External attributes
      cdView.setUint32(42, offset, true); // Relative offset of local header
      cdHeader.set(fileNameBytes, 46);

      parts.push(header);
      parts.push(entry.data);
      cdEntries.push(cdHeader);

      offset += header.length + entry.data.length;
    }

    const cdOffset = offset;
    let cdSize = 0;
    for (const cd of cdEntries) {
      parts.push(cd);
      cdSize += cd.length;
    }

    // End of Central Directory Record
    const eocd = new Uint8Array(22);
    const eocdView = new DataView(eocd.buffer);
    eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
    eocdView.setUint16(4, 0, true); // Disk number
    eocdView.setUint16(6, 0, true); // Disk with central directory
    eocdView.setUint16(8, this.entries.length, true); // Central directory entries on disk
    eocdView.setUint16(10, this.entries.length, true); // Total central directory entries
    eocdView.setUint32(12, cdSize, true); // Central directory size
    eocdView.setUint32(16, cdOffset, true); // Start offset
    eocdView.setUint16(20, 0, true); // Comment length

    parts.push(eocd);

    return new Blob(parts as any[], { type: 'application/zip' });
  }
}

export async function parseZipBlob(zipBlob: Blob): Promise<Record<string, Uint8Array>> {
  const buffer = await zipBlob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const files: Record<string, Uint8Array> = {};

  let pos = 0;
  while (pos < bytes.length - 30) {
    const sig = view.getUint32(pos, true);
    if (sig === 0x04034b50) { // Local header signature
      const compMethod = view.getUint16(pos + 8, true);
      const compressedSize = view.getUint32(pos + 18, true);
      const nameLen = view.getUint16(pos + 26, true);
      const extraLen = view.getUint16(pos + 28, true);

      const nameBytes = bytes.subarray(pos + 30, pos + 30 + nameLen);
      const filename = new TextDecoder().decode(nameBytes);
      const dataStart = pos + 30 + nameLen + extraLen;
      const fileData = bytes.subarray(dataStart, dataStart + compressedSize);

      if (compMethod === 0) { // Store (Uncompressed)
        files[filename] = fileData;
      }
      pos = dataStart + compressedSize;
    } else {
      pos++;
    }
  }

  return files;
}

// Helper: Standard CRC-32 checksum calculation
function crc32(bytes: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
