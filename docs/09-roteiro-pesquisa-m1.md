# 09 — Roteiro de pesquisa do M1 com o Claude chat

Guia para a equipe levantar o conteúdo do piloto (M1) usando o Claude chat (claude.ai) como **assistente de pesquisa**, não como fonte. O resultado são arquivos JSON prontos para o seed (`supabase/seed/`), que o script de importação valida automaticamente.

## 1. O que entregar

| Entrega | Meta | Tarefa do backlog | Onde salvar |
| --- | --- | --- | --- |
| Pontos com fonte, cartão e desafio | 10 a 20 (Liberdade e Pinheiros; Cais do Valongo opcional) | 1.1 e 1.3 | `supabase/seed/points/<slug>.json` (um arquivo por ponto) |
| Topônimos com origem verificada | 10 a 30 | 1.2 | `supabase/seed/toponyms.json` |
| Documentos em domínio público para o pipeline | 1 a 5 | 4.1 | `pipeline/data/documentos.json` (metadados; os arquivos ficam em `pipeline/data/raw/`, fora do git) |
| Planilha de controle | 1 | — | Onde a equipe preferir (modelo na seção 6) |

Um arquivo por ponto evita conflito quando as duas pessoas editam ao mesmo tempo.

## 2. Regras de ouro

O Claude chat **erra com confiança**: pode citar livros que não existem, páginas erradas, datas trocadas e etimologias populares como se fossem fatos. Por isso:

1. **O Claude encontra e organiza; a pessoa verifica.** Nenhum fato entra no JSON sem que alguém da equipe tenha **aberto a fonte** e confirmado o trecho.
2. **Fonte é documento, não o Claude.** "O Claude disse" nunca é fonte. Toda afirmação aponta para autor, obra, ano e localizador (página, seção, minuto ou URL).
3. **Trecho colado vale mais que busca.** O melhor fluxo é a pessoa colar ou anexar o trecho da fonte e pedir ao Claude que trabalhe **só** sobre ele.
4. **Na dúvida, fica de fora.** Um ponto a menos é melhor que um ponto errado. Etimologia sem fonte especializada não entra.
5. **A comunidade tem a palavra final.** A pesquisa bibliográfica prepara o rascunho; a validação comunitária (tarefa 1.5) decide o que é publicado e como é contado.
6. **Linguagem respeitosa** (CLAUDE.md, regra 6): nomes que os próprios povos usam; nada de "índio" genérico; nada de "conquistar" ou "capturar". Termos pejorativos de época só em citação, sinalizados.
7. **Coordenadas nunca vêm do Claude.** Vêm da fonte (endereço, cruzamento, descrição) e de um mapa (OpenStreetMap).

## 3. Preparar o Claude chat

### 3.1 Criar um Projeto

No claude.ai, crie o Projeto **"Arandu — pesquisa M1"** e:

- **Conhecimento do projeto:** anexe `docs/01-visao-e-problema.md`, `docs/02-escopo-mvp.md`, `docs/03-experiencia-e-gamificacao.md`, `docs/07-conteudo-curadoria-e-etica.md` e este roteiro.
- **Busca na web:** ative nas conversas de levantamento (etapas 1, 2, 5 e 6). Desative nas etapas que trabalham só sobre trechos colados (3, 4 e 7), para o Claude não misturar outras informações.
- **Não cole** contatos, telefones ou dados pessoais de parceiros e membros de comunidades.

### 3.2 Instruções do projeto (copiar e colar)

```text
Você apoia a pesquisa bibliográfica do Arandu, app educativo sobre a história indígena e afro-brasileira dos lugares, para escolas (Leis 10.639/2003 e 11.645/2008). Piloto: bairros da Liberdade e de Pinheiros, em São Paulo.

Regras obrigatórias:
1. Nunca afirme um fato histórico sem indicar a fonte específica: autor, título, ano e localizador (página, seção ou URL). Se não encontrar fonte, diga "não encontrei fonte".
2. Sempre separe a origem de cada informação:
   [TRECHO] o que está no texto que eu colei ou anexei;
   [WEB] o que você encontrou na busca, com o link;
   [A VERIFICAR] o que vem do seu conhecimento prévio. Isso nunca vale como fonte.
3. Não invente referências, páginas, citações ou datas. Se não for citação literal, diga que é paráfrase.
4. Etimologias: só de obras especializadas, com autor e página. Se autores divergem, mostre a divergência. Nunca proponha etimologia própria.
5. Use os nomes que os próprios povos usam. Não use "índio" como termo genérico. Não use metáforas de conquista ou captura.
6. Termos pejorativos de época aparecem só em citação, sinalizados como linguagem do documento.
7. Sinalize conteúdo possivelmente sensível (sagrado, restos humanos, rituais, conflitos atuais) para consulta à comunidade.
8. Quando eu pedir JSON, siga exatamente o modelo fornecido, sem campos extras.
9. Se eu pedir para trabalhar "apenas com os trechos", não use nenhuma outra informação.
```

## 4. Fluxo de trabalho

Cada item passa pelas etapas abaixo e por estes status na planilha:

```text
candidato → fontes verificadas → rascunho → revisão cruzada → pronto para o seed → enviado à comunidade
```

### Etapa 1 — Levantar candidatos (busca na web ligada)

Uma conversa por bairro.

```text
Para o bairro {Liberdade | Pinheiros}, em São Paulo, levante lugares, existentes ou desaparecidos, ligados à história afro-brasileira e/ou indígena.

Para cada lugar, dê em tabela:
- nome do lugar;
- por que é relevante, em uma frase;
- herança: indígena, afro-brasileira ou ambas;
- de 1 a 3 fontes concretas com link, preferindo órgãos de patrimônio, arquivos públicos, teses e artigos acadêmicos;
- marcação [WEB] ou [A VERIFICAR] em cada informação.

Não inclua lugares sem ao menos uma fonte candidata com link. Ao final, diga quais informações você considera menos seguras.
```

**Pessoa:** escolha de 8 a 12 candidatos por bairro. Prefira lugares com mais de uma fonte independente.

Tipos de fonte a priorizar:

- processos de tombamento e inventários (IPHAN, CONDEPHAAT, CONPRESP);
- arquivos públicos (Arquivo Histórico Municipal de São Paulo, Arquivo Público do Estado de São Paulo);
- Hemeroteca Digital da Biblioteca Nacional (jornais antigos);
- teses e dissertações (bibliotecas digitais da USP, da Unicamp e outras);
- relatórios de arqueologia e publicações de museus;
- relatos e publicações das próprias comunidades e coletivos (`relato_comunitario`).

Notícias servem para localizar fontes melhores, não como fonte única.

### Etapa 2 — Verificar as fontes (a etapa mais importante)

**Pessoa:** para cada fonte, abra o link ou o livro e confira:

- [ ] a fonte existe e o link abre;
- [ ] o trecho diz de fato o que foi atribuído a ele;
- [ ] o localizador foi anotado (página, seção ou minuto);
- [ ] o tipo foi classificado (`documento_historico`, `artigo_academico`, `noticia`, `livro`, `orgao_publico`, `relato_comunitario`, `outro`);
- [ ] a licença foi anotada se houver imagem ou se o documento for para o pipeline.

Copie os trechos relevantes, literalmente, para um arquivo de notas. Eles são a matéria-prima das próximas etapas.

Para ajudar na leitura de um trecho difícil:

```text
Abaixo está um trecho literal de {autor, obra, ano, página}.
Diga exatamente o que este trecho afirma sobre {lugar} e, separadamente, o que ele NÃO afirma, mas poderia ser mal interpretado como afirmado.

Trecho:
"""
{colar o trecho}
"""
```

### Etapa 3 — Rascunhar o cartão (busca na web desligada)

```text
Trabalhe APENAS com os trechos abaixo, numerados. Não use nenhuma outra informação.

Escreva para o ponto "{nome}":
1. summary: 1 a 2 frases para o mapa.
2. body_with_refs: texto de 150 a 250 palavras (1 a 2 minutos de leitura), para estudantes do ensino fundamental II, em que cada frase termina com a referência [n] do trecho que a sustenta.
3. body: o mesmo texto, sem as referências.
4. Uma lista do que os trechos NÃO permitem afirmar e que um leitor poderia esperar encontrar.

Se os trechos não bastam para 150 palavras, escreva menos e diga o que falta. Não complete com conhecimento geral.

Trechos:
[1] "{trecho}" — {autor, obra, ano, página}
[2] ...
```

**Pessoa:** confira frase por frase se cada `[n]` sustenta mesmo a frase. Ajuste o tom, que é o tom do Arandu e da equipe, não do Claude.

### Etapa 4 — Criar o desafio (busca na web desligada)

```text
Com base APENAS no trecho [{n}] abaixo, crie 1 desafio para o ponto "{nome}".
Tipo: {multipla_escolha com 3 opções | mito_ou_fato}.

Regras:
- a resposta certa precisa estar sustentada literalmente pelo trecho;
- as opções erradas devem ser plausíveis, mas claramente erradas segundo o trecho, e não podem reforçar estereótipos;
- explanation: de 1 a 3 frases explicando a resposta, citando o trecho.

Trecho [{n}]: "{trecho}" — {fonte}
```

### Etapa 5 — Topônimos (busca na web ligada para achar obras; desligada para redigir)

Etimologias indígenas são um terreno de muitos erros: há etimologias populares repetidas na internet sem base. Use obras especializadas e confira na própria obra. Exemplos de obras a procurar:

- Teodoro Sampaio, *O Tupi na Geografia Nacional* (1901, domínio público). É clássica, mas algumas interpretações foram revistas; cruze com autores atuais;
- Eduardo de Almeida Navarro, *Dicionário de Tupi Antigo* (2013);
- trabalhos acadêmicos de linguística sobre toponímia paulista.

```text
Para o topônimo "{nome}" (São Paulo), liste o que obras especializadas dizem sobre a origem e o significado do nome.
Para cada obra: autor, título, ano, página e a interpretação proposta.
Se os autores divergem, mostre todas as versões. Não proponha etimologia própria. Marque [A VERIFICAR] o que vier sem referência localizável.
```

**Pessoa:** confira na obra (página aberta). Regras para entrar no jogo:

- só topônimos em que a interpretação está **atribuída a uma obra verificada**;
- se as obras divergem muito, o topônimo **fica de fora** do Nome escondido, ou a explicação apresenta a divergência;
- **os distratores nunca podem ser interpretações propostas por outros autores.** Isso ensinaria como "errada" uma hipótese acadêmica. Use significados claramente inventados e neutros.

### Etapa 6 — Documentos para o pipeline (busca na web ligada)

```text
Procure documentos históricos digitalizados, em domínio público, que mencionem lugares da Liberdade ou de Pinheiros (São Paulo) ligados à história afro-brasileira ou indígena.
Prefira documentos impressos (jornais, relatórios oficiais, atas publicadas, livros antigos), legíveis e com download disponível.
Para cada um: título, autor, ano, acervo, link e por que você acredita que está em domínio público. Marque [A VERIFICAR] o que não puder confirmar.
```

**Pessoa:** confirme a licença no próprio acervo. Pela Lei 9.610/1998, o prazo de proteção é, em regra, de 70 anos contados de 1º de janeiro do ano seguinte à morte do autor. Na dúvida, confira os termos do acervo ou escolha outro documento. **Manuscritos ficam fora do protótipo** (ver `docs/decisoes.md`).

### Etapa 7 — Revisão cruzada (conversa nova, busca na web desligada)

Feita pela **outra pessoa da dupla**, em uma conversa nova, para o Claude não "lembrar" do rascunho:

```text
Abaixo estão um texto e os trechos de fonte que deveriam sustentá-lo.
1. Liste cada afirmação do texto e, ao lado, o trecho que a sustenta.
2. Aponte afirmações sem sustentação, exageros, generalizações, anacronismos e termos inadequados ou desrespeitosos.
3. Confira se o desafio tem uma única resposta correta segundo os trechos.
Não corrija o texto; só aponte os problemas.

Texto: """{body}"""
Desafio: """{desafio}"""
Trechos: [1] ... [2] ...
```

## 5. Formato de entrega (JSON)

### Ponto: `supabase/seed/points/<slug>.json`

O `slug` usa letras minúsculas, sem acento, com hífens (ex.: `nome-do-lugar`).

```json
{
  "slug": "nome-do-lugar",
  "title": "Nome do lugar",
  "summary": "1 a 2 frases.",
  "body": "Texto de 150 a 250 palavras, sem referências.",
  "location": { "lat": 0.0, "lng": 0.0 },
  "location_note": "Como a coordenada foi obtida (endereço da fonte, cruzamento, aproximação).",
  "unlock_radius_m": 75,
  "city": "São Paulo",
  "neighborhood": "Liberdade",
  "heritage": "indigena | afro_brasileira | ambas",
  "peoples": ["como os povos/comunidades se nomeiam"],
  "period_label": "ex.: século 18",
  "sensitivity": "aberto | cuidado | restrito",
  "sources": [
    {
      "id": "s1",
      "kind": "documento_historico | artigo_academico | noticia | livro | orgao_publico | relato_comunitario | outro",
      "title": "Título da obra",
      "author": "Autor",
      "publisher": "Editora, acervo ou veículo",
      "published_at": "AAAA-MM-DD ou AAAA",
      "url": "https://...",
      "license": "domínio público | CC-BY | uso autorizado | direitos reservados (só citação)",
      "locator": "p. 42"
    }
  ],
  "challenge": {
    "kind": "multipla_escolha | mito_ou_fato",
    "prompt": "Pergunta",
    "options": [
      { "id": "a", "text": "Opção A" },
      { "id": "b", "text": "Opção B" },
      { "id": "c", "text": "Opção C" }
    ],
    "correct_option": "a",
    "explanation": "Por que a resposta é essa, com base na fonte.",
    "source_id": "s1"
  },
  "review": {
    "body_with_refs": "Texto com [s1] em cada frase, para auditoria.",
    "researched_by": "Nome",
    "verified_by": "Nome de outra pessoa",
    "verified_at": "AAAA-MM-DD",
    "notes": "Divergências, pontos fracos, o que consultar com a comunidade."
  }
}
```

Observações:

- Use `"mito_ou_fato"` com duas opções: `{ "id": "mito", ... }` e `{ "id": "fato", ... }`.
- Em `review.body_with_refs`, use os `id` das fontes (`[s1]`, `[s2]`) em vez de números.
- `status` não vai no arquivo: todo ponto do seed entra como `revisao_pesquisa` e só é publicado depois da validação.
- Restos humanos, lugares sagrados e violência devem receber pelo menos `sensitivity: "cuidado"` e uma nota em `review.notes`.

### Topônimo: `supabase/seed/toponyms.json`

```json
[
  {
    "name": "Nome",
    "city": "São Paulo",
    "language": "ex.: tupi antigo",
    "meaning": "Significado segundo a obra citada.",
    "explanation": "1 a 3 frases; se houver divergência entre autores, mencione.",
    "distractors": ["significado inventado 1", "significado inventado 2"],
    "source": {
      "kind": "livro",
      "title": "Título",
      "author": "Autor",
      "published_at": "AAAA",
      "locator": "p. 00"
    },
    "review": { "researched_by": "Nome", "verified_by": "Nome", "verified_at": "AAAA-MM-DD" }
  }
]
```

### Documentos do pipeline: `pipeline/data/documentos.json`

```json
[
  {
    "file": "nome-do-arquivo.pdf",
    "title": "Título",
    "author": "Autor ou órgão",
    "published_at": "AAAA",
    "archive": "Acervo",
    "url": "https://...",
    "license": "domínio público",
    "license_evidence": "Por que está em domínio público (ex.: autor falecido em 1890; termos do acervo).",
    "printed": true,
    "notes": "Páginas de interesse."
  }
]
```

## 6. Planilha de controle

| ID | Bairro | Item | Tipo | Fonte principal | Status | Pesquisou | Verificou | Sensibilidade | Notas |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P01 | Liberdade | … | ponto | … | candidato | … | … | cuidado | … |
| T01 | — | … | topônimo | … | fontes verificadas | … | … | aberto | … |

## 7. Checklist de cada ponto antes do seed

- [ ] Pelo menos 1 fonte verificada por uma pessoa (de preferência 2 fontes independentes).
- [ ] Cada frase do `body` está sustentada em `review.body_with_refs`.
- [ ] O desafio tem uma única resposta certa, sustentada pela fonte indicada.
- [ ] A coordenada foi obtida da fonte e de um mapa, com `location_note` preenchida.
- [ ] Os povos e comunidades aparecem com os nomes que eles usam.
- [ ] Não há "índio" genérico, metáfora de conquista, exotização ou estereótipo.
- [ ] `sensitivity` foi avaliada, e o que for sensível está anotado para a comunidade.
- [ ] A revisão cruzada (etapa 7) foi feita por outra pessoa.
- [ ] O texto foi reescrito pela equipe, sem trechos copiados de obras protegidas além de citações curtas e atribuídas.

## 8. Divisão sugerida

- Cada pessoa pesquisa um bairro e **revisa o bairro da outra** (etapa 7), para que todo ponto tenha duas pessoas.
- Os topônimos podem ser divididos por ordem alfabética, com a mesma regra de revisão cruzada.
- Os documentos do pipeline (etapa 6) ficam com quem conduz o M4.

## 9. Entrega para o Claude Code

Quando houver arquivos em `supabase/seed/`, peça ao Claude Code para rodar o validador do seed. Ele recusa pontos sem fonte, sem coordenada, sem desafio, com desafio inconsistente ou com campos fora do modelo, e mostra o que corrigir. O Claude Code **não preenche nem corrige conteúdo**: só aponta o problema para a equipe resolver.
