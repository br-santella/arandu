# 08 — Backlog

Ordem de execução sugerida. Cada marco termina com algo demonstrável. Tamanho estimado: P (pequeno), M (médio), G (grande).

Responsáveis: **B** = Brunna (app, produto, parcerias), **G** = Grazielle (IA, dados, impacto), **B+G** = em conjunto.

## M0 — Fundação

| # | Tarefa | Resp. | Tam. |
| --- | --- | --- | --- |
| 0.1 | ✅ Criar repositório (privado), licença, `CLAUDE.md`, `docs/`, `.env.example` | B | P |
| 0.2 | ✅ Decisão de stack: Expo, Android e web | B+G | P |
| 0.3 | ✅ Projeto Supabase local e remoto; extensões PostGIS e pgvector (falta ligar login anônimo no remoto) | G | P |
| 0.4 | ✅ Migration inicial com o esquema de `docs/05`, RLS e testes (local, CI e remoto) | G | M |
| 0.5 | ✅ App Expo com rotas vazias, tema (cores e fontes) e logo | B | M |
| 0.6 | ✅ CI com lint e testes | B | P |
| 0.7 | ✅ Ollama local: `qwen3.5:9b` e `qwen3-embedding:0.6b`, versões fixadas | G | P |
| 0.8 | ✅ Workflow agendado de keep-alive do Supabase remoto | G | P |

**Pronto quando:** o app abre com a tela de boas-vindas e o banco sobe com `supabase db reset`.

## M1 — Conteúdo do piloto

| # | Tarefa | Resp. | Tam. |
| --- | --- | --- | --- |
| 1.1 | Levantar 10–20 pontos da Liberdade e de Pinheiros com fontes | B+G | G |
| 1.2 | Levantar 10–30 topônimos com origem verificada em fonte | B+G | M |
| 1.3 | Escrever cartões (1–2 min) e um desafio por ponto | B+G | G |
| 1.4 | Montar seed em JSON e script de importação | G | M |
| 1.5 | Primeiro contato com parceiros para validação | B | M |

**Pronto quando:** `db reset` carrega o conteúdo do piloto com fontes.

## M2 — Mapa que se acende

| # | Tarefa | Resp. | Tam. |
| --- | --- | --- | --- |
| 2.1 | ✅ Mapa MapLibre com estilo escuro centrado no Brasil (web) | B | M |
| 2.2 | ✅ Camada de "névoa" e pontos apagados (web) | B | M |
| 2.3 | ✅ Revelação de células H3 ao descobrir um ponto (com testes) | B | M |
| 2.4 | ✅ Pontos publicados no mapa vindos do Supabase (+ estados e municípios do IBGE) | B | P |
| 2.5 | ⏳ Descoberta por proximidade: cálculo pronto e testado; falta ligar a localização do navegador | B | M |
| 2.6 | ✅ Modo exploração remota (web, com pontos de teste) | B | P |
| 2.7 | Persistência local e sincronização de descobertas | B | M |

**Pronto quando:** dá para descobrir os pontos do piloto e ver o mapa se acender.

## M3 — Cartões, desafios e progresso

| # | Tarefa | Resp. | Tam. |
| --- | --- | --- | --- |
| 3.1 | Tela do cartão com fontes e validação | B | M |
| 3.2 | Desafio do ponto com feedback e fonte | B | M |
| 3.3 | Nome escondido diário | B | M |
| 3.4 | Tela de progresso e meta semanal (com testes) | B | M |
| 3.5 | Uma trilha completa | B | P |

**Pronto quando:** o ciclo central completo funciona do começo ao fim.

## M4 — Pipeline "revelar" (demonstração)

| # | Tarefa | Resp. | Tam. |
| --- | --- | --- | --- |
| 4.1 | Selecionar 1–5 documentos em domínio público e registrar licenças | G | M |
| 4.2 | Transcrição com avaliação em amostra | G | M |
| 4.3 | Extração estruturada com esquema pydantic e testes | G | M |
| 4.4 | Geocodificação com dicionário de equivalências | G | M |
| 4.5 | Gravação em `ai_proposal` | G | P |
| 4.6 | Notebook de demonstração passo a passo | G | P |

**Pronto quando:** um documento vira uma proposta no banco, com trecho de origem.

## M5 — Painel de curadoria

| # | Tarefa | Resp. | Tam. |
| --- | --- | --- | --- |
| 5.1 | Login de curadoria (admin) | B | P |
| 5.2 | Lista de propostas com documento de origem | B | M |
| 5.3 | Edição e transições de status com registro em `validation` | B+G | M |
| 5.4 | Publicar e ver o ponto no app | B | P |

**Pronto quando:** uma proposta aprovada aparece no app.

## M6 — Guia (RAG)

| # | Tarefa | Resp. | Tam. |
| --- | --- | --- | --- |
| 6.1 | Gerar chunks e embeddings do conteúdo publicado | G | M |
| 6.2 | Edge Function do guia com recuperação e citações | G | M |
| 6.3 | Tela de chat no app | B | M |
| 6.4 | Conjunto de perguntas de teste e avaliação | G | M |

**Pronto quando:** o guia responde com citação e recusa o que não está na base.

## M7 — Polimento para a banca

| # | Tarefa | Resp. | Tam. |
| --- | --- | --- | --- |
| 7.1 | Versão web publicada para demonstração por link | B | P |
| 7.2 | Roteiro de demonstração de 3 minutos ensaiado | B+G | P |
| 7.3 | Métricas iniciais: tempo do pipeline, taxa de aprovação, avaliação do guia | G | P |
| 7.4 | Revisão de acessibilidade e privacidade | B | P |
| 7.5 | Endpoint estável para o guia na demonstração (provedor de modelo aberto ou API com teto de gasto) e teste do "modo trechos" | G | P |
| 7.6 | Vídeo de backup do roteiro de demonstração | B | P |

## Depois do protótipo (aceleração e além)

- Modo turma completo e painel para professores.
- Camadas do tempo com mapas históricos.
- Painel agregado para secretarias de educação.
- Expansão para outras cidades com parceiros locais.
- Contribuições de usuários com moderação e validação.
- Exportação de dados abertos para órgãos de patrimônio.

## Preparação para a entrevista

- [ ] Explicar o projeto em 30 segundos e em 2 minutos.
- [ ] Responder: por que IA? Como escala se tudo passa por validação humana? Quem são os parceiros? O que entregam em seis semanas? Como medem impacto?
- [ ] Demonstração do protótipo, mesmo que parcial.
- [ ] Divisão de papéis clara entre as duas integrantes.
