import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/api/dashboard';
import { Client } from '@/api/clients';
import { Employee } from '@/api/employees';
import { autoGeneratePayout } from '@/api/hr';

export type JobStatus = 'Planned' | 'In Progress' | 'Completed' | 'On Hold' | 'Cancelled';
export type JobPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface Job {
  id: string;
  title: string;
  description?: string;
  client_id?: string;
  assigned_to?: string;
  status: JobStatus;
  priority: JobPriority;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Populated fields for display
  client?: Client;
  employee?: Employee;
}

export interface JobResponse {
  data: Job | Job[] | null;
  error: string | null;
}

export interface CreateJobData {
  title: string;
  description?: string;
  client_id?: string;
  assigned_to?: string;
  status?: JobStatus;
  priority?: JobPriority;
  due_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  notes?: string;
}

export interface UpdateJobData extends Partial<CreateJobData> {}

/**
 * Create a new job
 */
export const createJob = async (jobData: CreateJobData): Promise<JobResponse> => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          title: jobData.title,
          description: jobData.description || null,
          client_id: jobData.client_id || null,
          assigned_to: jobData.assigned_to || null,
          status: jobData.status || 'Planned',
          priority: jobData.priority || 'Medium',
          due_date: jobData.due_date || null,
          estimated_hours: jobData.estimated_hours || null,
          actual_hours: jobData.actual_hours || null,
          notes: jobData.notes || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return {
        data: null,
        error: error.message || 'Failed to create job',
      };
    }

    // Log activity
    try {
      await logActivity(`Job "${jobData.title}" was created`, 'job', '/operations-hub', {
        job_id: data.id,
        job_title: jobData.title,
        client_id: jobData.client_id,
        assigned_to: jobData.assigned_to,
      });
    } catch (logError) {
      console.warn('Failed to log job creation activity:', logError);
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating job:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the job',
    };
  }
};

/**
 * Get all jobs with client and employee data
 */
export const getJobs = async (): Promise<JobResponse> => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        client:clients(id, name, company, email),
        employee:employees(id, name, email, role)
      `,
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch jobs',
      };
    }

    // Transform the data to match our interface
    const transformedData = (data || []).map((job: any) => ({
      ...job,
      client: job.client || undefined,
      employee: job.employee || undefined,
    }));

    return {
      data: transformedData,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching jobs:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching jobs',
    };
  }
};

/**
 * Get a single job by ID with client and employee data
 */
export const getJobById = async (jobId: string): Promise<JobResponse> => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        client:clients(id, name, company, email, phone, address),
        employee:employees(id, name, email, phone, role)
      `,
      )
      .eq('id', jobId)
      .single();

    if (error) {
      console.error('Error fetching job:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch job',
      };
    }

    // Transform the data to match our interface
    const transformedData = {
      ...data,
      client: data.client || undefined,
      employee: data.employee || undefined,
    };

    return {
      data: transformedData,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching job:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the job',
    };
  }
};

/**
 * Update a job and auto-generate payouts when completed
 */
export const updateJob = async (jobId: string, updateData: UpdateJobData): Promise<JobResponse> => {
  try {
    // Get the current job data first to check if status is changing to completed
    const { data: currentJob } = await getJobById(jobId);
    const wasCompleted = currentJob && (currentJob as Job).status === 'Completed';
    const willBeCompleted = updateData.status === 'Completed';

    const { data, error } = await supabase
      .from('jobs')
      .update({
        title: updateData.title,
        description: updateData.description || null,
        client_id: updateData.client_id || null,
        assigned_to: updateData.assigned_to || null,
        status: updateData.status,
        priority: updateData.priority,
        due_date: updateData.due_date || null,
        estimated_hours: updateData.estimated_hours || null,
        actual_hours: updateData.actual_hours || null,
        notes: updateData.notes || null,
      })
      .eq('id', jobId)
      .select()
      .single();

    if (error) {
      console.error('Error updating job:', error);
      return {
        data: null,
        error: error.message || 'Failed to update job',
      };
    }

    // Auto-generate payout when job is completed (but not if it was already completed)
    if (!wasCompleted && willBeCompleted && data.assigned_to) {
      try {
        // Try to auto-generate payout for the completed job
        const payoutResult = await autoGeneratePayout(
          undefined, // No specific service ID for jobs
          data.assigned_to, // Employee who completed the job
          undefined, // No AI agent for jobs
          data.actual_hours || data.estimated_hours, // Use actual hours if available, otherwise estimated
        );

        if (payoutResult.data) {
          console.log('Auto-generated payout for completed job:', payoutResult.data);
        } else {
          console.warn('Failed to auto-generate payout for job:', payoutResult.error);
        }
      } catch (payoutError) {
        console.warn('Error during auto-payout generation for job:', payoutError);
        // Don't fail the job update if payout generation fails
      }
    }

    // Log activity
    try {
      await logActivity(`Job "${data.title}" was updated`, 'job', '/operations-hub', {
        job_id: data.id,
        job_title: data.title,
        status: data.status,
        auto_payout_triggered: !wasCompleted && willBeCompleted,
      });
    } catch (logError) {
      console.warn('Failed to log job update activity:', logError);
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating job:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the job',
    };
  }
};

/**
 * Delete a job
 */
export const deleteJob = async (jobId: string): Promise<JobResponse> => {
  try {
    // First get the job data for logging
    const { data: jobData } = await getJobById(jobId);

    const { error } = await supabase.from('jobs').delete().eq('id', jobId);

    if (error) {
      console.error('Error deleting job:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete job',
      };
    }

    // Log activity
    if (jobData) {
      try {
        await logActivity(`Job "${(jobData as Job).title}" was deleted`, 'job', '/operations-hub', {
          job_id: jobId,
          job_title: (jobData as Job).title,
        });
      } catch (logError) {
        console.warn('Failed to log job deletion activity:', logError);
      }
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting job:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the job',
    };
  }
};

/**
 * Get jobs by status
 */
export const getJobsByStatus = async (status: JobStatus): Promise<JobResponse> => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        client:clients(id, name, company),
        employee:employees(id, name, role)
      `,
      )
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs by status:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch jobs by status',
      };
    }

    // Transform the data to match our interface
    const transformedData = (data || []).map((job: any) => ({
      ...job,
      client: job.client || undefined,
      employee: job.employee || undefined,
    }));

    return {
      data: transformedData,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching jobs by status:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching jobs by status',
    };
  }
};

/**
 * Get jobs by client ID
 */
export const getJobsByClientId = async (clientId: string): Promise<JobResponse> => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        client:clients(id, name, company),
        employee:employees(id, name, role)
      `,
      )
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs by client ID:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch jobs by client ID',
      };
    }

    // Transform the data to match our interface
    const transformedData = (data || []).map((job: any) => ({
      ...job,
      client: job.client || undefined,
      employee: job.employee || undefined,
    }));

    return {
      data: transformedData,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching jobs by client ID:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching jobs by client ID',
    };
  }
};

/**
 * Get jobs by employee ID
 */
export const getJobsByEmployeeId = async (employeeId: string): Promise<JobResponse> => {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        client:clients(id, name, company),
        employee:employees(id, name, role)
      `,
      )
      .eq('assigned_to', employeeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs by employee ID:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch jobs by employee ID',
      };
    }

    // Transform the data to match our interface
    const transformedData = (data || []).map((job: any) => ({
      ...job,
      client: job.client || undefined,
      employee: job.employee || undefined,
    }));

    return {
      data: transformedData,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching jobs by employee ID:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching jobs by employee ID',
    };
  }
};

/**
 * Get overdue jobs
 */
export const getOverdueJobs = async (): Promise<JobResponse> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const { data, error } = await supabase
      .from('jobs')
      .select(
        `
        *,
        client:clients(id, name, company),
        employee:employees(id, name, role)
      `,
      )
      .neq('status', 'Completed')
      .neq('status', 'Cancelled')
      .lt('due_date', today)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error fetching overdue jobs:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch overdue jobs',
      };
    }

    // Transform the data to match our interface
    const transformedData = (data || []).map((job: any) => ({
      ...job,
      client: job.client || undefined,
      employee: job.employee || undefined,
    }));

    return {
      data: transformedData,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching overdue jobs:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching overdue jobs',
    };
  }
};
