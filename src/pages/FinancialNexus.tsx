import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { CosmicBackground } from '@/components/CosmicBackground';
import { RadialMenu } from '@/components/RadialMenu';

interface Invoice {
  id: string;
  client_name: string;
  amount: number;
  status: 'Draft' | 'Paid' | 'Overdue';
  due_date: string;
  created_at: string;
}

interface InvoiceFormData {
  client_name: string;
  amount: string;
  due_date: string;
}

const FinancialNexus: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>({
    client_name: '',
    amount: '',
    due_date: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch invoices from Supabase
  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setInvoices(data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new invoice
  const createInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([
          {
            client_name: formData.client_name,
            amount: parseFloat(formData.amount),
            status: 'Draft',
            due_date: formData.due_date,
          },
        ])
        .select();

      if (error) throw error;

      setInvoices((prev) => [...prev, ...data]);
      setFormData({ client_name: '', amount: '', due_date: '' });
      setShowForm(false);
    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Stripe Checkout (placeholder)
  const handleStripeCheckout = async (invoice: Invoice) => {
    try {
      // Placeholder for Stripe Checkout integration
      console.log('Processing payment for invoice:', invoice.id);

      // In a real implementation, this would:
      // 1. Call a serverless function to create a Stripe Checkout session
      // 2. Redirect to the Stripe Checkout URL
      // 3. Handle the success/cancel callbacks

      alert(
        `Stripe Checkout integration coming soon!\nInvoice: ${invoice.client_name} - $${invoice.amount}`,
      );
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const summary = {
      outstanding: 0,
      paid: 0,
      overdue: 0,
    };

    invoices.forEach((invoice) => {
      if (invoice.status === 'Paid') {
        summary.paid += invoice.amount;
      } else if (invoice.status === 'Overdue') {
        summary.overdue += invoice.amount;
      } else {
        summary.outstanding += invoice.amount;
      }
    });

    return summary;
  };

  const summary = calculateSummary();

  useEffect(() => {
    fetchInvoices();
  }, []);

  if (loading) {
    return (
      <div className="relative min-h-screen bg-cosmic-dark text-white">
        <CosmicBackground />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading invoices...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-cosmic-dark text-white">
      <CosmicBackground />
      <RadialMenu />

      <div className="relative z-10 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cosmic-highlight mb-2">Financial Nexus</h1>
          <p className="text-xl text-cosmic-accent">Manage invoices and payments</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-cosmic-light bg-opacity-20 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-cosmic-highlight mb-2">Outstanding</h3>
            <p className="text-3xl font-bold text-cosmic-accent">
              ${summary.outstanding.toFixed(2)}
            </p>
          </div>
          <div className="bg-cosmic-light bg-opacity-20 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-cosmic-highlight mb-2">Paid</h3>
            <p className="text-3xl font-bold text-green-400">${summary.paid.toFixed(2)}</p>
          </div>
          <div className="bg-cosmic-light bg-opacity-20 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-cosmic-highlight mb-2">Overdue</h3>
            <p className="text-3xl font-bold text-red-400">${summary.overdue.toFixed(2)}</p>
          </div>
        </div>

        {/* Add Invoice Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 shadow-lg"
          >
            + Add New Invoice
          </button>
        </div>

        {/* Invoice Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-cosmic-light bg-opacity-90 rounded-lg p-8 w-full max-w-md mx-4">
              <h2 className="text-2xl font-bold text-cosmic-highlight mb-6">Create New Invoice</h2>
              <form onSubmit={createInvoice} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Client Name</label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, client_name: e.target.value }))
                    }
                    className="w-full px-3 py-2 bg-cosmic-dark border border-cosmic-accent rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 bg-cosmic-dark border border-cosmic-accent rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-cosmic-dark border border-cosmic-accent rounded-md text-white focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-4 py-2 rounded-md font-semibold transition-colors duration-200 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Invoice'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-semibold transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-cosmic-light bg-opacity-20 rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-cosmic-accent">
            <h2 className="text-xl font-bold text-cosmic-highlight">Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cosmic-dark bg-opacity-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cosmic-accent uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cosmic-accent uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cosmic-accent uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cosmic-accent uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cosmic-accent uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cosmic-accent divide-opacity-20">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-cosmic-accent">
                      No invoices found. Create your first invoice above.
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-cosmic-light hover:bg-opacity-10">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {invoice.client_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        ${invoice.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            invoice.status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : invoice.status === 'Overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {invoice.status !== 'Paid' && (
                          <button
                            onClick={() => handleStripeCheckout(invoice)}
                            className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-3 py-1 rounded text-xs font-medium transition-colors duration-200"
                          >
                            Pay Now
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialNexus;
