import { Personaje } from "./Personaje.js";
import { visionRandom } from "./Vision.js";
import { armaRandom } from "./Arma.js";

export class PersonajeBueno extends Personaje {
  constructor(position) {
    super(position, "ß", visionRandom(), armaRandom());

    const i = Math.floor(Math.random() * 8);
    this.dy = Personaje.DIRECCIONES_Y[i];
    this.dx = Personaje.DIRECCIONES_X[i];
  }

  decidirMovi(board, malos, ocupados) {
    if (!this.isEstaVivo()) return;

    let masCercano = null;
    let dist = Number.POSITIVE_INFINITY;

    for (const m of malos) {
      if (!m.isEstaVivo()) continue;
      const d = this.getPosicionActual().distanciaManhattan(m.getPosicionActual());
      if (d < dist) {
        dist = d;
        masCercano = m;
      }
    }

    const RADIO_PELIGRO = 5;

    if (masCercano && dist <= RADIO_PELIGRO) {
      for (let paso = 0; paso < 1; paso++) {
        const mejorPos = this.calcularMejorMovimiento(board, masCercano.getPosicionActual(), true, ocupados);
        if (!mejorPos) break;
        if (!this.intentarMovimiento(mejorPos, board, ocupados)) break;
      }
      return;
    }

    const UMBRAL_PATRULLA = 5;

    if (malos.length <= UMBRAL_PATRULLA) {
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
}
