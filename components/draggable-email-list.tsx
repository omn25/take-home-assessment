'use client';

import { useState, memo, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GripVertical, Plus, X, Mail } from 'lucide-react';
import { validateEmail } from '@/lib/formatters';

interface DraggableEmailListProps {
  emails: string[];
  onEmailsChange: (emails: string[] | ((prev: string[]) => string[])) => void;
}

interface DraggableEmailItemProps {
  id: string;
  email: string;
  index: number;
  isPrimary: boolean;
  onEmailChange: (index: number, email: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  error?: string;
}

/**
 * DraggableEmailItem - Individual draggable email input component
 * 
 * Purpose: Renders a single email input field with drag-and-drop functionality,
 * validation feedback, and primary designation. Optimized with React.memo.
 * 
 * Contract:
 * - Preconditions: Valid props with email string and index
 * - Postconditions: Renders draggable email input with validation
 * - Side Effects: Calls onEmailChange and onRemove callbacks
 * - Error Handling: Displays validation errors inline
 */
const DraggableEmailItem = memo(function DraggableEmailItem({ 
  id, 
  email, 
  index, 
  isPrimary, 
  onEmailChange, 
  onRemove, 
  canRemove,
  error 
}: DraggableEmailItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-md border transition-all duration-200 ${
        isPrimary 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      } ${isDragging ? 'opacity-50 shadow-lg' : ''}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-150"
        title="Drag to reorder"
      >
        <GripVertical className="h-3 w-3" />
      </div>

      {/* Email Icon */}
      <Mail className="h-3 w-3 text-gray-500" />

      {/* Email Input */}
      <div className="flex-1">
        <Input
          type="email"
          value={email}
          onChange={(e) => onEmailChange(index, e.target.value)}
          placeholder="john@example.com"
          className={`border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-gray-400 focus:text-gray-900 transition-colors duration-150 ${error ? 'text-red-500' : ''}`}
        />
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
      </div>

      {/* Primary Badge */}
      {isPrimary && (
        <div className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          Primary
        </div>
      )}

      {/* Remove Button */}
      {canRemove && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
});

/**
 * DraggableEmailList - Manages a list of draggable email inputs
 * 
 * Purpose: Provides a drag-and-drop interface for managing multiple email addresses
 * with real-time validation, reordering, and primary designation. Optimized for performance.
 * 
 * Contract:
 * - Preconditions: emails array and onEmailsChange callback provided
 * - Postconditions: Renders draggable email list with add/remove functionality
 * - Side Effects: Updates parent component state via onEmailsChange
 * - Error Handling: Manages validation errors per email input
 * 
 * @param emails - Array of email strings
 * @param onEmailsChange - Callback to update emails in parent component
 */
export function DraggableEmailList({ emails, onEmailsChange }: DraggableEmailListProps) {
  const [emailErrors, setEmailErrors] = useState<Record<number, string>>({});
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleEmailChange = useCallback((index: number, email: string) => {
    onEmailsChange(prev => prev.map((e, i) => i === index ? email : e));
    
    // Validate email
    if (email && !validateEmail(email)) {
      setEmailErrors(prev => ({ ...prev, [index]: 'Please enter a valid email address' }));
    } else {
      setEmailErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  }, [onEmailsChange]);

  const handleRemove = useCallback((index: number) => {
    if (emails.length > 1) {
      onEmailsChange(prev => prev.filter((_, i) => i !== index));
    }
  }, [emails.length, onEmailsChange]);

  const handleAddEmail = useCallback(() => {
    onEmailsChange(prev => [...prev, '']);
  }, [onEmailsChange]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = emails.findIndex((_, index) => `email-${index}` === active.id);
      const newIndex = emails.findIndex((_, index) => `email-${index}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newEmails = arrayMove(emails, oldIndex, newIndex);
        onEmailsChange(newEmails);
        
        // Clear any errors for reordered items
        setEmailErrors({});
      }
    }
  }, [emails, onEmailsChange]);

  return (
    <div className="space-y-3">
      <Label>Email Addresses</Label>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={emails.map((_, index) => `email-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {emails.map((email, index) => (
              <DraggableEmailItem
                key={`email-${index}`}
                id={`email-${index}`}
                email={email}
                index={index}
                isPrimary={index === 0}
                onEmailChange={handleEmailChange}
                onRemove={handleRemove}
                canRemove={emails.length > 1}
                error={emailErrors[index]}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddEmail}
        className="w-full h-8 text-xs"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Email
      </Button>
    </div>
  );
}
