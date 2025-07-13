// utils/safeJson.ts
export function safeParse<T = unknown>(value: unknown): T | null {
  if (typeof value !== 'string') return null;      // already an object → nothing to parse
  try {
    return JSON.parse(value) as T;
  } catch (err) {
    console.error('🚨 JSON parse failed', { value, err });
    return null;
  }
}

export function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch (err) {
    console.error('🚨 JSON stringify failed', { value, err });
    return 'null';
  }
}