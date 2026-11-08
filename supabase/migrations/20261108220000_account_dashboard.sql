alter table public.profiles
  add column username text;

alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9_]{3,24}$');

create unique index profiles_username_unique_idx
  on public.profiles (lower(username))
  where username is not null;

drop policy "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant update (display_name, avatar_url, username) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

alter table public.download_claims
  add column pack_name text;

create table public.download_history (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  pack_name text not null,
  image_count integer not null check (image_count > 0),
  downloaded_at timestamptz not null default now()
);

create index download_history_user_downloaded_at_idx
  on public.download_history (user_id, downloaded_at desc);

alter table public.download_history enable row level security;

create policy "Users can view their own download history"
  on public.download_history for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.download_history from anon, authenticated;
grant select on public.download_history to authenticated;

create function public.claim_download(
  p_kind text,
  p_image_count integer,
  p_pack_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_premium boolean;
  v_packs_today integer;
  v_claim_id uuid;
  v_day_start timestamptz := date_trunc('day', now() at time zone 'UTC') at time zone 'UTC';
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;
  if p_kind is null or p_image_count is null
    or p_kind not in ('image', 'pack') or p_image_count < 1
    or (p_kind = 'image' and p_image_count <> 1)
    or (p_kind = 'pack' and (
      p_pack_name is null
      or length(btrim(p_pack_name)) < 1
      or length(btrim(p_pack_name)) > 80
    )) then
    raise exception 'invalid_download_request' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));
  delete from public.download_claims
  where user_id = v_user_id
    and created_at < v_day_start - interval '1 day';

  select
    plan = 'premium' and status in ('active', 'trialing')
      and (current_period_end is null or current_period_end > now())
  into v_is_premium
  from public.user_entitlements
  where user_id = v_user_id
  for update;
  v_is_premium := coalesce(v_is_premium, false);

  if p_kind = 'pack' and not v_is_premium and p_image_count > 20 then
    raise exception 'free_pack_image_limit' using errcode = 'P0001';
  end if;

  if p_kind = 'pack' and not v_is_premium then
    select count(*) into v_packs_today
    from public.download_claims
    where user_id = v_user_id
      and kind = 'pack'
      and not premium_at_claim
      and created_at >= v_day_start
      and created_at < v_day_start + interval '1 day'
      and (completed_at is not null or created_at > now() - interval '30 minutes');

    if v_packs_today >= 2 then
      raise exception 'daily_pack_limit_reached' using errcode = 'P0001';
    end if;
  end if;

  insert into public.download_claims (user_id, kind, image_count, premium_at_claim, pack_name)
  values (v_user_id, p_kind, p_image_count, v_is_premium, case when p_kind = 'pack' then btrim(p_pack_name) end)
  returning id into v_claim_id;

  return jsonb_build_object(
    'claim_id', v_claim_id,
    'is_premium', v_is_premium,
    'packs_remaining', case
      when v_is_premium or p_kind = 'image' then null
      else greatest(0, 1 - coalesce(v_packs_today, 0))
    end
  );
end;
$$;

revoke all on function public.claim_download(text, integer, text) from public, anon;
grant execute on function public.claim_download(text, integer, text) to authenticated;

create or replace function public.claim_download(p_kind text, p_image_count integer)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  select public.claim_download(
    p_kind,
    p_image_count,
    case when p_kind = 'pack' then 'Mi pack' else null end
  );
$$;

revoke all on function public.claim_download(text, integer) from public, anon;
grant execute on function public.claim_download(text, integer) to authenticated;

create or replace function public.finish_download(p_claim_id uuid, p_success boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claim public.download_claims%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select * into v_claim
  from public.download_claims
  where id = p_claim_id
    and user_id = auth.uid()
    and completed_at is null
  for update;

  if not found then
    raise exception 'download_claim_not_found' using errcode = 'P0002';
  end if;

  if p_success then
    update public.download_claims
    set completed_at = now()
    where id = v_claim.id;

    if v_claim.kind = 'pack' then
      insert into public.download_history (claim_id, user_id, pack_name, image_count)
      values (v_claim.id, v_claim.user_id, coalesce(v_claim.pack_name, 'Pack descargado'), v_claim.image_count);
    end if;
  else
    delete from public.download_claims
    where id = v_claim.id;
  end if;
end;
$$;
