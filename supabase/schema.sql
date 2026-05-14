-- ============================================================================
-- Nexa — esquema de base de datos
-- Ejecutá este script en Supabase → SQL Editor
-- ============================================================================

-- Tablas de catálogo

create table if not exists public.regions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  icon        text,
  created_at  timestamptz not null default now()
);

-- Tabla principal de negocios

create table if not exists public.businesses (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  slug            text not null unique,
  description     text not null,
  email           text,
  phone           text,
  website         text,
  instagram       text,
  facebook        text,
  whatsapp        text,
  address         text,
  latitude        double precision,
  longitude       double precision,
  rating          double precision,
  reviews_count   integer,
  hours           text,
  image_url       text,
  source          text,
  external_id     text,
  category_id     uuid not null references public.categories(id) on delete restrict,
  region_id       uuid not null references public.regions(id) on delete restrict,
  owner_id        uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists businesses_category_id_idx on public.businesses(category_id);
create index if not exists businesses_region_id_idx on public.businesses(region_id);
create index if not exists businesses_owner_id_idx on public.businesses(owner_id);
create index if not exists businesses_lat_lon_idx on public.businesses(latitude, longitude);

-- Caché de geocodificación (para Nominatim)

create table if not exists public.geocode_cache (
  id          uuid primary key default gen_random_uuid(),
  query       text not null unique,
  latitude    double precision not null,
  longitude   double precision not null,
  display     text,
  created_at  timestamptz not null default now()
);

-- Trigger updated_at

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.regions enable row level security;
alter table public.categories enable row level security;
alter table public.businesses enable row level security;
alter table public.geocode_cache enable row level security;

-- Lectura pública de catálogos y negocios
drop policy if exists "regions_select_all" on public.regions;
create policy "regions_select_all" on public.regions
  for select using (true);

drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all" on public.categories
  for select using (true);

drop policy if exists "businesses_select_all" on public.businesses;
create policy "businesses_select_all" on public.businesses
  for select using (true);

-- Negocios: solo el dueño puede insertar/editar/borrar los suyos
drop policy if exists "businesses_insert_own" on public.businesses;
create policy "businesses_insert_own" on public.businesses
  for insert with check (auth.uid() = owner_id);

drop policy if exists "businesses_update_own" on public.businesses;
create policy "businesses_update_own" on public.businesses
  for update using (auth.uid() = owner_id);

drop policy if exists "businesses_delete_own" on public.businesses;
create policy "businesses_delete_own" on public.businesses
  for delete using (auth.uid() = owner_id);

-- geocode_cache: solo accesible vía service role (sin políticas SELECT)
-- Las consultas server-side con service role bypassean RLS.

-- ============================================================================
-- Datos iniciales: categorías y regiones
-- ============================================================================

insert into public.categories (name, slug, icon) values
  ('Gastronomía', 'gastronomia', '🍽️'),
  ('Moda', 'moda', '👗'),
  ('Tecnología', 'tecnologia', '💻'),
  ('Servicios', 'servicios', '🛠️'),
  ('Belleza', 'belleza', '💅'),
  ('Hogar', 'hogar', '🏠'),
  ('Salud', 'salud', '🩺'),
  ('Educación', 'educacion', '📚'),
  ('Arte y diseño', 'arte-y-diseno', '🎨'),
  ('Mascotas', 'mascotas', '🐾')
on conflict (slug) do nothing;

insert into public.regions (name, slug) values
  ('Buenos Aires', 'buenos-aires'),
  ('Córdoba', 'cordoba'),
  ('Mendoza', 'mendoza'),
  ('Rosario', 'rosario'),
  ('Salta', 'salta'),
  ('La Plata', 'la-plata'),
  ('Mar del Plata', 'mar-del-plata'),
  ('Tucumán', 'tucuman'),
  ('Neuquén', 'neuquen'),
  ('Bariloche', 'bariloche')
on conflict (slug) do nothing;
