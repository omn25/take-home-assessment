/**
 * TypeScript type definitions for the Contacts application
 * 
 * This module defines all the interfaces and types used throughout
 * the contacts management system, including database models, API
 * responses, and form data structures.
 */

/**
 * Represents a contact's email address with metadata
 */
export interface ContactEmail {
  /** Unique identifier for the email record */
  id: string;
  /** ID of the associated contact */
  contact_id: string;
  /** Email address string */
  email: string;
  /** Whether this is the primary email for the contact */
  is_primary: boolean;
  /** ISO timestamp when the email was created */
  created_at: string;
  /** ISO timestamp when the email was last updated */
  updated_at: string;
}

/**
 * Represents a contact's phone number with metadata
 */
export interface ContactPhone {
  /** Unique identifier for the phone record */
  id: string;
  /** ID of the associated contact */
  contact_id: string;
  /** Phone number string (stored as digits only) */
  phone: string;
  /** Whether this is the primary phone for the contact */
  is_primary: boolean;
  /** ISO timestamp when the phone was created */
  created_at: string;
  /** ISO timestamp when the phone was last updated */
  updated_at: string;
}

/**
 * Complete contact model with all associated data
 * Based on the database schema with normalized email/phone tables
 */
export interface Contact {
  /** Unique identifier for the contact */
  id: string;
  /** Full name of the contact */
  name: string;
  /** URL to the contact's profile image */
  image_url: string;
  /** Last contact date in YYYY-MM-DD format */
  last_contact_date: string;
  /** Array of associated email addresses */
  emails: ContactEmail[];
  /** Array of associated phone numbers */
  phones: ContactPhone[];
  /** ISO timestamp when the contact was created */
  created_at: string;
  /** ISO timestamp when the contact was last updated */
  updated_at: string;
}

/**
 * Data structure for creating a new contact
 * Used in form submissions and API requests
 */
export interface CreateContact {
  /** Full name of the contact */
  name: string;
  /** URL to the contact's profile image */
  image_url: string;
  /** Last contact date in YYYY-MM-DD format */
  last_contact_date: string;
  /** Array of email addresses as strings */
  emails: string[];
  /** Array of phone numbers as strings */
  phones: string[];
  /** Index of the primary email in the emails array */
  primaryEmailIndex?: number;
  /** Index of the primary phone in the phones array */
  primaryPhoneIndex?: number;
}

/**
 * Data structure for updating an existing contact
 * All fields are optional for partial updates
 */
export interface UpdateContact {
  /** Full name of the contact */
  name?: string;
  /** URL to the contact's profile image */
  image_url?: string;
  /** Last contact date in YYYY-MM-DD format */
  last_contact_date?: string;
  /** Array of email addresses as strings */
  emails?: string[];
  /** Array of phone numbers as strings */
  phones?: string[];
  /** Index of the primary email in the emails array */
  primaryEmailIndex?: number;
  /** Index of the primary phone in the phones array */
  primaryPhoneIndex?: number;
}

/**
 * Result of duplicate contact checking
 * Used when creating contacts to detect and handle duplicates
 */
export interface DuplicateCheck {
  /** Whether a duplicate contact was found */
  hasDuplicate: boolean;
  /** The existing contact if a duplicate was found */
  existingContact?: Contact;
  /** New information that would be added to the existing contact */
  differences?: {
    emails: string[];
    phones: string[];
  };
}

/**
 * API response for paginated contact lists
 */
export interface ContactsResponse {
  /** Array of contact objects */
  contacts: Contact[];
  /** Total number of contacts matching the query */
  total: number;
  /** Current page number */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
}

/**
 * API response for single contact operations
 */
export interface ContactResponse {
  /** The contact object */
  contact: Contact;
}

/**
 * API error response structure
 */
export interface ErrorResponse {
  /** Error type or code */
  error: string;
  /** Human-readable error message */
  message?: string;
}

/**
 * Search and filtering options for contact queries
 */
export interface ContactFilters {
  /** Search term to match against contact names */
  search?: string;
  /** Page number for pagination */
  page?: number;
  /** Number of items per page */
  limit?: number;
  /** Field to sort by */
  sortBy?: 'name' | 'last_contact_date' | 'created_at';
  /** Sort order (ascending or descending) */
  sortOrder?: 'asc' | 'desc';
}
