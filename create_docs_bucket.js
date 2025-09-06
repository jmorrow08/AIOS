// Script to create the 'docs' bucket in Supabase Storage
// Run this script once to set up the bucket for the KnowledgeLibrary

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You'll need this for bucket creation

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    'Missing environment variables. Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY',
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDocsBucket() {
  try {
    const { data, error } = await supabase.storage.createBucket('docs', {
      public: true, // Make bucket public for easier access
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      fileSizeLimit: 52428800, // 50MB limit for documents
    });

    if (error) {
      console.error('Error creating bucket:', error);
    } else {
      console.log('Docs bucket created successfully:', data);
    }
  } catch (error) {
    console.error('Failed to create bucket:', error);
  }
}

createDocsBucket();
