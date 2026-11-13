# 6 — Os fluxos de ponta a ponta

Este documento conta, passo a passo, o caminho completo das quatro operações centrais. Cada passo indica a peça envolvida e o estado (🟢 pronto, ⚪ planejado). Os diagramas formais estão em [`docs/arquitetura/04-fluxos.md`](../arquitetura/04-fluxos.md).

## 6.1 Uma descoberta no mapa

**Situação:** uma estudante abre o app na Liberdade, no modo "perto de mim".

| # | O que acontece | Peça | Estado |
| --- | --- | --- | --- |
| 1 | Ao abrir o app, ela recebe um usuário anônimo (um token, sem dados pessoais) | Supabase Auth | 🟢 (no servidor) / ⚪ (no app) |
| 2 | O app pede ao servidor os pontos publicados da região | API do Supabase + RLS | 🟢 regra / ⚪ chamada |
| 3 | O servidor devolve **só** pontos publicados e não restritos | RLS | 🟢 |
| 4 | O app pede permissão de localização e acompanha a posição **só em memória** | App | ⚪ |
| 5 | A cada nova posição, o app calcula a distância até cada ponto | App (haversine) | ⚪ |
| 6 | Dentro do raio do ponto, abre o cartão: texto, fontes, quem validou | App | ⚪ |
| 7 | Ela responde ao desafio, ou não | App | ⚪ |
| 8 | Ao fechar o cartão, a célula H3 do ponto acende, com preenchimento | App | ⚪ |
| 9 | A descoberta é salva **no aparelho** | App (armazenamento local) | ⚪ |
| 10 | Quando há internet, o app envia `(id do usuário, id do ponto, presencial, acertou?)` | API + RLS | 🟢 regra / ⚪ envio |
| 11 | O banco confere se o ponto é público e se o usuário é ele mesmo, e grava | RLS | 🟢 |

**O que nunca acontece:** a posição dela ser enviada ao servidor. O passo 10 não tem coordenadas.

**No modo remoto**, os passos 4 e 5 não existem: ela toca no ponto, e no passo 8 a célula acende só com o contorno. Se ela passar pelo lugar depois, com o modo "perto de mim", a descoberta é promovida a presencial.

## 6.2 De um documento histórico a um ponto no mapa

**Situação:** a equipe encontrou um jornal antigo, em domínio público, que menciona um lugar do piloto.

| # | O que acontece | Quem | Estado |
| --- | --- | --- | --- |
| 1 | A equipe confirma a licença e registra o documento | Pessoa | ⚪ (roteiro no `docs/09`) |
| 2 | O pipeline grava a fonte na tabela `source` | Pipeline | ⚪ |
| 3 | O Tesseract transforma cada página em texto | Pipeline (OCR) | ⚪ |
| 4 | O modelo de IA extrai lugares, pessoas, comunidades e eventos, sempre com o **trecho literal** | Pipeline + Ollama | 🟢 cliente / ⚪ etapa |
| 5 | Se o JSON vier inválido, o pipeline tenta de novo 2 vezes; depois, manda para revisão manual | Pipeline | 🟢 |
| 6 | Nomes históricos viram lugares atuais (dicionário da equipe e depois o Nominatim) | Pipeline | ⚪ |
| 7 | Se a localização for incerta, a proposta vai sem coordenada | Pipeline | ⚪ |
| 8 | Grava a proposta em `ai_proposal` e um rascunho de ponto em `proposta_ia` | Pipeline (service role) | 🟢 tabelas / ⚪ gravação |
| 9 | A curadoria abre a proposta no painel, ao lado do trecho original | Painel | ⚪ |
| 10 | Edita, confere a fonte, posiciona; o status vai para `revisao_pesquisa` | Curadoria | ⚪ |
| 11 | A pesquisa aprova: `validacao_comunidade` | Pesquisa | ⚪ |
| 12 | A comunidade valida e assina: `publicado` | Comunidade | ⚪ |
| 13 | O banco registra a data de publicação | Trigger | 🟢 |
| 14 | Na próxima leitura, o ponto aparece no app | RLS | 🟢 |

Toda mudança de status gera um registro em `validation`: quem, com qual papel, quando e por quê.

Em qualquer etapa, a comunidade pode pedir restrição. O status vai para `restrito`, o ponto some do app e os trechos do guia são apagados na hora (triggers 🟢).

## 6.3 Uma pergunta ao guia

**Situação:** um estudante do ensino fundamental II pergunta ao guia sobre um ponto.

| # | O que acontece | Peça | Estado |
| --- | --- | --- | --- |
| 1 | O app envia a pergunta e a etapa de ensino, sem dados pessoais | App → Edge Function | ⚪ |
| 2 | A função confere o limite de perguntas por hora daquele usuário | Edge Function | ⚪ |
| 3 | A pergunta vira um vetor, com a instrução de busca | Modelo de embedding | 🟢 cliente / ⚪ função |
| 4 | Busca híbrida nos trechos: por significado e por palavras | Postgres (pgvector + full-text) | 🟢 índices / ⚪ consulta |
| 5 | Só existem trechos de pontos publicados e não restritos | Triggers | 🟢 |
| 6 | Sem trechos relevantes: "Ainda não tenho informação validada sobre isso." | Edge Function | ⚪ |
| 7 | Com trechos: monta o prompt com os trechos numerados e as fontes | Edge Function | ⚪ |
| 8 | O modelo responde citando `[1]`, `[2]`... | LLM | ⚪ |
| 9 | A função confere se toda afirmação tem citação | Edge Function | ⚪ |
| 10 | Se o modelo falhar, devolve os trechos com as fontes ("modo trechos") | Edge Function | ⚪ |
| 11 | O app mostra a resposta e as fontes | App | ⚪ |

## 6.4 Uma mudança de código

**Situação:** alguém da equipe, ou o Claude Code, muda o app.

| # | O que acontece | Onde | Estado |
| --- | --- | --- | --- |
| 1 | A mudança é feita e testada no notebook (testes, tipos, lint) | Local | 🟢 |
| 2 | A documentação afetada é atualizada (arquitetura, learning, decisões) | Local | 🟢 regra |
| 3 | Vira um commit com mensagem descritiva | Git | 🟢 |
| 4 | É enviada ao GitHub (`git push`) | GitHub | 🟢 |
| 5 | O GitHub Actions roda só os testes da parte que mudou | CI | 🟢 |
| 6 | Se algo falhar, o GitHub marca em vermelho | CI | 🟢 |
| 7 | Mudanças no banco chegam ao remoto com `supabase db push --remote` | Supabase | 🟢 |

Detalhes no [documento 7](07-workflow-de-desenvolvimento.md).
