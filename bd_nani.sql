-- 1. Extensión para generación de IDs únicos
create extension if not exists "uuid-ossp";

-- 2. Configuración del perfil de usuario y seguridad (PIN)
create table public.perfiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pin_hash text not null,
  pin_actualizado_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Entidades bancarias y billeteras
create table public.cuentas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nombre text not null, -- Ej: Bancolombia, Nequi, Efectivo
  tipo text not null check (tipo in ('debito', 'credito', 'efectivo', 'billetera_digital')),
  saldo_inicial numeric(12, 2) default 0.00 not null,
  activa boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Obligaciones fijas mensuales (Facturas / Arriendo)
create table public.obligaciones_fijas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  descripcion text not null,
  monto_estimado numeric(12, 2) not null,
  dia_pago_limite integer check (dia_pago_limite between 1 and 31) not null,
  categoria text default 'Obligatorio' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Transacciones diarias (Ingresos, Egresos, Inversiones)
create table public.transacciones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  cuenta_id uuid references public.cuentas(id) on delete cascade not null,
  monto numeric(12, 2) not null,
  tipo text not null check (tipo in ('ingreso', 'egreso', 'inversion')),
  categoria text not null, -- Ej: Arriendo, Alimentación, Nómina, CDT
  descripcion text,
  es_obligatorio boolean default false not null,
  fecha timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Portafolio de Inversiones (Módulo Futuro)
create table public.inversiones (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tipo_activo text not null, -- Ej: CDT, Fondos Inmobiliarios, Acciones
  monto_invertido numeric(12, 2) not null,
  rendimiento_anual_esperado numeric(5, 2), -- Porcentaje %
  fecha_inicio date default current_date not null,
  fecha_vencimiento date,
  estado text default 'activa' check (estado in ('activa', 'finalizada', 'cancelada')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Vista optimizada para la exportación a Excel mensual
create or replace view public.v_reporte_mensual as
select
  user_id,
  extract(year from fecha)::integer as anio,
  extract(month from fecha)::integer as mes,
  to_char(fecha, 'TCMonth YYYY') as periodo,
  sum(case when tipo = 'ingreso' then monto else 0 end) as total_ingresos,
  sum(case when tipo = 'egreso' then monto else 0 end) as total_egresos,
  sum(case when tipo = 'inversion' then monto else 0 end) as total_inversiones,
  sum(case when tipo = 'ingreso' then monto else 0 end) - 
  sum(case when tipo = 'egreso' then monto else 0 end) - 
  sum(case when tipo = 'inversion' then monto else 0 end) as saldo_remanente
from public.transacciones
group by user_id, extract(year from fecha), extract(month from fecha), to_char(fecha, 'TCMonth YYYY')
order by anio desc, mes desc;

alter table public.obligaciones_fijas 
add column if not exists pagado boolean default false;