import { supabase } from '@/lib/supabaseClient';
import { logActivity } from '@/api/dashboard';

export type ClientStatus = 'Active' | 'Inactive' | 'Prospect';

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: ClientStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientResponse {
  data: Client | Client[] | null;
  error: string | null;
}

export interface CreateClientData {
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: ClientStatus;
  notes?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {}

/**
 * Create a new client
 */
export const createClient = async (clientData: CreateClientData): Promise<ClientResponse> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([
        {
          name: clientData.name,
          company: clientData.company || null,
          email: clientData.email || null,
          phone: clientData.phone || null,
          address: clientData.address || null,
          status: clientData.status || 'Active',
          notes: clientData.notes || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return {
        data: null,
        error: error.message || 'Failed to create client',
      };
    }

    // Log activity
    try {
      await logActivity(`Client "${clientData.name}" was created`, 'client', '/operations-hub', {
        client_id: data.id,
        client_name: clientData.name,
        company: clientData.company,
      });
    } catch (logError) {
      console.warn('Failed to log client creation activity:', logError);
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error creating client:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while creating the client',
    };
  }
};

/**
 * Get all clients
 */
export const getClients = async (): Promise<ClientResponse> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch clients',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching clients:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching clients',
    };
  }
};

/**
 * Get a single client by ID
 */
export const getClientById = async (clientId: string): Promise<ClientResponse> => {
  try {
    const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();

    if (error) {
      console.error('Error fetching client:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch client',
      };
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching client:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching the client',
    };
  }
};

/**
 * Update a client
 */
export const updateClient = async (
  clientId: string,
  updateData: UpdateClientData,
): Promise<ClientResponse> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({
        name: updateData.name,
        company: updateData.company || null,
        email: updateData.email || null,
        phone: updateData.phone || null,
        address: updateData.address || null,
        status: updateData.status,
        notes: updateData.notes || null,
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return {
        data: null,
        error: error.message || 'Failed to update client',
      };
    }

    // Log activity
    try {
      await logActivity(`Client "${data.name}" was updated`, 'client', '/operations-hub', {
        client_id: data.id,
        client_name: data.name,
      });
    } catch (logError) {
      console.warn('Failed to log client update activity:', logError);
    }

    return {
      data,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error updating client:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while updating the client',
    };
  }
};

/**
 * Delete a client
 */
export const deleteClient = async (clientId: string): Promise<ClientResponse> => {
  try {
    // First get the client data for logging
    const { data: clientData } = await getClientById(clientId);

    const { error } = await supabase.from('clients').delete().eq('id', clientId);

    if (error) {
      console.error('Error deleting client:', error);
      return {
        data: null,
        error: error.message || 'Failed to delete client',
      };
    }

    // Log activity
    if (clientData) {
      try {
        await logActivity(
          `Client "${(clientData as Client).name}" was deleted`,
          'client',
          '/operations-hub',
          {
            client_id: clientId,
            client_name: (clientData as Client).name,
          },
        );
      } catch (logError) {
        console.warn('Failed to log client deletion activity:', logError);
      }
    }

    return {
      data: null,
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error deleting client:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while deleting the client',
    };
  }
};

/**
 * Get clients by status
 */
export const getClientsByStatus = async (status: ClientStatus): Promise<ClientResponse> => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('status', status)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching clients by status:', error);
      return {
        data: null,
        error: error.message || 'Failed to fetch clients by status',
      };
    }

    return {
      data: data || [],
      error: null,
    };
  } catch (error) {
    console.error('Unexpected error fetching clients by status:', error);
    return {
      data: null,
      error: 'An unexpected error occurred while fetching clients by status',
    };
  }
};
