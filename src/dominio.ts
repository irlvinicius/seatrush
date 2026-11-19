import type { EventoInfo } from "./tipos.ts";

// Erros de negócio: cada um já carrega o status HTTP que o servidor vai responder.
export abstract class ErroDeNegocio extends Error {
  readonly status: number;

  constructor(mensagem: string, status: number) {
    super(mensagem);
    this.name = new.target.name;
    this.status = status;
  }
}

// Pedido ou poltrona inválidos.
export class DadosInvalidosErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 400);
  }
}

// O evento não existe.
export class NaoEncontradoErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 404);
  }
}

// A poltrona já foi vendida.
export class PoltronaOcupadaErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 409);
  }
}

// A operadora não aprovou o pagamento.
export class PagamentoErro extends ErroDeNegocio {
  constructor(mensagem: string) {
    super(mensagem, 502);
  }
}

// Um evento com poltronas numeradas de 1 até a capacidade.
export class Evento {
  readonly id: number;
  readonly nome: string;
  readonly preco: number;
  readonly capacidade: number;
  #vendidas: number[] = [];

  constructor(id: number, nome: string, preco: number, capacidade: number) {
    this.id = id;
    this.nome = nome;
    this.preco = preco;
    this.capacidade = capacidade;
  }

  get disponivel(): number {
    return this.capacidade - this.#vendidas.length;
  }

  // Confere todas as poltronas primeiro e só depois marca.
  reservar(poltronas: number[]): void {
    if (poltronas.length === 0) {
      throw new DadosInvalidosErro("informe ao menos uma poltrona");
    }
    for (const poltrona of poltronas) {
      if (!Number.isInteger(poltrona) || poltrona < 1 || poltrona > this.capacidade) {
        throw new DadosInvalidosErro(`poltrona ${poltrona} não existe (de 1 a ${this.capacidade})`);
      }
    }
    if (new Set(poltronas).size !== poltronas.length) {
      throw new DadosInvalidosErro("poltrona repetida no mesmo pedido");
    }
    const ocupada = poltronas.find((poltrona) => this.#vendidas.includes(poltrona));
    if (ocupada !== undefined) {
      throw new PoltronaOcupadaErro(`poltrona ${ocupada} já foi vendida`);
    }
    this.#vendidas.push(...poltronas);
  }

  // Devolve as poltronas para a venda.
  liberar(poltronas: number[]): void {
    const naoVendida = poltronas.find((poltrona) => !this.#vendidas.includes(poltrona));
    if (naoVendida !== undefined) {
      throw new DadosInvalidosErro(`poltrona ${naoVendida} não estava vendida`);
    }
    this.#vendidas = this.#vendidas.filter((poltrona) => !poltronas.includes(poltrona));
  }

  info(): EventoInfo {
    return {
      id: this.id,
      nome: this.nome,
      preco: this.preco,
      capacidade: this.capacidade,
      disponivel: this.disponivel,
    };
  }
}