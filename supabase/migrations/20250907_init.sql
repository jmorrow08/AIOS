-- AI Operating System Database Schema
-- Migration: 20250907_init.sql

-- Create custom types/enums
CREATE TYPE user_role AS ENUM ('admin', 'client', 'agent');
CREATE TYPE service_status AS ENUM ('active', 'paused', 'completed');
CREATE TYPE billing_type AS ENUM ('subscription', 'one-time');
CREATE TYPE invoice_status AS ENUM ('pending', 'paid', 'overdue');
CREATE TYPE agent_status AS ENUM ('active', 'inactive');

-- Companies table
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services table
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    status service_status DEFAULT 'active',
    billing_type billing_type NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status invoice_status DEFAULT 'pending',
    paid_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agents table
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    prompt TEXT,
    api_key_ref TEXT,
    status agent_status DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent Logs table
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    input TEXT,
    output TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meeting Logs table
CREATE TABLE meeting_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Companies: Admins have full access, clients see their own company
CREATE POLICY "Admins have full access to companies" ON companies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Clients see their own company" ON companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.company_id = companies.id
        )
    );

-- Users: Admins have full access, clients see users in their company, agents see themselves
CREATE POLICY "Admins have full access to users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Clients see users in their company" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u1, users u2
            WHERE u1.id = auth.uid()
            AND u1.company_id = u2.company_id
            AND u2.id = users.id
        )
    );

CREATE POLICY "Agents see themselves" ON users
    FOR SELECT USING (
        users.id = auth.uid() AND users.role = 'agent'
    );

-- Services: Admins have full access, clients see services for their company
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
        )
    );

-- Invoices: Admins have full access, clients see invoices for their company
CREATE POLICY "Admins have full access to invoices" ON invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Clients see invoices for their company" ON invoices
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.company_id = invoices.company_id
        )
    );

-- Transactions: Admins have full access, clients see transactions for their company's invoices
CREATE POLICY "Admins have full access to transactions" ON transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Clients see transactions for their company" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u, invoices i
            WHERE u.id = auth.uid()
            AND u.company_id = i.company_id
            AND i.id = transactions.invoice_id
        )
    );

-- AI Agents: Admins have full access, agents have access to ai_agents and agent_logs
CREATE POLICY "Admins have full access to ai_agents" ON ai_agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Agents have access to ai_agents" ON ai_agents
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'agent'
        )
    );

-- Agent Logs: Admins have full access, agents see their own logs
CREATE POLICY "Admins have full access to agent_logs" ON agent_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Agents see their own logs" ON agent_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users u, ai_agents a
            WHERE u.id = auth.uid()
            AND u.role = 'agent'
            AND a.id = agent_logs.agent_id
        )
    );

-- Meeting Logs: Admins have full access
CREATE POLICY "Admins have full access to meeting_logs" ON meeting_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Seed Data

-- Insert sample company
INSERT INTO companies (id, name, contact_info) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Acme Corporation', '{"email": "contact@acme.com", "phone": "+1-555-0123", "address": "123 Business St, City, ST 12345"}');

-- Insert admin user
INSERT INTO users (id, email, role, company_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@acme.com', 'admin', '550e8400-e29b-41d4-a716-446655440000');

-- Insert client user
INSERT INTO users (id, email, role, company_id) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'client@acme.com', 'client', '550e8400-e29b-41d4-a716-446655440000');

-- Insert agent user
INSERT INTO users (id, email, role, company_id) VALUES
('550e8400-e29b-41d4-a716-446655440003', 'agent@acme.com', 'agent', '550e8400-e29b-41d4-a716-446655440000');

-- Insert AI agent
INSERT INTO ai_agents (id, name, role, prompt, status) VALUES
('550e8400-e29b-41d4-a716-446655440004', 'Sales Assistant', 'sales_support', 'You are a helpful sales assistant AI.', 'active');

-- Insert services
INSERT INTO services (id, company_id, name, description, status, billing_type, price, start_date, end_date) VALUES
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'AI Consulting', 'Monthly AI strategy and implementation consulting', 'active', 'subscription', 2500.00, '2024-09-01', '2024-12-31'),
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440000', 'Custom AI Development', 'One-time development of custom AI solution', 'active', 'one-time', 15000.00, '2024-09-01', NULL);

-- Insert invoices
INSERT INTO invoices (id, company_id, service_id, amount, due_date, status, paid_date) VALUES
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440005', 2500.00, '2024-09-30', 'paid', '2024-09-15'),
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440006', 15000.00, '2024-10-15', 'pending', NULL);

-- Insert transaction
INSERT INTO transactions (id, invoice_id, amount, payment_method) VALUES
('550e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440007', 2500.00, 'bank_transfer');

-- Insert agent log
INSERT INTO agent_logs (id, agent_id, input, output) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'How can I help with sales?', 'I can assist with lead generation, customer analysis, and sales strategy optimization.');
