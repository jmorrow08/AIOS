import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Trash2 } from 'lucide-react';
import { LineItem } from '@/api/invoices';

interface InvoiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: InvoiceFormData) => Promise<void>;
  clients: Array<{ id: string; name: string }>;
  loading?: boolean;
}

export interface InvoiceFormData {
  clientId: string;
  dueDate: string;
  lineItems: LineItem[];
  notes?: string;
}

interface FormLineItem {
  description: string;
  amount: number;
  quantity: number;
  unitPrice: number;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  clients,
  loading = false,
}) => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    clientId: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    lineItems: [{ description: '', amount: 0, quantity: 1, unitPrice: 0 }],
    notes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        clientId: '',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lineItems: [{ description: '', amount: 0, quantity: 1, unitPrice: 0 }],
        notes: '',
      });
      setErrors({});
    }
  }, [isOpen]);

  const calculateTotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + item.amount, 0);
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, { description: '', amount: 0, quantity: 1, unitPrice: 0 }],
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.lineItems.length > 1) {
      setFormData((prev) => ({
        ...prev,
        lineItems: prev.lineItems.filter((_, i) => i !== index),
      }));
    }
  };

  const updateLineItem = (index: number, field: keyof FormLineItem, value: string | number) => {
    setFormData((prev) => {
      const newLineItems = [...prev.lineItems];
      const item = { ...newLineItems[index] };

      if (field === 'quantity' || field === 'unitPrice') {
        const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
        item[field] = numValue;
        item.amount = item.quantity * item.unitPrice;
      } else if (field === 'amount') {
        item[field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
      } else {
        item[field] = value;
      }

      newLineItems[index] = item;
      return { ...prev, lineItems: newLineItems };
    });
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Please select a client';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    const validLineItems = formData.lineItems.filter(
      (item) => item.description.trim() && item.amount > 0,
    );

    if (validLineItems.length === 0) {
      newErrors.lineItems = 'At least one valid line item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Convert form line items to API line items
      const apiLineItems: LineItem[] = formData.lineItems
        .filter((item) => item.description.trim() && item.amount > 0)
        .map((item) => ({
          description: item.description,
          amount: item.amount,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        }));

      await onSubmit({
        ...formData,
        lineItems: apiLineItems,
      });

      onClose();
    } catch (error) {
      console.error('Error submitting invoice:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Invoice</DialogTitle>
          <DialogDescription className="text-gray-400">
            Add invoice details and line items for the selected client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client" className="text-white">
              Client *
            </Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, clientId: value }))}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id} className="text-white">
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && <p className="text-red-400 text-sm">{errors.clientId}</p>}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due-date" className="text-white">
              Due Date *
            </Label>
            <Input
              id="due-date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white"
            />
            {errors.dueDate && <p className="text-red-400 text-sm">{errors.dueDate}</p>}
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-white">Line Items *</Label>
              <Button
                type="button"
                onClick={addLineItem}
                variant="outline"
                size="sm"
                className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {errors.lineItems && <p className="text-red-400 text-sm">{errors.lineItems}</p>}

            <div className="space-y-3">
              {formData.lineItems.map((item, index) => (
                <div key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <Label className="text-white text-sm">Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        placeholder="Service description"
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-white text-sm">Qty</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-white text-sm">Unit Price</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                        placeholder="0.00"
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-white text-sm">Total</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount.toFixed(2)}
                        onChange={(e) => updateLineItem(index, 'amount', e.target.value)}
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                      />
                    </div>
                    <div className="col-span-1">
                      {formData.lineItems.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20 mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-end pt-4 border-t border-gray-700">
              <div className="text-right">
                <p className="text-gray-400 text-sm">Total Amount</p>
                <p className="text-white text-xl font-semibold">${calculateTotal().toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or terms..."
              className="bg-gray-800 border-gray-600 text-white"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-cosmic-blue hover:bg-cosmic-blue/80"
          >
            {loading ? 'Creating...' : 'Create Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceForm;
