-- Service Messages Table
CREATE TABLE IF NOT EXISTS service_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('client', 'admin', 'agent')),
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb, -- Array of attachment objects with url, filename, type
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Deliverables Table
CREATE TABLE IF NOT EXISTS service_deliverables (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_size BIGINT,
    file_type VARCHAR(100),
    uploaded_by UUID NOT NULL,
    uploaded_by_type VARCHAR(20) NOT NULL CHECK (uploaded_by_type IN ('admin', 'agent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'revision_requested')),
    feedback TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Feedback Table
CREATE TABLE IF NOT EXISTS service_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    client_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_messages_service_id ON service_messages(service_id);
CREATE INDEX IF NOT EXISTS idx_service_messages_created_at ON service_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_service_deliverables_service_id ON service_deliverables(service_id);
CREATE INDEX IF NOT EXISTS idx_service_deliverables_status ON service_deliverables(status);
CREATE INDEX IF NOT EXISTS idx_service_feedback_service_id ON service_feedback(service_id);
CREATE INDEX IF NOT EXISTS idx_service_feedback_rating ON service_feedback(rating);

-- Enable RLS (Row Level Security)
ALTER TABLE service_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_messages
CREATE POLICY "Users can view messages for their services" ON service_messages
    FOR SELECT USING (
        service_id IN (
            SELECT id FROM services WHERE company_id IN (
                SELECT company_id FROM employees WHERE id = auth.uid()
                UNION
                SELECT company_id FROM clients WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can insert messages for their services" ON service_messages
    FOR INSERT WITH CHECK (
        service_id IN (
            SELECT id FROM services WHERE company_id IN (
                SELECT company_id FROM employees WHERE id = auth.uid()
                UNION
                SELECT company_id FROM clients WHERE id = auth.uid()
            )
        )
    );

-- RLS Policies for service_deliverables
CREATE POLICY "Users can view deliverables for their services" ON service_deliverables
    FOR SELECT USING (
        service_id IN (
            SELECT id FROM services WHERE company_id IN (
                SELECT company_id FROM employees WHERE id = auth.uid()
                UNION
                SELECT company_id FROM clients WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins and agents can manage deliverables" ON service_deliverables
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees
            WHERE id = auth.uid()
            AND role IN ('admin', 'manager', 'agent')
        )
    );

-- RLS Policies for service_feedback
CREATE POLICY "Users can view feedback for their services" ON service_feedback
    FOR SELECT USING (
        service_id IN (
            SELECT id FROM services WHERE company_id IN (
                SELECT company_id FROM employees WHERE id = auth.uid()
                UNION
                SELECT company_id FROM clients WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Clients can insert feedback for their services" ON service_feedback
    FOR INSERT WITH CHECK (
        client_id = auth.uid() AND
        service_id IN (
            SELECT id FROM services WHERE company_id IN (
                SELECT company_id FROM clients WHERE id = auth.uid()
            )
        )
    );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_messages_updated_at BEFORE UPDATE ON service_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_deliverables_updated_at BEFORE UPDATE ON service_deliverables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_feedback_updated_at BEFORE UPDATE ON service_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
