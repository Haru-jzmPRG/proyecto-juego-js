import { Personaje } from "./Personaje.js";
import { visionRandom } from "./Vision.js";
import { armaRandom } from "./Arma.js";
import { Combate } from "./Combate.js";

export class PersonajeMalo extends Personaje {
  constructor(position) {
    super(position, "Ø", visionRandom(), armaRandom());

    this.target = null;
    const i = Math.floor(Math.random() * 8);
    this.dy = Personaje.DIRECCIONES_Y[i];
    this.dx = Personaje.DIRECCIONES_X[i];
  }

  intentarFijarTarget(buenos) {
    if (this.target && this.target.isEstaVivo()) return;

    this.target = null;
    let mejor = Number.POSITIVE_INFINITY;

    const cazaFinal = buenos.length < 3;

    for (const g of buenos) {
      if (!g.isEstaVivo()) continue;

      const d = this.getPosicionActual().distanciaManhattan(g.getPosicionActual());

      if (cazaFinal) {
        if (d < mejor) { mejor = d; this.target = g; }
      } else {
        if (d <= 6 && d < mejor) { mejor = d; this.target = g; }
      }
    }
  }

  resolverCombate(board, casilla, defensor, muertos) {
    const ganaMalo = Combate.ganaAtacante(this, defensor);

    if (ganaMalo) {
      defensor.die();
      muertos.push(defensor);
      this.intentarMovimiento(casilla, board);
    } else {
      this.die();
      muertos.push(this);
    }
  }

  decidirMovi(board, buenos, ocupados, muertos) {
    if (!this.isEstaVivo()) return;

    this.intentarFijarTarget(buenos);

    if (this.target && this.target.isEstaVivo()) {
      const posActual = this.getPosicionActual();
      const posTarget = this.target.getPosicionActual();

      for (let i = 0; i < 8; i++) {
        const cand = posActual.desplazar(Personaje.DIRECCIONES_Y[i], Personaje.DIRECCIONES_X[i]);
        if (cand.mismaPosicion(posTarget)) {
          this.resolverCombate(board, cand, this.target, muertos);
          return;
        }
      }
    }

    if (this.target && this.target.isEstaVivo()) {
      for (let paso = 0; paso < 2; paso++) {
        const cand = this.mejorPasoHacia(board, this.target.getPosicionActual());
        if (!cand) break;

        if (cand.mismaPosicion(this.target.getPosicionActual())) {
          this.resolverCombate(board, cand, this.target, muertos);
          break;
        }

        if (!this.intentarMovimiento(cand, board, ocupados)) break;
      }
      return;
    }

    const next = this.getPosicionActual().desplazar(this.dy, this.dx);
    if (!this.intentarMovimiento(next, board, ocupados)) {
      const start = Math.floor(Math.random() * 8);
      for (let k = 0; k < 8; k++) {
        const i = (start + k) % 8;
        const cand = this.getPosicionActual().desplazar(Personaje.DIRECCIONES_Y[i], Personaje.DIRECCIONES_X[i]);
        if (this.intentarMovimiento(cand, board, ocupados)) {
          this.dy = Personaje.DIRECCIONES_Y[i];
          this.dx = Personaje.DIRECCIONES_X[i];
          break;
        }
      }
    }
  }
}
