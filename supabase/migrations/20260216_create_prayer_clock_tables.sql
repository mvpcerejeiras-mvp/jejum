-- Create table for Prayer Campaigns
CREATE TABLE IF NOT EXISTS prayer_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration INTEGER NOT NULL CHECK (duration IN (12, 48)),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on campaigns
ALTER TABLE prayer_campaigns ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view campaigns
CREATE POLICY "Everyone can view campaigns" 
ON prayer_campaigns FOR SELECT 
USING (true);

-- Policy: Only authenticated users (admins) can insert/update/delete campaigns
-- Note: Adjust this policy based on your specific auth setup. Assuming admins have a specific role or just enabling for all auth users for now if simple app.
-- For this improved version, we'll assume public read, authenticated insert/update.
CREATE POLICY "Authenticated users can manage campaigns" 
ON prayer_campaigns FOR ALL 
USING (auth.role() = 'authenticated');


-- Create table for Prayer Signups
CREATE TABLE IF NOT EXISTS prayer_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES prayer_campaigns(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    slot_number INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Constraint: slot_number must be within campaign duration (handled by app logic mostly, but good to have constraint if possible, but duration varies)
    -- Constraint: Unique member per slot in a campaign (prevent double signup for same hour)
    UNIQUE(campaign_id, member_id, slot_number)
);

-- Enable RLS on signups
ALTER TABLE prayer_signups ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view signups (to see slots filling up)
CREATE POLICY "Everyone can view signups" 
ON prayer_signups FOR SELECT 
USING (true);

-- Policy: Insert allowed for public/anon if we use the backend API to handle validation, 
-- but usually signups are done by the user. If public site allows signup:
CREATE POLICY "Everyone can insert signups" 
ON prayer_signups FOR INSERT 
WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_prayer_signups_campaign_id ON prayer_signups(campaign_id);
CREATE INDEX idx_prayer_signups_member_id ON prayer_signups(member_id);
