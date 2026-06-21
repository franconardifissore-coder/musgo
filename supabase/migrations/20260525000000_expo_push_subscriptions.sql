-- ============================================================
-- Migración para soportar push notifications mobile (Expo).
--
-- Contexto: durante la ventana de coexistencia (web viva + app
-- publicada), un mismo usuario puede tener suscripciones web (VAPID)
-- Y tokens nativos de Expo. Para evitar notificar dos veces:
--
--   1. Cuando el usuario registra un Expo push token desde la app
--      mobile, marcamos sus suscripciones VAPID como inactivas
--      (disabled_at != null).
--   2. La edge function send-watering-reminders salta las
--      suscripciones con disabled_at != null.
--
-- Esto deja al usuario recibiendo notificaciones solo desde el
-- canal más reciente (que asumimos es el preferido).
-- ============================================================

-- 1. Soft-disable column en la tabla VAPID existente.
alter table public.push_subscriptions
  add column if not exists disabled_at timestamptz;

create index if not exists push_subscriptions_active_idx
  on public.push_subscriptions (user_id)
  where disabled_at is null;

-- 2. Tabla nueva para Expo push tokens.
--    Un mismo usuario puede tener varios dispositivos (iPhone + iPad),
--    cada uno con su propio token Expo.
create table if not exists public.expo_push_subscriptions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  expo_token  text        not null,
  platform    text        not null check (platform in ('ios', 'android')),
  device_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, expo_token)
);

create index if not exists expo_push_subscriptions_user_id_idx
  on public.expo_push_subscriptions (user_id);

alter table public.expo_push_subscriptions enable row level security;

-- Cada usuario gestiona sus propios tokens.
drop policy if exists "Users can manage own expo push subscriptions"
  on public.expo_push_subscriptions;

create policy "Users can manage own expo push subscriptions"
on public.expo_push_subscriptions
for all
to authenticated
using  (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Trigger para mantener updated_at sincronizado.
create or replace function public.set_expo_push_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists expo_push_subscriptions_set_updated_at
  on public.expo_push_subscriptions;
create trigger expo_push_subscriptions_set_updated_at
  before update on public.expo_push_subscriptions
  for each row
  execute function public.set_expo_push_updated_at();
