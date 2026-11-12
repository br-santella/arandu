# 03 — Experiência e gamificação

## Princípio

O Arandu não compete com a Wikipédia em quantidade de informação. Ele leva a história até a pessoa **no lugar e no momento certos, em formato curto e com algo para fazer**. A gamificação existe para valorizar cada descoberta e manter o interesse ao longo do tempo, não para competir.

## Ciclo central

```
Descobrir → Ler/ouvir (1–2 min) → Responder → Revelar no mapa → próxima descoberta
```

Todas as mecânicas são variações desse ciclo.

## Duas camadas de engajamento

| Camada | Frequência | Onde | Exemplo |
| --- | --- | --- | --- |
| Diária e remota | Todo dia, 1–2 min | Qualquer lugar | Nome escondido, Mito ou fato |
| De campo | Ocasional | No território | Visitar pontos, completar trilhas |

Em vez de ofensiva diária, o app usa **metas semanais** (ex.: 3 descobertas ou desafios na semana), porque ninguém visita um lugar histórico novo todo dia.

## Fluxo de aprendizado

| Etapa | Mecânica | Benefício |
| --- | --- | --- |
| 1. Curiosidade | Nome escondido | Desperta a pergunta no dia a dia |
| 2. Descoberta | Mapa que se revela | Liga a história ao lugar real |
| 3. Compreensão | Cartões e guia | Contexto curto e com fonte |
| 4. Fixação | Mito ou fato e revisões | Corrige equívocos e consolida |
| 5. Pertencimento | Modo turma | A turma revela o mapa junta |

## Mecânicas

### Mapa que se revela
- O mapa do Brasil começa coberto por uma camada escura com uma grade de pontos apagados, como na logo.
- Cada descoberta acende o ponto e ilumina uma área ao redor (célula hexagonal, por exemplo H3 resolução 8 ou 9).
- O progresso é visual: o usuário vê o bairro, a cidade e o país se acendendo.
- Linguagem: "acender", "revelar". Nunca "conquistar" ou "capturar".

### Descoberta por proximidade
- Raio padrão de 50–100 m (configurável por ponto).
- A verificação de proximidade acontece **no dispositivo**. O servidor recebe apenas o ID do ponto descoberto, nunca as coordenadas do usuário.
- **Modo exploração remota:** permite descobrir pontos sem estar no local (sala de aula, demonstração, acessibilidade). Descobertas remotas acendem o mapa com um visual diferente (por exemplo, contorno em vez de preenchimento) e podem ser "completadas" com uma visita.

### Cartão do ponto
- Título, imagem opcional (apenas imagens com licença livre ou cedidas), texto de 1–2 minutos de leitura.
- Bloco "De onde vem esta informação": fontes com link.
- Bloco "Quem validou": autoria e validação (pesquisador/comunidade), data.
- Período histórico e tipo (indígena, afro-brasileiro, ambos).
- Botão "Pergunte ao guia".

### Desafio do ponto
- 1 pergunta de múltipla escolha ou mito/fato, escrita pela curadoria junto com o conteúdo do ponto.
- Feedback explica a resposta certa e cita a fonte.
- Errar não bloqueia o progresso; o ponto acende de qualquer forma. O desafio dá um selo extra.

### Nome escondido (desafio diário)
- Um topônimo por dia: "De onde vem o nome X?" com 3 opções.
- Resposta com explicação, língua de origem e fonte.
- **Só usa topônimos com origem verificada em fonte confiável.** Etimologias populares sem fonte não entram.

### Mito ou fato
- Afirmações curtas sobre povos indígenas e história afro-brasileira, com explicação.
- Exemplo de formato: "Todos os povos indígenas falam a mesma língua? → Mito." (conteúdo final escrito pela curadoria).

### Trilhas
- Roteiros de 4 a 6 pontos em um bairro, com ordem sugerida e tempo estimado.
- Pensadas para saídas escolares.

### Camadas do tempo (Could)
- Controle deslizante que sobrepõe um mapa histórico georreferenciado ao mapa atual.
- Apenas mapas em domínio público ou com licença adequada.

### Modo turma (Could no protótipo)
- Professor cria uma turma e recebe um código.
- Estudantes entram com o código, sem e-mail nem dados pessoais.
- O mapa da turma se acende com as descobertas de todos. Progresso cooperativo, sem ranking individual.
- O professor vê descobertas e acertos agregados.

## Telas do protótipo

1. **Boas-vindas:** logo, slogan, botão "Começar". Escolha entre "Explorar perto de mim" e "Explorar de qualquer lugar".
2. **Mapa:** mapa apagado, pontos próximos, contador de progresso, acesso ao desafio diário.
3. **Cartão do ponto:** conteúdo, fontes, validação, desafio.
4. **Desafio diário:** Nome escondido.
5. **Progresso:** áreas acesas, pontos descobertos, meta semanal, selos.
6. **Guia:** chat com respostas citadas.
7. **Trilha:** lista ordenada de pontos e mapa da trilha.
8. **Turma (Could):** código, mapa coletivo.

## Identidade visual

| Elemento | Valor |
| --- | --- |
| Fundo escuro | `#1E2A26` |
| Fundo claro | `#F6F1E7` |
| Terracota (acento) | `#B04A24` (texto em fundo claro), `#E8946B` (em fundo escuro) |
| Ocre (luz) | `#E3B25B` |
| Texto suave em fundo escuro | `#C9D3CC` |
| Títulos | Fraunces |
| Texto | DM Sans |

A logo (mapa do Brasil em pontos, com pontos acesos) está em `assets/brand/arandu-logo.svg`.

## Acessibilidade

- Contraste mínimo 4.5:1 para texto.
- Tudo o que a cor comunica também aparece em texto (ex.: "descoberto", "a visitar").
- Leitor de tela nos cartões, desafios e progresso.
- O modo exploração remota garante uso por quem não pode se deslocar.
