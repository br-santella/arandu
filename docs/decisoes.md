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
| 2026-11-12 | **Protótipo só web por enquanto**; Android e iOS depois que a web estiver validada | Testes em aparelho dependem de dispositivos que a equipe não tem disponíveis agora; a web é a versão da demonstração. No celular, o mapa mostra um aviso |
| 2026-11-12 | Mapa web: `maplibre-gl` 6 com estilo `dark` do OpenFreeMap; rótulos priorizam `name:pt` | Gratuito, sem chave; nomes em português quando os tiles têm |
| 2026-11-12 | Worker do maplibre copiado para `public/maplibre/` no `postinstall` e indicado com `setWorkerUrl` | O bundler do Expo não empacota o worker separado da v6; a cópia acompanha sempre a versão instalada |
| 2026-11-12 | **Paleta de "modo noturno"** sobre o estilo `dark` (`mapTheme.ts`): terra cinza-esverdeada, oceano mais escuro, fronteiras e nomes claros; névoa a 50% e **abaixo dos rótulos** | Revisão da equipe: no estilo original a terra (rgb 12) e o oceano (rgb 27) quase não se distinguiam, e a névoa a 80% escondia o Brasil. Substitui a decisão abaixo sobre a opacidade |
| 2026-11-12 | Névoa mais escura que o mapa base (`#05080A`, 80%) | Com a névoa na cor de fundo, a célula revelada parecia mais escura que o entorno; agora "acender" fica visivelmente mais claro |
| 2026-11-12 | Ao abrir um ponto, o mapa voa até ele (zoom 15) | Células de resolução 9 não aparecem no zoom do país |
| 2026-11-12 | Lista de pontos ao lado do mapa, com estado em texto | Alternativa acessível ao mapa (teclado e leitor de tela) e entrada da exploração remota |
| 2026-11-12 | Hospedagem web precisa de fallback de SPA (toda rota serve `index.html`) | O app é `output: single`; sem fallback, abrir `/mapa` direto dá 404 |
| 2026-11-12 | Exploração remota libera **todos** os pontos publicados, sem sequência | Uso em sala (professor mostra qualquer ponto) e critério de pronto do protótipo |
| 2026-11-12 | O ponto acende ao **fechar o cartão**, com ou sem resposta ao desafio | Mantém a leitura no ciclo; errar ou pular o desafio não bloqueia (docs/03) |
| 2026-11-12 | Descobertas remotas valem o mesmo que presenciais na meta semanal e nas áreas acesas | Não penalizar quem não pode se deslocar; a diferença é só visual (contorno vs. preenchimento) |
| 2026-11-12 | Modo remoto nunca pede permissão de localização; visita posterior promove `remota` → `presencial` | Privacidade máxima por padrão; registro igual nos dois modos (só ID do ponto e modo) |
| 2026-11-12 | Formato do seed: um JSON por ponto em `supabase/seed/points/`, topônimos em `supabase/seed/toponyms.json`, com bloco `review` (quem pesquisou, quem verificou, texto com referências) | Evita conflitos de edição; mantém a rastreabilidade de cada frase até a fonte (docs/09) |
| 2026-11-12 | **LLM: `qwen3.5:9b`** (Q4_K_M, Apache 2.0), ID Ollama `56671c2ab938` | Cabe inteiro na GPU de 8 GB (≈6,4 GB em uso, contexto 4096); `gemma4:12b` ocupa ≈8 GB e iria parcialmente para a CPU. Trocar quando a avaliação da doc 06 mostrar necessidade |
| 2026-11-12 | Raciocínio desligado (`reasoning_effort: "none"`) na extração | Teste real: 115 s com raciocínio vs. 4,5 s sem, ambos com JSON válido e trechos literais |
| 2026-11-12 | Penalidades forçadas a 0 (`presence_penalty`, `frequency_penalty`) | O pacote do `qwen3.5:9b` vem com `presence_penalty` 1,5, que induz a reescrever o texto e quebraria a regra de trecho literal |
| 2026-11-12 | **Embeddings: `qwen3-embedding:0.6b`**, ID Ollama `ac6da0dfba84`, substitui `bge-m3` (que fica como reserva) | Metade do tamanho, 1024 dimensões (esquema inalterado). Nada indexado ainda, troca sem custo. Instrução só nas perguntas, igual no pipeline e no guia. Decisão final por teste de busca quando houver seed |
| 2026-11-12 | Gemma 4 31B e Qwen 3.8 27B fora do uso local | 18,7 e 16,8 GB: não cabem na GPU nem na RAM. Só como teto de qualidade em provedor hospedado, se necessário |
| 2026-11-12 | OCR: Tesseract e PaddleOCR comparados por taxa de erro; manuscritos fora do protótipo | Modelos de visão erram de forma plausível (risco à regra 1); Kraken exige treino com transcrições de referência |
| 2026-11-12 | Busca do guia híbrida: vetorial + full-text em português do Postgres, com fallback só full-text | Se o serviço de embeddings cair, o guia continua recuperando trechos; full-text é gratuito e embutido |
| 2026-11-12 | Guia degrada para "modo trechos" se o LLM estiver indisponível | Mostra os trechos recuperados com fonte, sem gerar texto. Nunca inventa e nunca fica fora do ar na demonstração |
| 2026-11-12 | Modelo do guia escolhido pelo conjunto de testes da doc 06 | Se o modelo aberto não atingir zero afirmações sem citação e recusas corretas, há dado concreto para justificar uma API paga |
| 2026-11-12 | Repositório **privado** por enquanto | Decisão da equipe; abrir o código (MIT) quando o conteúdo e os parceiros estiverem definidos. GitHub Actions privado tem cota gratuita mensal, suficiente para o protótipo |
| 2026-11-12 | Tabela `curator` (fora da doc 05) define quem acessa o painel | As RLS precisam distinguir curadoria de usuários anônimos; gerida só com service role |
| 2026-11-12 | `trail.status` (fora da doc 05) | Trilhas em rascunho não podem aparecer no app, como os pontos |
| 2026-11-12 | `content_chunk.point_id` obrigatório; triggers impedem indexar ponto não publicado ou restrito e apagam chunks quando o ponto sai de `publicado` ou vira `restrito` | Garante a regra 5 no banco, não só no código do guia |
| 2026-11-12 | Entrada em turma por código será uma função RPC (security definer), não por política de INSERT | O estudante precisa achar a turma pelo código sem poder listar turmas |
| 2026-11-12 | Infraestrutura só em planos gratuitos no protótipo (Supabase free, hospedagem web estática, tiles gratuitos, Nominatim) | Custo fixo zero; riscos de plano gratuito tratados em docs/04 ("Custos e confiabilidade") |
