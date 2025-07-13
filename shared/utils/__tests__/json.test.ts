/**
 * Unit tests for safe JSON parsing utilities
 */
import { safeParse, safeParseWithResult, smartJsonHandler, betterJsonParse } from '../json';

describe('safeParse', () => {
  test('returns parsed object for valid JSON string', () => {
    const result = safeParse('{"name": "test", "value": 123}');
    expect(result).toEqual({ name: "test", value: 123 });
  });

  test('returns null for invalid JSON string', () => {
    const result = safeParse('{invalid json}');
    expect(result).toBeNull();
  });

  test('returns null for non-string input', () => {
    const result = safeParse({ name: "test" });
    expect(result).toBeNull();
  });

  test('returns null for empty string', () => {
    const result = safeParse('');
    expect(result).toBeNull();
  });

  test('returns null for whitespace-only string', () => {
    const result = safeParse('   ');
    expect(result).toBeNull();
  });

  test('handles array JSON correctly', () => {
    const result = safeParse('[1, 2, 3]');
    expect(result).toEqual([1, 2, 3]);
  });

  test('handles null and undefined inputs', () => {
    expect(safeParse(null)).toBeNull();
    expect(safeParse(undefined)).toBeNull();
  });
});

describe('safeParseWithResult', () => {
  test('returns success result for valid JSON', () => {
    const result = safeParseWithResult('{"test": true}');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ test: true });
    expect(result.error).toBeUndefined();
  });

  test('returns failure result for invalid JSON', () => {
    const result = safeParseWithResult('{bad json}');
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toBeDefined();
  });

  test('returns failure result for non-string input', () => {
    const result = safeParseWithResult(123);
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toBe('Expected string, got number');
  });

  test('returns failure result for empty string', () => {
    const result = safeParseWithResult('');
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.error).toBe('Empty string provided');
  });
});

describe('smartJsonHandler', () => {
  test('returns object as-is when input is already an object', () => {
    const input = { name: "test", value: 123 };
    const result = smartJsonHandler(input);
    expect(result).toBe(input);
  });

  test('parses string input correctly', () => {
    const result = smartJsonHandler('{"name": "test"}');
    expect(result).toEqual({ name: "test" });
  });

  test('returns null for invalid string input', () => {
    const result = smartJsonHandler('{invalid}');
    expect(result).toBeNull();
  });

  test('returns null for primitive types', () => {
    expect(smartJsonHandler(123)).toBeNull();
    expect(smartJsonHandler(true)).toBeNull();
    expect(smartJsonHandler(undefined)).toBeNull();
  });

  test('handles null input correctly', () => {
    const result = smartJsonHandler(null);
    expect(result).toBeNull();
  });

  test('handles array objects correctly', () => {
    const input = [1, 2, 3];
    const result = smartJsonHandler(input);
    expect(result).toBe(input);
  });
});

describe('betterJsonParse', () => {
  test('parses valid JSON correctly', () => {
    const result = betterJsonParse('{"name": "test"}');
    expect(result).toEqual({ name: "test" });
  });

  test('throws descriptive error for non-string input', () => {
    expect(() => betterJsonParse({} as any)).toThrow(/JSON.parse expects a string/);
  });

  test('throws descriptive error for invalid JSON', () => {
    expect(() => betterJsonParse('{invalid}')).toThrow(/Failed to parse JSON/);
  });

  test('includes input preview in error message', () => {
    const longInput = 'x'.repeat(200);
    expect(() => betterJsonParse(longInput)).toThrow(/Input: "x{100}\.\.\."/);
  });
});

// Integration tests to verify the original problem is solved
describe('JSON Parse Bug Prevention', () => {
  test('prevents "[object Object]" error scenario', () => {
    const objectInput = { name: "test" };
    
    // This is the scenario that caused the original bug
    const result = smartJsonHandler(objectInput);
    expect(result).toBe(objectInput);
    expect(typeof result).toBe('object');
  });

  test('handles response object vs string scenarios', () => {
    // Simulating Express response scenarios
    const stringResponse = '{"status": "ok"}';
    const objectResponse = { status: "ok" };
    
    expect(smartJsonHandler(stringResponse)).toEqual({ status: "ok" });
    expect(smartJsonHandler(objectResponse)).toBe(objectResponse);
  });

  test('prevents crashes on malformed data', () => {
    const malformedInputs = [
      '[object Object]',
      'undefined',
      'null',
      '{',
      '}',
      '{"incomplete":',
      123,
      true,
      [],
      {}
    ];

    malformedInputs.forEach(input => {
      expect(() => smartJsonHandler(input)).not.toThrow();
    });
  });
});