import { criarBilheteria } from "./bilheteria.ts";
import { Evento } from "./dominio.ts";
import { criarPagamentoFalso } from "./pagamento.ts";
import { criarServidor } from "./servidor.ts";

const PORTA = 3000;

// Evento 1 (100 poltronas) -> Usado pelo bench
const eventos = [
  new Evento(1, "Lollapalooza 2026 - Sabrina Carpenter", 100, 100),
  new Evento(2, "Festival de Jazz", 150, 60),
  new Evento(3, "Zepelim e o Sopro do Cão - Burgiff", 80, 40),
];

// Operadora falsa -> cada cobrança demora 80 ms e 10% falham.
const pagar = criarPagamentoFalso({ latenciaMs: 80, taxaDeFalha: 0.1 });

const bilheteria = criarBilheteria({ eventos, pagar, limitePagamentoMs: 500 });

criarServidor(bilheteria).listen(PORTA, () => {
  console.log(`Bilheteria disponível em http://localhost:${PORTA}`);
});
