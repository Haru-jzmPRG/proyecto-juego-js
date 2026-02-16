export const Arma = Object.freeze({
  ESPADA: "ESPADA",
  MANDOBLE: "MANDOBLE",
  LANZA: "LANZA",
  ARCO: "ARCO",
  CATALIZADOR: "CATALIZADOR"
});

export function armaGanaA(arma, otra) {
  switch (arma) {
    case Arma.ESPADA: return otra === Arma.CATALIZADOR;
    case Arma.MANDOBLE: return otra === Arma.ESPADA;
    case Arma.LANZA: return otra === Arma.MANDOBLE;
    case Arma.ARCO: return otra === Arma.LANZA;
    case Arma.CATALIZADOR: return otra === Arma.ARCO;
    default: return false;
  }
}

export function armaRandom() {
  const values = Object.values(Arma);
  return values[Math.floor(Math.random() * values.length)];
}
