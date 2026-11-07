create table public.user_entitlements (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'premium')),
  status text not null default 'inactive',
  current_period_end timestamptz,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  updated_at timestamptz not null default now()
);

create table public.download_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('image', 'pack')),
  image_count integer not null check (image_count > 0),
  premium_at_claim boolean not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index download_claims_user_created_at_idx
  on public.download_claims (user_id, created_at)
  where kind = 'pack';

alter table public.user_entitlements enable row level security;
alter table public.download_claims enable row level security;

create policy "Users can view their own entitlement"
  on public.user_entitlements for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on public.user_entitlements from anon, authenticated;
grant select on public.user_entitlements to authenticated;
revoke all on public.download_claims from anon, authenticated;

create function public.create_user_entitlement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_entitlement
  after insert on auth.users
  for each row execute function public.create_user_entitlement();

create function public.claim_download(p_kind text, p_image_count integer)
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
  if p_kind not in ('image', 'pack') or p_image_count < 1
    or (p_kind = 'image' and p_image_count <> 1) then
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

  insert into public.download_claims (user_id, kind, image_count, premium_at_claim)
  values (v_user_id, p_kind, p_image_count, v_is_premium)
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

create function public.finish_download(p_claim_id uuid, p_success boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  if p_success then
    update public.download_claims
    set completed_at = now()
    where id = p_claim_id and user_id = auth.uid() and completed_at is null;
  else
    delete from public.download_claims
    where id = p_claim_id and user_id = auth.uid() and completed_at is null;
  end if;

  if not found then
    raise exception 'download_claim_not_found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.claim_download(text, integer) from public, anon;
revoke all on function public.finish_download(uuid, boolean) from public, anon;
grant execute on function public.claim_download(text, integer) to authenticated;
grant execute on function public.finish_download(uuid, boolean) to authenticated;
