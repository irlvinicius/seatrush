# Bilheteria concorrente

Projeto final de Paradigmas de Linguagens de Programação.

Os arquivos de `src/` que vocês escrevem já existem, vazios; o `tipos.ts` e o `servidor.ts` vêm prontos. O que vai em cada um está no passo
indicado do enunciado:

| Arquivo | Passo do enunciado |
| :--- | :--- |
| `src/tipos.ts` (pronto) | 1: os tipos |
| `src/regras.ts` | 2: meia-entrada |
| `src/preco.ts` | 3: preço (funcional) |
| `src/dominio.ts` | 4: evento e erros (orientado a objetos) |
| `src/bilheteria.ts` | 5: a venda, onde a concorrência aparece |
| `src/servidor.ts` (pronto) e `src/main.ts` | 6: ligar o servidor |

Não alterem `src/pagamento.ts`, `src/servidor.ts`, `src/bench.ts` nem `testes/`: a correção usa os originais.

Para começar, sigam o `GUIA.md`. Depois dele, os comandos são:

```bash
npm install
npm test          # correção automática: mostra os pontos
npm start         # serviço em http://localhost:3000
npm run bench     # com o serviço no ar: 200 pedidos simultâneos no evento 1, dois por poltrona
```

Exemplo de pedido:

```bash
curl -X POST localhost:3000/reservas -H 'Content-Type: application/json' \
  -d '{"eventoId":1,"ingressos":[{"nome":"Ana","idade":20,"estudante":true,"pcd":false,"poltrona":7}]}'
```

---

## Preencham (avaliado no vídeo)

**Link do vídeo:** 

### Integrantes

| Nome | Usuário do GitHub | 
| :--- | :--- |
|Pedro Lopes| [@pleonLopes](https://github.com/pleonLopes)|
|Vinícius Vieira| [@irlvinicius](https://github.com/irlvinicius)



### Decisões

1. **Concorrência.** Como vocês garantem que duas pessoas não ficam com a mesma poltrona? Onde estava o
   `await` perigoso?

   **Resposta:** as poltronas são marcadas com `evento.reservar(poltronas)` **antes** do `await` do
   pagamento. O Node roda o JavaScript numa linha só e só troca de pedido num `await`, então conferir se a
   poltrona está livre e marcá-la acontece de uma vez, sem nenhum outro pedido no meio. O `await` perigoso
   é o da cobrança (`await comTempoLimite(this.#pagar(total), ...)`): se a marcação viesse depois dele, os
   quatro pedidos da mesma poltrona passariam pela conferência enquanto esperam a operadora, todos seriam
   cobrados e só depois um deles falharia. Se o pagamento é recusado ou passa do tempo limite, as poltronas
   voltam para a venda com `evento.liberar(poltronas)`. Limitação: quando o tempo esgota, a cobrança
   atrasada ainda pode ser aprovada pela operadora; num sistema real isso pediria um estorno.
2. **OO.** O que o `Evento` esconde e por quê? Por que o `reservar` é tudo ou nada? Por que os erros são uma hierarquia de classes?
3. **Funcional.** O que ganhamos com `preco.ts` puro? Como vocês testariam ele sem subir o servidor?

   **Resposta:** as funções de `preco.ts` só dependem do que recebem e não alteram nada fora delas: a mesma
   entrada sempre dá a mesma saída. Isso deixa o cálculo previsível, fácil de reaproveitar (as fábricas
   `valorDoIngresso` e `aplicarTaxa` geram funções já configuradas) e seguro mesmo com centenas de pedidos
   ao mesmo tempo, porque não há estado compartilhado. Para testar, basta importar as funções e comparar
   resultados, sem servidor, sem rede e sem operadora: `aplicarTaxa(0.1)(100)` tem que dar `110`, e
   `montarIngressos` pode receber outra regra de meia (por exemplo, `(p) => p.nome === "Beto"`) para
   conferir que ela usa a função recebida.
4. **Se fosse em outro paradigma.** Escolham uma das partes e expliquem como ficaria em outro
   paradigma, e se ficaria melhor ou pior.
5. **Concorrente × paralelo.** O Node roda o JavaScript numa linha só: os pedidos de vocês são
   concorrentes, não paralelos. O que mudaria se a venda rodasse em vários núcleos ao mesmo tempo?

### Resultados do bench

| Cenário | Pedidos | Tempo (ms) | Vendidos | Poltrona ocupada | Falha de pagamento |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Padrão (`main.ts`), 1ª rodada | 200 | 193 | 91 | 100 | 9 |
| Padrão (`main.ts`), 2ª rodada (servidor reiniciado) | 200 | 198 | 92 | 100 | 8 |
| Bench de novo sem reiniciar o servidor | 200 | 209 | 7 | 192 | 1 |

O bench ocupa as poltronas do evento 1: para rodar de novo, parem o `npm start` (Ctrl+C) e subam outra
vez.

O que os números mostram: os 200 pedidos (dois por poltrona) terminam em cerca de 200 ms, mesmo com cada
cobrança levando 80 ms. Se fossem atendidos um de cada vez, seriam pelo menos 8 segundos (100 cobranças × 80 ms):
enquanto um pedido espera a operadora, o Node atende os outros. Nenhuma poltrona foi vendida duas vezes:
vendidos + falhas de pagamento somam 100, e exatamente 100 pedidos (o segundo de cada poltrona) receberam
409. As falhas de pagamento (~10%) batem com a `taxaDeFalha: 0.1` da operadora falsa, e essas poltronas
voltaram para a venda. É o que mostra a última linha: rodando o bench de novo sem reiniciar, só as poltronas
devolvidas pelas falhas da rodada anterior estavam livres e foram vendidas (7 vendas e 1 falha); o resto
deu 409.