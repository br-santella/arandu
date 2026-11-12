# Histórico de arquitetura

Uma linha por mudança que afete esta pasta. Mais recente no topo.

| Data | Mudança | Documentos afetados |
| --- | --- | --- |
| 2026-11-12 | Pipeline: projeto uv, configuração via `.env` e cliente compatível com OpenAI (saída estruturada com JSON Schema, temperature 0, até 2 novas tentativas; embeddings com checagem de dimensão) | 01 |
| 2026-11-12 | Criação da pasta de arquitetura com diagramas de contexto, contêineres, implantação, classes, estados, sequência, segurança e casos de uso | Todos |
| 2026-11-12 | Migrations iniciais (esquema + RLS) e testes pgTAP escritos, ainda não executados | 02, 03, 05 |
| 2026-11-12 | Stack definida: Expo (Android e web), Supabase gratuito, IA aberta via Ollama com provedor trocável, `bge-m3` | 01, 04 |
