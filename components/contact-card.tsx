'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Contact } from '@/lib/types';
import { Calendar, Edit, Trash2, Eye } from 'lucide-react';
import { formatPhoneNumber } from '@/lib/formatters';

interface ContactCardProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onView: (contact: Contact) => void;
  isLoading?: boolean;
}

export function ContactCard({ contact, onEdit, onDelete, onView, isLoading = false }: ContactCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Generate consistent pastel color for initials
  const getInitialsColor = (name: string) => {
    const colors = [
      'bg-purple-100 text-purple-700',
      'bg-blue-100 text-blue-700', 
      'bg-green-100 text-green-700',
      'bg-pink-100 text-pink-700',
      'bg-yellow-100 text-yellow-700',
      'bg-indigo-100 text-indigo-700'
    ];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <Card 
      className="w-full hover:shadow-md hover:bg-gray-50 hover:scale-[1.02] transition-all duration-200 rounded-xl border-0 shadow-sm cursor-pointer"
      onClick={() => onView(contact)}
    >
      <CardHeader className="pb-0 py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {contact.image_url ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={contact.image_url} 
                  alt={contact.name} 
                  className="h-10 w-10 rounded-full object-cover border border-gray-200" 
                />
              </div>
            ) : (
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold border border-gray-200 ${getInitialsColor(contact.name)}`}>
                {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            )}
            <div className="flex flex-col">
              <CardTitle className="text-sm font-semibold text-gray-900 leading-tight">{contact.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-0.5">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500">Last contact {formatDate(contact.last_contact_date)}</span>
              </div>
              {/* Show primary email and phone if available */}
              {contact.emails && contact.emails.length > 0 && (
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-xs text-gray-500">📧</span>
                  <span className="text-xs text-gray-600">
                    {contact.emails?.find(e => e.is_primary)?.email || contact.emails?.[0]?.email}
                  </span>
                </div>
              )}
              {contact.phones && contact.phones.length > 0 && (
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="text-xs text-gray-500">📞</span>
                  <span className="text-xs text-gray-600">
                    {formatPhoneNumber(contact.phones?.find(p => p.is_primary)?.phone || contact.phones?.[0]?.phone || '')}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex space-x-0.5">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onView(contact);
              }}
              disabled={isLoading}
              className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors duration-200"
              title="View Contact"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(contact);
              }}
              disabled={isLoading}
              className="h-7 w-7 p-0 hover:bg-gray-100 hover:border-gray-300 transition-colors duration-200"
              title="Edit Contact"
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(contact);
              }}
              disabled={isLoading}
              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-colors duration-200"
              title="Delete Contact"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
