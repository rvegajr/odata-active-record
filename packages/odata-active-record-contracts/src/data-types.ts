/**
 * Date handling interface - single responsibility for date operations
 */
export interface IDateHandler {
  /**
   * Parse a value into a Date object
   * @param value - The value to parse (string, number, Date, etc.)
   * @param format - Optional format string for parsing
   * @returns Date object or null if parsing fails
   */
  parseDate(value: unknown, format?: string): Date | null;

  /**
   * Format a Date object to a string
   * @param date - The Date object to format
   * @param format - The format string (defaults to ISO string)
   * @returns Formatted date string
   */
  formatDate(date: Date, format?: string): string;

  /**
   * Handle timezone conversion
   * @param date - The Date object to convert
   * @param timezone - Target timezone (defaults to UTC)
   * @returns Date object in target timezone
   */
  handleTimezone(date: Date, timezone?: string): Date;

  /**
   * Validate if a value can be parsed as a date
   * @param value - The value to validate
   * @returns True if the value can be parsed as a date
   */
  isValidDate(value: unknown): boolean;
}

/**
 * Number handling interface - single responsibility for number operations
 */
export interface INumberHandler {
  /**
   * Parse a value into a number
   * @param value - The value to parse
   * @returns Number or null if parsing fails
   */
  parseNumber(value: unknown): number | null;

  /**
   * Format a number as currency
   * @param amount - The amount to format
   * @param currency - Currency code (defaults to USD)
   * @returns Formatted currency string
   */
  formatCurrency(amount: number, currency?: string): string;

  /**
   * Handle precision for decimal numbers
   * @param value - The number to round
   * @param precision - Number of decimal places (defaults to 2)
   * @returns Rounded number
   */
  handlePrecision(value: number, precision?: number): number;

  /**
   * Validate if a value can be parsed as a number
   * @param value - The value to validate
   * @returns True if the value can be parsed as a number
   */
  isValidNumber(value: unknown): boolean;
}

/**
 * String handling interface - single responsibility for string operations
 */
export interface IStringHandler {
  /**
   * Sanitize a string value
   * @param value - The value to sanitize
   * @returns Sanitized string
   */
  sanitizeString(value: unknown): string;

  /**
   * Validate email format
   * @param email - The email to validate
   * @returns True if email is valid
   */
  validateEmail(email: string): boolean;

  /**
   * Truncate a string to specified length
   * @param value - The string to truncate
   * @param maxLength - Maximum length
   * @returns Truncated string
   */
  truncateString(value: string, maxLength: number): string;

  /**
   * Validate if a value can be converted to a string
   * @param value - The value to validate
   * @returns True if the value can be converted to a string
   */
  isValidString(value: unknown): boolean;
}

/**
 * Boolean handling interface - single responsibility for boolean operations
 */
export interface IBooleanHandler {
  /**
   * Parse a value into a boolean
   * @param value - The value to parse
   * @returns Boolean value
   */
  parseBoolean(value: unknown): boolean;

  /**
   * Validate if a value can be converted to a boolean
   * @param value - The value to validate
   * @returns True if the value can be converted to a boolean
   */
  isValidBoolean(value: unknown): boolean;
}

/**
 * JSON handling interface - single responsibility for JSON operations
 */
export interface IJsonHandler {
  /**
   * Parse a value as JSON
   * @param value - The value to parse
   * @returns Parsed JSON or null if parsing fails
   */
  parseJSON(value: unknown): unknown;

  /**
   * Validate if a value is valid JSON
   * @param value - The value to validate
   * @returns True if the value is valid JSON
   */
  isValidJSON(value: unknown): boolean;

  /**
   * Stringify a value to JSON
   * @param value - The value to stringify
   * @returns JSON string
   */
  stringifyJSON(value: unknown): string;
}

/**
 * Array handling interface - single responsibility for array operations
 */
export interface IArrayHandler {
  /**
   * Validate and convert a value to an array
   * @param value - The value to validate
   * @param itemType - Optional type validation for array items
   * @returns Array or empty array if validation fails
   */
  validateArray(value: unknown, itemType?: string): unknown[];

  /**
   * Validate if a value is an array
   * @param value - The value to validate
   * @returns True if the value is an array
   */
  isValidArray(value: unknown): boolean;
}

/**
 * Composite data type handler that combines all type handlers
 * This follows ISP by allowing consumers to use only the handlers they need
 */
export interface IDataTypeHandler extends 
  IDateHandler,
  INumberHandler,
  IStringHandler,
  IBooleanHandler,
  IJsonHandler,
  IArrayHandler {
  /**
   * Auto-detect and convert a value to its appropriate type
   * @param value - The value to auto-convert
   * @param targetType - Optional target type hint
   * @returns Converted value
   */
  autoConvert(value: unknown, targetType?: string): unknown;
}
