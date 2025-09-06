-- Demo users for testing authentication and role-based access
-- Run this in Supabase SQL Editor after setting up authentication

-- Create demo admin user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440000',
  'authenticated',
  'authenticated',
  'admin@demo.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Demo Admin", "company_name": "Your Company", "role": "admin"}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  0,
  NULL,
  '',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Create demo client user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '550e8400-e29b-41d4-a716-446655440001',
  'authenticated',
  'authenticated',
  'client@demo.com',
  crypt('client123', gen_salt('bf')),
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Demo Client", "company_name": "Client Company", "role": "client"}',
  FALSE,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  0,
  NULL,
  '',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- The profiles will be created automatically by the trigger
-- But let's also manually ensure they exist
INSERT INTO public.profiles (id, email, full_name, company_name, role)
VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'admin@demo.com', 'Demo Admin', 'Your Company', 'admin'),
  ('550e8400-e29b-41d4-a716-446655440001', 'client@demo.com', 'Demo Client', 'Client Company', 'client')
ON CONFLICT (id) DO NOTHING;

-- Create some sample data for testing
INSERT INTO public.jobs (client_name, employee_name, status, date, notes) VALUES
  ('Client Company', 'Demo Admin', 'In Progress', '2024-01-15', 'Website development project'),
  ('Client Company', 'Demo Admin', 'Pending', '2024-01-20', 'Mobile app consultation'),
  ('Another Client', 'Demo Admin', 'Completed', '2024-01-10', 'Logo design completed')
ON CONFLICT DO NOTHING;

INSERT INTO public.invoices (client_name, amount, status, due_date) VALUES
  ('Client Company', 2500.00, 'Draft', '2024-02-01'),
  ('Client Company', 1500.00, 'Paid', '2024-01-15'),
  ('Another Client', 3200.00, 'Overdue', '2024-01-01')
ON CONFLICT DO NOTHING;
