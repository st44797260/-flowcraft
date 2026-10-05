-- FlowCraft 工作流表
-- 在 Supabase 控制台 → SQL Editor 中执行本文件

create table if not exists public.workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  status text not null default 'draft',  -- draft | active | archived
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 自动更新
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists workflows_set_updated_at on public.workflows;
create trigger workflows_set_updated_at
  before update on public.workflows
  for each row execute function public.set_updated_at();

-- 开启行级安全
alter table public.workflows enable row level security;

-- 演示策略：允许匿名增删改查（anon key 本来就暴露在前端）。
-- 正式使用时建议改为仅 authenticated 用户可见自己的数据：
--   using (auth.uid() is not null)
create policy "workflows_anon_select"
  on public.workflows for select using (true);

create policy "workflows_anon_insert"
  on public.workflows for insert with check (true);

create policy "workflows_anon_update"
  on public.workflows for update using (true);

create policy "workflows_anon_delete"
  on public.workflows for delete using (true);

-- ============================================
-- 执行记录表
-- ============================================
create table if not exists public.executions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  status text not null default 'running',  -- running | success | error
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  logs jsonb not null default '[]'::jsonb,
  result text,
  error text
);

create index if not exists executions_workflow_id_idx
  on public.executions (workflow_id);

alter table public.executions enable row level security;

create policy "executions_anon_select"
  on public.executions for select using (true);

create policy "executions_anon_insert"
  on public.executions for insert with check (true);

create policy "executions_anon_update"
  on public.executions for update using (true);

create policy "executions_anon_delete"
  on public.executions for delete using (true);

-- ============================================
-- 模板表（可选：未建表时前端使用内置模板目录）
-- ============================================
create table if not exists public.templates (
  id text primary key,                     -- 与前端内置模板 id 对应
  name text not null,
  description text,
  category text not null,
  nodes jsonb not null default '[]'::jsonb,
  edges jsonb not null default '[]'::jsonb,
  usage_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.templates enable row level security;

create policy "templates_anon_select"
  on public.templates for select using (true);

create policy "templates_anon_update"
  on public.templates for update using (true);
