export class TableroDeJuego {

  constructor(alto, ancho) {
    this.ALTO = alto;
    this.ANCHO = ancho;
    this.TABLERO = Array.from(
      { length: alto },
      () => Array(ancho).fill(0) // 0 = libre, 1 = obstáculo
    );
  }

  getALTO() { return this.ALTO; }
  getANCHO() { return this.ANCHO; }

  dentroDelArray(y, x) {
    return y >= 0 && y < this.ALTO && x >= 0 && x < this.ANCHO;
  }

  dentroInterior(y, x) {
    return y > 0 && y < this.ALTO - 1 &&
           x > 0 && x < this.ANCHO - 1;
  }

  esBorde(y, x) {
    return y === 0 || y === this.ALTO - 1 ||
           x === 0 || x === this.ANCHO - 1;
  }

  esObstaculo(y, x) {
    if (!this.dentroDelArray(y, x)) return false;
    return this.TABLERO[y][x] === 1;
  }

  estaBloqueado(y, x) {
    if (!this.dentroDelArray(y, x)) return true;
    if (this.esBorde(y, x)) return true;
    return this.esObstaculo(y, x);
  }

  ponerObstaculo(y, x) {
    if (!this.dentroInterior(y, x)) return false;
    if (this.TABLERO[y][x] === 1) return false;

    this.TABLERO[y][x] = 1;
    return true;
  }

  generarObstaculosAleatorios(cantidad) {
    let puestos = 0;
    let intentos = 0;
    const maxIntentos = cantidad * 50;

    while (puestos < cantidad && intentos < maxIntentos) {
      intentos++;

      const y = 1 + Math.floor(Math.random() * (this.ALTO - 2));
      const x = 1 + Math.floor(Math.random() * (this.ANCHO - 2));

      if (this.ponerObstaculo(y, x)) puestos++;
    }
  }

  posicionLibreAleatoria() {
    while (true) {
      const y = 1 + Math.floor(Math.random() * (this.ALTO - 2));
      const x = 1 + Math.floor(Math.random() * (this.ANCHO - 2));

      if (!this.esObstaculo(y, x)) return [y, x];
    }
  }

  // 🔥 MÉTODO PARA RENDERIZAR EN HTML
  renderHTML(personajes) {
    let html = "";

    for (let y = 0; y < this.ALTO; y++) {
      for (let x = 0; x < this.ANCHO; x++) {

        let personaje = null;

        for (const c of personajes) {
          if (!c.isEstaVivo()) continue;

          if (
            c.getPosicionActual().getY() === y &&
            c.getPosicionActual().getX() === x
          ) {
            personaje = c;
            break;
          }
        }

        // Si hay personaje
        if (personaje) {
          const { ch, cls } = personaje.getSimbolo();
          html += `<span class="cell ${cls}">${escapeHtml(ch)}</span>`;
          continue;
        }

        // Bordes y obstáculos
        let ch = " ";
        let cls = "";

        if (y === 0 && x === 0) { ch = "┌"; cls = "border"; }
        else if (y === 0 && x === this.ANCHO - 1) { ch = "┐"; cls = "border"; }
        else if (y === this.ALTO - 1 && x === 0) { ch = "└"; cls = "border"; }
        else if (y === this.ALTO - 1 && x === this.ANCHO - 1) { ch = "┘"; cls = "border"; }
        else if (y === 0 || y === this.ALTO - 1) { ch = "─"; cls = "border"; }
        else if (x === 0 || x === this.ANCHO - 1) { ch = "│"; cls = "border"; }
        else if (this.esObstaculo(y, x)) { ch = "■"; cls = "obstacle"; }

        html += `<span class="cell ${cls}">${escapeHtml(ch)}</span>`;
      }

      html += "\n";
    }

    return html;
  }
}


/* 🔒 Helper fuera de la clase (IMPORTANTE) */
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
