# 5 — Inteligência artificial no Arandu

Estado: 🟢 **modelos instalados e cliente de IA testado** (inclusive contra o modelo real). 🟡 Pipeline e guia planejados (M4 e M6).

## 5.1 Os dois papéis da IA

| Papel | Nome | O que faz | Quando |
| --- | --- | --- | --- |
| **Revelar** | Pipeline | Lê documentos históricos e **propõe** pontos para o mapa | Na preparação do conteúdo, no computador da equipe |
| **Mediar** | Guia | Responde perguntas dos estudantes **usando só o conteúdo validado** | No app, quando o estudante pergunta |

Nos dois casos vale a regra central do projeto: **a IA propõe, pessoas decidem.** Por quê está na seção 5.3.

## 5.2 O que é um modelo de linguagem (LLM)

Um **LLM** (Large Language Model, grande modelo de linguagem) é um programa treinado com enormes quantidades de texto para **prever a próxima palavra**. Fazendo isso repetidas vezes, ele escreve frases, resume, traduz e extrai informação.

### Tokens e contexto

- O modelo não lê palavras inteiras, e sim **tokens**: pedaços de palavra. "descobertas" pode virar `desc` + `ober` + `tas`. Em português, uma palavra dá em média um pouco mais de um token.
- O **contexto** é o máximo de tokens que o modelo "enxerga" de uma vez, somando pergunta e resposta. No Arandu, o `qwen3.5:9b` roda com contexto de **4096 tokens**: cabem uma página de documento mais as instruções, ou cinco trechos do guia mais a pergunta.

### Parâmetros

Um modelo é feito de bilhões de números, os **parâmetros** (ou pesos). "9B" quer dizer cerca de 9 bilhões. Mais parâmetros costumam dar mais qualidade, mas exigem mais memória.

### Como o modelo escolhe cada token: amostragem

A cada passo, o modelo calcula uma probabilidade para cada token possível. Alguns controles definem como escolher entre eles:

| Controle | O que faz | No Arandu |
| --- | --- | --- |
| **temperature** | Quanto aleatória é a escolha. `0` escolhe sempre o mais provável | `0` na extração, para ser reproduzível |
| **top_p** | Considera só os tokens mais prováveis até somar essa probabilidade | `1` (sem corte) |
| **presence_penalty** | Penaliza tokens que **já apareceram** no texto | **`0`, forçado** (ver abaixo) |
| **frequency_penalty** | Penaliza tokens conforme quantas vezes apareceram | `0`, forçado |

**Um caso real do projeto.** O pacote do `qwen3.5:9b` vem configurado com `presence_penalty = 1,5`. Para conversar, isso evita repetição. Para o Arandu é um problema: a extração precisa **copiar trechos literais** do documento, e uma penalidade por repetir palavras empurra o modelo a reescrever o trecho com outras palavras. Seria uma "citação" que não está no documento, exatamente o que a regra 1 do projeto proíbe. Por isso o cliente do pipeline **força as penalidades a zero** em toda chamada, e um teste garante isso.

### Modo de raciocínio

Alguns modelos "pensam em voz alta" antes de responder: geram um rascunho interno de raciocínio. Isso ajuda em problemas complexos, mas custa tempo. No teste real do Arandu:

| Configuração | Tempo de uma extração | Resultado |
| --- | --- | --- |
| Raciocínio ligado (padrão) | 115 s | JSON válido, trechos literais |
| Raciocínio desligado (`reasoning_effort: "none"`) | **4,5 s** | JSON válido, trechos literais |

Para extração estruturada o raciocínio não compensou, então ele fica desligado (`LLM_REASONING_EFFORT=none`).

## 5.3 Alucinação: por que a IA só propõe

**Alucinação** é quando o modelo produz algo **falso, mas com aparência de verdadeiro**: uma data inventada, um livro que não existe, uma etimologia popular contada como fato. Isso acontece porque o modelo aprende **o que soa provável**, e não **o que é verdade**.

Para um projeto sobre história apagada, uma alucinação seria grave: inventaria história no lugar da história real. Por isso:

1. A IA **nunca publica**. Ela grava **propostas** (`ai_proposal`), e pessoas decidem.
2. Toda informação extraída precisa vir com o **trecho literal** do documento (`excerpt`), para a curadoria conferir.
3. O guia só responde com base em **trechos já validados** e cita a fonte de cada afirmação.
4. Se não houver base, o guia diz que **não sabe**.

## 5.4 Modelos locais e abertos

O Arandu roda os modelos **no computador da equipe**, sem pagar por uso e sem enviar documentos para fora.

### Ollama

O **Ollama** é um programa que baixa e executa modelos abertos localmente. Ele oferece uma **API compatível com a da OpenAI**: um "jeito padrão" de conversar com modelos, que muitos provedores seguem.

```bash
ollama pull qwen3.5:9b     # baixa o modelo
ollama list                # lista os modelos instalados
ollama ps                  # mostra o que está carregado na memória
```

### Quantização e memória da GPU

Uma **GPU** (placa de vídeo) faz as contas dos modelos muito mais rápido que o processador comum. A memória da GPU (**VRAM**) é o limite: o modelo inteiro precisa caber nela para ser rápido. A GPU da equipe tem **8 GB**.

**Quantização** é guardar cada parâmetro com menos bits. `Q4_K_M` usa cerca de 4 a 5 bits por parâmetro, em vez de 16. O modelo fica cerca de 3 a 4 vezes menor, com pouca perda de qualidade.

| Modelo | Tamanho | Coube nos 8 GB? |
| --- | --- | --- |
| `qwen3.5:9b` (escolhido) | ≈ 6,5 GB | Sim, 100% na GPU |
| `gemma4:12b` | ≈ 8 GB | No limite: parte iria para o processador, mais lento |
| `gemma4:31b`, `qwen3.8:27b` | 17 a 19 GB | Não |

### Provedor trocável

O código do Arandu não depende do Ollama. Ele fala com **qualquer** serviço compatível com a API da OpenAI, configurado pelo `.env`:

```text
LLM_BASE_URL=http://localhost:11434/v1   # hoje: Ollama local
LLM_MODEL=qwen3.5:9b
LLM_API_KEY=                              # vazio no Ollama
```

Para trocar de modelo ou usar um provedor na nuvem, basta mudar essas linhas. Isso será útil na demonstração, quando o guia precisar de um endereço sempre disponível (ver [documento 8](08-servicos-e-custos.md)).

## 5.5 Saída estruturada: fazendo a IA responder em formato fixo

Para um programa usar a resposta do modelo, ela precisa vir num formato previsível, como **JSON**.

- **JSON** é um formato de texto para dados: `{"name": "Exemplo", "excerpt": "..."}`.
- **JSON Schema** é a descrição de como o JSON deve ser: quais campos, de que tipo, quais são obrigatórios.
- **Pydantic** é uma biblioteca Python que define esse formato como uma classe e **valida** os dados recebidos.

```python
class Place(BaseModel):
    name: str
    excerpt: str
```

O cliente do Arandu (`pipeline/arandu_pipeline/llm.py`) faz assim:

1. gera o JSON Schema a partir da classe Pydantic;
2. envia ao modelo junto com o pedido (`response_format`), o que **obriga** o modelo a responder naquele formato;
3. valida a resposta com Pydantic;
4. se vier inválida, **tenta de novo** até 2 vezes;
5. se ainda falhar, levanta um erro (`StructuredOutputError`) e o trecho vai para **revisão manual**, em vez de o programa "adivinhar".

## 5.6 Embeddings: transformando significado em números

Um **embedding** é uma lista de números (um **vetor**) que representa o **significado** de um texto. Textos com sentidos parecidos ganham vetores próximos, mesmo usando palavras diferentes.

```text
"onde ficava a aldeia?"           → [0,12, -0,40, 0,88, ...]   (1024 números)
"localização do antigo povoado"   → [0,10, -0,38, 0,85, ...]   ← parecido
"receita de bolo"                 → [-0,70, 0,22, -0,15, ...]  ← diferente
```

- O Arandu usa o modelo `qwen3-embedding:0.6b`, que gera vetores de **1024 dimensões** (1024 números). O banco guarda isso na coluna `content_chunk.embedding`, do tipo `vector(1024)`, graças à extensão **pgvector**.
- A proximidade é medida pela **similaridade de cosseno**: o ângulo entre dois vetores. Ângulo pequeno quer dizer significados parecidos.
- O índice **HNSW** é uma estrutura em forma de grafo que encontra os vetores mais próximos sem comparar com todos. É uma busca aproximada e muito rápida.

### Modelo assimétrico: instrução só na pergunta

O `qwen3-embedding` funciona melhor quando a **pergunta** vem com uma instrução que diz o que se busca, e os **documentos** vão sem instrução:

```text
pergunta:  "Instruct: Given a question about places ... retrieve passages that answer it
            Query: onde ficava a aldeia?"
documento: "texto do trecho, sem instrução"
```

O cliente faz isso com `embed_query()` (com instrução) e `embed()` (sem). A instrução precisa ser **idêntica** no pipeline e no guia. Se mudar de um lado só, a busca piora **sem dar erro nenhum**, um defeito difícil de perceber.

**Trocar de modelo de embedding exige recalcular todos os vetores**, porque vetores de modelos diferentes não são comparáveis. Por isso a versão exata está registrada em `docs/decisoes.md`.

## 5.7 RAG: como o guia vai responder ⚪

**RAG** (Retrieval-Augmented Generation, geração aumentada por recuperação) é a técnica de **buscar primeiro, responder depois**. Em vez de confiar no que o modelo "lembra", o sistema entrega a ele os trechos certos e pede que responda **só com base neles**.

```text
1. Estudante pergunta:   "quem vivia aqui?"
2. Busca (recuperação):  encontra os 5 trechos validados mais relevantes
3. Montagem do prompt:   "Use SOMENTE estes trechos. Cite cada afirmação com [n].
                          [1] trecho... — Fonte: ...
                          [2] trecho... — Fonte: ..."
4. Geração:              o modelo escreve a resposta, citando [1], [2]
5. Conferência:          o sistema verifica se toda afirmação tem citação
6. Resposta:             texto + lista de fontes
```

### Busca híbrida

O Arandu combina duas buscas:

- **vetorial**, por significado (embeddings);
- **por palavras**, com o full-text em português do Postgres.

A primeira entende sinônimos; a segunda acerta nomes próprios exatos. Juntas, erram menos.

### Degradação segura

Se uma peça falhar, o guia **perde recursos, mas nunca inventa**:

| Falha | Comportamento |
| --- | --- |
| Serviço de embeddings fora do ar | Usa só a busca por palavras |
| Modelo de IA fora do ar ou lento | **Modo trechos**: mostra os trechos encontrados com as fontes, sem texto gerado |
| Nenhum trecho relevante | "Ainda não tenho informação validada sobre isso." e sugere pontos relacionados |

## 5.8 OCR: lendo documentos escaneados ⚪

**OCR** (reconhecimento óptico de caracteres) transforma a imagem de uma página em texto.

- **Tesseract**, com o modelo de português, é a base. PaddleOCR será comparado com ele.
- Modelos de visão (IA que "lê" imagens) **não** serão o OCR principal. Quando o Tesseract erra, o texto sai truncado e o erro **é visível**. Quando um modelo de visão erra, ele escreve uma frase **plausível que não está no documento**, e esse erro passa despercebido.
- **Manuscritos ficam fora do protótipo.** Ferramentas como o Kraken precisam ser treinadas para cada tipo de letra.

## 5.9 Como sabemos se a IA está boa: avaliação

Escolher um modelo pela "ficha técnica" não basta. O Arandu vai medir:

| O quê | Como |
| --- | --- |
| Guia | 30 a 50 perguntas de teste, metade respondível e metade não. Mede acertos citados, recusas corretas e **zero afirmações sem citação** |
| Extração | Porcentagem de entidades confirmadas pela curadoria |
| OCR | Taxa de erro por caractere numa amostra revisada à mão |
| Pipeline | Tempo para gerar uma proposta vs. o levantamento manual |

Esses testes rodam a cada troca de modelo ou de prompt. Até agora (fim do M0), só foi testado que os modelos **funcionam**; a qualidade será medida quando houver conteúdo.
