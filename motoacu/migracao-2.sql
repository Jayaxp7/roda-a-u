-- MotoAçu: migração 2 (encomenda/entrega + moto ao vivo)
-- Cola no Supabase em: SQL Editor > New query > Run
-- Pode rodar mais de uma vez sem problema.

-- Encomenda e entrega de restaurante
alter table pedidos add column if not exists descricao text;            -- o que vai ser levado
alter table pedidos add column if not exists solicitante_nome text;     -- nome do restaurante/loja (se for o caso)
alter table pedidos add column if not exists destinatario_nome text;    -- quem recebe
alter table pedidos add column if not exists destinatario_tel text;

-- Posição da moto durante a corrida (o passageiro vê a moto no mapa)
alter table pedidos add column if not exists motorista_lat double precision;
alter table pedidos add column if not exists motorista_lon double precision;
alter table pedidos add column if not exists motorista_pos_em timestamptz;

-- Busca rápida do histórico de cada passageiro e motorista
create index if not exists pedidos_passageiro_idx on pedidos (passageiro_tel, criado_em desc);
create index if not exists pedidos_motorista_idx on pedidos (motorista_tel, criado_em desc);
