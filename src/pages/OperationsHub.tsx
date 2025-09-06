import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Job {
  id: string;
  client_name: string;
  employee_name: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  date: string;
  notes: string;
}

const OperationsHub: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    employee_name: '',
    date: '',
    notes: '',
  });

  // Fetch jobs from Supabase
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert([
          {
            client_name: formData.client_name,
            employee_name: formData.employee_name,
            status: 'Pending',
            date: formData.date,
            notes: formData.notes,
          },
        ])
        .select();

      if (error) throw error;

      // Add new job to the list
      if (data) {
        setJobs((prev) => [data[0], ...prev]);
      }

      // Reset form and close modal
      setFormData({
        client_name: '',
        employee_name: '',
        date: '',
        notes: '',
      });
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
    }
  };

  // Handle status update
  const updateJobStatus = async (jobId: string, newStatus: 'Completed') => {
    try {
      const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);

      if (error) throw error;

      // Update local state
      setJobs((prev) =>
        prev.map((job) => (job.id === jobId ? { ...job, status: newStatus } : job)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    }
  };

  // Get status styling
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cosmic-light to-cosmic-dark p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-cosmic-highlight mb-6">Operations Hub</h1>
          <div className="flex justify-center items-center h-64">
            <div className="text-cosmic-highlight">Loading jobs...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-light to-cosmic-dark p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cosmic-highlight">Operations Hub</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-cosmic-accent hover:bg-cosmic-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            + New Job
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={() => setError(null)} className="float-right ml-4 font-bold">
              ×
            </button>
          </div>
        )}

        {/* Jobs Table */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-cosmic-dark/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cosmic-highlight uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cosmic-highlight uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cosmic-highlight uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cosmic-highlight uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-cosmic-highlight uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cosmic-dark/20">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-cosmic-dark/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-cosmic-highlight">
                      {job.client_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-cosmic-highlight">
                      {job.employee_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusStyles(
                          job.status,
                        )}`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-cosmic-highlight">
                      {new Date(job.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-x-2">
                      <button
                        onClick={() => {
                          /* View job details - could expand this */
                        }}
                        className="text-cosmic-accent hover:text-cosmic-accent/80 text-sm underline"
                      >
                        View
                      </button>
                      {job.status !== 'Completed' && (
                        <button
                          onClick={() => updateJobStatus(job.id, 'Completed')}
                          className="text-green-400 hover:text-green-300 text-sm underline"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {jobs.length === 0 && (
            <div className="text-center py-12">
              <p className="text-cosmic-highlight/70">
                No jobs found. Create your first job to get started.
              </p>
            </div>
          )}
        </div>

        {/* Modal for creating new job */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold text-cosmic-dark mb-4">Create New Job</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-cosmic-dark mb-1">
                    Client Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.client_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, client_name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-dark mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.employee_name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, employee_name: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-dark mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-dark mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cosmic-accent"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-cosmic-accent hover:bg-cosmic-accent/80 text-white py-2 px-4 rounded-md transition-colors"
                  >
                    Create Job
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationsHub;
