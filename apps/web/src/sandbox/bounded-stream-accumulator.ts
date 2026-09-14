export type BoundedStreamResult = Readonly<{
  preview: string;
  bytes: number;
  truncated: boolean;
}>;

export class BoundedStreamAccumulator {
  private readonly maxBytes: number;
  private totalBytes = 0;
  private readonly bufferChunks: Buffer[] = [];
  private currentBufferBytes = 0;

  constructor(maxBytes = 64 * 1024) {
    this.maxBytes = maxBytes;
  }

  append(chunk: Buffer | string): void {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'utf8');
    const chunkLength = buffer.length;

    if (chunkLength === 0) {
      return;
    }

    this.totalBytes += chunkLength;

    if (this.currentBufferBytes < this.maxBytes) {
      const remainingBytes = this.maxBytes - this.currentBufferBytes;
      if (chunkLength <= remainingBytes) {
        this.bufferChunks.push(buffer);
        this.currentBufferBytes += chunkLength;
      } else {
        this.bufferChunks.push(buffer.subarray(0, remainingBytes));
        this.currentBufferBytes += remainingBytes;
      }
    }
  }

  get result(): BoundedStreamResult {
    const combined = Buffer.concat(this.bufferChunks, this.currentBufferBytes);
    return {
      preview: combined.toString('utf8'),
      bytes: this.totalBytes,
      truncated: this.totalBytes > this.maxBytes,
    };
  }
}
