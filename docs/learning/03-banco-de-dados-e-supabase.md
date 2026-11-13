# 3 — Banco de dados e Supabase

Estado: 🟢 **pronto** no local e no remoto, com 13 testes de segurança passando. Ainda **sem conteúdo** (vem do M1).

## 3.1 O que é um banco de dados

Um **banco de dados** guarda informação de forma organizada, permanente e segura, e permite buscá-la rápido. O Arandu usa o **PostgreSQL** (ou "Postgres"), um banco **relacional**, gratuito e de código aberto.

Num banco relacional, os dados ficam em **tabelas**, como planilhas:

| id | slug | title | status |
| --- | --- | --- | --- |
| `a1b2…` | `exemplo-1` | [CONTEÚDO DE TESTE — NÃO PUBLICAR] | publicado |
| `c3d4…` | `exemplo-2` | [CONTEÚDO DE TESTE — NÃO PUBLICAR] | revisao_pesquisa |

- Cada **linha** é um registro (um ponto).
- Cada **coluna** é um campo, com um **tipo** (texto, número, data...).
- A **chave primária** (`id`) identifica cada linha de forma única. No Arandu, os ids são **UUIDs**: códigos longos e aleatórios, como `3f2b9c1e-...`, praticamente impossíveis de repetir.
- Uma **chave estrangeira** liga tabelas. Por exemplo, `challenge.point_id` aponta para o `id` de um ponto: todo desafio pertence a um ponto.

## 3.2 SQL: a linguagem do banco

**SQL** é a linguagem usada para criar tabelas e consultar dados.

```sql
-- Buscar os pontos publicados de um bairro
select slug, title
from point
where status = 'publicado' and neighborhood = 'Bairro Exemplo';
```

```sql
-- Criar uma tabela (trecho real, simplificado, do Arandu)
create table public.challenge (
  id uuid primary key default gen_random_uuid(),
  point_id uuid references public.point(id) on delete cascade,
  kind text not null check (kind in ('multipla_escolha', 'mito_ou_fato')),
  prompt text not null
);
```

O que cada parte faz:

- `primary key`: é a chave primária.
- `default gen_random_uuid()`: o banco gera o id sozinho.
- `references public.point(id)`: é uma chave estrangeira.
- `on delete cascade`: se o ponto for apagado, seus desafios também são.
- `not null`: o campo é obrigatório.
- `check (...)`: só aceita os valores listados.

### Enums

Um **enum** é um tipo com uma lista fechada de valores. O status de um ponto só pode ser um destes:

```sql
create type public.point_status as enum (
  'proposta_ia', 'revisao_pesquisa', 'validacao_comunidade',
  'publicado', 'rejeitado', 'restrito'
);
```

Isso impede erros como gravar `'publicad'` por engano.

## 3.3 As tabelas do Arandu

São 16 tabelas, em quatro grupos. O diagrama completo está em [`docs/arquitetura/02-modelo-de-dados.md`](../arquitetura/02-modelo-de-dados.md).

| Grupo | Tabelas | Para quê |
| --- | --- | --- |
| **Conteúdo** | `point`, `source`, `point_source`, `challenge`, `toponym`, `trail`, `trail_point` | O que o app mostra |
| **Curadoria** | `partner`, `validation`, `ai_proposal`, `curator` | Como o conteúdo chega à publicação, e quem pode mexer |
| **Uso** | `discovery`, `classroom`, `classroom_member` | O que cada usuário fez |
| **Guia** | `content_chunk` | Trechos do conteúdo preparados para a busca do guia |

Duas observações:

- `point_source` é uma **tabela de ligação**: um ponto pode ter várias fontes, e uma fonte pode servir a vários pontos.
- `discovery` guarda **só** quem descobriu, qual ponto, de que modo e se acertou o desafio. **Não tem coordenadas** do usuário.

## 3.4 Dados geográficos com PostGIS

**PostGIS** é uma extensão do Postgres para dados de mapa. Com ele, a coluna `location` de um ponto é do tipo `geography(point, 4326)`:

- `point` quer dizer que é um ponto, e não uma linha ou uma área;
- `4326` é o código do sistema de coordenadas **WGS 84**, o mesmo do GPS (latitude e longitude).

Isso permite perguntas como "quais pontos estão a menos de 1 km daqui?" direto no banco.

## 3.5 Índices: como o banco busca rápido

Um **índice** é como o índice remissivo de um livro: em vez de ler todas as páginas, o banco vai direto ao lugar certo. O Arandu tem quatro índices:

| Índice | Tipo | Acelera |
| --- | --- | --- |
| `point_location_idx` | **GiST** (para geometria) | Busca de pontos por proximidade ou área |
| `point_status_idx` | Comum (B-tree) | Filtro de pontos publicados |
| `content_chunk_fts_idx` | **GIN** (para texto) | Busca por palavras em português |
| `content_chunk_embedding_idx` | **HNSW** (para vetores) | Busca por significado no guia (ver [documento 5](05-inteligencia-artificial.md)) |

### Busca de texto em português

A coluna `content_chunk.fts` guarda o texto já preparado para busca com `to_tsvector('portuguese', text)`. O Postgres reduz cada palavra ao seu radical: "descobertas", "descoberta" e "descobrir" passam a se encontrar. Assim o guia acha trechos mesmo quando a pergunta usa outra forma da palavra.

## 3.5b Limites oficiais e "ponto dentro de polígono"

A tabela `admin_area` guarda os contornos oficiais dos **27 estados e 5.570 municípios**, baixados da API de malhas do **IBGE** (dados públicos) pelo script `pipeline/arandu_pipeline/ibge_areas.py`:

```bash
cd pipeline && uv run python -m arandu_pipeline.ibge_areas   # depois de cada db reset
```

Cada ponto ganha automaticamente o código IBGE do estado (`state_code`, 2 dígitos) e do município (`municipality_code`, 7 dígitos). Quem faz isso é o trigger `point_assign_admin_area`, com uma operação clássica de geografia: ***point-in-polygon*** ("este ponto está dentro deste polígono?"), feita pela função `ST_Covers` do PostGIS.

Depois de importar, a função `refresh_admin_derived()` calcula duas coisas que o mapa usa:

- a **forma do Brasil** (`code = 'BR'`, `level = 'pais'`), unindo os 27 estados com `ST_Union`;
- as **divisas internas** de cada estado e município (`border`): o contorno (`ST_Boundary`) menos uma faixa de ~1 km em volta do limite do país (`ST_Difference` com `ST_Buffer`), o que tira o litoral e as fronteiras internacionais.

Se as malhas forem carregadas **depois** dos pontos, a função `refresh_point_admin_codes()` recalcula todos. O script de importação já a chama no final.

### Views: perguntas prontas

Uma **view** é uma consulta SQL salva com nome, que se usa como se fosse uma tabela. O Arandu tem duas, feitas para o app:

- `published_point`: pontos publicados com latitude e longitude como números (o app não precisa entender o formato do PostGIS);
- `area_with_points`: só os estados e municípios que têm pontos publicados, com o total e o contorno.

As duas usam `security_invoker`: a view roda **com as permissões de quem pergunta**, então as regras de acesso (RLS) continuam valendo. Sem isso, uma view rodaria com as permissões do dono do banco e poderia mostrar o que não devia.

## 3.6 Triggers e funções: regras que o banco aplica sozinho

Uma **função** é um bloco de código guardado no banco. Um **trigger** (gatilho) é uma função que roda **automaticamente** quando algo acontece numa tabela.

O Arandu usa três triggers:

| Trigger | Quando roda | O que faz |
| --- | --- | --- |
| `point_before_update` | Antes de alterar um ponto | Atualiza a data de modificação; registra `published_at` quando o ponto é publicado |
| `content_chunk_guard` | Antes de gravar um trecho do guia | **Recusa** o trecho se o ponto não estiver publicado ou for restrito |
| `point_purge_chunks` | Depois de mudar o status ou a sensibilidade de um ponto | **Apaga** os trechos do guia se o ponto deixar de ser público |

Os dois últimos garantem uma regra inegociável do projeto, **"conteúdo restrito nunca é enviado ao LLM"**, dentro do próprio banco. Mesmo que um programa tenha um erro, o banco não deixa o conteúdo restrito chegar ao guia.

## 3.7 Migrations: a história do banco em arquivos

Uma **migration** é um arquivo SQL que descreve **uma mudança** na estrutura do banco. Elas ficam em `supabase/migrations/`, numeradas por data:

```text
20261112000000_initial_schema.sql   tabelas, tipos, índices, triggers
20261112000100_rls.sql              regras de acesso (ver documento 4)
```

Por que usar migrations em vez de mexer no banco à mão:

- **Reprodutível:** qualquer pessoa recria o banco idêntico com um comando.
- **Versionado:** as migrations ficam no Git, com histórico de quem mudou o quê.
- **Seguro:** a mesma migration é testada no local e no CI antes de chegar ao remoto.

Regra importante: **uma migration já aplicada no remoto nunca é editada.** Se algo precisar mudar, cria-se uma migration nova. Editar a antiga faria o remoto e o código contarem histórias diferentes.

## 3.8 O que é o Supabase

O **Supabase** é uma plataforma que entrega, prontos, os serviços de servidor de que um app costuma precisar. Por baixo, é quase tudo software aberto.

| Serviço | O que é | Uso no Arandu |
| --- | --- | --- |
| **Database** | Um Postgres completo | Todas as tabelas 🟢 |
| **API automática** (PostgREST) | Transforma cada tabela num endereço web. Ex.: `/rest/v1/point` | O app vai ler pontos por aqui ⚪ |
| **Auth** | Login de usuários | Login anônimo dos estudantes 🟢 |
| **Storage** | Guarda arquivos | Imagens com licença livre e, talvez, tiles do mapa ⚪ |
| **Edge Functions** | Pequenos programas que rodam no servidor | O guia (RAG) ⚪ |

Com a **API automática**, o app não precisa de um servidor feito à mão: pede `GET /rest/v1/point?select=slug,title` e recebe os pontos em JSON. Quem decide **o que** cada um pode ver são as regras de acesso (RLS), explicadas no [documento 4](04-seguranca-e-privacidade.md).

## 3.9 Supabase local e remoto

### Local, com Docker

O **Docker** roda programas em **contêineres**: caixas isoladas que já trazem tudo de que o programa precisa. O comando `npx supabase start` sobe vários contêineres (banco, API, login, painel) **no seu notebook**, idênticos aos da nuvem.

```bash
npx supabase start      # liga o Supabase local
npx supabase db reset   # recria o banco do zero: aplica as migrations e o seed
npx supabase test db    # roda os testes do banco
npx supabase stop       # desliga
```

O painel local (Studio) abre em `http://127.0.0.1:54323` e permite ver as tabelas.

### Remoto

O projeto na nuvem (plano gratuito) recebe as migrations com:

```bash
npx supabase db push --remote
```

Atenção: na CLI 3, **sem `--remote` o comando vai para o banco local**.

## 3.10 O seed: o conteúdo inicial

O **seed** (semente) é o conteúdo que entra no banco quando ele é criado. Hoje, no ambiente local, o seed tem só **4 pontos de teste** (`supabase/seed/dev_test_points.sql`), usados para desenvolver o mapa. Eles **nunca** vão para o banco remoto. No Arandu, ele vem da pesquisa do M1, em arquivos JSON legíveis por pessoas (`supabase/seed/points/<slug>.json`), no formato definido em `docs/09-roteiro-pesquisa-m1.md`.

Um script de importação ⚪ vai validar cada arquivo e recusar pontos sem fonte, sem coordenada ou sem desafio. Todo ponto do seed entra como `revisao_pesquisa`; nenhum entra publicado.

## 3.11 Testes do banco (pgTAP)

**pgTAP** é uma ferramenta para escrever testes **em SQL**, dentro do próprio banco. O arquivo `supabase/tests/database/rls.test.sql`:

1. cria dados de teste fictícios (pontos publicados, rascunhos, restritos);
2. **finge ser** cada tipo de usuário (visitante anônimo, estudante, curador);
3. confere o que cada um consegue ver e fazer;
4. desfaz tudo no final (`rollback`), sem deixar sujeira.

Exemplo:

```sql
set local role anon;  -- a partir daqui, age como visitante não logado
select results_eq(
  'select slug from public.point',
  array['teste-publicado'],
  'anon sees only published, non-restricted points');
```

São 13 testes, que rodam no seu notebook e a cada envio de código ao GitHub.
