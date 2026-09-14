import { describe, expect, it } from 'vitest';

import { BoundedStreamAccumulator } from '../../apps/web/src/sandbox/bounded-stream-accumulator';

describe('BoundedStreamAccumulator', () => {
  it('accumulates small output without truncation', () => {
    const accumulator = new BoundedStreamAccumulator(100);
    accumulator.append('hello ');
    accumulator.append('world\n');

    expect(accumulator.result).toEqual({
      preview: 'hello world\n',
      bytes: 12,
      truncated: false,
    });
  });

  it('bounds memory and records exact total bytes when stream exceeds limit', () => {
    const accumulator = new BoundedStreamAccumulator(10);
    accumulator.append('12345');
    accumulator.append('67890');
    accumulator.append('extra-bytes-should-not-expand-buffer');

    const result = accumulator.result;
    expect(result.preview).toBe('1234567890');
    expect(result.bytes).toBe(46);
    expect(result.truncated).toBe(true);
  });

  it('handles binary Buffer chunks and multi-byte UTF-8 correctly', () => {
    const accumulator = new BoundedStreamAccumulator(1024);
    const chunk1 = Buffer.from('foo');
    const chunk2 = Buffer.from('bar');

    accumulator.append(chunk1);
    accumulator.append(chunk2);

    expect(accumulator.result).toEqual({
      preview: 'foobar',
      bytes: 6,
      truncated: false,
    });
  });

  it('correctly reassembles multi-byte UTF-8 split across byte-by-byte chunk boundaries', () => {
    const accumulator = new BoundedStreamAccumulator(1024);
    // '🥑' is 4 bytes: 0xf0 0x9f 0xa5 0x91
    const emojiBytes = Buffer.from('🥑');
    expect(emojiBytes.length).toBe(4);

    for (const byte of emojiBytes) {
      accumulator.append(Buffer.from([byte]));
    }

    const result = accumulator.result;
    expect(result.preview).toBe('🥑');
    expect(result.bytes).toBe(4);
    expect(result.truncated).toBe(false);
  });

  it('handles output exactly at the byte limit without marking it truncated', () => {
    const accumulator = new BoundedStreamAccumulator(10);
    accumulator.append('1234567890');

    const result = accumulator.result;
    expect(result.preview).toBe('1234567890');
    expect(result.bytes).toBe(10);
    expect(result.truncated).toBe(false);
  });

  it('marks output truncated when exactly one byte exceeds the limit', () => {
    const accumulator = new BoundedStreamAccumulator(10);
    accumulator.append('12345678901'); // 11 bytes

    const result = accumulator.result;
    expect(result.preview).toBe('1234567890');
    expect(result.bytes).toBe(11);
    expect(result.truncated).toBe(true);
  });

  it('keeps stdout and stderr accumulators strictly isolated from one another', () => {
    const stdout = new BoundedStreamAccumulator(5);
    const stderr = new BoundedStreamAccumulator(5);

    stdout.append('1234567'); // 7 bytes -> truncated
    stderr.append('abc'); // 3 bytes -> not truncated

    expect(stdout.result).toEqual({
      preview: '12345',
      bytes: 7,
      truncated: true,
    });

    expect(stderr.result).toEqual({
      preview: 'abc',
      bytes: 3,
      truncated: false,
    });
  });
});
