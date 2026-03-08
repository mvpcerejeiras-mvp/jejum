-- Create message_queue table for centralized WhatsApp sending
create table public.message_queue (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete set null,
  phone text not null,
  content text not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent', 'error')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  sent_at timestamp with time zone,
  
  -- Metadata specifically for identifying why the message was queued
  metadata jsonb default '{}'::jsonb
);

-- Index for processing queue (find pending messages by priority/date)
create index idx_message_queue_processing on public.message_queue(status, priority desc, created_at asc) where status = 'pending';

-- Enable RLS
alter table public.message_queue enable row level security;

-- Policy: Allow read/write for all (simple pattern)
create policy "Allow all operations for everyone" 
on public.message_queue for all 
using (true) 
with check (true);
