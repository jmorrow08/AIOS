-- Client Portal Schema Updates
-- Migration: 202509XX_client_portal_schema.sql
-- Updates services table status enum and adds deliverables column

-- Update service status enum to match new flow requirements
ALTER TYPE service_status RENAME TO service_status_old;
CREATE TYPE service_status AS ENUM ('requested', 'in_progress', 'review', 'completed', 'archived');

-- Update services table to use new status enum
ALTER TABLE services ALTER COLUMN status TYPE service_status USING
  CASE
    WHEN status::text = 'active' THEN 'in_progress'::service_status
    WHEN status::text = 'paused' THEN 'requested'::service_status
    WHEN status::text = 'completed' THEN 'completed'::service_status
    ELSE 'requested'::service_status
  END;

-- Add deliverables JSONB column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS deliverables JSONB DEFAULT '[]'::jsonb;

-- Drop old enum type
DROP TYPE service_status_old;

-- Create deliverables storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'deliverables',
  'deliverables',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/zip',
    'application/x-zip-compressed'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deliverables bucket
CREATE POLICY "Users can view deliverables for their services" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'deliverables' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM services WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
        UNION
        SELECT company_id FROM clients WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload deliverables for their services" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'deliverables' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM services WHERE company_id IN (
        SELECT company_id FROM employees WHERE id = auth.uid()
        UNION
        SELECT company_id FROM clients WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Admins and agents can manage all deliverables" ON storage.objects
  FOR ALL USING (
    bucket_id = 'deliverables' AND
    EXISTS (
      SELECT 1 FROM employees
      WHERE id = auth.uid()
      AND role IN ('admin', 'manager', 'agent')
    )
  );

-- Update RLS policies for services table to include new status values
DROP POLICY IF EXISTS "Admins have full access to services" ON services;
DROP POLICY IF EXISTS "Clients see services for their company" ON services;

CREATE POLICY "Admins have full access to services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Clients see services for their company" ON services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.company_id = services.company_id
      AND users.role = 'client'
    )
  );

CREATE POLICY "Agents can view and update services for their company" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = auth.uid()
      AND employees.company_id = services.company_id
      AND employees.role IN ('agent', 'manager')
    )
  );

-- Add index for deliverables column for better performance
CREATE INDEX IF NOT EXISTS idx_services_deliverables ON services USING gin(deliverables);

-- Update trigger for services table updated_at (if not already present)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at column to services if it doesn't exist
ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for services table
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
