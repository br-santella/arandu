# 4 — Segurança e privacidade

Estado: 🟢 **regras do banco, login anônimo e gestão de segredos prontos e testados.** As proteções do guia e do app serão completadas no M2 e no M6.

## 4.1 Por que isto importa tanto no Arandu

O público inclui **crianças e adolescentes**, e o conteúdo inclui informação que **comunidades podem pedir para não ser pública**. Um vazamento aqui não é só um problema técnico: é uma quebra de confiança com escolas e comunidades. Por isso a segurança está na arquitetura desde o começo, e não "por cima" no final.

## 4.2 Três ideias que guiam tudo

1. **Nunca confie no cliente.** Qualquer pessoa pode modificar o app no próprio aparelho ou chamar a API diretamente. Toda regra importante precisa valer **no servidor**.
2. **Menor privilégio.** Cada parte recebe só o acesso de que precisa. O app pode ler pontos publicados; não pode ler propostas da IA.
3. **Minimização de dados.** O dado mais seguro é o que nunca foi coletado. O Arandu não guarda a localização, o nome nem o e-mail dos estudantes.

## 4.3 Chaves de acesso

O Supabase usa **chaves**: textos longos que identificam quem está chamando.

| Chave | Pode ficar no app? | Poder |
| --- | --- | --- |
| **Publishable key** (`sb_publishable_...`) | **Sim**, é pública por design | Só o que as regras de acesso (RLS) permitem |
| **Secret key / service role** | **Nunca** | Ignora as regras de acesso: lê e escreve tudo |

Pode parecer estranho deixar uma chave "pública". A lógica é: a publishable key só diz "este pedido vem do app Arandu". Ela não dá poder nenhum além do que as regras do banco liberam para qualquer visitante. Quem protege os dados são as **regras**, não o segredo da chave.

Já a secret key é como a chave mestra do prédio: fica só no pipeline e no backend do painel, nunca no app, nunca no repositório e nunca em conversas.

## 4.4 Login anônimo e tokens (JWT)

O estudante não cria conta. Ao abrir o app, ele recebe um **usuário anônimo**: o Supabase cria um identificador (UUID) e devolve um **token**.

Um **JWT** (JSON Web Token) é um "crachá digital" assinado pelo servidor. Ele tem três partes separadas por pontos: cabeçalho, conteúdo e assinatura. O conteúdo inclui, por exemplo:

```json
{ "sub": "id-do-usuario-anonimo", "role": "authenticated", "is_anonymous": true }
```

- `sub` é o id do usuário. No banco, a função `auth.uid()` lê esse valor.
- A **assinatura** impede falsificação: se alguém alterar o `sub` para se passar por outro usuário, a assinatura deixa de bater e o servidor recusa.

Assim o app consegue dizer "estas descobertas são minhas" **sem saber quem a pessoa é**.

Papéis (roles) no banco:

| Papel | Quem é |
| --- | --- |
| `anon` | Quem ainda não fez login nenhum |
| `authenticated` | Quem tem token: estudantes (anônimos) e curadores |
| `service_role` | O pipeline e o backend do painel; ignora as regras |

Curadores são usuários `authenticated` cujo id está na tabela `curator`.

## 4.5 Row Level Security (RLS): regras por linha

**RLS** (segurança em nível de linha) é um recurso do Postgres em que o banco **filtra cada linha** de acordo com quem pergunta. A mesma consulta devolve resultados diferentes para pessoas diferentes.

Exemplo real (`supabase/migrations/20261112000100_rls.sql`):

```sql
create policy point_public_read on public.point
  for select to anon, authenticated
  using (status = 'publicado' and sensitivity <> 'restrito');
```

Em português: "visitantes e usuários logados podem **ler** (`select`) um ponto **somente se** ele estiver publicado e não for restrito".

Na prática, se o app pedir `select * from point`:

- o **estudante** recebe só os pontos publicados e não restritos;
- o **curador** recebe todos, porque há outra regra (`point_curator_all`) que libera tudo para quem está na tabela `curator`;
- **sem nenhuma regra** que se aplique, o banco não devolve nada. O padrão é negar.

Outro exemplo: as descobertas.

```sql
create policy discovery_own_insert on public.discovery
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_point_public(point_id));
```

O usuário só pode registrar uma descoberta **em nome dele mesmo** e **de um ponto público**. Tentar registrar em nome de outra pessoa, ou de um rascunho, é recusado.

A matriz completa de quem pode o quê está em [`docs/arquitetura/05-seguranca-e-privacidade.md`](../arquitetura/05-seguranca-e-privacidade.md).

### Funções "security definer"

Algumas regras precisam consultar outras tabelas, como "este ponto é público?". Para isso o Arandu usa funções `security definer` (`is_point_public`, `is_curator`...), que rodam com permissão do dono do banco, mas fazem **uma única pergunta fixa** e devolvem só verdadeiro ou falso. Elas também evitam um problema técnico: uma regra que consulta a própria tabela poderia entrar em ciclo infinito.

### Testado, não presumido

Os 13 testes pgTAP (ver [documento 3](03-banco-de-dados-e-supabase.md)) fingem ser cada tipo de usuário e conferem essas regras. Eles rodam a cada envio de código, então ninguém consegue afrouxar uma regra sem que o CI acuse.

## 4.6 Conteúdo restrito: proteção em camadas

Quando uma comunidade indica que algo não deve ser público, o ponto vai para `restrito`. Três camadas garantem que ele some:

1. **RLS:** o app não consegue mais ler o ponto.
2. **Trigger `point_purge_chunks`:** os trechos desse ponto são apagados do índice do guia na hora.
3. **Trigger `content_chunk_guard`:** ninguém consegue indexar de novo um ponto restrito.

Resultado: o conteúdo restrito **nunca é exibido nem enviado ao modelo de IA**, mesmo que algum programa tenha um erro.

## 4.7 Segredos e o arquivo `.env`

Configurações como endereços e chaves ficam em **variáveis de ambiente**, lidas de um arquivo `.env`:

```text
.env.example   modelo, SEM valores secretos, vai para o Git
.env           valores reais do Supabase local, NÃO vai para o Git
.env.remote    valores públicos do projeto remoto, NÃO vai para o Git
```

O arquivo `.gitignore` lista o que o Git deve ignorar. Nele, `.env` e `.env.*` estão bloqueados, exceto o `.env.example`. Assim, uma chave secreta não vai parar no GitHub por acidente.

Regra das variáveis com prefixo `EXPO_PUBLIC_`: elas são **embutidas no app** e qualquer pessoa pode lê-las. Por isso só podem conter valores públicos, como a URL do Supabase e a publishable key.

Segredos usados pelo guia (endereço e chave do modelo de IA) ficarão como **secrets do Supabase** (`supabase secrets set`), guardados no servidor e nunca no app.

## 4.8 Privacidade dos estudantes (LGPD)

A **LGPD** (Lei Geral de Proteção de Dados, Lei 13.709/2018) regula o tratamento de dados pessoais no Brasil e exige cuidado redobrado com dados de crianças e adolescentes.

O que o Arandu faz:

| Dado | O que acontece |
| --- | --- |
| Localização GPS | Usada **só dentro do aparelho**, só com o app aberto. O servidor nunca recebe. No modo remoto, o app nem pede permissão |
| Identidade | Usuário anônimo: só um UUID, sem nome, e-mail ou telefone |
| Descobertas | Só: id do usuário anônimo, id do ponto, modo, acerto |
| Turma (planejado) | Apelido escolhido pelo estudante, nunca o nome completo |
| Perguntas ao guia | Enviadas sem dados pessoais; não guardadas por padrão |
| Direito de apagar | O usuário pode apagar as próprias descobertas (regra `discovery_own_delete`) |

## 4.9 Repositório privado

Nesta fase o repositório no GitHub é **privado**. O código é aberto por licença (MIT), mas só será publicado quando o conteúdo e as parcerias estiverem definidos. Mesmo privado, segredos nunca entram no Git: repositórios mudam de visibilidade e o histórico guarda tudo.

## 4.10 Checklist de segurança para cada mudança

- [ ] A regra vale no **servidor**, e não só no app?
- [ ] Alguma tabela nova tem RLS ativada e regras explícitas?
- [ ] Algum dado pessoal novo está sendo coletado? Ele é mesmo necessário?
- [ ] Algum segredo ficou em código, em `EXPO_PUBLIC_*` ou no histórico do Git?
- [ ] Os testes cobrem a regra nova?
