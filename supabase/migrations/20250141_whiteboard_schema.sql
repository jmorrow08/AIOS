-- Whiteboard Schema Migration
-- Creates tables and policies for collaborative whiteboard functionality

-- Whiteboard Sessions Table
CREATE TABLE IF NOT EXISTS whiteboard_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    participants JSONB DEFAULT '[]'::jsonb, -- Array of user objects with id, name, color, cursor_position
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Whiteboard Elements Table
CREATE TABLE IF NOT EXISTS whiteboard_elements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES whiteboard_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('shape', 'text', 'drawing', 'image')),
    data JSONB NOT NULL, -- Contains element-specific data (coords, color, text, fileUrl, etc.)
    layer_order INTEGER DEFAULT 0, -- For z-index ordering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE whiteboard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_elements ENABLE ROW LEVEL SECURITY;

-- Policies for whiteboard_sessions
CREATE POLICY "Users can view sessions they participate in"
    ON whiteboard_sessions FOR SELECT
    USING (
        created_by = auth.uid() OR
        participants @> jsonb_build_array(jsonb_build_object('id', auth.uid()))
    );

CREATE POLICY "Users can create sessions"
    ON whiteboard_sessions FOR INSERT
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Session creators and participants can update"
    ON whiteboard_sessions FOR UPDATE
    USING (
        created_by = auth.uid() OR
        participants @> jsonb_build_array(jsonb_build_object('id', auth.uid()))
    );

-- Policies for whiteboard_elements
CREATE POLICY "Users can view elements in sessions they participate in"
    ON whiteboard_elements FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM whiteboard_sessions ws
            WHERE ws.id = whiteboard_elements.session_id
            AND (
                ws.created_by = auth.uid() OR
                ws.participants @> jsonb_build_array(jsonb_build_object('id', auth.uid()))
            )
        )
    );

CREATE POLICY "Users can insert elements in sessions they participate in"
    ON whiteboard_elements FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM whiteboard_sessions ws
            WHERE ws.id = whiteboard_elements.session_id
            AND (
                ws.created_by = auth.uid() OR
                ws.participants @> jsonb_build_array(jsonb_build_object('id', auth.uid()))
            )
        )
    );

CREATE POLICY "Users can update their own elements or in sessions they participate in"
    ON whiteboard_elements FOR UPDATE
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM whiteboard_sessions ws
            WHERE ws.id = whiteboard_elements.session_id
            AND (
                ws.created_by = auth.uid() OR
                ws.participants @> jsonb_build_array(jsonb_build_object('id', auth.uid()))
            )
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_whiteboard_sessions_created_by ON whiteboard_sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_whiteboard_sessions_participants ON whiteboard_sessions USING gin(participants);
CREATE INDEX IF NOT EXISTS idx_whiteboard_sessions_active ON whiteboard_sessions(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_whiteboard_elements_session_id ON whiteboard_elements(session_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_elements_user_id ON whiteboard_elements(user_id);
CREATE INDEX IF NOT EXISTS idx_whiteboard_elements_type ON whiteboard_elements(type);
CREATE INDEX IF NOT EXISTS idx_whiteboard_elements_layer_order ON whiteboard_elements(session_id, layer_order);
CREATE INDEX IF NOT EXISTS idx_whiteboard_elements_created_at ON whiteboard_elements(session_id, created_at);

-- Function to update whiteboard_element updated_at timestamp
CREATE OR REPLACE FUNCTION update_whiteboard_element_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update whiteboard_session updated_at when elements change
CREATE OR REPLACE FUNCTION update_whiteboard_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE whiteboard_sessions
    SET updated_at = NOW()
    WHERE id = COALESCE(NEW.session_id, OLD.session_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER trigger_update_whiteboard_element_updated_at
    BEFORE UPDATE ON whiteboard_elements
    FOR EACH ROW
    EXECUTE FUNCTION update_whiteboard_element_updated_at();

CREATE TRIGGER trigger_update_whiteboard_session_updated_at
    AFTER INSERT OR UPDATE OR DELETE ON whiteboard_elements
    FOR EACH ROW
    EXECUTE FUNCTION update_whiteboard_session_updated_at();
