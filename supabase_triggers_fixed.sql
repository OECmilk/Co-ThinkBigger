-- triggers_fixed.sql

-- 1. トレイト（関数）の修正
-- updatedAt を明示的に設定し、エラーを防ぎます
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public."Profile" (
    id, 
    "userId", 
    username, 
    "avatarUrl", 
    "createdAt", 
    "updatedAt"
  )
  values (
    gen_random_uuid(),
    new.id,
    -- ユーザー名の重複回避のため、時間を付与、またはメタデータを使用
    coalesce(
      new.raw_user_meta_data ->> 'username', 
      split_part(new.email, '@', 1) || '_' || substr(md5(new.id::text), 1, 4)
    ),
    new.raw_user_meta_data ->> 'avatar_url',
    now(), -- createdAt
    now()  -- updatedAt (Prismaの@updatedAtはDBレベルのデフォルトがないことが多いため必須)
  );
  return new;
end;
$$;

-- 2. トリガーの再作成（変更なし）
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
