-- Run this SQL in Supabase SQL Editor

create table announcements (
  id uuid default gen_random_uuid() primary key,
  title text,
  body text,
  timestamp timestamptz
);

create table suggestions (
  id uuid default gen_random_uuid() primary key,
  message text,
  votes int,
  timestamp timestamptz
);

create table access_logs (
  id uuid default gen_random_uuid() primary key,
  code text,
  role text,
  user_agent text,
  timestamp timestamptz
);