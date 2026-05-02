create table if not exists performance_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  match_date  date not null default current_date,
  entry_type  text not null check (entry_type in ('match', 'training', 'trial')),
  context     text,
  goals       integer,
  assists     integer,
  rating      integer check (rating between 1 and 10),
  notes       text,
  created_at  timestamptz not null default now()
);

alter table performance_logs enable row level security;

create policy "Users can manage their own logs"
  on performance_logs for all
  using (true)
  with check (true);

create index performance_logs_user_id_idx on performance_logs (user_id, match_date desc);
