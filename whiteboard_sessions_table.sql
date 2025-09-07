-- Whiteboard Sessions Table
-- Stores collaborative whiteboard sessions with participants and metadata

CREATE TABLE IF NOT EXISTS whiteboard_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    participants JSONB DEFAULT '[]'::jsonb, -- Array of user objects with id, name, color, cursor_position
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE whiteboard_sessions ENABLE ROW LEVEL SECURITY;

-- Policies
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

-- Indexes for performance
CREATE INDEX idx_whiteboard_sessions_created_by ON whiteboard_sessions(created_by);
CREATE INDEX idx_whiteboard_sessions_participants ON whiteboard_sessions USING gin(participants);
CREATE INDEX idx_whiteboard_sessions_active ON whiteboard_sessions(is_active) WHERE is_active = true;
