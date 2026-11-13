# Aprendendo o Arandu

Esta pasta ensina **como o Arandu funciona por dentro**: a arquitetura, os serviços, o banco de dados, a inteligência artificial, a segurança e o jeito de trabalhar no projeto.

## Para quem é

Para quem sabe o básico de computação e programação (variáveis, funções, arquivos, terminal) e quer entender o projeto a fundo, sem precisar ser especialista. Todo conceito técnico é explicado na primeira vez em que aparece, e o [glossário](glossario.md) reúne todos os termos.

Os outros documentos do projeto têm papéis diferentes:

| Pasta ou arquivo | Para quê |
| --- | --- |
| `docs/01` a `docs/09` | **O quê e por quê:** visão, escopo, regras de conteúdo, backlog |
| `docs/arquitetura/` | **Referência técnica:** diagramas e detalhes para quem já domina os conceitos |
| `docs/learning/` (esta pasta) | **Como aprender:** os mesmos assuntos explicados passo a passo |
| `docs/decisoes.md` | **Por que escolhemos assim:** cada decisão com data e motivo |

## Trilha de estudo

Leia nesta ordem. Cada documento assume que você leu os anteriores.

| # | Documento | Você vai entender |
| --- | --- | --- |
| 1 | [Visão geral do sistema](01-visao-geral-do-sistema.md) | Quais são as peças do Arandu, onde cada uma roda e como conversam |
| 2 | [O app (Expo e React Native)](02-o-app.md) | Como o aplicativo é construído, organizado e testado |
| 3 | [Banco de dados e Supabase](03-banco-de-dados-e-supabase.md) | Tabelas, SQL, migrations, dados geográficos e os serviços do Supabase |
| 4 | [Segurança e privacidade](04-seguranca-e-privacidade.md) | Chaves, login anônimo, regras de acesso (RLS), segredos e LGPD |
| 5 | [Inteligência artificial no Arandu](05-inteligencia-artificial.md) | O que é um modelo de linguagem, embeddings, RAG e por que a IA só propõe |
| 6 | [Os fluxos de ponta a ponta](06-fluxos-de-ponta-a-ponta.md) | O caminho completo de uma descoberta, de um documento histórico e de uma pergunta ao guia |
| 7 | [Workflow de desenvolvimento](07-workflow-de-desenvolvimento.md) | Git, GitHub, testes, CI, ambientes e como o Claude Code trabalha no projeto |
| 8 | [Serviços externos e custos](08-servicos-e-custos.md) | Cada serviço usado, quanto custa e o que fazer quando falha |
| — | [Glossário](glossario.md) | Todos os termos técnicos, de A a Z |

## Como ler o estado de cada parte

O projeto está em construção. Cada seção indica o estado do que descreve:

| Selo | Significado |
| --- | --- |
| 🟢 **Pronto** | Existe no código e foi testado |
| 🟡 **Parcial** | Existe, mas falta parte ou ainda não foi testado de ponta a ponta |
| ⚪ **Planejado** | Ainda não existe; o texto descreve como vai funcionar |

## Como esta pasta é mantida

- Toda mudança que introduza um conceito novo, mude um fluxo ou mude um serviço **atualiza o documento correspondente aqui**, no mesmo commit.
- A tabela abaixo registra as revisões, para quem estudar no futuro saber o que mudou.
- Exemplos de conteúdo histórico usam sempre `[CONTEÚDO DE TESTE — NÃO PUBLICAR]`: esta pasta ensina a técnica, não a história.

## Histórico de revisões

| Data | O que mudou | Documentos |
| --- | --- | --- |
| 2026-11-12 | Mapa com limites oficiais do IBGE e só pontos dentro da cidade; app lendo o Supabase; views, point-in-polygon e TanStack Query; histórico das versões do mapa | 02, 03, 08 |
| 2026-11-12 | Revelação hierárquica (bairro, cidade, estado) com hierarquia do H3 | 02 |
| 2026-11-12 | Paleta noturna, ordem das camadas e o bug de atualização descartada (`isStyleLoaded`) | 02 |
| 2026-11-12 | Mapa web implementado: arquivos por plataforma, GeoJSON e camadas, névoa com buracos, worker do maplibre, verificação com navegador, SPA | 02 |
| 2026-11-12 | Criação da trilha, refletindo o fim do M0 (fundação) e as decisões do M2 (exploração remota) | Todos |
