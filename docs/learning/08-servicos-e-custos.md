# 8 — Serviços externos e custos

Estado: 🟢 **custo fixo zero** no protótipo. Todos os serviços usados estão em planos gratuitos ou rodam no computador da equipe.

## 8.1 Por que custo zero é uma decisão de arquitetura

Um projeto social em fase de protótipo não pode depender de cartão de crédito. Por isso cada escolha técnica considerou duas perguntas:

1. **Quanto custa?** Prefira o gratuito, o aberto e o local.
2. **O que acontece se o serviço falhar ou mudar de regra?** Tenha sempre um plano B.

A regra que torna isso possível é a **troca por configuração**: o mapa, o modelo de IA e o banco são acessados por endereços no `.env`. Trocar de fornecedor não exige reescrever código.

## 8.2 Os serviços, um a um

| Serviço | Para quê | Custo hoje | Risco | Plano B |
| --- | --- | --- | --- | --- |
| **GitHub** | Código, histórico, CI | Grátis (cota mensal de minutos no repositório privado) | Estourar a cota de minutos | Workflows filtrados por pasta; repositório público tem minutos ilimitados |
| **Supabase** | Banco, login, API, arquivos, funções | Grátis | **Pausa após cerca de 1 semana sem uso**; limites de tamanho | Keep-alive a cada 3 dias; reativar e testar na véspera de demonstrações |
| **Ollama** + modelos abertos | IA do pipeline e do guia | Grátis (roda na GPU da equipe) | Notebook desligado = guia sem IA | "Modo trechos" no guia; endpoint estável só para a banca (item 7.5) |
| **Tiles do mapa** (ex.: OpenFreeMap) ⚪ | Desenho do mapa | Grátis | Serviço gratuito fora do ar | Endereço configurável; arquivo PMTiles próprio no Storage |
| **Nominatim** (OpenStreetMap) ⚪ | Endereço para coordenada | Grátis | Política de uso: no máximo 1 pedido por segundo | Limitador e cache no pipeline |
| **Hospedagem web** ⚪ | Versão web do app | Grátis (GitHub Pages, Netlify, Vercel ou EAS Hosting) | — | Qualquer hospedagem de arquivos estáticos |
| **Expo / EAS** | Ferramentas do app, builds | Grátis (cota de builds na nuvem) | Fila lenta | Build no próprio notebook |
| **Apple (iOS)** | Publicar no iPhone | US$ 99/ano | — | **Adiado**; o código já é compatível |
| **Google Play** | Publicar na loja | US$ 25, uma vez | — | **Adiado**; APK instalado direto |

## 8.3 A pausa do Supabase gratuito

O plano gratuito **pausa** projetos sem atividade por cerca de uma semana. Um projeto pausado não responde, e o app pararia de funcionar.

A solução é o workflow `keep-alive.yml`: a cada 3 dias, o GitHub faz uma leitura leve e pública (`GET /rest/v1/point?limit=1`) usando a publishable key. Isso conta como atividade. Ele passa pelas regras de acesso como qualquer visitante, então não lê nada privado.

Antes de uma demonstração importante, vale abrir o painel do Supabase e conferir que o projeto está ativo.

## 8.4 O desafio do guia em produção

Hoje o modelo de IA roda **no notebook**. A função do guia, porém, roda **no servidor do Supabase**, que não alcança o notebook. Para o guia funcionar no app publicado, ele precisa de um endpoint de modelo **acessível pela internet**. As opções:

| Opção | Custo | Confiabilidade |
| --- | --- | --- |
| Expor o notebook por um túnel | Zero | Baixa: se o notebook desligar, o guia para |
| Provedor de modelos abertos hospedados | Baixo, por uso | Alta |
| API comercial com teto de gasto | Baixo, por uso | Alta |

A decisão fica para o item 7.5 do backlog, guiada pela avaliação do guia. Se houver gasto, **um teto de gasto é configurado no provedor antes** de colocar a chave.

## 8.5 Limites para evitar surpresas

- `GUIDE_RATE_LIMIT_PER_HOUR`: máximo de perguntas por usuário por hora.
- `GUIDE_MAX_OUTPUT_TOKENS`: tamanho máximo de cada resposta.
- **Cache** de transcrições, extrações e embeddings: nada é processado duas vezes sem necessidade.
- **Plano B da demonstração:** um vídeo gravado do roteiro, caso a internet falhe na entrevista.
