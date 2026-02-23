-- Create reminder_logs table to track sent notifications
create table public.reminder_logs (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade not null,
  type text not null check (type in ('fasting', 'prayer')),
  target_date text not null, -- Format: YYYY-MM-DD for fasting, or DD/MM HH:mm for prayer (or similar unique key)
  sent_at timestamp with time zone default timezone('utc'::text, now()) not null,
  status text default 'sent'
);

-- Index for faster lookups
create index idx_reminder_logs_lookup on public.reminder_logs(member_id, type, target_date);

-- Enable RLS
alter table public.reminder_logs enable row level security;

-- Policy: Allow read/write for all (following the simple patterns of this project)
create policy "Allow all operations for everyone" 
on public.reminder_logs for all 
using (true) 
with check (true);
