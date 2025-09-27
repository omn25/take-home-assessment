/**
 * Phone number formatting and validation utilities
 * 
 * This module provides functions for formatting, validating, and cleaning
 * phone numbers and email addresses used throughout the contacts application.
 * Also includes input sanitization for security.
 */

/**
 * Sanitizes user input to prevent XSS attacks
 * 
 * Purpose: Removes potentially dangerous HTML/script content from user inputs
 * to prevent cross-site scripting (XSS) attacks while preserving safe text.
 * 
 * Contract:
 * - Preconditions: input is a string (can be empty or null)
 * - Postconditions: Returns sanitized string safe for display
 * - Side Effects: None (pure function)
 * - Security: Removes script tags and dangerous HTML
 * 
 * @param input - Raw user input string
 * @returns Sanitized string safe for display
 * @example sanitizeInput('<script>alert("xss")</script>Hello') // Returns 'Hello'
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Formats a phone number for display as (XXX) XXX-XXXX
 * 
 * Purpose: Converts raw phone number strings into a standardized, human-readable format
 * for display in the UI. Handles various input formats and normalizes to US format.
 * 
 * Contract:
 * - Preconditions: phone is a string (can be empty or null)
 * - Postconditions: Returns formatted string or original if invalid
 * - Side Effects: None (pure function)
 * - Error Handling: Returns original string for invalid inputs
 * 
 * @param phone - Raw phone number string
 * @returns Formatted phone number or original string if invalid
 * @example formatPhoneNumber('1234567890') // Returns '(123) 456-7890'
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for 10-digit numbers
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  // For other lengths, return as-is
  return phone;
}

/**
 * Validates if a phone number is exactly 10 digits
 * 
 * Purpose: Ensures phone numbers meet the required format for storage and processing.
 * Used in form validation to provide immediate feedback to users.
 * 
 * Contract:
 * - Preconditions: phone is a string (can be empty or null)
 * - Postconditions: Returns boolean validation result
 * - Side Effects: None (pure function)
 * - Validation Rules: Must contain exactly 10 digits after cleaning
 * 
 * @param phone - Phone number string to validate
 * @returns True if valid 10-digit phone number
 * @example validatePhoneNumber('1234567890') // Returns true
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false;
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Must be exactly 10 digits
  return cleaned.length === 10;
}

/**
 * Validates email format using regex
 * 
 * Purpose: Ensures email addresses conform to standard email format requirements.
 * Used in form validation to prevent invalid email submissions.
 * 
 * Contract:
 * - Preconditions: email is a string (can be empty or null)
 * - Postconditions: Returns boolean validation result
 * - Side Effects: None (pure function)
 * - Validation Rules: Must match standard email regex pattern
 * 
 * @param email - Email string to validate
 * @returns True if valid email format
 * @example validateEmail('user@example.com') // Returns true
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Removes all non-digit characters from phone number for storage
 * @param phone - Phone number string to clean
 * @returns Cleaned phone number with only digits
 * @example cleanPhoneNumber('(123) 456-7890') // Returns '1234567890'
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Formats phone number progressively as user types in input field
 * @param phone - Phone number string to format
 * @returns Progressively formatted phone number
 * @example formatPhoneForInput('123456') // Returns '(123) 456'
 */
export function formatPhoneForInput(phone: string): string {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length >= 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length >= 3) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else if (cleaned.length > 0) {
    return `(${cleaned}`;
  }
  
  return cleaned;
}
