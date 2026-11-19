import { DadosInvalidosErro, Evento, NaoEncontradoErro } from "./dominio.ts";
import type { Pagamento } from "./pagamento.ts";
import { calcularTotal, montarIngressos } from "./preco.ts";
import { direitoAMeia } from "./regras.ts";
import type { Comprovante, ConfigBilheteria, EventoInfo, Pedido } from "./tipos.ts";

export class Bilheteria {
  #eventos: Evento[];
  #pagar: Pagamento;
  #limitePagamentoMs: number;
  #proximoReservaId = 1;

  constructor(config: ConfigBilheteria) {
    this.#eventos = config.eventos;
    this.#pagar = config.pagar;
    this.#limitePagamentoMs = config.limitePagamentoMs;
  }

  listarEventos(): EventoInfo[] {
    return this.#eventos.map((evento) => evento.info());
  }

  async reservar(pedido: Pedido): Promise<Comprovante> {
    // 1 -> Confere pedido e procura o evento
    if (!Array.isArray(pedido?.ingressos) || pedido.ingressos.length === 0) {
      throw new DadosInvalidosErro("o pedido precisa de ao menos um ingresso");
    }
    const evento = this.#eventos.find((e) => e.id === pedido.eventoId);
    if (!evento) {
      throw new NaoEncontradoErro(`evento ${pedido.eventoId} não existe`);
    }

    // 2 -> Marcação de poltronas ocorre ANTES do await (para ninguem conseguir pegar durante o pagamento)
    const poltronas = pedido.ingressos.map((pessoa) => pessoa.poltrona);
    evento.reservar(poltronas);

    // 3 -> Montagem dos ingressos e total (do preco.ts)
    const ingressos = montarIngressos(evento.preco, pedido.ingressos, direitoAMeia);
    const total = calcularTotal(ingressos);

    // 4 -> Cobrança async na api da operadora
    await this.#pagar(total);

    // 5 -> Comprovação com ID novo
    return { reservaId: this.#proximoReservaId++, eventoId: evento.id, ingressos, total };
  }
}

export function criarBilheteria(config: ConfigBilheteria): Bilheteria {
  return new Bilheteria(config);
}
