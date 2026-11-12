# 02 — Escopo do protótipo (MVP)

## Objetivo do protótipo

Provar, com algo funcionando, as duas teses que a banca vai avaliar:

1. **O ciclo de descoberta funciona e gera interesse:** um usuário explora um bairro, descobre pontos, responde desafios e vê o mapa se acender.
2. **A IA revela de verdade:** um documento histórico passa pelo pipeline e vira um ponto proposto, que é revisado por uma pessoa antes de ser publicado.

O protótipo deve ser demonstrável em uma entrevista de 10 minutos e evoluir durante a aceleração de seis semanas.

## Recorte geográfico

- **Bairros piloto:** Liberdade e Pinheiros, em São Paulo. Um exemplo afro-brasileiro e um indígena.
- **Meta de conteúdo:** 10 a 20 pontos curados, com fonte, e 10 a 30 topônimos com origem verificada.
- O Cais do Valongo pode entrar como ponto "fora do piloto", para mostrar que o mapa é nacional.

## Dentro do escopo

### App (mobile, com versão web para demonstração)

| Funcionalidade | Descrição | Prioridade |
| --- | --- | --- |
| Mapa do Brasil "apagado" | Mapa com camada escura; áreas se acendem conforme o usuário descobre pontos | Must |
| Pontos no mapa | Pontos validados dos bairros piloto | Must |
| Descoberta por proximidade | Ao chegar a um raio do ponto, ele é desbloqueado | Must |
| Modo exploração remota | Desbloqueia pontos sem estar no local, para demonstração e uso em sala | Must |
| Cartão do ponto | Texto curto (1–2 min), fontes, autoria/validação, período | Must |
| Desafio do ponto | Pergunta de múltipla escolha ou mito/fato após ler o cartão | Must |
| Nome escondido (diário) | "De onde vem o nome X?" com explicação e fonte | Must |
| Progresso | Contagem de pontos descobertos, áreas acesas, sequência semanal | Must |
| Trilha | Uma trilha completa de 4 a 6 pontos em um bairro | Should |
| Guia conversacional | Perguntas livres respondidas só com base no conteúdo validado, com citação | Should |
| Camadas do tempo | Sobreposição de um mapa histórico em domínio público em um bairro | Could |
| Modo turma (versão mínima) | Professor cria turma com código; progresso coletivo da turma | Could |

### Painel de curadoria (web simples)

| Funcionalidade | Prioridade |
| --- | --- |
| Lista de pontos propostos pela IA com documento de origem | Must |
| Editar, aprovar para próxima etapa, rejeitar, marcar como restrito | Must |
| Registrar quem validou e quando | Must |
| Publicar ponto aprovado (aparece no app) | Must |

### Pipeline de IA (demonstração)

| Etapa | Prioridade |
| --- | --- |
| Ingestão de 1 a 5 documentos em domínio público | Must |
| Transcrição (OCR ou modelo de visão) | Must |
| Extração estruturada de entidades (lugar, pessoa, comunidade, data, evento) | Must |
| Geocodificação aproximada e criação de ponto proposto | Must |
| Envio para o painel de curadoria | Must |
| Cruzamento com topônimos | Could |

## Fora do escopo do protótipo

- Cobertura nacional e cidades além de São Paulo (exceto pontos-vitrine).
- Contribuições abertas de usuários.
- Relatos em áudio.
- Rankings, ligas e perfis sociais.
- Painel completo para secretarias de educação.
- Integração com bases do IPHAN.
- Tradução para línguas indígenas.
- Monetização.

## Critérios de pronto do protótipo

- [ ] Um usuário novo abre o app, vê o mapa apagado e entende o que fazer em menos de 30 segundos.
- [ ] É possível descobrir todos os pontos do piloto no modo exploração remota.
- [ ] Cada ponto exibe pelo menos uma fonte e o status de validação.
- [ ] O mapa visivelmente se acende a cada descoberta.
- [ ] O desafio "Nome escondido" funciona com conteúdo verificado.
- [ ] Um documento histórico percorre o pipeline e aparece como proposta no painel.
- [ ] Uma proposta aprovada no painel aparece no app.
- [ ] O guia responde a uma pergunta coberta pela base citando a fonte, e diz "não sei" para uma pergunta fora dela.
- [ ] Nenhum dado de localização precisa do usuário é armazenado no servidor.
- [ ] Roteiro de demonstração de 3 minutos ensaiado.

## Roteiro de demonstração (para a entrevista)

1. Abrir o app: mapa do Brasil apagado, com o slogan.
2. Entrar na Liberdade em modo exploração e descobrir o ponto do Cemitério dos Aflitos.
3. Ler o cartão, ver a fonte e a validação, responder ao desafio. O mapa acende.
4. Fazer o "Nome escondido" do dia.
5. Perguntar ao guia algo coberto pela base e algo fora dela.
6. Abrir o painel: mostrar um documento que virou proposta, aprovar e ver o ponto aparecer no app.
