alter table player_profiles add column if not exists last_activity_at date;

create or replace function sync_player_last_activity()
returns trigger language plpgsql as $$
declare
  target_user_id text;
begin
  target_user_id := case when TG_OP = 'DELETE' then OLD.user_id else NEW.user_id end;
  update player_profiles
    set last_activity_at = (
      select max(match_date) from performance_logs where user_id = target_user_id
    )
  where user_id = target_user_id;
  return null;
end;
$$;

create trigger trg_sync_player_last_activity
after insert or update or delete on performance_logs
for each row execute function sync_player_last_activity();
