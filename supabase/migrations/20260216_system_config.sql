-- Create system_config table (Single Row Pattern)
create table public.system_config (
  id uuid default gen_random_uuid() primary key,
  event_mode text not null check (event_mode in ('fasting', 'prayer_clock', 'combined')),
  active_campaign_id uuid references public.prayer_campaigns(id),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.system_config enable row level security;

-- Policy: Allow read for everyone (anon included)
create policy "Enable read access for all users" 
on public.system_config for select 
using (true);

-- Policy: Allow update only for authenticated users (admins) - OR all for simplicity based on current project pattern
create policy "Enable all operations for authenticated users and anon" 
on public.system_config for all 
using (true) 
with check (true);

-- Seed initial value
insert into public.system_config (event_mode) values ('fasting');
