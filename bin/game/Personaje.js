import { Colores } from "./Colores.js";
import { visionColor } from "./Vision.js";

export class Personaje {
  static DIRECCIONES_Y = [-1, 1, 0, 0, -1, -1, 1, 1];
  static DIRECCIONES_X = [0, 0, -1, 1, -1, 1, -1, 1];

  constructor(posicion, simbolo, vision, arma) {
    this.posicionActual = posicion;
    this.simbolo = simbolo;
    this.vision = vision;
    this.arma = arma;
    this.estaVivo = true;
  }

  getPosicionActual() { return this.posicionActual; }
  getVision() { return this.vision; }
  getArma() { return this.arma; }
  isEstaVivo() { return this.estaVivo; }

  die() { this.estaVivo = false; }

  getSimbolo() {
    if (!this.estaVivo) return { ch: " ", cls: "" };
    return { ch: this.simbolo, cls: `vision-${this.vision}` };
  }


  intentarMovimiento(newPos, board, ocupados = null) {
    if (board.estaBloqueado(newPos.getY(), newPos.getX())) return false;

    if (ocupados) {
      for (const c of ocupados) {
        if (!c.isEstaVivo()) continue;
        if (c === this) continue;
        if (c.getPosicionActual().mismaPosicion(newPos)) return false;
      }
    }

    this.posicionActual = newPos;
    return true;
  }

  calcularMejorMovimiento(board, objetivo, maximizar, ocupados) {
    let mejor = null;
    let mejorDist = maximizar ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;

    for (let i = 0; i < 8; i++) {
      const cand = this.posicionActual.desplazar(Personaje.DIRECCIONES_Y[i], Personaje.DIRECCIONES_X[i]);
      if (board.estaBloqueado(cand.getY(), cand.getX())) continue;

      let ocupada = false;
      for (const c of ocupados) {
        if (!c.isEstaVivo()) continue;
        if (c === this) continue;
        if (c.getPosicionActual().mismaPosicion(cand)) { ocupada = true; break; }
      }
      if (ocupada) continue;

      const d = cand.distanciaManhattan(objetivo);

      if (maximizar) {
        if (d > mejorDist) { mejorDist = d; mejor = cand; }
      } else {
        if (d < mejorDist) { mejorDist = d; mejor = cand; }
      }
    }

    return mejor;
  }

  mejorPasoHacia(board, objetivo) {
    const actual = this.getPosicionActual();
    let mejor = null;
    let mejorDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < 8; i++) {
      const cand = actual.desplazar(Personaje.DIRECCIONES_Y[i], Personaje.DIRECCIONES_X[i]);
      if (board.estaBloqueado(cand.getY(), cand.getX())) continue;

      const d = cand.distanciaManhattan(objetivo);
      if (d < mejorDist) {
        mejorDist = d;
        mejor = cand;
      }
    }
    return mejor;
  }
}
