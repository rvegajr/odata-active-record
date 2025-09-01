import { describe, it, expect } from 'vitest';
import type { 
  IDateHandler, 
  INumberHandler, 
  IStringHandler, 
  IBooleanHandler,
  IJsonHandler,
  IArrayHandler,
  IDataTypeHandler 
} from './data-types';

// Mock implementations for testing
class MockDateHandler implements IDateHandler {
  parseDate(value: unknown, format?: string): Date | null {
    if (typeof value === 'string') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    if (value instanceof Date) {
      return value;
    }
    return null;
  }

  formatDate(date: Date, format?: string): string {
    return date.toISOString();
  }

  handleTimezone(date: Date, timezone?: string): Date {
    return date; // Simplified for testing
  }

  isValidDate(value: unknown): boolean {
    return this.parseDate(value) !== null;
  }
}

class MockNumberHandler implements INumberHandler {
  parseNumber(value: unknown): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      if (value.trim() === '') return null;
      const num = Number(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  formatCurrency(amount: number, currency?: string): string {
    return `${currency || 'USD'} ${amount.toFixed(2)}`;
  }

  handlePrecision(value: number, precision?: number): number {
    const p = precision ?? 2;
    return Math.round(value * Math.pow(10, p)) / Math.pow(10, p);
  }

  isValidNumber(value: unknown): boolean {
    return this.parseNumber(value) !== null;
  }
}

class MockStringHandler implements IStringHandler {
  sanitizeString(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    return String(value).trim();
  }

  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  truncateString(value: string, maxLength: number): string {
    return value.length > maxLength ? value.substring(0, maxLength) + '...' : value;
  }

  isValidString(value: unknown): boolean {
    return typeof value === 'string' || typeof value === 'number';
  }
}

class MockBooleanHandler implements IBooleanHandler {
  parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === '1' || lower === 'yes';
    }
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  isValidBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return true;
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      return lower === 'true' || lower === 'false' || lower === '1' || lower === '0' || lower === 'yes' || lower === 'no';
    }
    if (typeof value === 'number') return value === 0 || value === 1;
    return false;
  }
}

class MockJsonHandler implements IJsonHandler {
  parseJSON(value: unknown): unknown {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  }

  isValidJSON(value: unknown): boolean {
    return this.parseJSON(value) !== null;
  }

  stringifyJSON(value: unknown): string {
    return JSON.stringify(value);
  }
}

class MockArrayHandler implements IArrayHandler {
  validateArray(value: unknown, itemType?: string): unknown[] {
    if (Array.isArray(value)) return value;
    return [];
  }

  isValidArray(value: unknown): boolean {
    return Array.isArray(value);
  }
}

class MockDataTypeHandler implements IDataTypeHandler {
  private dateHandler: IDateHandler;
  private numberHandler: INumberHandler;
  private stringHandler: IStringHandler;
  private booleanHandler: IBooleanHandler;
  private jsonHandler: IJsonHandler;
  private arrayHandler: IArrayHandler;

  constructor(
    dateHandler?: IDateHandler,
    numberHandler?: INumberHandler,
    stringHandler?: IStringHandler,
    booleanHandler?: IBooleanHandler,
    jsonHandler?: IJsonHandler,
    arrayHandler?: IArrayHandler
  ) {
    this.dateHandler = dateHandler ?? new MockDateHandler();
    this.numberHandler = numberHandler ?? new MockNumberHandler();
    this.stringHandler = stringHandler ?? new MockStringHandler();
    this.booleanHandler = booleanHandler ?? new MockBooleanHandler();
    this.jsonHandler = jsonHandler ?? new MockJsonHandler();
    this.arrayHandler = arrayHandler ?? new MockArrayHandler();
  }

  // Date methods
  parseDate(value: unknown, format?: string): Date | null {
    return this.dateHandler.parseDate(value, format);
  }

  formatDate(date: Date, format?: string): string {
    return this.dateHandler.formatDate(date, format);
  }

  handleTimezone(date: Date, timezone?: string): Date {
    return this.dateHandler.handleTimezone(date, timezone);
  }

  isValidDate(value: unknown): boolean {
    return this.dateHandler.isValidDate(value);
  }

  // Number methods
  parseNumber(value: unknown): number | null {
    return this.numberHandler.parseNumber(value);
  }

  formatCurrency(amount: number, currency?: string): string {
    return this.numberHandler.formatCurrency(amount, currency);
  }

  handlePrecision(value: number, precision?: number): number {
    return this.numberHandler.handlePrecision(value, precision);
  }

  isValidNumber(value: unknown): boolean {
    return this.numberHandler.isValidNumber(value);
  }

  // String methods
  sanitizeString(value: unknown): string {
    return this.stringHandler.sanitizeString(value);
  }

  validateEmail(email: string): boolean {
    return this.stringHandler.validateEmail(email);
  }

  truncateString(value: string, maxLength: number): string {
    return this.stringHandler.truncateString(value, maxLength);
  }

  isValidString(value: unknown): boolean {
    return this.stringHandler.isValidString(value);
  }

  // Boolean methods
  parseBoolean(value: unknown): boolean {
    return this.booleanHandler.parseBoolean(value);
  }

  isValidBoolean(value: unknown): boolean {
    return this.booleanHandler.isValidBoolean(value);
  }

  // JSON methods
  parseJSON(value: unknown): unknown {
    return this.jsonHandler.parseJSON(value);
  }

  isValidJSON(value: unknown): boolean {
    return this.jsonHandler.isValidJSON(value);
  }

  stringifyJSON(value: unknown): string {
    return this.jsonHandler.stringifyJSON(value);
  }

  // Array methods
  validateArray(value: unknown, itemType?: string): unknown[] {
    return this.arrayHandler.validateArray(value, itemType);
  }

  isValidArray(value: unknown): boolean {
    return this.arrayHandler.isValidArray(value);
  }

  autoConvert(value: unknown, targetType?: string): unknown {
    // If target type is specified, use it
    if (targetType) {
      switch (targetType) {
        case 'date':
          return this.parseDate(value);
        case 'number':
          return this.parseNumber(value);
        case 'boolean':
          return this.parseBoolean(value);
        case 'json':
          return this.parseJSON(value);
        case 'array':
          return this.validateArray(value);
        case 'string':
          return this.sanitizeString(value);
        default:
          break;
      }
    }

    // Auto-detect type based on value
    if (this.isValidArray(value)) {
      return this.validateArray(value);
    }
    if (this.isValidJSON(value)) {
      return this.parseJSON(value);
    }
    if (this.isValidNumber(value)) {
      return this.parseNumber(value);
    }
    if (this.isValidBoolean(value)) {
      return this.parseBoolean(value);
    }
    if (this.isValidDate(value)) {
      return this.parseDate(value);
    }
    
    // Fall back to string
    return this.sanitizeString(value);
  }
}

describe('Data Type Handler Interfaces', () => {
  describe('IDateHandler', () => {
    let handler: IDateHandler;

    beforeEach(() => {
      handler = new MockDateHandler();
    });

    it('should parse valid date strings', () => {
      const result = handler.parseDate('2024-01-01');
      expect(result).toBeInstanceOf(Date);
      // Check that it's a valid date, not specific year due to timezone
      expect(result).not.toBeNull();
    });

    it('should parse Date objects', () => {
      const date = new Date('2024-01-01');
      const result = handler.parseDate(date);
      expect(result).toBe(date);
    });

    it('should return null for invalid dates', () => {
      const result = handler.parseDate('invalid-date');
      expect(result).toBeNull();
    });

    it('should validate date values correctly', () => {
      expect(handler.isValidDate('2024-01-01')).toBe(true);
      expect(handler.isValidDate('invalid-date')).toBe(false);
      expect(handler.isValidDate(new Date())).toBe(true);
    });

    it('should format dates correctly', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      const result = handler.formatDate(date);
      expect(result).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('INumberHandler', () => {
    let handler: INumberHandler;

    beforeEach(() => {
      handler = new MockNumberHandler();
    });

    it('should parse valid numbers', () => {
      expect(handler.parseNumber(42)).toBe(42);
      expect(handler.parseNumber('42')).toBe(42);
      expect(handler.parseNumber('42.5')).toBe(42.5);
    });

    it('should return null for invalid numbers', () => {
      expect(handler.parseNumber('invalid')).toBeNull();
      expect(handler.parseNumber('')).toBeNull();
    });

    it('should format currency correctly', () => {
      expect(handler.formatCurrency(42.5)).toBe('USD 42.50');
      expect(handler.formatCurrency(42.5, 'EUR')).toBe('EUR 42.50');
    });

    it('should handle precision correctly', () => {
      expect(handler.handlePrecision(42.567, 2)).toBe(42.57);
      expect(handler.handlePrecision(42.567)).toBe(42.57);
    });

    it('should validate numbers correctly', () => {
      expect(handler.isValidNumber(42)).toBe(true);
      expect(handler.isValidNumber('42')).toBe(true);
      expect(handler.isValidNumber('invalid')).toBe(false);
    });
  });

  describe('IStringHandler', () => {
    let handler: IStringHandler;

    beforeEach(() => {
      handler = new MockStringHandler();
    });

    it('should sanitize strings correctly', () => {
      expect(handler.sanitizeString('  hello  ')).toBe('hello');
      expect(handler.sanitizeString(42)).toBe('42');
    });

    it('should validate emails correctly', () => {
      expect(handler.validateEmail('test@example.com')).toBe(true);
      expect(handler.validateEmail('invalid-email')).toBe(false);
    });

    it('should truncate strings correctly', () => {
      expect(handler.truncateString('hello world', 5)).toBe('hello...');
      expect(handler.truncateString('hi', 5)).toBe('hi');
    });

    it('should validate strings correctly', () => {
      expect(handler.isValidString('hello')).toBe(true);
      expect(handler.isValidString(42)).toBe(true);
      expect(handler.isValidString(null)).toBe(false);
    });
  });

  describe('IBooleanHandler', () => {
    let handler: IBooleanHandler;

    beforeEach(() => {
      handler = new MockBooleanHandler();
    });

    it('should parse boolean values correctly', () => {
      expect(handler.parseBoolean(true)).toBe(true);
      expect(handler.parseBoolean(false)).toBe(false);
      expect(handler.parseBoolean('true')).toBe(true);
      expect(handler.parseBoolean('1')).toBe(true);
      expect(handler.parseBoolean('yes')).toBe(true);
      expect(handler.parseBoolean('false')).toBe(false);
      expect(handler.parseBoolean('0')).toBe(false);
    });

    it('should handle numbers correctly', () => {
      expect(handler.parseBoolean(1)).toBe(true);
      expect(handler.parseBoolean(0)).toBe(false);
      expect(handler.parseBoolean(42)).toBe(true);
    });
  });

  describe('IJsonHandler', () => {
    let handler: IJsonHandler;

    beforeEach(() => {
      handler = new MockJsonHandler();
    });

    it('should parse JSON strings correctly', () => {
      const result = handler.parseJSON('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should return null for invalid JSON', () => {
      const result = handler.parseJSON('invalid json');
      expect(result).toBeNull();
    });

    it('should validate JSON correctly', () => {
      expect(handler.isValidJSON('{"key": "value"}')).toBe(true);
      expect(handler.isValidJSON('invalid json')).toBe(false);
    });

    it('should stringify values correctly', () => {
      const result = handler.stringifyJSON({ key: 'value' });
      expect(result).toBe('{"key":"value"}');
    });
  });

  describe('IArrayHandler', () => {
    let handler: IArrayHandler;

    beforeEach(() => {
      handler = new MockArrayHandler();
    });

    it('should validate arrays correctly', () => {
      expect(handler.validateArray([1, 2, 3])).toEqual([1, 2, 3]);
      expect(handler.validateArray('not an array')).toEqual([]);
    });

    it('should check if value is array correctly', () => {
      expect(handler.isValidArray([1, 2, 3])).toBe(true);
      expect(handler.isValidArray('not an array')).toBe(false);
    });
  });

  describe('IDataTypeHandler - Auto Conversion', () => {
    let handler: IDataTypeHandler;

    beforeEach(() => {
      handler = new MockDataTypeHandler();
    });

    it('should auto-convert dates', () => {
      const result = handler.autoConvert('2024-01-01T00:00:00.000Z');
      expect(result).toBeInstanceOf(Date);
    });

    it('should auto-convert numbers', () => {
      const result = handler.autoConvert('42');
      expect(result).toBe(42);
    });

    it('should auto-convert booleans', () => {
      const result = handler.autoConvert('true');
      expect(result).toBe(true);
    });

    it('should auto-convert JSON', () => {
      const result = handler.autoConvert('{"key": "value"}');
      expect(result).toEqual({ key: 'value' });
    });

    it('should auto-convert arrays', () => {
      const result = handler.autoConvert([1, 2, 3]);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should fall back to string for unknown types', () => {
      const result = handler.autoConvert('hello world');
      expect(result).toBe('hello world');
    });

    it('should respect target type hints', () => {
      const result = handler.autoConvert('42', 'string');
      expect(result).toBe('42');
    });
  });
});
