# CLAUDE.md — Arandu

Este arquivo orienta o Claude Code a trabalhar neste repositório. Leia-o inteiro antes de qualquer tarefa e consulte os documentos em `docs/` quando a tarefa tocar o assunto deles.

## O projeto em uma frase

Arandu é um app que desperta o interesse pela história indígena e afro-brasileira ao reunir informação confiável, validada pelas comunidades com apoio de IA, em uma experiência gamificada de exploração do território, levando às escolas o ensino exigido pelas Leis 10.639/2003 e 11.645/2008 e construindo uma base nacional de preservação do patrimônio.

Slogan: **Arandu — a sabedoria que acende o mapa.**

Equipe: Brunna Santella Souza (produto, app, parcerias) e Grazielle Florentino de Sousa (IA, dados, impacto).

## Onde está cada coisa

| Documento | Conteúdo |
| --- | --- |
| `docs/01-visao-e-problema.md` | Problema, público, tese de impacto, contexto do AI4Good |
| `docs/02-escopo-mvp.md` | O que entra e o que não entra no protótipo, critérios de pronto |
| `docs/03-experiencia-e-gamificacao.md` | Ciclo central, mecânicas, telas, fluxos |
| `docs/04-arquitetura-tecnica.md` | Stack, estrutura do repositório, decisões técnicas |
| `docs/05-modelo-de-dados.md` | Entidades, campos, estados de validação, esquema SQL inicial |
| `docs/06-pipeline-de-ia.md` | Pipeline "revelar" (documentos → pontos) e guia "mediar" (RAG) |
| `docs/07-conteudo-curadoria-e-etica.md` | Regras de conteúdo, validação comunitária, privacidade, licenças |
| `docs/08-backlog.md` | Marcos e tarefas em ordem de execução |
| `docs/decisoes.md` | Registro datado de decisões |
| `docs/arquitetura/` | Documentação técnica: diagramas UML e de arquitetura (Mermaid), segurança, fluxos, histórico |

## Regras inegociáveis

1. **Nunca invente conteúdo histórico.** Nenhum fato, data, etimologia, nome de povo ou descrição de lugar pode ser escrito pelo Claude Code como conteúdo do app. Todo conteúdo vem do arquivo de seed curado (`supabase/seed/`) com fonte citada. Se faltar conteúdo para testar uma tela, use texto claramente marcado como fictício: `[CONTEÚDO DE TESTE — NÃO PUBLICAR]`.
2. **A IA propõe, pessoas decidem.** Nada gerado por modelo é publicado automaticamente. Todo ponto passa pelos estados de validação descritos em `docs/05-modelo-de-dados.md`.
3. **O guia só responde com base no conteúdo validado.** Se a resposta não estiver na base, ele diz que não sabe. Toda resposta cita a fonte.
4. **Privacidade de estudantes.** O público inclui menores de idade. Não armazene localização precisa do usuário, não peça dados pessoais além do mínimo, siga a LGPD. Detalhes em `docs/07-conteudo-curadoria-e-etica.md`.
5. **Conteúdo sensível ou restrito não entra no app.** Campo `sensibilidade` controla isso; conteúdo marcado como `restrito` nunca é exibido nem enviado ao LLM.
6. **Linguagem respeitosa.** Use os nomes que os próprios povos usam. Não use "índio" como termo genérico; use "indígena" ou o nome do povo. Não use metáforas de conquista ou captura na interface ("conquistar região", "capturar"). Use "descobrir", "revelar", "acender".

## Convenções

- Interface do app e conteúdo: **português do Brasil**.
- Código, nomes de variáveis, commits e comentários técnicos: **inglês**.
- Commits pequenos e descritivos (`feat:`, `fix:`, `docs:`, `chore:`).
- Toda funcionalidade nova vem com teste quando houver lógica (regras de progresso, revelação do mapa, filtros de validação, recuperação do RAG).
- Acessibilidade: textos com contraste adequado, alvos de toque de pelo menos 44 pt, suporte a leitor de tela nos componentes principais.
- Segredos (chaves de API) apenas em `.env`, nunca no repositório. Mantenha `.env.example` atualizado.

## Comandos (atualizar conforme o projeto evoluir)

```bash
# app
cd apps/mobile && npm install && npx expo start

# banco local
npx supabase start && npx supabase db reset   # aplica migrations e seed
npx supabase test db                            # testes pgTAP (RLS e guarda do guia)

# modelos abertos locais (Ollama) — tags exatas definidas em .env
ollama pull "$LLM_MODEL" && ollama pull bge-m3

# pipeline de IA
cd pipeline && uv sync && uv run pytest
```

## Como trabalhar comigo (Claude Code)

- Antes de uma tarefa grande, proponha um plano curto e espere confirmação.
- Siga a ordem do `docs/08-backlog.md`, salvo pedido contrário.
- Quando uma decisão não estiver documentada, registre-a em `docs/decisoes.md` (data, decisão, motivo).
- **A documentação é parte essencial do projeto.** Toda alteração que mude esquema, RLS, fluxos, componentes, integrações ou infraestrutura atualiza, **no mesmo commit**, os diagramas e textos de `docs/arquitetura/`, o selo de estado (🟢/🟡/⚪) e uma linha em `docs/arquitetura/historico.md`. Regras completas em `docs/arquitetura/README.md`. Ao final de cada tarefa, confira se algum documento ficou desatualizado.
- Se uma tarefa exigir conteúdo histórico que não está no seed, pare e peça o conteúdo à equipe.
