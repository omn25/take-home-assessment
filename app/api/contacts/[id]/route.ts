import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/db';
import { UpdateContact, ContactResponse, ErrorResponse } from '@/lib/types';

// GET /api/contacts/[id] - Get a specific contact
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: contact, error } = await supabase
      .from('contacts')
      .select(`
        id, name, image_url, last_contact_date, created_at, updated_at,
        contact_emails(id, contact_id, email, is_primary, created_at, updated_at),
        contact_phones(id, contact_id, phone, is_primary, created_at, updated_at)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const errorResponse: ErrorResponse = {
          error: 'Contact not found',
          message: 'No contact found with the provided ID'
        };
        return NextResponse.json(errorResponse, { status: 404 });
      }
      throw error;
    }

    // Transform the data to match the Contact interface
    const transformedContact = {
      ...contact,
      emails: contact.contact_emails || [],
      phones: contact.contact_phones || []
    };

    const response: ContactResponse = {
      contact: transformedContact
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching contact:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch contact',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// PUT /api/contacts/[id] - Update a contact
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateContact = await request.json();

    // Check if contact exists first
    const { error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      const errorResponse: ErrorResponse = {
        error: 'Contact not found',
        message: 'No contact found with the provided ID'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (fetchError) {
      throw fetchError;
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.last_contact_date !== undefined) updateData.last_contact_date = body.last_contact_date;

    if (Object.keys(updateData).length === 0) {
      const errorResponse: ErrorResponse = {
        error: 'No fields to update',
        message: 'At least one field must be provided for update'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', id)
      .select(`
        id, name, image_url, last_contact_date, created_at, updated_at,
        contact_emails(id, email, is_primary),
        contact_phones(id, phone, is_primary)
      `)
      .single();

    if (error) {
      throw error;
    }

    // Handle email updates
    if (body.emails !== undefined) {
      // Delete existing emails
      await supabase
        .from('contact_emails')
        .delete()
        .eq('contact_id', id);

      // Insert new emails
      if (body.emails.length > 0) {
        const primaryEmailIndex = body.primaryEmailIndex ?? 0;
        const emailInserts = body.emails.map((email, index) => ({
          contact_id: id,
          email: email.trim(),
          is_primary: index === primaryEmailIndex
        }));

        await supabase
          .from('contact_emails')
          .insert(emailInserts);
      }
    }

    // Handle phone updates
    if (body.phones !== undefined) {
      // Delete existing phones
      await supabase
        .from('contact_phones')
        .delete()
        .eq('contact_id', id);

      // Insert new phones
      if (body.phones.length > 0) {
        const primaryPhoneIndex = body.primaryPhoneIndex ?? 0;
        const phoneInserts = body.phones.map((phone, index) => ({
          contact_id: id,
          phone: phone.trim(),
          is_primary: index === primaryPhoneIndex
        }));

        await supabase
          .from('contact_phones')
          .insert(phoneInserts);
      }
    }

    // Fetch the complete updated contact
    const { data: completeContact, error: finalFetchError } = await supabase
      .from('contacts')
      .select(`
        id, name, image_url, last_contact_date, created_at, updated_at,
        contact_emails(id, contact_id, email, is_primary, created_at, updated_at),
        contact_phones(id, contact_id, phone, is_primary, created_at, updated_at)
      `)
      .eq('id', id)
      .single();

    if (finalFetchError) {
      throw finalFetchError;
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating contact:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to update contact',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/contacts/[id] - Delete a contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if contact exists first
    const { error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      const errorResponse: ErrorResponse = {
        error: 'Contact not found',
        message: 'No contact found with the provided ID'
      };
      return NextResponse.json(errorResponse, { status: 404 });
    }

    if (fetchError) {
      throw fetchError;
    }

    // Delete the contact
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    const errorResponse: ErrorResponse = {
      error: 'Failed to delete contact',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
