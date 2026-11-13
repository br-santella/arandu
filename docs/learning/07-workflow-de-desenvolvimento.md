# 7 — Workflow de desenvolvimento

Estado: 🟢 **Git, GitHub (privado), testes automáticos e CI funcionando.**

## 7.1 Git: o histórico do projeto

O **Git** guarda o histórico de todas as mudanças. Cada "foto" do projeto é um **commit**, com autor, data e uma mensagem explicando o que mudou.

```bash
git status                 # o que mudou e ainda não foi salvo
git add <arquivo>          # escolhe o que entra no próximo commit
git commit -m "mensagem"   # salva a foto
git log --oneline          # lista os commits
```

### Mensagens de commit

O projeto segue um padrão curto, em inglês (ver `CLAUDE.md`):

| Prefixo | Uso | Exemplo |
| --- | --- | --- |
| `feat:` | Funcionalidade nova | `feat(mobile): scaffold Expo app...` |
| `fix:` | Correção de erro | `fix: handle empty embedding input` |
| `docs:` | Só documentação | `docs: record remote exploration rules` |
| `chore:` | Manutenção (configuração, dependências) | `chore(supabase): init local project` |
| `ci:` | Verificações automáticas | `ci: add per-area workflows` |

Commits **pequenos** facilitam entender e, se preciso, desfazer uma mudança.

### Branch

Uma **branch** (ramo) é uma linha paralela de desenvolvimento. A principal se chama `main`. Para mudanças maiores, cria-se uma branch, trabalha-se nela e depois ela é juntada à `main`, de preferência por um **pull request** (PR) no GitHub, que permite revisar antes.

## 7.2 GitHub: o repositório remoto

O **GitHub** guarda uma cópia do repositório na nuvem (o **remoto**, chamado `origin`).

```bash
git push    # envia seus commits ao GitHub
git pull    # traz os commits que outras pessoas enviaram
```

O repositório `br-santella/arandu` é **privado** nesta fase.

### Autenticação por chave SSH

O envio ao GitHub usa uma **chave SSH**: um par de arquivos, um **público** (`id_ed25519.pub`), cadastrado no GitHub, e um **privado** (`id_ed25519`), que nunca sai do computador. O GitHub confere que quem tem a chave privada é você, sem senha.

Um **agente SSH** guarda a chave na memória para não pedir a senha toda hora. No notebook do projeto, o agente recusava a operação, e a solução foi mandar o Git usar o arquivo da chave direto:

```bash
git config core.sshCommand "ssh -o IdentityAgent=none -i ~/.ssh/id_ed25519"
```

## 7.3 Dependências e gerenciadores de pacotes

O projeto usa código de terceiros (bibliotecas), chamado de **dependências**. Um **gerenciador de pacotes** baixa e organiza essas dependências.

| Parte | Gerenciador | Lista de dependências | Versões exatas (lockfile) |
| --- | --- | --- | --- |
| App | **npm** | `apps/mobile/package.json` | `apps/mobile/package-lock.json` |
| Pipeline | **uv** | `pipeline/pyproject.toml` | `pipeline/uv.lock` |

O **lockfile** registra a versão **exata** de cada dependência instalada. Assim, o computador de outra pessoa e o CI instalam exatamente as mesmas versões, e um "funciona na minha máquina" não acontece. O lockfile **vai para o Git**.

A pasta `node_modules/` (no app) e `.venv/` (no pipeline) guardam os pacotes baixados. São grandes, recriáveis e ficam **fora** do Git.

## 7.4 Tipos de verificação automática

| Verificação | O que pega | App | Pipeline | Banco |
| --- | --- | --- | --- | --- |
| **Testes unitários** | Lógica errada | Jest (12) | pytest (14) | — |
| **Testes do banco** | Regras de acesso furadas | — | — | pgTAP (13) |
| **Tipos** | Valor de tipo errado | `tsc` | (Pydantic, em tempo de execução) | — |
| **Lint** | Erros comuns e estilo | ESLint | Ruff | — |
| **Formatação** | Código desalinhado | (ESLint) | `ruff format` | — |

### Testes com servidor simulado

Os testes do cliente de IA não chamam o modelo de verdade: usam um **servidor simulado** (`httpx.MockTransport`), que devolve respostas preparadas. Assim os testes são rápidos, não dependem de GPU e conseguem simular falhas (JSON inválido, erro 500) que seriam difíceis de provocar com o modelo real. O modelo real é testado à parte, manualmente, quando há mudanças de modelo.

## 7.5 CI: verificação contínua no GitHub

**CI** (integração contínua) é rodar as verificações **automaticamente** a cada envio de código. O Arandu usa o **GitHub Actions**: a cada `push`, o GitHub liga um computador temporário, baixa o código e roda os testes.

Os workflows ficam em `.github/workflows/`:

| Workflow | Roda quando muda | Faz |
| --- | --- | --- |
| `mobile.yml` | `apps/mobile/` | Instala, confere tipos, lint, testes |
| `pipeline.yml` | `pipeline/` | Instala, Ruff, testes |
| `database.yml` | `supabase/` | Sobe o banco, roda os testes pgTAP |
| `keep-alive.yml` | A cada 3 dias (agendado) | Faz uma leitura leve no Supabase remoto para ele não pausar |

Cada workflow só roda quando a **sua** pasta muda. Isso economiza os minutos gratuitos do repositório privado.

Um agendamento como `"17 9 */3 * *"` está no formato **cron**: minuto 17, hora 9 (UTC), a cada 3 dias.

Os **secrets do GitHub** (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`) são valores guardados nas configurações do repositório e entregues ao workflow sem aparecer no código.

## 7.6 Configuração por ambiente (`.env`)

Cada ambiente (local, remoto) tem endereços e chaves diferentes. Em vez de mudar o código, muda-se o arquivo `.env`. Ver [documento 4](04-seguranca-e-privacidade.md), seção 4.7.

## 7.7 Documentação como parte do trabalho

No Arandu, documentação **não é opcional**. Toda mudança que afete o que está descrito atualiza, no mesmo commit:

| O quê | Onde |
| --- | --- |
| Uma decisão nova | `docs/decisoes.md` (data, decisão, motivo) |
| Arquitetura, fluxos, diagramas, estado | `docs/arquitetura/` + `historico.md` |
| Conceito novo ou fluxo alterado | `docs/learning/` + histórico de revisões |
| Progresso | `docs/08-backlog.md` |

## 7.8 Como o Claude Code trabalha no projeto

O **Claude Code** é um assistente de programação que lê e altera arquivos, roda comandos e testes. Ele segue o `CLAUDE.md`, que define:

- **regras inegociáveis**: nunca inventar conteúdo histórico, a IA só propõe, o guia só responde com conteúdo validado, privacidade, conteúdo restrito, linguagem respeitosa;
- **convenções**: interface em português, código em inglês, commits pequenos, testes para toda lógica;
- **jeito de trabalhar**: propor um plano antes de tarefas grandes, seguir o backlog, registrar decisões, manter a documentação.

Algumas ações exigem **aprovação humana** explícita: enviar código ao GitHub, gravar secrets, aplicar migrations no banco de produção. O sistema de permissões bloqueia essas ações até que alguém da equipe aprove ou as execute.

## 7.9 Comandos do dia a dia

```bash
# App
cd apps/mobile && npm install && npx expo start --web
npm test && npm run typecheck && npm run lint

# Banco
npx supabase start && npx supabase db reset
npx supabase test db
npx supabase db push --remote

# Pipeline
cd pipeline && uv sync && uv run pytest
uv run ruff check . && uv run ruff format .

# Modelos
ollama pull qwen3.5:9b && ollama pull qwen3-embedding:0.6b
```

A lista atualizada fica sempre no `CLAUDE.md`, na seção "Comandos".
