# Documentação de arquitetura

Esta pasta descreve **como o Arandu é construído**: componentes, dados, fluxos, segurança e decisões técnicas. A documentação de produto (visão, escopo, experiência, ética) fica em [`docs/`](../).

A documentação é parte do produto. **Toda mudança de código que altere o que está descrito aqui atualiza esta pasta no mesmo commit** (ver "Como manter").

## Índice

| Documento | Conteúdo | Diagramas |
| --- | --- | --- |
| [01 — Visão geral](01-visao-geral.md) | Contexto, contêineres, implantação, estado de cada componente | Contexto, contêineres, implantação |
| [02 — Modelo de dados](02-modelo-de-dados.md) | Entidades, relações, enums, triggers | Diagrama de classes UML |
| [03 — Ciclos de vida](03-ciclos-de-vida.md) | Estados de validação do conteúdo e da descoberta | Diagramas de estados UML |
| [04 — Fluxos](04-fluxos.md) | Descoberta, pipeline "revelar", curadoria, guia | Diagramas de sequência UML |
| [05 — Segurança e privacidade](05-seguranca-e-privacidade.md) | Fronteiras de confiança, RLS, segredos, dados do usuário | Fronteiras de confiança, matriz de acesso |
| [06 — Casos de uso](06-casos-de-uso.md) | Atores e o que cada um faz no sistema | Casos de uso |
| [Histórico](historico.md) | Registro datado das mudanças de arquitetura | — |

## Legenda de estado

Cada componente e fluxo indica seu estado:

| Selo | Significado |
| --- | --- |
| 🟢 **Implementado** | Código existe e foi testado |
| 🟡 **Escrito, não testado** | Código existe, mas ainda não rodou |
| ⚪ **Planejado** | Só descrito; ainda não há código |

## Fontes de verdade

Quando houver divergência, vale esta ordem:

1. **Código e migrations** (`supabase/migrations/`, `apps/`, `pipeline/`).
2. **Esta pasta** (`docs/arquitetura/`).
3. Documentos de produto (`docs/01` a `docs/08`).

Uma divergência é um defeito de documentação: corrija o documento no mesmo commit em que for percebida.

## Como manter

- **Toda mudança** em esquema, RLS, fluxos, componentes, integrações externas ou infraestrutura:
  1. atualiza o(s) diagrama(s) e o texto afetados;
  2. atualiza o selo de estado;
  3. adiciona uma linha em [`historico.md`](historico.md);
  4. se for uma decisão nova, registra também em [`docs/decisoes.md`](../decisoes.md);
  5. se introduzir ou mudar um conceito, atualiza a trilha de estudo em [`docs/learning/`](../learning/README.md).
- Diagramas são escritos em **Mermaid** dentro do Markdown. Nada de imagens exportadas: texto é versionável e revisável em PR.
- Para visualizar no VS Code, instale a extensão recomendada em `.vscode/extensions.json` (Markdown Preview Mermaid Support). O GitHub renderiza Mermaid nativamente.
- Nomes de tabelas, campos e funções aparecem exatamente como no código (inglês). Explicações em português.
- Nenhum diagrama contém conteúdo histórico real; exemplos usam `[CONTEÚDO DE TESTE — NÃO PUBLICAR]`.
