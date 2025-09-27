'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contact, UpdateContact, DuplicateCheck } from '@/lib/types';
import { DuplicateConfirmationDialog } from './duplicate-confirmation-dialog';
import { DraggableEmailList } from './draggable-email-list';
import { DraggablePhoneList } from './draggable-phone-list';

interface ContactFormProps {
  /** Contact to edit (undefined for new contact) */
  contact?: Contact;
  /** Callback when creating a new contact */
  /** Callback when updating an existing contact */
  onUpdate?: (data: UpdateContact) => Promise<void>;
  /** Callback when canceling the form */
  onCancel: () => void;
  /** Whether the form is in a loading state */
  isLoading?: boolean;
  /** Callback when a contact is successfully created */
  onContactCreated?: (contact: Contact) => void;
}

/**
 * ContactForm - A comprehensive form for creating and editing contacts
 * 
 * Features:
 * - Form validation with real-time error feedback
 * - Drag-and-drop reorderable email/phone lists
 * - Image upload with validation
 * - Duplicate contact detection and merging
 * - Date validation (prevents future dates)
 * 
 * @param props - ContactFormProps
 * @returns JSX.Element
 */
export function ContactForm({ contact, onUpdate, onCancel, isLoading = false, onContactCreated }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    image_url: contact?.image_url || '',
    last_contact_date: contact?.last_contact_date || '',
    emails: contact?.emails?.map(e => e.email) || [''],
    phones: contact?.phones?.map(p => p.phone) || [''],
  });


  // Update form data when contact prop changes
  useEffect(() => {
    if (contact) {
      // Sort emails and phones to put primary ones first
      const sortedEmails = [...(contact.emails || [])].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return 0;
      });
      
      const sortedPhones = [...(contact.phones || [])].sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return 0;
      });

      setFormData({
        name: contact.name || '',
        image_url: contact.image_url || '',
        last_contact_date: contact.last_contact_date || '',
        emails: sortedEmails.map(e => e.email),
        phones: sortedPhones.map(p => p.phone),
      });
    }
  }, [contact]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const fileInputId = 'contact-image-file-input';

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadError, setUploadError] = useState<string>('');
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheck | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  /**
   * Validates the form data and sets error messages
   * 
   * Purpose: Ensures all required fields are present and valid before form submission.
   * Performs client-side validation for name, image URL, and date fields.
   * 
   * Contract:
   * - Preconditions: formData state is populated
   * - Postconditions: errors state is updated with validation results
   * - Side Effects: Updates errors state via setErrors
   * - Returns: boolean indicating validation success
   * 
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.image_url.trim()) {
      newErrors.image_url = 'Image URL is required';
    }

    // Validate date format and prevent future dates
    if (!formData.last_contact_date.trim()) {
      newErrors.last_contact_date = 'Last contact date is required (YYYY-MM-DD)';
    } else {
      const selectedDate = new Date(formData.last_contact_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today to allow today's date
      
      // Check if date is valid
      if (isNaN(selectedDate.getTime())) {
        newErrors.last_contact_date = 'Invalid date format (YYYY-MM-DD)';
      } else if (selectedDate > today) {
        newErrors.last_contact_date = 'Last contact date cannot be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission with validation and duplicate checking
   * 
   * Purpose: Orchestrates the complete form submission flow including validation,
   * duplicate checking, and API calls for both create and update operations.
   * 
   * Contract:
   * - Preconditions: Form is not already submitting, not in loading state
   * - Postconditions: Contact is created/updated or duplicate dialog is shown
   * - Side Effects: Updates submitting state, calls API endpoints, shows dialogs
   * - Error Handling: Catches and logs errors, resets submitting state
   * 
   * @param e - Form submit event (prevented from default behavior)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (submitting || isLoading) {
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      if (contact) {
        // Update existing contact
        await onUpdate?.({
          ...formData,
          primaryEmailIndex: 0, // First email is always primary
          primaryPhoneIndex: 0, // First phone is always primary
        });
      } else {
        // Create new contact - check for duplicates first
        const response = await fetch('/api/contacts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          image_url: formData.image_url,
          last_contact_date: formData.last_contact_date,
          emails: formData.emails.filter(email => email.trim() !== ''),
          phones: formData.phones.filter(phone => phone.trim() !== ''),
          primaryEmailIndex: 0, // First email is always primary
          primaryPhoneIndex: 0, // First phone is always primary
        }),
        });

        if (response.status === 409) {
          // Duplicate found
          const data = await response.json();
          setDuplicateCheck(data.duplicateCheck);
          setShowDuplicateDialog(true);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to create contact');
        }

        const data = await response.json();
        onContactCreated?.(data.contact);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handles form field changes with real-time validation
   * 
   * Purpose: Updates form data state and provides immediate user feedback
   * by clearing errors and performing real-time validation on specific fields.
   * 
   * Contract:
   * - Preconditions: field is a valid form field name, value is a string
   * - Postconditions: formData is updated, errors are cleared if present
   * - Side Effects: Updates formData and errors state
   * - Special Behavior: Performs real-time date validation for last_contact_date
   * 
   * @param field - The form field name to update
   * @param value - The new value for the field
   */
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation for last contact date
    if (field === 'last_contact_date' && value) {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Set to end of today to allow today's date
      
      if (selectedDate > today) {
        setErrors(prev => ({ ...prev, [field]: 'Last contact date cannot be in the future' }));
      }
    }
  };

  const handleEmailsChange = (emails: string[] | ((prev: string[]) => string[])) => {
    setFormData(prev => ({ 
      ...prev, 
      emails: typeof emails === 'function' ? emails(prev.emails) : emails 
    }));
  };

  const handlePhonesChange = (phones: string[] | ((prev: string[]) => string[])) => {
    setFormData(prev => ({ 
      ...prev, 
      phones: typeof phones === 'function' ? phones(prev.phones) : phones 
    }));
  };

  /**
   * Merges new contact data with existing contact, only adding unique information
   * 
   * Purpose: Handles the merge operation when user chooses to add new data to an
   * existing contact instead of creating a duplicate. Filters out duplicate emails
   * and phones before sending to API.
   * 
   * Contract:
   * - Preconditions: duplicateCheck.existingContact exists, form is not submitting
   * - Postconditions: Contact is updated with unique data, dialog is closed
   * - Side Effects: Calls merge API, updates parent component, resets form state
   * - Error Handling: Logs errors, resets submitting state on failure
   */
  const handleMergeContact = async () => {
    if (!duplicateCheck?.existingContact) return;

    try {
      setSubmitting(true);
      
      // Calculate unique data to send (avoid duplicates)
      const existing = duplicateCheck.existingContact;
      const existingEmails = existing.emails.map(e => e.email.toLowerCase());
      const existingPhones = existing.phones.map(p => p.phone.replace(/\D/g, ''));
      
      const uniqueEmails = formData.emails.filter(email => 
        email.trim() && !existingEmails.includes(email.toLowerCase())
      );
      const uniquePhones = formData.phones.filter(phone => {
        const cleanedPhone = phone.replace(/\D/g, '');
        return cleanedPhone && !existingPhones.includes(cleanedPhone);
      });

      const response = await fetch('/api/contacts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          existingContactId: duplicateCheck.existingContact.id,
          newEmails: uniqueEmails,
          newPhones: uniquePhones,
          newLastContactDate: formData.last_contact_date,
          primaryEmailIndex: 0, // First email is always primary
          primaryPhoneIndex: 0, // First phone is always primary
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to merge contact');
      }

      const data = await response.json();
      onContactCreated?.(data.contact);
      setShowDuplicateDialog(false);
    } catch (error) {
      console.error('Error merging contact:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateNewContact = async () => {
    try {
      setSubmitting(true);
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          image_url: formData.image_url,
          last_contact_date: formData.last_contact_date,
          emails: formData.emails.filter(email => email.trim() !== ''),
          phones: formData.phones.filter(phone => phone.trim() !== ''),
          primaryEmailIndex: 0, // First email is always primary
          primaryPhoneIndex: 0, // First phone is always primary
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create contact');
      }

      const data = await response.json();
      onContactCreated?.(data.contact);
      setShowDuplicateDialog(false);
    } catch (error) {
      console.error('Error creating contact:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;

    // Clear previous upload errors
    setUploadError('');

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File too large. Maximum size is 5MB.');
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await res.json();
      handleChange('image_url', data.url);
      setFileName(file.name);
      setUploadError(''); // Clear any previous errors on success
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Image upload failed';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="pb-4 mb-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">{contact ? 'Edit Contact' : 'Add New Contact'}</h2>
        <p className="text-sm text-muted-foreground">Enter the contact details below</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Contact Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Jane Doe"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={fileInputId}>Image *</Label>
            <p className="text-xs text-muted-foreground">
              Accepted formats: JPEG, PNG, GIF, WebP (max 5MB)
            </p>
            {/* Hidden text input storing the uploaded URL for submission */}
            <input type="hidden" value={formData.image_url} readOnly />

            {/* Hidden file input */}
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById(fileInputId)?.click()}
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Add File'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {formData.image_url ? (fileName ? `${fileName} uploaded` : 'File uploaded') : 'No file selected'}
              </span>
            </div>

            {/* Upload error display */}
            {uploadError && (
              <p className="text-sm text-red-500">{uploadError}</p>
            )}

            {errors.image_url && (
              <p className="text-sm text-red-500">{errors.image_url}</p>
            )}
          </div>

          <DraggableEmailList
            emails={formData.emails}
            onEmailsChange={handleEmailsChange}
          />

          <DraggablePhoneList
            phones={formData.phones}
            onPhonesChange={handlePhonesChange}
          />

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            💡 <strong>Tip:</strong> Drag the grip handle (⋮⋮) to reorder emails and phones. The first item in each list will be marked as &quot;Primary&quot; and shown prominently in the contact view.
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_contact_date">Last Contact Date *</Label>
            <Input
              id="last_contact_date"
              type="date"
              value={formData.last_contact_date}
              onChange={(e) => handleChange('last_contact_date', e.target.value)}
              placeholder="YYYY-MM-DD"
              max={new Date().toISOString().split('T')[0]} // Prevent future dates
              className={errors.last_contact_date ? 'border-red-500' : ''}
            />
            {errors.last_contact_date && (
              <p className="text-sm text-red-500">{errors.last_contact_date}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || submitting}>
              {isLoading || submitting ? 'Saving...' : contact ? 'Update Contact' : 'Add Contact'}
            </Button>
          </div>
        </form>
      
      {/* Duplicate Confirmation Dialog */}
      {duplicateCheck && (
        <DuplicateConfirmationDialog
          isOpen={showDuplicateDialog}
          onClose={() => setShowDuplicateDialog(false)}
          onMerge={handleMergeContact}
          onCreateNew={handleCreateNewContact}
          duplicateCheck={duplicateCheck}
          newContactName={formData.name}
          newEmails={formData.emails.filter(email => email.trim() !== '')}
          newPhones={formData.phones.filter(phone => phone.trim() !== '')}
          newLastContactDate={formData.last_contact_date}
        />
      )}
    </div>
  );
}
