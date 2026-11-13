# Histórico de arquitetura

Uma linha por mudança que afete esta pasta. Mais recente no topo.

| Data | Mudança | Documentos afetados |
| --- | --- | --- |
| 2026-11-12 | Limites oficiais do IBGE (`admin_area`), códigos de estado/município nos pontos por trigger, views `published_point` e `area_with_points`; app lê o Supabase; mapa com estados/municípios em gradiente e só pontos dentro da cidade; H3 removido | 01, 02, 03, 05 |
| 2026-11-12 | Revelação hierárquica: áreas H3 res. 7, 4 e 2 brilham na proporção de pontos descobertos, por faixa de zoom | 01, 03 |
| 2026-11-12 | Mapa: paleta noturna (`mapTheme.ts`), névoa a 50% abaixo dos rótulos; corrigido descarte de atualizações durante carregamento de tiles | 01 |
| 2026-11-12 | Mapa web (maplibre-gl 6, OpenFreeMap dark), névoa com buracos por célula H3 (res. 9), contorno para remota e preenchimento para presencial, lista acessível, cartão provisório; protótipo só web | 01 |
| 2026-11-12 | Regras da exploração remota: todos os pontos liberados, acende ao fechar o cartão, peso igual na meta, sem permissão de localização | 03 |
| 2026-11-12 | Modelos definidos: `qwen3.5:9b` (raciocínio desligado, penalidades zeradas) e `qwen3-embedding:0.6b` (instrução só na consulta); `bge-m3` vira reserva | 01, 04, doc 04 |
| 2026-11-12 | Migrations aplicadas no remoto; RLS confirmada pela API pública (tabelas internas retornam vazio); CI e keep-alive verdes no GitHub | 01 |
| 2026-11-12 | Projeto Supabase remoto criado (plano gratuito); chaves no formato novo (publishable key); variável renomeada para `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; keep-alive envia só o header `apikey` | 05 |
| 2026-11-12 | CI no GitHub Actions: três workflows com filtro por pasta (economia de minutos no repositório privado) e keep-alive agendado a cada 3 dias | 01 |
| 2026-11-12 | App Expo (SDK 58, expo-router, `src/app`): tema com contraste AA testado, fontes Fraunces e DM Sans, rotas vazias, tela de boas-vindas, export web | 01, doc 04 |
| 2026-11-12 | Supabase local (CLI 3.1.0, Postgres 17): migrations aplicadas, 13 testes pgTAP passando; login anônimo ativado no `config.toml` | 01, 02, 03, 05 |
| 2026-11-12 | Pipeline: projeto uv, configuração via `.env` e cliente compatível com OpenAI (saída estruturada com JSON Schema, temperature 0, até 2 novas tentativas; embeddings com checagem de dimensão) | 01 |
| 2026-11-12 | Criação da pasta de arquitetura com diagramas de contexto, contêineres, implantação, classes, estados, sequência, segurança e casos de uso | Todos |
| 2026-11-12 | Migrations iniciais (esquema + RLS) e testes pgTAP escritos, ainda não executados | 02, 03, 05 |
| 2026-11-12 | Stack definida: Expo (Android e web), Supabase gratuito, IA aberta via Ollama com provedor trocável, `bge-m3` | 01, 04 |
