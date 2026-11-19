import type { Pessoa } from "./tipos.ts";

const IDADE_MINIMA_IDOSO = 60;

// Estudante || PCD || Idade > 60
export function direitoAMeia(pessoa: Pessoa): boolean {
  return pessoa.estudante || pessoa.pcd || pessoa.idade >= IDADE_MINIMA_IDOSO;
}
