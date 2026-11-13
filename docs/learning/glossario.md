# Glossário

Termos técnicos usados no Arandu, em ordem alfabética. Entre parênteses, o documento onde o termo é explicado com mais detalhe.

| Termo | Significado |
| --- | --- |
| **Alucinação** | Quando um modelo de IA produz algo falso com aparência de verdadeiro (5) |
| **API** | Jeito padronizado de um programa pedir coisas a outro, geralmente pela internet (3) |
| **API compatível com OpenAI** | Formato de API seguido por vários provedores de IA; permite trocar de provedor sem mudar código (5) |
| **Backend** | A parte do sistema que roda no servidor (1) |
| **Branch** | Linha paralela de desenvolvimento no Git (7) |
| **Chave estrangeira** | Coluna que aponta para a chave primária de outra tabela (3) |
| **Chave primária** | Coluna que identifica cada linha de forma única (3) |
| **Chave SSH** | Par de arquivos (público e privado) usado para se autenticar sem senha (7) |
| **CI** (integração contínua) | Rodar testes automaticamente a cada envio de código (7) |
| **Cliente** | O programa que a pessoa usa; no Arandu, o app (1) |
| **Commit** | Uma "foto" salva do projeto no Git, com mensagem (7) |
| **Componente** | Peça reutilizável de interface no React (2) |
| **Contêiner** | Caixa isolada em que o Docker roda um programa com tudo de que ele precisa (3) |
| **Contexto** (de um modelo) | Quantidade máxima de tokens que o modelo considera de uma vez (5) |
| **Cron** | Formato para agendar tarefas repetidas (7) |
| **Development build** | Versão do app compilada com os módulos nativos de que ele precisa, como o mapa (2) |
| **Docker** | Programa que roda contêineres (3) |
| **Edge Function** | Pequeno programa que roda no servidor do Supabase; no Arandu, o guia (3) |
| **Embedding** | Lista de números que representa o significado de um texto (5) |
| **Endpoint** | Um endereço específico de uma API (3) |
| **Enum** | Tipo com lista fechada de valores permitidos (3) |
| **Expo** | Conjunto de ferramentas para criar apps com React Native (2) |
| **Expo Router** | Sistema de telas em que cada arquivo de `src/app/` é uma rota (2) |
| **Frontend** | A parte visível do sistema; no Arandu, o app (1) |
| **Full-text search** | Busca por palavras, considerando variações (radicais) do idioma (3) |
| **GeoJSON** | Formato JSON para geometrias; coordenadas na ordem [longitude, latitude] (2) |
| **GiST, GIN, HNSW** | Tipos de índice: para geometria, para texto e para vetores (3, 5) |
| **Git** | Sistema que guarda o histórico de mudanças do projeto (7) |
| **GitHub Actions** | Serviço do GitHub que roda os workflows de CI (7) |
| **GPU / VRAM** | Placa de vídeo e sua memória; onde os modelos de IA rodam rápido (5) |
| **H3** | Grade de hexágonos que cobre o planeta; usada para acender áreas do mapa (2) |
| **Haversine** | Fórmula da distância entre dois pontos na superfície da Terra (2) |
| **IBGE, malhas** | Contornos oficiais de estados e municípios publicados pelo IBGE (3) |
| **Índice** | Estrutura que acelera buscas no banco (3) |
| **JSON** | Formato de texto para dados estruturados (5) |
| **JSON Schema** | Descrição do formato que um JSON deve ter (5) |
| **JSX** | Sintaxe parecida com HTML usada para descrever telas no React (2) |
| **JWT** | Token assinado que identifica um usuário sem revelar quem ele é (4) |
| **LGPD** | Lei Geral de Proteção de Dados (Lei 13.709/2018) (4) |
| **Lint** | Verificação automática de erros comuns e de estilo no código (2, 7) |
| **LLM** | Grande modelo de linguagem; IA que gera texto prevendo o próximo token (5) |
| **Lockfile** | Arquivo com as versões exatas das dependências (7) |
| **MapLibre** | Biblioteca de mapas gratuita e aberta (2) |
| **Migration** | Arquivo SQL que descreve uma mudança na estrutura do banco (3) |
| **OCR** | Transformar a imagem de um texto em texto digital (5) |
| **Ollama** | Programa que roda modelos de IA abertos no próprio computador (5) |
| **Parâmetros** (de um modelo) | Os bilhões de números aprendidos no treino; "9B" = 9 bilhões (5) |
| **Point-in-polygon** | Operação que responde se um ponto está dentro de um polígono; usada para achar o estado e o município de cada ponto (3) |
| **pgTAP** | Ferramenta para escrever testes em SQL (3) |
| **pgvector** | Extensão do Postgres para guardar e buscar vetores (5) |
| **Pipeline** | Sequência de etapas que processa algo; no Arandu, de documento a proposta (5, 6) |
| **PostGIS** | Extensão do Postgres para dados geográficos (3) |
| **PostgreSQL** | O banco de dados relacional usado pelo Arandu (3) |
| **Presence penalty** | Controle que penaliza tokens já usados; forçado a zero no Arandu (5) |
| **Props** | Parâmetros de um componente React (2) |
| **Publishable key** | Chave pública do Supabase, segura no app porque as regras de acesso a limitam (4) |
| **Pull request** (PR) | Pedido para juntar uma branch à principal, com revisão (7) |
| **Pydantic** | Biblioteca Python que define e valida formatos de dados (5) |
| **Quantização** | Guardar os parâmetros de um modelo com menos bits, para caber em menos memória (5) |
| **RAG** | Técnica de buscar trechos primeiro e gerar a resposta só com base neles (5) |
| **React / React Native** | Biblioteca de interfaces; e sua versão para celular (2) |
| **Repositório** | A pasta do projeto, com histórico controlado pelo Git (1, 7) |
| **RLS** (Row Level Security) | Regras do banco que filtram linhas conforme quem pergunta (4) |
| **Rota** | Endereço de uma tela no app (2) |
| **security_invoker** | Opção de view que faz a consulta rodar com as permissões de quem pergunta, mantendo a RLS (3) |
| **Secret key / service role** | Chave que ignora as regras de acesso; nunca vai para o app (4) |
| **Secrets** | Valores sensíveis guardados num serviço (GitHub, Supabase), fora do código (4, 7) |
| **Security definer** | Função do banco que roda com permissão do dono para responder uma pergunta fixa (4) |
| **Hierarquia do H3** | Cada hexágono H3 tem um "pai" maior em resoluções menores; usado para medir o progresso por bairro, cidade e estado (2) |
| **Headless** (navegador) | Navegador rodando sem janela, controlado por um programa; usado para testar telas (2) |
| **Seed** | Conteúdo inicial carregado no banco (3) |
| **Servidor** | Computador que guarda dados e responde aos clientes (1) |
| **Similaridade de cosseno** | Medida de quão parecidos são dois vetores, pelo ângulo entre eles (5) |
| **SPA** | Aplicação de página única: um `index.html` carrega o app, que troca as telas sozinho (2) |
| **Slug** | Identificador legível usado em endereços: `nome-do-lugar` (2) |
| **SQL** | Linguagem para criar e consultar bancos de dados relacionais (3) |
| **Supabase** | Plataforma com banco, login, API, arquivos e funções prontos (3) |
| **TanStack Query** | Biblioteca que busca dados do servidor e os guarda em cache, cuidando de carregamento, erro e nova tentativa (2) |
| **Temperature** | Quanto aleatória é a escolha de tokens; 0 = sempre o mais provável (5) |
| **Tiles** | Pedaços quadrados de um mapa digital, carregados sob demanda (2) |
| **Token** (de um modelo) | Pedaço de palavra que o modelo processa (5) |
| **Token** (de login) | Ver JWT (4) |
| **Trigger** | Função que o banco roda automaticamente quando algo acontece numa tabela (3) |
| **TypeScript** | JavaScript com tipos (2) |
| **UUID** | Identificador longo e aleatório, praticamente impossível de repetir (3) |
| **Variável de ambiente** | Configuração lida de fora do código, como do arquivo `.env` (4) |
| **View** | Consulta SQL salva com nome, usada como uma tabela (3) |
| **Vetor** | Lista ordenada de números; ver embedding (5) |
| **WCAG** | Norma internacional de acessibilidade web; exige contraste de 4,5:1 para texto (2) |
| **Worker** | Código JavaScript que roda em paralelo, sem travar a tela; o mapa usa um para os tiles (2) |
| **Workflow** (CI) | Arquivo que descreve uma sequência de verificações automáticas (7) |
