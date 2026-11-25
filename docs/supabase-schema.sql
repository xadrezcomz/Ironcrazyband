-- Esquema proposto para a fase com painel administrativo (blueprint, seções 11, 16 e 17).
-- Ainda NÃO está em uso: hoje o site lê public/acervo.json, que segue estes mesmos campos.
-- Arquivos originais ficam no armazenamento (Cloudflare R2 ou Supabase Storage); aqui só metadados.

create table integrantes (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  papel       text not null,
  nota        text,
  foto_url    text,                      -- nunca rosto gerado: só fotos reais
  ordem       int not null default 0,
  participacao_especial boolean not null default false
);

create table eventos (                    -- linha do tempo
  id          uuid primary key default gen_random_uuid(),
  ano_inicio  int not null check (ano_inicio between 2010 and 2026),
  ano_fim     int,
  titulo      text not null,
  texto       text,
  local       text,
  data        date
);

create table midias (                     -- fotos e vídeos do acervo
  id          uuid primary key default gen_random_uuid(),
  tipo        text not null check (tipo in ('foto', 'video', 'cartaz', 'objeto')),
  url         text not null,             -- cópia tratada para a web
  original_url text,                     -- arquivo original preservado
  legenda     text,
  evento_id   uuid references eventos(id),
  criado_em   timestamptz not null default now()
);

create table midia_integrantes (
  midia_id      uuid references midias(id) on delete cascade,
  integrante_id uuid references integrantes(id) on delete cascade,
  primary key (midia_id, integrante_id)
);

create table musicas (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  colecao     text check (colecao in ('Iron Crazy Live', 'Rock Classics', 'Flashback', 'Favoritas da banda', 'Raridades', 'Rádio Iron Crazy')),
  audio_url   text,
  autoral     boolean not null default false,
  licenca     text                       -- obrigatório para covers publicados
);

create table depoimentos (
  id            uuid primary key default gen_random_uuid(),
  integrante_id uuid references integrantes(id),
  texto         text not null,
  midia_id      uuid references midias(id)
);

create table mensagens (                  -- livro de visitas, com moderação
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  texto       text not null,
  foto_url    text,
  consentimento boolean not null,
  aprovada    boolean not null default false,
  criado_em   timestamptz not null default now()
);

create table administradores (
  user_id     uuid primary key references auth.users(id),
  papel       text not null check (papel in ('integrante', 'admin'))
);

-- Leitura pública só do que foi aprovado; escrita só para administradores.
alter table mensagens enable row level security;
create policy "ler aprovadas" on mensagens for select using (aprovada);
create policy "visitante envia" on mensagens for insert with check (consentimento and not aprovada);
create policy "admin modera" on mensagens for all
  using (exists (select 1 from administradores a where a.user_id = auth.uid()));
