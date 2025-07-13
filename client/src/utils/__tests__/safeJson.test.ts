import { safeParse, safeStringify } from '../safeJson';

describe('safeParse', () => {
  test('returns object for good JSON', () => {
    expect(safeParse('{"a":1}')).toEqual({ a: 1 });
  });
  
  test('returns null for object input', () => {
    expect(safeParse({ a: 1 })).toBeNull();
  });
  
  test('returns null for bad JSON string', () => {
    expect(safeParse('{invalid json}')).toBeNull();
  });
  
  test('returns null for non-string input', () => {
    expect(safeParse(123)).toBeNull();
    expect(safeParse(true)).toBeNull();
    expect(safeParse(null)).toBeNull();
    expect(safeParse(undefined)).toBeNull();
  });
  
  test('returns array for valid JSON array', () => {
    expect(safeParse('[1,2,3]')).toEqual([1, 2, 3]);
  });
});

describe('safeStringify', () => {
  test('returns JSON string for valid object', () => {
    expect(safeStringify({ a: 1 })).toBe('{"a":1}');
  });
  
  test('returns "null" for circular references', () => {
    const circular: any = { a: 1 };
    circular.self = circular;
    expect(safeStringify(circular)).toBe('null');
  });
  
  test('handles primitives correctly', () => {
    expect(safeStringify("hello")).toBe('"hello"');
    expect(safeStringify(123)).toBe('123');
    expect(safeStringify(true)).toBe('true');
    expect(safeStringify(null)).toBe('null');
  });
});