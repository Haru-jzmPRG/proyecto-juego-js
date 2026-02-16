export class Posicion {
  constructor(y, x) {
    this.y = y;
    this.x = x;
  }

  getY() { return this.y; }
  getX() { return this.x; }

  distanciaManhattan(otra) {
    return Math.abs(this.y - otra.y) + Math.abs(this.x - otra.x);
  }

  desplazar(dy, dx) {
    return new Posicion(this.y + dy, this.x + dx);
  }

  mismaPosicion(otra) {
    return this.y === otra.y && this.x === otra.x;
  }
}
