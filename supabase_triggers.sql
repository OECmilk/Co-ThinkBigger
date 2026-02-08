-- triggers.sql

-- ユーザー作成時に自動的にProfileを作成するトリガー
-- これを実行することで、サインアップ時に確実にProfileが作成されます

-- 1. トレイト（関数）の作成
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public."Profile" (id, "userId", username, "avatarUrl")
  values (
    gen_random_uuid(),
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- 2. トリガーの作成
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
