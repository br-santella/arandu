# 2 — O app (Expo e React Native)

Estado: 🟡 **base pronta** (tema, fontes, rotas, tela de boas-vindas, testes). Mapa, cartões, desafios e guia estão planejados (M2 a M6).

## 2.1 As linguagens: JavaScript e TypeScript

O app é escrito em **TypeScript**, que é **JavaScript com tipos**.

- **JavaScript** é a linguagem dos navegadores. Hoje também roda em celulares e servidores.
- **Tipos** dizem que tipo de valor cada variável aceita. Com eles, muitos erros aparecem **antes** de o programa rodar.

```ts
// Sem tipos, nada impede passar um número onde se esperava um texto.
// Com TypeScript, o erro aparece no editor:
function saudar(nome: string): string {
  return `Olá, ${nome}`;
}
saudar(42); // erro: 42 não é string
```

O comando `npm run typecheck` (que chama `tsc --noEmit`) confere os tipos do app inteiro sem gerar nada. Ele roda no CI a cada envio.

## 2.2 React: a tela feita de componentes

**React** é uma biblioteca para construir interfaces. A ideia central: a tela é montada com **componentes**, que são funções que devolvem o que deve aparecer.

Exemplo real do Arandu (simplificado) — `apps/mobile/src/components/Button.tsx`:

```tsx
export function Button({ label, onPress }: Props) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.base}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
```

- `Button` é um componente; `label` e `onPress` são suas **props** (parâmetros).
- A sintaxe parecida com HTML (`<Pressable>`, `<Text>`) se chama **JSX**.
- Para usar: `<Button label="Começar" onPress={() => ...} />`.

Um componente pode ter **estado**, ou seja, dados que mudam com o tempo (por exemplo, "o cartão está aberto?"). Quando o estado muda, o React redesenha só o que precisa.

## 2.3 React Native e Expo

- **React Native** permite usar React para criar apps de **celular**. Em vez de `<div>`, usa `<View>`; em vez de `<p>`, usa `<Text>`. Os componentes viram elementos nativos do Android e do iOS.
- **React Native Web** faz os mesmos componentes funcionarem no **navegador**.
- **Expo** é um conjunto de ferramentas sobre o React Native: cria o projeto, oferece módulos prontos (localização, fontes, tela de abertura) e facilita gerar o app.

Resultado: **um código só** para Android, iOS e web. É por isso que o Arandu escolheu Expo: a versão web permite mostrar o app à banca **por um link** (ver `docs/decisoes.md`).

No protótipo, o alvo é **Android e web**. O iOS fica para depois porque exige uma conta paga da Apple.

### Expo Go e development build

- **Expo Go** é um app pronto, das lojas, que roda projetos Expo sem compilar nada. Só funciona com os módulos que já vêm dentro dele.
- O mapa (MapLibre) tem **código nativo próprio**, que não está no Expo Go. Por isso o Arandu vai precisar de um **development build**: uma versão do app compilada com os módulos de que ele precisa.

## 2.4 Rotas: cada arquivo é uma tela

O Arandu usa o **Expo Router**, em que **a estrutura de pastas define as telas**:

| Arquivo | Endereço | Tela |
| --- | --- | --- |
| `src/app/index.tsx` | `/` | Boas-vindas 🟢 |
| `src/app/mapa.tsx` | `/mapa` | Mapa ⚪ (M2) |
| `src/app/ponto/[slug].tsx` | `/ponto/qualquer-coisa` | Cartão de um ponto ⚪ (M3) |
| `src/app/desafio.tsx` | `/desafio` | Nome escondido ⚪ (M3) |
| `src/app/progresso.tsx` | `/progresso` | Progresso ⚪ (M3) |
| `src/app/trilha.tsx` | `/trilha` | Trilha ⚪ (M3) |
| `src/app/guia.tsx` | `/guia` | Guia ⚪ (M6) |
| `src/app/_layout.tsx` | — | Moldura comum: carrega fontes, define cabeçalhos e cores |

- `[slug]` entre colchetes é uma **rota dinâmica**: a parte do endereço vira um parâmetro. `/ponto/abc` abre a tela com `slug = "abc"`.
- Um **slug** é um identificador legível, em minúsculas e com hífens, usado em endereços.

Na tela de boas-vindas, os botões levam ao mapa com um parâmetro de modo:

```tsx
router.push({ pathname: '/mapa', params: { modo: 'remoto' } });
```

## 2.5 Organização das pastas do app

```text
apps/mobile/
├── app.json             configuração do app (nome, ícone, cores, plugins)
├── package.json         dependências e comandos (npm)
├── package-lock.json    versões exatas instaladas
├── tsconfig.json        configuração do TypeScript
├── eslint.config.js     regras de estilo de código (lint)
├── AGENTS.md            orientações do Expo para assistentes de código
├── assets/images/       logo e imagens
└── src/
    ├── app/             rotas (telas)
    ├── components/      peças reutilizáveis (Button, Placeholder)
    ├── theme/           cores, fontes, cálculo de contraste
    ├── features/        ⚪ funcionalidades: mapa, pontos, desafios, guia...
    └── lib/             ⚪ utilitários: cliente do Supabase, H3, geografia
```

## 2.6 Tema e acessibilidade

### Cores como "tokens"

`src/theme/colors.ts` separa duas camadas:

- **Paleta:** as cores da marca, vindas da doc 03 (`#1E2A26` fundo escuro, `#E3B25B` ocre etc.).
- **Tokens semânticos:** nomes pelo **papel** da cor (`background`, `text`, `accent`). Os componentes usam os tokens; se a marca mudar uma cor, o app inteiro acompanha.

### Contraste testado automaticamente

Texto precisa de contraste suficiente com o fundo para ser lido por pessoas com baixa visão. A norma internacional **WCAG** exige razão de pelo menos **4,5:1** para texto normal.

Como se calcula (`src/theme/contrast.ts`):

1. Cada cor vira um número de **luminância relativa**, entre 0 (preto) e 1 (branco), pesando vermelho, verde e azul conforme a sensibilidade do olho humano (o verde pesa mais).
2. A razão é `(mais clara + 0,05) / (mais escura + 0,05)`. Preto com branco dá 21:1; uma cor com ela mesma dá 1:1.

O arquivo de teste confere **todas as combinações de texto e fundo** do tema. Se alguém trocar uma cor por outra com pouco contraste, o teste falha e o CI avisa.

### Outras regras de acessibilidade aplicadas

- **Alvos de toque** de pelo menos 44 pontos (`MIN_TOUCH_TARGET`), para dedos e para quem tem dificuldade motora.
- **Leitor de tela:** botões têm `accessibilityRole="button"`, rótulo e dica (`accessibilityHint`). A logo tem descrição em texto.
- **Cor nunca sozinha:** o que a cor comunica também aparece em texto (por exemplo, "Descoberto à distância" e "Visitado").

### Fontes

Títulos em **Fraunces** e texto em **DM Sans**, carregadas no `_layout.tsx`. Se as fontes falharem, o app abre com as fontes do sistema em vez de travar.

## 2.7 Testes do app

Um **teste automatizado** é um pequeno programa que verifica se outro programa faz o que deveria.

```ts
it('matches known WCAG reference values', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
});
```

- O app usa **Jest** (com a configuração `jest-expo`).
- Testes ficam em pastas `__tests__/`.
- Comandos, dentro de `apps/mobile`: `npm test`, `npm run typecheck`, `npm run lint`.

**Lint** é a verificação de estilo e de erros comuns no código (por exemplo, variável declarada e nunca usada).

## 2.8 O mapa (M2)

Estado: 🟢 **na web**: mapa, estados e municípios oficiais que acendem em gradiente, pontos acesos e exploração remota, **lendo os pontos publicados do Supabase**. ⚪ Proximidade (localização do navegador) e salvamento das descobertas vêm nos próximos passos. No celular, o mapa mostra por enquanto um aviso: o protótipo é **só web** até ser validado.

### O que a pessoa vê em cada zoom: níveis de detalhe

Um mapa mostra coisas diferentes conforme a distância, como um atlas: de longe, os estados; de perto, as ruas. Esse princípio se chama **nível de detalhe**. No Arandu, cada nível conta uma parte da história:

| Vista | Zoom | O que aparece | Como "acende" |
| --- | --- | --- | --- |
| **Brasil** | menor que 5 | **Só as divisões dos estados**, sem estradas nem cidades | Estados com pontos brilham de 0% a 100%, na proporção descobertos ÷ publicados |
| **Estado** | 5 a 9 | O contorno do estado **destacado** e o contorno de **todos os municípios**; nenhuma estrada | Municípios com pontos brilham com a mesma regra. Ver todos os municípios ajuda a estimar "quantas cidades faltam" |
| **Município** | 9 ou mais | Ruas, o contorno da cidade **destacado** e os pontos | Ponto cinza (a descobrir), **anel** ocre (descoberto à distância) ou ponto ocre **cheio** (visitado) |

Para esconder estradas e rótulos nas vistas amplas, a função `baseLayerRule` (em `mapTheme.ts`, testada) examina cada camada do estilo base e decide: esconder (as fronteiras estaduais do estilo, porque usamos as do IBGE), mostrar só a partir de certo zoom (estradas a partir do 9, nomes de cidades grandes a partir do 5) ou manter como está. No código, isso vira `setLayerZoomRange`, que define em que faixa de zoom uma camada é desenhada.

Exemplo: com 3 pontos no estado de São Paulo e 1 no Distrito Federal, descobrir 1 ponto em São Paulo faz o estado de São Paulo brilhar a 33%, e o Distrito Federal fica só com um contorno tênue, um convite a explorar.

### Os arquivos do mapa

| Arquivo | Papel |
| --- | --- |
| `src/lib/supabase.ts` | Cliente do Supabase (só a publishable key) |
| `src/features/map/api.ts` | Busca pontos publicados e áreas no Supabase |
| `src/features/map/reveal.ts` | Regras: progresso por estado e município, promoção remota → presencial, GeoJSON |
| `src/features/map/RevealMap.web.tsx` | O mapa no navegador (maplibre-gl) |
| `src/features/map/RevealMap.tsx` | Versão para celular (por enquanto, só um aviso) |
| `src/features/map/mapTheme.ts` | Paleta noturna sobre o estilo do mapa |
| `src/features/map/PointSheet.tsx` | Cartão provisório; fechar o cartão acende o ponto |
| `src/lib/geo.ts` | Distância (haversine) e teste de raio, para o modo "perto de mim" |
| `src/app/mapa.tsx` | A tela: mapa, contador, lista acessível, avisos de carregamento e erro |

### De onde vêm os dados

O app faz **quatro perguntas** ao Supabase, por *views* do banco (ver [documento 3](03-banco-de-dados-e-supabase.md)):

| View | O que traz | Tamanho com os pontos de teste |
| --- | --- | --- |
| `published_point` | Pontos publicados, com latitude, longitude e códigos IBGE | ≈ 1 KB |
| `area_with_points` | Estados e municípios **com pontos**, com contorno (para o brilho) | ≈ 9 KB |
| `state_outline` | Contorno de **todos** os estados (vista Brasil) | ≈ 108 KB |
| `municipality_outline` | Contorno de **todos os municípios dos estados com pontos** (vista Estado) | ≈ 315 KB |

A API do Supabase devolve no máximo 1.000 linhas por pergunta. Por isso a busca é **paginada** (`fetchAllPages`): pede de mil em mil até a resposta vir incompleta. Isso importa para estados com muitos municípios, como Minas Gerais (853).

O app usa o **TanStack Query** para buscar e guardar esses dados em memória (*cache*). Ele cuida de "carregando", "deu erro" e "tentar de novo", e evita buscar de novo à toa: os dados do mapa mudam pouco, então ficam válidos por 5 minutos.

As variáveis do Supabase para o app ficam em `apps/mobile/.env`, porque o Expo lê o `.env` da pasta do próprio app. Como as outras, ele fica fora do Git.

### O progresso por área

A função `areaProgress` percorre os pontos publicados e, para cada estado (ou município), conta **quantos existem** e **quantos a pessoa já descobriu**. A fração vira o brilho da área: `opacidade = 0,55 × fração`. Descobertas remotas e presenciais contam igual.

Essa mesma conta, feita no servidor e somando muitos estudantes, é a base dos futuros **relatórios por estado e cidade** para escolas e secretarias. Eles serão sempre agregados, com um número mínimo de estudantes por grupo, para ninguém ser identificável.

### Arquivos por plataforma

Repare nos nomes `RevealMap.web.tsx` e `RevealMap.tsx`. O bundler do Expo escolhe o arquivo **pela plataforma**: no navegador usa o `.web.tsx`; no celular, o outro. As duas versões seguem o mesmo "contrato" de props (`RevealMap.types.ts`), então a tela não precisa saber qual está rodando.

### Lógica separada da tela

Toda a regra do jogo está em funções puras (`reveal.ts`, `geo.ts`, `api.ts`), que recebem dados e devolvem dados, sem desenhar nada. Por isso são fáceis de testar: os testes conferem, por exemplo, a fração de cada estado e município, que remoto e presencial contam igual, e que uma visita promove uma descoberta remota a presencial, nunca o contrário.

### GeoJSON e camadas

**GeoJSON** é um formato JSON para geometrias: pontos, linhas e polígonos com coordenadas `[longitude, latitude]` (nessa ordem!). O mapa desenha cada "fonte" de dados como **camadas**, de baixo para cima:

| Camada | Fonte | Como aparece | Zoom |
| --- | --- | --- | --- |
| `veil` | um polígono do tamanho do mundo | véu escuro leve: o Brasil "apagado" | todos |
| `estado-progress` | estados com pontos | brilho ocre proporcional | < 5 |
| `municipio-progress` | municípios com pontos | brilho ocre proporcional | 5 a 9 |
| `municipality-outlines` | todos os municípios dos estados com pontos | linha fina clara | ≥ 5 |
| `state-outlines` | todos os estados | linha clara | todos |
| `municipio-highlight` | municípios com pontos | contorno ocre (cidade destacada) | ≥ 5 |
| `estado-highlight` | estados com pontos | contorno ocre (estado destacado) | < 11 |
| `points` | um círculo por ponto | cinza, anel ocre ou ocre cheio, com brilho | ≥ 5 |

### Só o Brasil: a máscara

Os tiles do mapa trazem o mundo inteiro. Para mostrar **só o Brasil**, o app desenha uma **máscara**: um polígono do tamanho do mundo, pintado da cor do mar, com um **buraco no formato do Brasil** (um buraco para cada parte, inclusive as ilhas). Ela fica **por cima** dos nomes do estilo base, então cobre também os nomes de outros países. Uma trava de câmera (`maxBounds`) impede afastar o mapa para longe do país.

A forma do Brasil é a **união dos 27 estados** do IBGE, calculada uma vez no banco (ver [documento 3](03-banco-de-dados-e-supabase.md)). Enquanto ela não carregou, o app **não desenha máscara nenhuma**: um mundo coberto sem buraco esconderia o Brasil também. Esse caso foi pego relendo um teste que passava com a expectativa errada.

### Divisas sem litoral

O contorno de um estado costeiro inclui o litoral. Desenhado como linha, ele soma um traço extra à costa, que já aparece pelo contraste entre terra e mar. Por isso, as linhas de estados e municípios são só as **divisas internas**: o contorno **menos** o limite externo do país (o litoral e as fronteiras com outros países).

Como as malhas de estados e de municípios do IBGE são simplificadas separadamente, os litorais delas não coincidem perfeitamente. O banco usa uma **tolerância** de cerca de 1 km: pedaços de linha a menos de 1 km do limite do país são descartados.

### Nomes próprios, do IBGE

A camada de nomes do estilo base mistura estados brasileiros com províncias de países vizinhos, e os nomes estrangeiros "vazavam" pela borda da máscara. A solução foi desenhar **nossos próprios nomes**: cada estado e município vem com um ponto dentro da sua área (`ST_PointOnSurface`), onde o nome é escrito. Nas vistas Brasil e Estado aparecem só esses nomes; os do estilo base voltam apenas na vista Município.

### Paleta noturna e ordem das camadas

O estilo `dark` original deixava a terra quase preta e o oceano só um pouco mais claro; mal se via o Brasil. O arquivo `mapTheme.ts` troca as cores de algumas camadas do estilo, no espírito do "modo noturno" dos mapas comerciais: terra cinza-esverdeada, oceano mais escuro, fronteiras e nomes de cidades claros.

A **ordem das camadas** importa: o véu e as áreas são inseridos **antes da primeira camada de rótulos**, então os nomes ficam sempre por cima e legíveis.

### O worker do maplibre

O maplibre-gl processa os tiles num **worker**: um pedaço de JavaScript que roda em paralelo, sem travar a tela. Na versão 6, o worker é um arquivo separado, que o bundler do Expo não copia sozinho. Sem ele, o mapa fica preto. A solução está em `scripts/copy-maplibre-worker.mjs`: a cada `npm install` (pelo script `postinstall`), o worker é copiado para `public/maplibre/`, e o mapa aponta para ele com `setWorkerUrl`.

### Como o mapa evoluiu (e por quê)

Esta seção registra as versões anteriores, porque elas ensinam tanto quanto a atual.

1. **Células H3 fixas.** Primeiro, cada ponto acendia um hexágono da grade **H3** (uma grade de hexágonos que cobre o planeta, com várias resoluções) de cerca de 0,1 km². Problema: no zoom do país, a célula era invisível.
2. **Hierarquia do H3.** Depois, hexágonos maiores (bairro, cidade, estado aproximados) brilhavam na proporção de pontos descobertos. Funcionava, mas os hexágonos **não eram os limites reais**: o estado de São Paulo ficava coberto por uns 3 hexágonos.
3. **Limites oficiais do IBGE.** A equipe decidiu usar os **contornos oficiais** de estados e municípios na vista ampla e, dentro da cidade, mostrar **só os pontos**. A diferença entre remoto e presencial passou da célula para o próprio ponto (anel × cheio).
4. **Níveis de detalhe.** A progressão ainda estava poluída: estradas e nomes de cidades pequenas apareciam cedo demais. A equipe definiu três vistas (Brasil, Estado, Município), cada uma mostrando só o necessário, e pediu o contorno de **todos** os municípios na vista Estado, para dar a noção de quanto falta.
5. **Só o Brasil, sem litoral (atual).** A equipe pediu para esconder os outros países e tirar a linha costeira. Vieram a máscara, as divisas internas e os nomes próprios do IBGE.

A ideia de revelar uma área ligada ao **tipo de conhecimento** (por exemplo, o território de uma aldeia) foi deixada para depois do protótipo, porque desenhar essa área seria uma **afirmação histórica** que precisa de fonte e de validação comunitária.

### Bugs que só a revisão humana e o navegador pegaram

- **Pontos "descobertos" que não acendiam.** Antes de atualizar o desenho, o código conferia `isStyleLoaded()`, que devolve falso **enquanto há tiles carregando** (por exemplo, durante o voo até um ponto). A atualização era descartada em silêncio. A correção foi tirar essa condição. O cenário foi reproduzido no navegador automatizado para confirmar.
- **Mapa preto:** o worker ausente (ver acima).
- **"Acender" parecendo "apagar":** uma névoa clara demais deixava a área revelada mais escura que o entorno.

### Como o mapa é verificado

Além dos testes, o mapa é aberto num Chrome sem janela (*headless*), controlado por um script, que clica nos pontos da lista, afasta o zoom e tira capturas de tela. É assim que se confere o que os testes não veem: cores, contraste, ordem das camadas e se o desenho acompanha o estado do app.

### SPA e hospedagem

A versão web é uma **SPA** (single-page application): um único `index.html` carrega o app, e o próprio app troca de tela conforme o endereço. Por isso a hospedagem precisa de um **fallback**: qualquer endereço (como `/mapa`) deve devolver o `index.html`. Sem isso, abrir `/mapa` direto dá erro 404.

### Mapas digitais: estilo e tiles

Um mapa digital é desenhado a partir de **tiles** (ladrilhos): pedaços quadrados do mapa, carregados conforme você move e aproxima. Um **estilo** diz como desenhar cada coisa (cor das ruas, dos rios, dos rótulos).

- **MapLibre** é a biblioteca de mapas, gratuita e de código aberto. No navegador, `maplibre-gl`; no celular (depois), `@maplibre/maplibre-react-native`.
- Os tiles vêm do OpenFreeMap (gratuito, sem chave), configurável em `EXPO_PUBLIC_MAP_STYLE_URL`.

### O que falta no M2 ⚪

**Proximidade calculada no aparelho.** No modo "perto de mim", o app vai comparar a posição do aparelho com a de cada ponto, usando a **fórmula de haversine** (distância entre dois pontos numa esfera, já pronta e testada em `geo.ts`). Se a distância for menor que o raio do ponto (`unlock_radius_m`, 75 m por padrão), o ponto é descoberto. **A posição nunca sai do aparelho.** O servidor recebe só "o usuário X descobriu o ponto Y, presencialmente". Ver [documento 4](04-seguranca-e-privacidade.md).

**Exploração remota** (já funciona), com as regras decididas em `docs/decisoes.md`:

- libera **todos** os pontos publicados;
- **nunca pede** permissão de localização;
- o ponto acende ao **fechar o cartão**;
- vale o mesmo que a descoberta presencial; a diferença é só visual (anel em vez de ponto cheio);
- uma visita depois "promove" a descoberta de remota para presencial.

**Offline-first.** O app vai guardar as descobertas **primeiro no próprio aparelho** e enviar ao servidor quando houver internet. Assim, uma saída escolar sem sinal não perde nada.

## 2.9 Comandos úteis

```bash
cd apps/mobile
npm install            # instala as dependências
npx expo start --web   # abre o app no navegador
npm test               # testes
npm run typecheck      # tipos
npm run lint           # estilo
npx expo install <pacote>   # instala um pacote na versão compatível com o Expo
```

Use sempre `npx expo install` em vez de `npm install <pacote>`: ele escolhe a versão que combina com a versão do Expo (SDK 58).
