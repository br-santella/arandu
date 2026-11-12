# 06 — Casos de uso

Prioridade conforme [`docs/02-escopo-mvp.md`](../02-escopo-mvp.md): **M** = Must, **S** = Should, **C** = Could.

```mermaid
flowchart LR
  est(["👤 Estudante /<br/>público"])
  prof(["👤 Professor"])
  cur(["👤 Curadoria /<br/>pesquisador"])
  com(["👤 Comunidade<br/>parceira"])
  ia(["⚙️ Pipeline de IA"])

  subgraph app["App"]
    uc1(["Explorar o mapa apagado — M"])
    uc2(["Descobrir ponto por proximidade — M"])
    uc3(["Descobrir em modo remoto — M"])
    uc4(["Ler cartão com fonte e validação — M"])
    uc5(["Responder desafio do ponto — M"])
    uc6(["Jogar Nome escondido — M"])
    uc7(["Ver progresso e meta semanal — M"])
    uc8(["Seguir trilha — S"])
    uc9(["Perguntar ao guia — S"])
    uc10(["Criar turma e ver progresso agregado — C"])
    uc11(["Entrar em turma com código — C"])
  end

  subgraph painel["Painel de curadoria"]
    uc20(["Revisar propostas da IA — M"])
    uc21(["Editar, aprovar ou rejeitar — M"])
    uc22(["Validar e assinar — M"])
    uc23(["Marcar como restrito — M"])
    uc24(["Publicar — M"])
  end

  subgraph pipeline["Pipeline"]
    uc30(["Transcrever documento — M"])
    uc31(["Extrair entidades — M"])
    uc32(["Geocodificar e propor ponto — M"])
  end

  est --> uc1 & uc2 & uc3 & uc6 & uc7 & uc8 & uc9 & uc11
  uc2 -. "inclui" .-> uc4
  uc3 -. "inclui" .-> uc4
  uc4 -. "estende" .-> uc5
  prof --> uc3 & uc10
  cur --> uc20 & uc21 & uc23 & uc24
  com --> uc22 & uc23
  ia --> uc30
  uc30 -. "inclui" .-> uc31
  uc31 -. "inclui" .-> uc32
  uc32 -. "alimenta" .-> uc20
```

## Atores

| Ator | Autenticação | Pode | Não pode |
| --- | --- | --- | --- |
| Estudante / público | Anônimo | Explorar, descobrir, responder, perguntar | Ver rascunhos; enviar localização |
| Professor | Anônimo ou login mínimo | Criar turma, ver progresso agregado | Ver dados individuais identificáveis |
| Curadoria / pesquisador | Login de curador (`curator`) | Editar, mudar status, publicar | Publicar sem fonte |
| Comunidade parceira | Pela curadoria (painel no futuro) | Validar, assinar, restringir, pedir retirada | — (pedido tem prioridade) |
| Pipeline de IA | Service role | Criar `source`, `ai_proposal`, rascunhos | Publicar |
