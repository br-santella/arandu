# 06 — Pipeline de IA

A IA tem dois papéis: **revelar** (dos documentos às propostas de pontos) e **mediar** (o guia que conversa com o usuário). Em ambos, a IA propõe e pessoas validam.

## Parte 1 — Revelar: de documentos a pontos propostos

### Fluxo

```
documento ─▶ ingest ─▶ transcribe ─▶ extract ─▶ geocode ─▶ toponyms ─▶ publish
 (PDF/img)   (metadados)  (texto)    (entidades)  (lugar)   (cruzamento)  (ai_proposal)
```

### Etapas

**1. Ingestão (`ingest.py`)**
- Entrada: PDFs ou imagens de documentos **em domínio público ou com licença que permita o uso**.
- Registra a fonte em `source` com título, autor, data, licença e URL de origem.
- Candidatos para o piloto: acervos digitalizados de arquivos públicos, mapas históricos de São Paulo e registros de jornais antigos em hemerotecas digitais. A equipe escolhe e confirma a licença de cada documento antes do uso.

**2. Transcrição (`transcribe.py`)**
- Documentos impressos: OCR (Tesseract com modelo de português) como base.
- Manuscritos e documentos difíceis: modelo de visão multimodal aberto (via Ollama) com instrução de transcrição literal, preservando grafia original e marcando trechos ilegíveis como `[ilegível]`. Modelos abertos ainda são fracos em manuscritos antigos em português: prever revisão manual. Para o piloto, priorizar documentos impressos.
- Saída: texto por página, com referência à página de origem.
- Métrica: amostra revisada manualmente para estimar a taxa de erro de caracteres.

**3. Extração estruturada (`extract.py`)**
- LLM aberto via Ollama, com saída restrita ao JSON Schema gerado pelo modelo pydantic (`format` estruturado) e `temperature = 0` para resultados reproduzíveis. Saídas inválidas são rejeitadas e reenviadas no máximo 2 vezes; depois disso, o trecho é marcado para revisão manual. Esquema:

```json
{
  "places": [{ "name": "", "historical_name": "", "description": "", "excerpt": "" }],
  "people_or_groups": [{ "name": "", "role": "", "excerpt": "" }],
  "communities": [{ "name": "", "type": "indigena|afro_brasileira|outro", "excerpt": "" }],
  "events": [{ "description": "", "date_text": "", "excerpt": "" }],
  "heritage_relevance": "alta|media|baixa",
  "confidence": 0.0,
  "notes": ""
}
```

- Regras do prompt de extração:
  - extrair apenas o que está no texto; todo item precisa de `excerpt` literal;
  - não inferir etnia, povo ou origem que o texto não diga;
  - registrar a linguagem do documento como está, mas sinalizar termos pejorativos de época em `notes`, para a curadoria contextualizar.

**4. Geocodificação (`geocode.py`)**
- Nomes históricos → lugares atuais, usando um dicionário curado de equivalências (construído pela equipe) e depois um geocodificador aberto (ex.: Nominatim, respeitando a política de uso).
- Saída com `location_confidence`. Abaixo do limiar, a proposta vai sem localização e a curadoria posiciona o ponto à mão.

**5. Cruzamento com topônimos (`toponyms.py`)**
- Compara nomes de ruas, bairros e rios do recorte com a tabela `toponym` já validada.
- Sugere ligações entre um ponto proposto e topônimos relacionados.
- **Não gera etimologias.** Só cruza com topônimos que já têm fonte verificada.

**6. Publicação da proposta (`publish.py`)**
- Grava em `ai_proposal` com trecho de origem, entidades e localização sugerida.
- Cria um `point` em `proposta_ia` apenas como rascunho para a curadoria.

### Avaliação do pipeline (para mostrar à banca)

| Métrica | Como medir |
| --- | --- |
| Qualidade da transcrição | Taxa de erro em uma amostra revisada à mão |
| Precisão da extração | % de entidades extraídas confirmadas pela curadoria |
| Taxa de aprovação | % de propostas que viram pontos publicados |
| Ganho de tempo | Tempo para gerar uma proposta vs. levantamento manual da mesma informação |

## Parte 2 — Mediar: o guia (RAG)

### Fluxo

```
pergunta ─▶ Edge Function ─▶ busca vetorial (content_chunk, só publicado)
                         ─▶ prompt com trechos + fontes ─▶ LLM ─▶ resposta com citações
```

### Regras do guia

1. Responde **apenas** com base nos trechos recuperados.
2. Toda afirmação tem citação no formato `[n]`, ligada à fonte do trecho.
3. Se os trechos não respondem à pergunta, diz que ainda não há informação validada e sugere pontos relacionados.
4. Adapta a linguagem à etapa de ensino escolhida (fundamental I, fundamental II, médio, geral) sem mudar os fatos.
5. Não responde sobre conteúdo marcado como `restrito` (esse conteúdo nem é indexado).
6. Recusa pedidos fora do tema com educação.

### Esboço do prompt do sistema

```
Você é o guia do Arandu, um app sobre a história indígena e afro-brasileira dos lugares.
Responda em português, em até 120 palavras, na linguagem adequada para: {etapa}.
Use SOMENTE as informações dos trechos abaixo. Cite cada afirmação com [n].
Se os trechos não forem suficientes, diga: "Ainda não tenho informação validada sobre isso."
Nunca invente datas, nomes, povos ou etimologias.
Use os nomes que os próprios povos usam.

Trechos:
[1] {texto} — Fonte: {fonte}
[2] ...
```

### Avaliação do guia

- Conjunto de 30 a 50 perguntas de teste: metade respondível pela base, metade fora dela.
- Métricas: % de respostas corretas e citadas; % de recusas corretas; zero afirmações sem citação.
- Rodar esse teste a cada mudança de prompt ou modelo.

## Custos e limites

- No protótipo, tudo roda com modelos abertos via Ollama (custo zero). O modelo do guia só é trocado por outro, aberto hospedado ou comercial, se a avaliação acima mostrar necessidade.
- Toda chamada passa por uma interface compatível com a API da OpenAI (`LLM_BASE_URL`, `EMBEDDING_BASE_URL`); trocar de provedor não muda código.
- Use modelos menores para extração em lote e um modelo mais capaz só onde a qualidade exigir.
- Faça cache de transcrições, extrações e embeddings; nunca reprocesse um documento sem necessidade.
- Defina limite de requisições por usuário no guia e de tokens por resposta.
- Se o LLM do guia falhar, responda em "modo trechos" (trechos recuperados com fonte, sem texto gerado); se os embeddings falharem, use só a busca full-text.
- Registre a tag exata de cada modelo usado em `ai_proposal.model`, para que os resultados sejam rastreáveis.
