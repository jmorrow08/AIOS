// Script to create the 'media' bucket in Supabase Storage
// Run this script once to set up the bucket for the MediaStudio

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

async function createMediaBucket() {
  try {
    const { data, error } = await supabase.storage.createBucket('media', {
      public: true, // Make bucket public for easier access
      allowedMimeTypes: ['image/*', 'video/*'],
      fileSizeLimit: 104857600, // 100MB limit
    });

    if (error) {
      console.error('Error creating bucket:', error);
    } else {
      console.log('Media bucket created successfully:', data);
    }
  } catch (error) {
    console.error('Failed to create bucket:', error);
  }
}

createMediaBucket();
