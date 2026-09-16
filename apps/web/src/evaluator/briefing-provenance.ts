import { createHash } from 'node:crypto';

const canonicalValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, item]) => [key, canonicalValue(item)]),
    );
  }
  return value;
};

export const briefingSha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');
export const briefingDataSha256 = (value: unknown) =>
  briefingSha256(JSON.stringify(canonicalValue(value)));
