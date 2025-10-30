-- Create notifications table for LytbuB HQ
-- This table stores all system notifications for users

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('message', 'deliverable', 'feedback', 'invoice', 'budget', 'system')),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (for marking as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Only authenticated users can insert notifications (this will be handled by service functions)
CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Admin users can delete notifications (for cleanup)
CREATE POLICY "Admins can delete notifications" ON public.notifications
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.notifications
        WHERE user_id = user_uuid AND read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.notifications
    SET read = TRUE
    WHERE user_id = user_uuid AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification with optional external integrations
CREATE OR REPLACE FUNCTION create_notification(
    user_uuid UUID,
    notification_type TEXT,
    notification_title TEXT,
    notification_body TEXT,
    notification_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (user_uuid, notification_type, notification_title, notification_body, notification_link)
    RETURNING id INTO notification_id;

    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to notify external services (placeholder for future integration)
CREATE OR REPLACE FUNCTION notify_external_services()
RETURNS TRIGGER AS $$
BEGIN
    -- Placeholder for external integrations
    -- This will be expanded to call Slack, Discord, email services, etc.
    -- based on company_config settings

    RAISE LOG 'Notification created: % for user %', NEW.id, NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for external notifications
CREATE TRIGGER trigger_external_notifications
    AFTER INSERT ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION notify_external_services();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
