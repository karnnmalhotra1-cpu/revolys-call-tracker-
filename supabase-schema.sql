-- Run this once in Supabase: Project → SQL Editor → New query → paste all → Run

create table calls (
  id uuid primary key default gen_random_uuid(),
  logged_by text,
  school_name text not null,
  city text,
  outcome text not null,
  interested boolean,
  notes text,
  whatsapp_shared boolean default false,
  follow_up_needed boolean default false,
  follow_up_date date,
  follow_up_done boolean default false,
  logged_at timestamptz default now(),
  call_date date default current_date
);

create table interns (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  pin text not null
);

create table admin_settings (
  id int primary key default 1,
  username text not null default 'Superadmin',
  password text not null default 'Revolys@1108'
);

insert into admin_settings (id, username, password)
values (1, 'Superadmin', 'Revolys@1108')
on conflict (id) do nothing;

-- Basic access policies (anyone with the site link can read/write —
-- fine for a small internal tool, not bank-grade security)
alter table calls enable row level security;
alter table interns enable row level security;
alter table admin_settings enable row level security;

create policy "public read calls" on calls for select using (true);
create policy "public insert calls" on calls for insert with check (true);
create policy "public update calls" on calls for update using (true);
create policy "public delete calls" on calls for delete using (true);

create policy "public read interns" on interns for select using (true);
create policy "public insert interns" on interns for insert with check (true);
create policy "public delete interns" on interns for delete using (true);

create policy "public read admin" on admin_settings for select using (true);
create policy "public update admin" on admin_settings for update using (true);
