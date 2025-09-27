'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DuplicateCheck } from '@/lib/types';
import { AlertTriangle, Mail, Phone, User, Calendar, Plus } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/formatters';

interface DuplicateConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onMerge: () => void;
  onCreateNew: () => void;
  duplicateCheck: DuplicateCheck;
  newContactName: string;
  newEmails: string[];
  newPhones: string[];
  newLastContactDate: string;
}

export function DuplicateConfirmationDialog({
  isOpen,
  onClose,
  onMerge,
  onCreateNew,
  duplicateCheck,
  newContactName,
  newEmails,
  newPhones,
  newLastContactDate,
}: DuplicateConfirmationDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uniqueData, setUniqueData] = useState<{
    emails: string[];
    phones: string[];
    hasNewerDate: boolean;
  }>({ emails: [], phones: [], hasNewerDate: false });

  // Calculate unique data when dialog opens
  useEffect(() => {
    if (isOpen && duplicateCheck.existingContact) {
      const existing = duplicateCheck.existingContact;
      
      // Get existing emails and phones
      const existingEmails = existing.emails.map(e => e.email.toLowerCase());
      const existingPhones = existing.phones.map(p => p.phone.replace(/\D/g, ''));
      
      // Find unique emails and phones
      const uniqueEmails = newEmails.filter(email => 
        email.trim() && !existingEmails.includes(email.toLowerCase())
      );
      const uniquePhones = newPhones.filter(phone => {
        const cleanedPhone = phone.replace(/\D/g, '');
        return cleanedPhone && !existingPhones.includes(cleanedPhone);
      });
      
      // Check if new date is more recent
      const hasNewerDate = newLastContactDate && 
        new Date(newLastContactDate) > new Date(existing.last_contact_date);
      
      setUniqueData({
        emails: uniqueEmails,
        phones: uniquePhones,
        hasNewerDate: !!hasNewerDate
      });
    }
  }, [isOpen, duplicateCheck, newEmails, newPhones, newLastContactDate]);

  const handleMerge = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onMerge();
    } finally {
      setIsProcessing(false);
    }
  }, [onMerge]);

  const handleCreateNew = useCallback(async () => {
    setIsProcessing(true);
    try {
      await onCreateNew();
    } finally {
      setIsProcessing(false);
    }
  }, [onCreateNew]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Enter' && !isProcessing) {
        e.preventDefault();
        handleMerge();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isProcessing, onClose, handleMerge]);

  if (!duplicateCheck.existingContact) {
    return null;
  }

  const existingContact = duplicateCheck.existingContact;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
            Duplicate Contact Found
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600 mt-1">
            A contact named &quot;{newContactName}&quot; already exists. What would you like to do?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Existing Contact Info */}
          <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4 text-gray-600" />
              <span className="font-semibold text-sm text-gray-700">Existing Contact</span>
            </div>
            <div className="space-y-3">
              <div className="text-base font-medium text-gray-900">{existingContact.name}</div>
              
              {/* Emails */}
              {existingContact.emails.length > 0 && (
                <div className="space-y-2">
                  {existingContact.emails.map((email) => (
                    <div key={email.id} className="flex items-center gap-3 text-sm">
                      <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700 flex-1">{email.email}</span>
                      {email.is_primary && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Phones */}
              {existingContact.phones.length > 0 && (
                <div className="space-y-2">
                  {existingContact.phones.map((phone) => (
                    <div key={phone.id} className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-700 flex-1">{formatPhoneNumber(phone.phone)}</span>
                      {phone.is_primary && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Last Contact Date */}
              <div className="flex items-center gap-3 text-sm pt-2 border-t border-gray-200">
                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-600">
                  <span className="font-medium">Last contacted:</span> {new Date(existingContact.last_contact_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* New Information to be Added */}
          {(uniqueData.emails.length > 0 || uniqueData.phones.length > 0 || uniqueData.hasNewerDate) && (
            <div className="border border-amber-200 rounded-xl p-5 bg-amber-50/50">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-sm text-amber-800">New Information to be Added</span>
            </div>
              <div className="space-y-3">
                {/* New Emails */}
                {uniqueData.emails.length > 0 && (
            <div className="space-y-2">
                    {uniqueData.emails.map((email, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span className="text-amber-800 flex-1">{email}</span>
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">
                          New
                        </span>
                    </div>
                  ))}
                </div>
              )}
                
                {/* New Phones */}
                {uniqueData.phones.length > 0 && (
                  <div className="space-y-2">
                    {uniqueData.phones.map((phone, index) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <Phone className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <span className="text-amber-800 flex-1">{formatPhoneNumber(phone)}</span>
                        <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-medium">
                          New
                        </span>
                    </div>
                  ))}
                </div>
              )}
                
                {/* Date Update */}
                {uniqueData.hasNewerDate && (
                  <div className="flex items-center gap-3 text-sm pt-2 border-t border-amber-200">
                    <Calendar className="h-4 w-4 text-amber-600 flex-shrink-0" />
                    <span className="text-amber-800">
                      <span className="font-medium">Last contacted:</span> {new Date(newLastContactDate).toLocaleDateString()}
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                        More Recent
                      </span>
                    </span>
                  </div>
                )}
                
                {uniqueData.emails.length === 0 && uniqueData.phones.length === 0 && !uniqueData.hasNewerDate && (
                  <div className="text-sm text-amber-700 italic">
                    No new information to add - all data already exists.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No New Information Warning */}
          {uniqueData.emails.length === 0 && uniqueData.phones.length === 0 && !uniqueData.hasNewerDate && (
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
              <div className="text-sm text-gray-600 text-center">
                <span className="font-medium">Note:</span> All the information you&apos;re trying to add already exists for this contact.
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-6 border-t border-gray-200">
          <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
              className="flex-1 h-11"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleCreateNew}
            disabled={isProcessing}
              className="flex-1 h-11"
          >
              Create New Anyway
          </Button>
          <Button
            onClick={handleMerge}
            disabled={isProcessing}
              className="flex-1 h-11 bg-blue-600 hover:bg-blue-700 text-white"
          >
              {isProcessing ? 'Adding...' : 'Add to Existing'}
          </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
