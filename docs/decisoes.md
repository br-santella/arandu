# Registro de decisões

| Data | Decisão | Motivo |
| --- | --- | --- |
| 2026-11-12 | Nome provisório "Arandu" e slogan "a sabedoria que acende o mapa" | Palavra guarani para sabedoria; a validar com falantes e comunidades |
| 2026-11-12 | Bairros piloto: Liberdade e Pinheiros (São Paulo) | Um exemplo afro-brasileiro e um indígena, ambos com fontes públicas |
| 2026-11-12 | Descoberta por geolocalização, não por visão computacional | O que foi apagado em geral não tem placa ou monumento para fotografar |
| 2026-11-12 | Licença do código: MIT | Permissiva e simples; favorece adoção e o critério *open source* do AI4Good. Conteúdo segue licença própria (docs/07) |
| 2026-11-12 | Stack do app: Expo (React Native) + TypeScript | Versão web para demonstração por link; mesma linguagem no app e no painel; framework gratuito e open source |
| 2026-11-12 | Protótipo só para Android e web; iOS adiado | Evita a conta Apple Developer (US$ 99/ano), necessária para rodar o MapLibre nativo no iPhone. O código continua compatível com iOS |
| 2026-11-12 | IA open source por padrão, com provedor trocável (API compatível com OpenAI, configurada por `.env`) | Custo zero no protótipo, alinhado ao critério *open source* e à soberania de dados. Trocar de modelo/provedor é só configuração |
| 2026-11-12 | Pipeline roda localmente (Tesseract + modelo aberto via Ollama) | Documentos não saem da máquina; processamento em lote não precisa de servidor |
| 2026-11-12 | Embeddings: `bge-m3` (1024 dimensões) | Multilíngue, bom em português, aberto e compatível com `vector(1024)` do esquema |
| 2026-11-12 | Versão fixada do embedding: `bge-m3:latest`, ID Ollama `790764642607` (1,2 GB) | Testado contra o Ollama local: 1024 dimensões. Se o ID mudar, reindexar todos os chunks |
| 2026-11-12 | App: Expo SDK 58, rotas em `apps/mobile/src/app` (padrão atual do Expo Router), web como SPA (`output: single`) | Segue o template oficial; SPA é a hospedagem estática mais simples |
| 2026-11-12 | Removidos do template Expo: `.claude/settings.json` (ativava plugin) e `LICENSE` da Expo | Nenhum plugin ativado sem pedido da equipe; a licença MIT da raiz cobre o app |
| 2026-11-12 | Paleta de texto testada automaticamente contra WCAG AA (4,5:1) | Acessibilidade garantida por teste, não por revisão manual |
| 2026-11-12 | Supabase CLI 3.1.0 via `npx`; login anônimo ativado no `config.toml` | Sem instalação global; usuário anônimo é a base da privacidade (docs/04, decisão 4) |
| 2026-11-12 | Projeto Supabase remoto `pgdrpfauuxaxvvnqozzv` (plano gratuito). Valores públicos em `.env.remote` (fora do git); secret key, service role e senha do banco nunca no repositório nem no chat | Separar ambiente local e remoto; chaves secretas só em `supabase secrets` e `.env` |
| 2026-11-12 | Busca do guia híbrida: vetorial + full-text em português do Postgres, com fallback só full-text | Se o serviço de embeddings cair, o guia continua recuperando trechos; full-text é gratuito e embutido |
| 2026-11-12 | Guia degrada para "modo trechos" se o LLM estiver indisponível | Mostra os trechos recuperados com fonte, sem gerar texto. Nunca inventa e nunca fica fora do ar na demonstração |
| 2026-11-12 | Modelo do guia escolhido pelo conjunto de testes da doc 06 | Se o modelo aberto não atingir zero afirmações sem citação e recusas corretas, há dado concreto para justificar uma API paga |
| 2026-11-12 | Repositório **privado** por enquanto | Decisão da equipe; abrir o código (MIT) quando o conteúdo e os parceiros estiverem definidos. GitHub Actions privado tem cota gratuita mensal, suficiente para o protótipo |
| 2026-11-12 | Tabela `curator` (fora da doc 05) define quem acessa o painel | As RLS precisam distinguir curadoria de usuários anônimos; gerida só com service role |
| 2026-11-12 | `trail.status` (fora da doc 05) | Trilhas em rascunho não podem aparecer no app, como os pontos |
| 2026-11-12 | `content_chunk.point_id` obrigatório; triggers impedem indexar ponto não publicado ou restrito e apagam chunks quando o ponto sai de `publicado` ou vira `restrito` | Garante a regra 5 no banco, não só no código do guia |
| 2026-11-12 | Entrada em turma por código será uma função RPC (security definer), não por política de INSERT | O estudante precisa achar a turma pelo código sem poder listar turmas |
| 2026-11-12 | Infraestrutura só em planos gratuitos no protótipo (Supabase free, hospedagem web estática, tiles gratuitos, Nominatim) | Custo fixo zero; riscos de plano gratuito tratados em docs/04 ("Custos e confiabilidade") |
