# 03 — Ciclos de vida

## Validação de um ponto

Estado: 🟢 enum e triggers implementados e testados; ⚪ transições no painel planejadas (M5).

```mermaid
stateDiagram-v2
  direction LR
  [*] --> proposta_ia : pipeline cria rascunho
  [*] --> revisao_pesquisa : curadoria cria à mão

  proposta_ia --> revisao_pesquisa : curadoria aceita para revisão
  revisao_pesquisa --> validacao_comunidade : pesquisa aprova
  validacao_comunidade --> publicado : comunidade valida e assina
  publicado --> revisao_pesquisa : correção ou pedido da comunidade

  proposta_ia --> rejeitado
  revisao_pesquisa --> rejeitado
  validacao_comunidade --> rejeitado

  proposta_ia --> restrito
  revisao_pesquisa --> restrito
  validacao_comunidade --> restrito
  publicado --> restrito : comunidade restringe

  note right of publicado
    Único estado visível no app
    e indexável pelo guia
  end note
  note right of restrito
    Nunca exibido nem enviado ao LLM.
    Pedido da comunidade tem prioridade.
  end note
```

### Efeitos de cada estado

| Estado | Visível no app | Indexável pelo guia | Efeito automático no banco |
| --- | --- | --- | --- |
| `proposta_ia` | Não | Não | — |
| `revisao_pesquisa` | Não | Não | Ao voltar de `publicado`: chunks apagados |
| `validacao_comunidade` | Não | Não | — |
| `publicado` | Sim (se `sensitivity <> 'restrito'`) | Sim | `published_at = now()` |
| `rejeitado` | Não | Não | Chunks apagados |
| `restrito` | Não | Não | Chunks apagados |

Toda transição deve gerar uma linha em `validation` (quem, papel, quando, comentário). Isso será feito pelo painel (M5); ⚪ ainda não há trigger que obrigue.

### `status = restrito` e `sensitivity = restrito`

Os dois existem e ambos bloqueiam o conteúdo:

- `sensitivity` descreve **a natureza do conteúdo** (`aberto`, `cuidado`, `restrito`). Pode ser marcada em qualquer etapa.
- `status = restrito` descreve **a decisão de retirada** no fluxo de validação.

As RLS e os triggers verificam os dois. Um ponto `publicado` com `sensitivity = restrito` não aparece no app nem no guia.

O mesmo ciclo vale para `toponym` e `trail` (campo `status`).

## Descoberta de um ponto (por usuário)

Estado: ⚪ Planejado (M2–M3).

```mermaid
stateDiagram-v2
  direction LR
  [*] --> apagado
  apagado --> descoberto_remoto : exploração remota
  apagado --> descoberto_presencial : chegou no raio do ponto
  descoberto_remoto --> descoberto_presencial : visitou depois
  descoberto_remoto --> descoberto_remoto : respondeu desafio
  descoberto_presencial --> descoberto_presencial : respondeu desafio

  note right of descoberto_remoto
    Mapa acende com contorno
  end note
  note right of descoberto_presencial
    Mapa acende com preenchimento
  end note
```

- Persistência: `discovery.mode` (`remota` ou `presencial`) e `discovery.challenge_correct`.
- Errar o desafio não bloqueia: o ponto acende de qualquer forma; acertar dá um selo extra.
- O usuário pode apagar o próprio progresso (LGPD).
