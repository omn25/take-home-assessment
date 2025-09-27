'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Contact } from '@/lib/types';
import { Calendar, Camera, Edit3, Mail, Phone } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/formatters';
import Image from 'next/image';

interface ContactViewProps {
  contact: Contact;
  onClose: () => void;
  onEdit: (contact: Contact) => void;
}

export function ContactView({ contact, onClose, onEdit }: ContactViewProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
      
      await res.json();
      // Note: In a real app, you'd update the contact with the new image URL
      // For now, we'll just show success
      setUploadError(''); // Clear any previous errors on success
      alert('Image uploaded successfully! Refresh the page to see the new image.');
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'Image upload failed';
      setUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{contact.name}</h1>
        <p className="text-sm text-gray-500">Contact Details</p>
      </div>

      {/* Profile Picture Section */}
      <div className="flex justify-center mb-8">
        <div className="relative group">
          {contact.image_url ? (
            <Image
              src={contact.image_url}
              alt={contact.name}
              width={112}
              height={112}
              className="h-28 w-28 rounded-full object-cover border-4 border-gray-100 shadow-lg group-hover:opacity-90 transition-opacity duration-200"
            />
          ) : (
            <div className="h-28 w-28 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl border-4 border-gray-100 shadow-lg group-hover:opacity-90 transition-opacity duration-200">
              {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          )}
          
          {/* Overlay Camera Button */}
          <div className="absolute -bottom-1 -right-1">
            <input
              id="view-contact-image-file-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <Button
              size="sm"
              onClick={() => document.getElementById('view-contact-image-file-input')?.click()}
              disabled={uploading}
              className="h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:scale-110 transition-all duration-200 p-0"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="mb-6">
          <p className="text-sm text-red-500 text-center bg-red-50 rounded-lg py-2 px-4">{uploadError}</p>
        </div>
      )}

      {/* Contact Information - Only show if there's primary contact info */}
      {(() => {
        const primaryEmail = contact.emails?.find(e => e.is_primary) || contact.emails?.[0];
        const primaryPhone = contact.phones?.find(p => p.is_primary) || contact.phones?.[0];
        
        return (
          <div className="text-center mb-8 space-y-4">
            {/* Contact Info - Only Primary (only show if there's contact info) */}
            {(primaryEmail || primaryPhone) && (
              <div className="bg-blue-50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm font-semibold text-blue-800 mb-3">Contact Information</h3>
                
                {/* Primary Email */}
                {primaryEmail && (
                  <div className="flex items-center justify-center space-x-2 text-blue-700">
                    <Mail className="h-5 w-5" />
                    <span className="text-base font-medium">{primaryEmail.email}</span>
                  </div>
                )}
                
                {/* Primary Phone */}
                {primaryPhone && (
                  <div className="flex items-center justify-center space-x-2 text-blue-700">
                    <Phone className="h-5 w-5" />
                    <span className="text-base font-medium">{formatPhoneNumber(primaryPhone.phone)}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Last Contact Date - Always show */}
            <div className="flex items-center justify-center space-x-2 text-gray-600 pt-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Last contacted {formatDate(contact.last_contact_date)}</span>
            </div>
          </div>
        );
      })()}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 h-11 rounded-xl border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
        >
          Close
        </Button>
        <Button
          onClick={() => onEdit(contact)}
          className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02] transition-all duration-200"
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Contact
        </Button>
      </div>
    </div>
  );
}
