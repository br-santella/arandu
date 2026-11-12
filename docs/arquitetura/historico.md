# Histórico de arquitetura

Uma linha por mudança que afete esta pasta. Mais recente no topo.

| Data | Mudança | Documentos afetados |
| --- | --- | --- |
| 2026-11-12 | Projeto Supabase remoto criado (plano gratuito); chaves no formato novo (publishable key); variável renomeada para `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; keep-alive envia só o header `apikey` | 05 |
| 2026-11-12 | CI no GitHub Actions: três workflows com filtro por pasta (economia de minutos no repositório privado) e keep-alive agendado a cada 3 dias | 01 |
| 2026-11-12 | App Expo (SDK 58, expo-router, `src/app`): tema com contraste AA testado, fontes Fraunces e DM Sans, rotas vazias, tela de boas-vindas, export web | 01, doc 04 |
| 2026-11-12 | Supabase local (CLI 3.1.0, Postgres 17): migrations aplicadas, 13 testes pgTAP passando; login anônimo ativado no `config.toml` | 01, 02, 03, 05 |
| 2026-11-12 | Pipeline: projeto uv, configuração via `.env` e cliente compatível com OpenAI (saída estruturada com JSON Schema, temperature 0, até 2 novas tentativas; embeddings com checagem de dimensão) | 01 |
| 2026-11-12 | Criação da pasta de arquitetura com diagramas de contexto, contêineres, implantação, classes, estados, sequência, segurança e casos de uso | Todos |
| 2026-11-12 | Migrations iniciais (esquema + RLS) e testes pgTAP escritos, ainda não executados | 02, 03, 05 |
| 2026-11-12 | Stack definida: Expo (Android e web), Supabase gratuito, IA aberta via Ollama com provedor trocável, `bge-m3` | 01, 04 |
