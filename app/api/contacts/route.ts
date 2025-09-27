import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { CreateContact, ContactsResponse, ContactResponse, ErrorResponse, DuplicateCheck } from '@/lib/types';

/**
 * Checks for duplicate contacts by name and compares contact information
 * 
 * Purpose: Prevents duplicate contact creation by checking for existing contacts
 * with the same name and identifying what new information would be added.
 * 
 * Contract:
 * - Preconditions: name is non-empty string, emails and phones are arrays
 * - Postconditions: Returns DuplicateCheck with hasDuplicate flag and differences
 * - Side Effects: Queries database for existing contacts
 * - Error Handling: Returns hasDuplicate: false on database errors
 * 
 * @param name - Contact name to check
 * @param emails - Array of email addresses
 * @param phones - Array of phone numbers
 * @returns Promise<DuplicateCheck> - Duplicate check result with existing contact and differences
 */
async function checkForDuplicate(name: string, emails: string[], phones: string[]): Promise<DuplicateCheck> {
  // Find contacts with the same name
  const { data: existingContacts, error } = await supabase
    .from('contacts')
    .select(`
      id, name, image_url, last_contact_date, created_at, updated_at,
      contact_emails(id, contact_id, email, is_primary, created_at, updated_at),
      contact_phones(id, contact_id, phone, is_primary, created_at, updated_at)
    `)
    .ilike('name', name);

  if (error || !existingContacts || existingContacts.length === 0) {
    return { hasDuplicate: false };
  }

  // For now, return the first match (in a real app, you might want more sophisticated matching)
  const existingContact = existingContacts[0];
  
  // Transform the contact to match the Contact interface
  const transformedContact = {
    ...existingContact,
    emails: existingContact.contact_emails || [],
    phones: existingContact.contact_phones || []
  };
  
  // Check if the only differences are emails/phones
  const existingEmails = existingContact.contact_emails?.map(e => e.email) || [];
  const existingPhones = existingContact.contact_phones?.map(p => p.phone) || [];
  
  const newEmails = emails.filter(email => !existingEmails.includes(email));
  const newPhones = phones.filter(phone => !existingPhones.includes(phone));
  
  return {
    hasDuplicate: true,
    existingContact: transformedContact,
    differences: {
      emails: newEmails,
      phones: newPhones
    }
  };
}

/**
 * GET /api/contacts - Retrieves all contacts with pagination and search functionality
 * 
 * Purpose: Provides a paginated list of contacts with optional search filtering.
 * Supports efficient data loading for large contact lists.
 * 
 * Contract:
 * - Preconditions: Valid NextRequest with optional query parameters
 * - Postconditions: Returns paginated contact list with metadata
 * - Side Effects: Queries database, no state changes
 * - Error Handling: Returns 500 status with error message on failure
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - search: Search term for contact names (optional)
 * 
 * @param request - NextRequest object containing query parameters
 * @returns Promise<NextResponse> - JSON response with contacts and pagination info
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'last_contact_date';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    const offset = (page - 1) * limit;

    // Build Supabase query with joined emails and phones
    let query = supabase
      .from('contacts')
      .select(`
        id, name, image_url, last_contact_date, created_at, updated_at,
        contact_emails(id, contact_id, email, is_primary, created_at, updated_at),
        contact_phones(id, contact_id, phone, is_primary, created_at, updated_at)
      `, { count: 'exact' });

    // Add search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Add sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: contacts, error, count } = await query;

    if (error) {
      throw error;
    }

    // Transform the data to match the Contact interface
    const transformedContacts = (contacts || []).map(contact => ({
      ...contact,
      emails: contact.contact_emails || [],
      phones: contact.contact_phones || []
    }));

    const response: ContactsResponse = {
      contacts: transformedContacts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch contacts',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST /api/contacts - Creates a new contact with duplicate checking
 * 
 * Purpose: Handles contact creation with intelligent duplicate detection.
 * Either creates a new contact or returns duplicate information for user decision.
 * 
 * Contract:
 * - Preconditions: Valid CreateContact data in request body
 * - Postconditions: Contact created or duplicate check result returned
 * - Side Effects: Creates database records, may trigger duplicate dialog
 * - Error Handling: Returns 400 for validation errors, 500 for server errors
 * 
 * Request Body:
 * - name: Contact name (required)
 * - image_url: Contact image URL (required)
 * - last_contact_date: Last contact date in YYYY-MM-DD format (required)
 * - emails: Array of email addresses
 * - phones: Array of phone numbers
 * - primaryEmailIndex: Index of primary email (default: 0)
 * - primaryPhoneIndex: Index of primary phone (default: 0)
 * 
 * @param request - NextRequest object containing contact data
 * @returns Promise<NextResponse> - JSON response with created contact or duplicate check result
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateContact = await request.json();

    if (!body.name || !body.image_url || !body.last_contact_date) {
      const errorResponse: ErrorResponse = {
        error: 'Missing required fields',
        message: 'name, image_url, and last_contact_date are required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Check for duplicates
    const duplicateCheck = await checkForDuplicate(body.name, body.emails || [], body.phones || []);
    
    if (duplicateCheck.hasDuplicate) {
      return NextResponse.json({ duplicateCheck }, { status: 409 });
    }

    // Create the contact
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert([{
        name: body.name,
        image_url: body.image_url,
        last_contact_date: body.last_contact_date
      }])
      .select('id, name, image_url, last_contact_date, created_at, updated_at')
      .single();

    if (contactError) {
      throw contactError;
    }

    // Add emails if provided
    if (body.emails && body.emails.length > 0) {
      const emailInserts = body.emails.map((email, index) => ({
        contact_id: newContact.id,
        email: email.trim(),
        is_primary: index === 0
      }));

      const { error: emailError } = await supabase
        .from('contact_emails')
        .insert(emailInserts);

      if (emailError) {
        console.error('Error inserting emails:', emailError);
        // Continue anyway, don't fail the whole operation
      }
    }

    // Add phones if provided
    if (body.phones && body.phones.length > 0) {
      const phoneInserts = body.phones.map((phone, index) => ({
        contact_id: newContact.id,
        phone: phone.trim(),
        is_primary: index === 0
      }));

      const { error: phoneError } = await supabase
        .from('contact_phones')
        .insert(phoneInserts);

      if (phoneError) {
        console.error('Error inserting phones:', phoneError);
        // Continue anyway, don't fail the whole operation
      }
    }

    // Fetch the complete contact with emails and phones
    const { data: completeContact, error: fetchError } = await supabase
      .from('contacts')
      .select(`
        id, name, image_url, last_contact_date, created_at, updated_at,
        contact_emails(id, contact_id, email, is_primary, created_at, updated_at),
        contact_phones(id, contact_id, phone, is_primary, created_at, updated_at)
      `)
      .eq('id', newContact.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Transform the data to match the Contact interface
    const transformedContact = {
      ...completeContact,
      emails: completeContact.contact_emails || [],
      phones: completeContact.contact_phones || []
    };

    const response: ContactResponse = {
      contact: transformedContact
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to create contact',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT /api/contacts/merge - Merge new contact data with existing contact
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { existingContactId, newEmails, newPhones, newLastContactDate } = body;

    if (!existingContactId) {
      const errorResponse: ErrorResponse = {
        error: 'Missing required fields',
        message: 'existingContactId is required'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // First, get the existing contact to compare last_contact_date
    const { data: existingContact, error: fetchExistingError } = await supabase
      .from('contacts')
      .select('last_contact_date')
      .eq('id', existingContactId)
      .single();

    if (fetchExistingError) {
      throw fetchExistingError;
    }

    // Update last_contact_date if the new one is more recent
    if (newLastContactDate) {
      const existingDate = new Date(existingContact.last_contact_date);
      const newDate = new Date(newLastContactDate);
      
      if (newDate > existingDate) {
        const { error: updateDateError } = await supabase
          .from('contacts')
          .update({ last_contact_date: newLastContactDate })
          .eq('id', existingContactId);

        if (updateDateError) {
          console.error('Error updating last contact date:', updateDateError);
          // Continue anyway, don't fail the whole operation
        }
      }
    }

    // Add new emails if provided
    if (newEmails && newEmails.length > 0) {
      const emailInserts = newEmails.map((email: string) => ({
        contact_id: existingContactId,
        email: email.trim(),
        is_primary: false // Don't override existing primary for merge
      }));

      const { error: emailError } = await supabase
        .from('contact_emails')
        .insert(emailInserts);

      if (emailError) {
        console.error('Error inserting emails:', emailError);
        // Continue anyway
      }
    }

    // Add new phones if provided
    if (newPhones && newPhones.length > 0) {
      const phoneInserts = newPhones.map((phone: string) => ({
        contact_id: existingContactId,
        phone: phone.trim(),
        is_primary: false // Don't override existing primary for merge
      }));

      const { error: phoneError } = await supabase
        .from('contact_phones')
        .insert(phoneInserts);

      if (phoneError) {
        console.error('Error inserting phones:', phoneError);
        // Continue anyway
      }
    }

    // Fetch the updated contact with emails and phones
    const { data: updatedContact, error: fetchError } = await supabase
      .from('contacts')
      .select(`
        id, name, image_url, last_contact_date, created_at, updated_at,
        contact_emails(id, contact_id, email, is_primary, created_at, updated_at),
        contact_phones(id, contact_id, phone, is_primary, created_at, updated_at)
      `)
      .eq('id', existingContactId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Transform the data to match the Contact interface
    const transformedContact = {
      ...updatedContact,
      emails: updatedContact.contact_emails || [],
      phones: updatedContact.contact_phones || []
    };

    const response: ContactResponse = {
      contact: transformedContact
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error merging contact:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to merge contact',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
