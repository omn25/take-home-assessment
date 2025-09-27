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
import { GripVertical, Plus, X, Phone } from 'lucide-react';
import { validatePhoneNumber, formatPhoneForInput, cleanPhoneNumber } from '@/lib/formatters';

interface DraggablePhoneListProps {
  phones: string[];
  onPhonesChange: (phones: string[] | ((prev: string[]) => string[])) => void;
}

interface DraggablePhoneItemProps {
  id: string;
  phone: string;
  index: number;
  isPrimary: boolean;
  onPhoneChange: (index: number, phone: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
  error?: string;
}

const DraggablePhoneItem = memo(function DraggablePhoneItem({ 
  id, 
  phone, 
  index, 
  isPrimary, 
  onPhoneChange, 
  onRemove, 
  canRemove,
  error 
}: DraggablePhoneItemProps) {
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

      {/* Phone Icon */}
      <Phone className="h-3 w-3 text-gray-500" />

      {/* Phone Input */}
      <div className="flex-1">
        <Input
          type="tel"
          value={formatPhoneForInput(phone)}
          onChange={(e) => {
            const cleaned = cleanPhoneNumber(e.target.value);
            onPhoneChange(index, cleaned);
          }}
          placeholder="(555) 123-4567"
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

export function DraggablePhoneList({ phones, onPhonesChange }: DraggablePhoneListProps) {
  const [phoneErrors, setPhoneErrors] = useState<Record<number, string>>({});
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePhoneChange = useCallback((index: number, phone: string) => {
    onPhonesChange(prev => prev.map((p, i) => i === index ? phone : p));
    
    // Validate phone number
    if (phone && !validatePhoneNumber(phone)) {
      setPhoneErrors(prev => ({ ...prev, [index]: 'Please enter a valid 10-digit phone number' }));
    } else {
      setPhoneErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
    }
  }, [onPhonesChange]);

  const handleRemove = useCallback((index: number) => {
    if (phones.length > 1) {
      onPhonesChange(prev => prev.filter((_, i) => i !== index));
    }
  }, [phones.length, onPhonesChange]);

  const handleAddPhone = useCallback(() => {
    onPhonesChange(prev => [...prev, '']);
  }, [onPhonesChange]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = phones.findIndex((_, index) => `phone-${index}` === active.id);
      const newIndex = phones.findIndex((_, index) => `phone-${index}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newPhones = arrayMove(phones, oldIndex, newIndex);
        onPhonesChange(newPhones);
        
        // Clear any errors for reordered items
        setPhoneErrors({});
      }
    }
  }, [phones, onPhonesChange]);

  return (
    <div className="space-y-3">
      <Label>Phone Numbers</Label>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={phones.map((_, index) => `phone-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {phones.map((phone, index) => (
              <DraggablePhoneItem
                key={`phone-${index}`}
                id={`phone-${index}`}
                phone={phone}
                index={index}
                isPrimary={index === 0}
                onPhoneChange={handlePhoneChange}
                onRemove={handleRemove}
                canRemove={phones.length > 1}
                error={phoneErrors[index]}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddPhone}
        className="w-full h-8 text-xs"
      >
        <Plus className="h-3 w-3 mr-1" />
        Add Phone
      </Button>
    </div>
  );
}
