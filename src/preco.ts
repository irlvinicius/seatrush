import type { Ingresso, Pessoa, TipoIngresso } from "./tipos.ts";

// Taxa sobre valor dos ingressos
const TAXA_DE_SERVICO = 0.1;

const arredondar = (valor: number): number => Math.round(valor * 100) / 100;

// Fábrica: preço base + func() por tipo
export function valorDoIngresso(precoBase: number): (tipo: TipoIngresso) => number {
  return (tipo) => (tipo === "meia" ? arredondar(precoBase / 2) : precoBase);
}

// Fábrica: percentual fixo + valor
export function aplicarTaxa(percentual: number): (valor: number) => number {
  return (valor) => arredondar(valor * (1 + percentual));
}

// Cria um ingresso por pessoa
export function montarIngressos(
  precoBase: number,
  pessoas: readonly Pessoa[],
  temDireitoAMeia: (pessoa: Pessoa) => boolean,
): Ingresso[] {
  const valor = valorDoIngresso(precoBase);
  return pessoas.map((pessoa) => {
    const tipo: TipoIngresso = temDireitoAMeia(pessoa) ? "meia" : "inteira";
    return { nome: pessoa.nome, poltrona: pessoa.poltrona, tipo, valor: valor(tipo) };
  });
}

// Soma dos ingressos + taxa de serviço
export function calcularTotal(ingressos: readonly Ingresso[]): number {
  const subtotal = ingressos.reduce((soma, ingresso) => soma + ingresso.valor, 0);
  return aplicarTaxa(TAXA_DE_SERVICO)(subtotal);
}
