'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ContactForm } from '@/components/contact-form';
import { ContactCard } from '@/components/contact-card';
import { ContactView } from '@/components/contact-view';
import { Contact, UpdateContact, ContactsResponse } from '@/lib/types';
import { Plus, Search, Users, AlertTriangle } from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Fetch contacts
  const fetchContacts = useCallback(async (page = 1, search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/contacts?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const data: ContactsResponse = await response.json();
      setContacts(data.contacts);
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        totalPages: data.totalPages,
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    fetchContacts(1, value);
  };


  // Handle contact created (called by ContactForm after successful creation/merge)
  const handleContactCreated = () => {
    setIsAddDialogOpen(false);
    fetchContacts(pagination.page, searchTerm);
  };

  // Handle edit contact
  const handleEditContact = async (data: UpdateContact) => {
    if (!editingContact) return;

    try {
      const response = await fetch(`/api/contacts/${editingContact.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update contact');
      }

      setEditingContact(null);
      fetchContacts(pagination.page, searchTerm);
    } catch (error) {
      console.error('Error updating contact:', error);
      alert(error instanceof Error ? error.message : 'Failed to update contact');
    }
  };

  // Handle delete contact
  const handleDeleteContact = async (contact: Contact) => {
    setContactToDelete(contact);
  };

  const confirmDelete = async () => {
    if (!contactToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/contacts/${contactToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete contact');
      }

      // Refresh list and close modals
      await fetchContacts(pagination.page, searchTerm);
      setEditingContact(null);
      setContactToDelete(null);
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete contact');
    } finally {
      setDeleting(false);
    }
  };

  // Load contacts on component mount
  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <div className="mx-auto max-w-4xl py-12 px-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-[32px] font-semibold tracking-tight">Contacts</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-6 hover:scale-105 transition-all duration-200">
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <ContactForm
              onCancel={() => setIsAddDialogOpen(false)}
              onContactCreated={handleContactCreated}
            />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
        />
      </div>

      {/* Contacts List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading your contacts...</p>
        </div>
      ) : contacts.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="text-center py-16">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-gray-900">
              {searchTerm ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              {searchTerm 
                ? 'Try adjusting your search terms or check the spelling' 
                : 'Start building your network by adding your first contact'
              }
            </p>
            {!searchTerm && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="rounded-full px-6 hover:scale-105 transition-all duration-200"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Contact
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-4 max-w-4xl mx-auto">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={setEditingContact}
              onDelete={handleDeleteContact}
              onView={setViewingContact}
              isLoading={loading}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-8">
          <Button
            variant="outline"
            onClick={() => fetchContacts(pagination.page - 1, searchTerm)}
            disabled={pagination.page <= 1 || loading}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => fetchContacts(pagination.page + 1, searchTerm)}
            disabled={pagination.page >= pagination.totalPages || loading}
          >
            Next
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          {editingContact && (
            <ContactForm
              contact={editingContact}
              onUpdate={handleEditContact}
              onCancel={() => setEditingContact(null)}
            />
          )}
          <div className="flex justify-between pt-2">
            <div />
            {editingContact && (
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700"
                onClick={() => handleDeleteContact(editingContact)}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Contact'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* View Contact Dialog */}
      <Dialog open={!!viewingContact} onOpenChange={() => setViewingContact(null)}>
        <DialogContent className="rounded-2xl max-w-lg shadow-2xl border-0 p-0">
          {viewingContact && (
            <ContactView
              contact={viewingContact}
              onClose={() => setViewingContact(null)}
              onEdit={(contact) => {
                setViewingContact(null);
                setEditingContact(contact);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!contactToDelete} onOpenChange={() => setContactToDelete(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Contact
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">
              Are you sure you want to delete <span className="font-semibold">{contactToDelete?.name}</span>? 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setContactToDelete(null)}
              disabled={deleting}
              className="rounded-full"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
              className="rounded-full"
            >
              {deleting ? 'Deleting...' : 'Delete Contact'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
