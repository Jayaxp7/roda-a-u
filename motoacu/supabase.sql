-- MotoAçu: tabela de pedidos (versão de TESTE)
-- Cola isso no Supabase em: SQL Editor > New query > Run

create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  tipo text not null default 'corrida',            -- corrida | encomenda | entrega_restaurante
  status text not null default 'pendente',         -- pendente | aceito | em_andamento | concluido | cancelado

  passageiro_nome text not null,
  passageiro_tel text not null,

  origem_lat double precision not null,
  origem_lon double precision not null,
  origem_texto text,
  destino_lat double precision not null,
  destino_lon double precision not null,
  destino_texto text,

  distancia_km numeric(6,2),
  duracao_min integer,
  valor numeric(8,2),

  motorista_nome text,
  motorista_tel text
);

create index if not exists pedidos_status_idx on pedidos (status, criado_em desc);

-- Segurança para TESTE: qualquer pessoa com o link pode ler e escrever.
-- Antes de abrir pro público, trocar por login (Supabase Auth) e regras por usuário.
alter table pedidos enable row level security;

drop policy if exists "teste_total" on pedidos;
create policy "teste_total" on pedidos
  for all to anon
  using (true)
  with check (true);
