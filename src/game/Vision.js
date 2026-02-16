import { Colores } from "./Colores.js";

export const Vision = Object.freeze({
  PYRO: "PYRO",
  HYDRO: "HYDRO",
  ELECTRO: "ELECTRO",
  DENDRO: "DENDRO",
  ANEMO: "ANEMO",
  GEO: "GEO",
  CRYO: "CRYO"
});

export function visionGanaA(vision, otra) {
  switch (vision) {
    case Vision.PYRO: return otra === Vision.CRYO;
    case Vision.HYDRO: return otra === Vision.PYRO;
    case Vision.ELECTRO: return otra === Vision.HYDRO;
    case Vision.DENDRO: return otra === Vision.ELECTRO;
    case Vision.ANEMO: return otra === Vision.DENDRO;
    case Vision.GEO: return otra === Vision.ANEMO;
    case Vision.CRYO: return otra === Vision.GEO;
    default: return false;
  }
}

export function visionRandom() {
  const values = Object.values(Vision);
  return values[Math.floor(Math.random() * values.length)];
}

export function visionColor(vision) {
  switch (vision) {
    case Vision.PYRO: return Colores.PYRO;
    case Vision.HYDRO: return Colores.HYDRO;
    case Vision.CRYO: return Colores.CRYO;
    case Vision.ELECTRO: return Colores.ELECTRO;
    case Vision.DENDRO: return Colores.DENDRO;
    case Vision.ANEMO: return Colores.ANEMO;
    case Vision.GEO: return Colores.GEO;
    default: return Colores.RESET;
  }
}
