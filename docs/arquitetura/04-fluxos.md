# 04 — Fluxos

Diagramas de sequência dos quatro fluxos centrais.

## Descoberta por proximidade

Estado: ⚪ Planejado (M2). Regra: **a posição do usuário nunca sai do aparelho.**

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário
  participant App as App (Expo)
  participant Geo as Localização do aparelho
  participant Loc as Progresso local
  participant DB as Supabase (RLS)

  App->>DB: lista pontos publicados da região
  DB-->>App: pontos com location e unlock_radius_m
  loop enquanto o mapa está aberto
    Geo-->>App: posição atual (só em memória)
    App->>App: distância até cada ponto
  end
  alt dentro do raio
    App->>U: "Você descobriu um lugar"
    App->>Loc: salva point_id e modo presencial
    App->>App: acende a célula H3 do ponto
    App->>DB: insert discovery(user_id, point_id, mode)
    Note over App,DB: sem coordenadas do usuário
  else modo exploração remota
    U->>App: toca no ponto
    App->>Loc: salva point_id e modo remota
    App->>DB: insert discovery(user_id, point_id, remota)
  end
  opt sem conexão
    Loc-->>DB: sincroniza quando houver rede
  end
```

## Pipeline "revelar": de documento a proposta

Estado: ⚪ Planejado (M4). Roda na máquina da equipe, com modelos abertos.

```mermaid
sequenceDiagram
  autonumber
  actor G as Equipe
  participant P as pipeline (Python)
  participant T as Tesseract
  participant L as Ollama (LLM aberto)
  participant N as Nominatim
  participant DB as Supabase (service role)

  G->>P: documento + licença confirmada
  P->>DB: insert source (título, autor, licença, url)
  P->>T: OCR por página
  T-->>P: texto por página
  P->>L: extração com JSON Schema (pydantic), temperature 0
  L-->>P: lugares, pessoas, comunidades, eventos, excerpts
  alt JSON inválido
    P->>L: nova tentativa (máximo 2)
    P->>P: depois disso, marca para revisão manual
  end
  P->>P: dicionário curado de nomes históricos
  P->>N: geocodificação (1 req/s, com cache)
  N-->>P: coordenada + confiança
  alt confiança abaixo do limiar
    P->>P: proposta sem localização
  end
  P->>DB: insert ai_proposal (excerpt, extracted, model)
  P->>DB: insert point em proposta_ia (rascunho)
  Note over P,DB: o pipeline nunca publica
```

## Curadoria: da proposta à publicação

Estado: ⚪ Planejado (M5).

```mermaid
sequenceDiagram
  autonumber
  actor C as Curadoria
  actor Com as Comunidade parceira
  participant A as Painel (admin)
  participant DB as Supabase (RLS: is_curator)
  participant App as App

  C->>A: abre propostas
  A->>DB: select ai_proposal + source
  C->>A: edita texto, fonte, posição
  A->>DB: update point status revisao_pesquisa
  A->>DB: insert validation (curadoria)
  C->>A: pesquisa aprova
  A->>DB: status validacao_comunidade + validation
  Com->>C: valida e assina (ou pede restrição)
  alt aprovado
    A->>DB: status publicado + validation (comunidade)
    DB->>DB: trigger define published_at
    App->>DB: próxima leitura
    DB-->>App: ponto visível
  else restrito
    A->>DB: status restrito + validation
    DB->>DB: trigger apaga chunks do guia
  end
```

## Guia (RAG)

Estado: ⚪ Planejado (M6). Inclui as duas degradações seguras.

```mermaid
sequenceDiagram
  autonumber
  actor U as Usuário
  participant App as App
  participant F as Edge Function guide
  participant E as Embeddings (qwen3-embedding)
  participant DB as Postgres
  participant L as LLM

  U->>App: pergunta + etapa de ensino
  App->>F: pergunta (sem dados pessoais)
  F->>F: limite por usuário (GUIDE_RATE_LIMIT_PER_HOUR)
  alt embeddings disponíveis
    F->>E: embedding da pergunta (com instrução de consulta)
    E-->>F: vetor 1024
    F->>DB: busca híbrida (vetor + full-text pt)
  else embeddings fora do ar
    F->>DB: só full-text pt
  end
  DB-->>F: top-k chunks (só pontos publicados e não restritos)
  alt nenhum trecho relevante
    F-->>App: "Ainda não tenho informação validada sobre isso." + pontos relacionados
  else LLM responde a tempo
    F->>L: prompt com trechos numerados [n] + fontes
    L-->>F: resposta com citações
    F->>F: confere que toda afirmação cita [n]
    F-->>App: resposta + fontes
  else LLM falhou ou estourou o tempo
    F-->>App: modo trechos (trechos + fontes, sem texto gerado)
  end
```
