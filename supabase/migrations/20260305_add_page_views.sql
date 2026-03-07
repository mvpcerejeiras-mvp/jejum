-- Add total_views column to system_config
ALTER TABLE public.system_config ADD COLUMN IF NOT EXISTS total_views INTEGER NOT NULL DEFAULT 0;

-- Create an RPC to increment the view count securely
CREATE OR REPLACE FUNCTION increment_page_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment the total_views on the most recent row of system_config
  UPDATE public.system_config
  SET total_views = total_views + 1
  WHERE id = (
    SELECT id FROM public.system_config 
    ORDER BY created_at DESC 
    LIMIT 1
  );
END;
$$;
