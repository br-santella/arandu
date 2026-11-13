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

Estado: 🟢 **na web**: mapa, névoa, células H3 e exploração remota, com pontos de teste. ⚪ Proximidade, pontos vindos do Supabase e salvamento das descobertas vêm nos próximos passos. No celular, o mapa mostra por enquanto um aviso: o protótipo é **só web** até ser validado.

### Os arquivos do mapa

| Arquivo | Papel |
| --- | --- |
| `src/lib/geo.ts` | Distância entre dois pontos (haversine) e teste de raio |
| `src/features/map/reveal.ts` | Regras da revelação: célula de cada ponto, promoção remota → presencial, névoa e camadas em GeoJSON |
| `src/features/map/RevealMap.web.tsx` | O mapa no navegador (maplibre-gl) |
| `src/features/map/RevealMap.tsx` | Versão para celular (por enquanto, só um aviso) |
| `src/features/map/PointSheet.tsx` | Cartão provisório; fechar o cartão acende o ponto |
| `src/features/map/fixtures.ts` | Pontos de **teste**, fictícios, até o app ler do Supabase |
| `src/app/mapa.tsx` | A tela: mapa, contador, lista acessível de pontos |

### Arquivos por plataforma

Repare nos nomes `RevealMap.web.tsx` e `RevealMap.tsx`. O bundler do Expo escolhe o arquivo **pela plataforma**: no navegador usa o `.web.tsx`; no celular, o outro. As duas versões seguem o mesmo "contrato" de props (`RevealMap.types.ts`), então a tela não precisa saber qual está rodando.

### Lógica separada da tela

Toda a regra do jogo está em funções puras (`reveal.ts`, `geo.ts`), que recebem dados e devolvem dados, sem desenhar nada. Por isso são fáceis de testar: 14 testes conferem, por exemplo, que uma visita promove uma descoberta remota a presencial e nunca o contrário. Um desses testes pegou um bug real: o anel do hexágono saía com o último ponto repetido.

### GeoJSON e camadas

**GeoJSON** é um formato JSON para geometrias: pontos, linhas e polígonos com coordenadas `[longitude, latitude]` (nessa ordem!). O mapa recebe três "fontes" GeoJSON e desenha cada uma como **camada**:

| Fonte | Camada | Como aparece |
| --- | --- | --- |
| `fog` | um polígono do tamanho do mundo **com um buraco para cada célula acesa** | névoa escura; onde há buraco, o mapa aparece |
| `cells` | um hexágono por célula acesa | contorno ocre (remota) e preenchimento ocre (presencial) |
| `points` | um ponto por local | cinza apagado ou ocre aceso, com brilho |

Um polígono com buracos tem um anel externo e anéis internos. A névoa é exatamente isso: o mundo inteiro menos as células descobertas.

### O worker do maplibre

O maplibre-gl processa os tiles num **worker**: um pedaço de JavaScript que roda em paralelo, sem travar a tela. Na versão 6, o worker é um arquivo separado, que o bundler do Expo não copia sozinho. Sem ele, o mapa fica preto. A solução está em `scripts/copy-maplibre-worker.mjs`: a cada `npm install` (pelo script `postinstall`), o worker é copiado para `public/maplibre/`, e o mapa aponta para ele com `setWorkerUrl`.

### Como o mapa foi verificado

Além dos testes, o mapa foi aberto num Chrome sem janela (*headless*), controlado por um script, que clicou nos pontos e tirou capturas de tela. Foi assim que apareceram dois problemas que os testes não pegam: o worker ausente (mapa preto) e a névoa clara demais, que fazia a célula acesa parecer **mais escura** que o entorno.

### SPA e hospedagem

A versão web é uma **SPA** (single-page application): um único `index.html` carrega o app, e o próprio app troca de tela conforme o endereço. Por isso a hospedagem precisa de um **fallback**: qualquer endereço (como `/mapa`) deve devolver o `index.html`. Sem isso, abrir `/mapa` direto dá erro 404.

### Como foi planejado (e o que falta)

### Mapas digitais: estilo e tiles

Um mapa digital é desenhado a partir de **tiles** (ladrilhos): pedaços quadrados do mapa, carregados conforme você move e aproxima. Um **estilo** diz como desenhar cada coisa (cor das ruas, dos rios, dos rótulos).

- **MapLibre** é a biblioteca de mapas, gratuita e de código aberto. No celular usa `@maplibre/maplibre-react-native`; no navegador, `maplibre-gl`. São duas implementações atrás de um mesmo componente do Arandu.
- Os tiles virão de um serviço gratuito (por exemplo, OpenFreeMap), configurado em `EXPO_PUBLIC_MAP_STYLE_URL`, para poder trocar de fornecedor sem mexer no código.

### H3: as células que acendem

**H3** é uma grade de **hexágonos** que cobre o planeta, criada pela Uber e aberta ao público. Cada hexágono tem um identificador, e há várias **resoluções** (tamanhos). Na resolução 9, cada célula tem em média cerca de 0,1 km², algo como alguns quarteirões.

No Arandu, descobrir um ponto **acende a célula** onde ele está. Hexágonos ficam bonitos e regulares no mapa, e a mesma célula sempre corresponde à mesma área, para qualquer usuário.

### Proximidade calculada no aparelho

No modo "perto de mim", o app compara a posição do aparelho com a de cada ponto, usando a **fórmula de haversine** (distância entre dois pontos numa esfera). Se a distância for menor que o raio do ponto (`unlock_radius_m`, 75 m por padrão), o ponto é descoberto.

**A posição nunca sai do aparelho.** O servidor recebe só "o usuário X descobriu o ponto Y, presencialmente". Ver [documento 4](04-seguranca-e-privacidade.md).

### Exploração remota

Regras já decididas (`docs/decisoes.md`):

- libera **todos** os pontos publicados;
- **nunca pede** permissão de localização;
- o ponto acende ao **fechar o cartão**;
- vale o mesmo que a descoberta presencial na meta semanal; a diferença é só visual (contorno em vez de preenchimento);
- uma visita depois "promove" a descoberta de remota para presencial.

### Offline-first

O app vai guardar as descobertas **primeiro no próprio aparelho** e enviar ao servidor quando houver internet. Assim, uma saída escolar sem sinal não perde nada.

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
