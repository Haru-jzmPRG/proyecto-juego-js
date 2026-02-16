import { TableroDeJuego } from "./TableroDeJuego.js";
import { Posicion } from "./Posicion.js";
import { PersonajeMalo } from "./PersonajeMalo.js";
import { PersonajeBueno } from "./PersonajeBueno.js";
import { Consola } from "./Consola.js";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function posicionLibreSinPisarse(board, yaColocados) {
  while (true) {
    const [y, x] = board.posicionLibreAleatoria();
    const pos = new Posicion(y, x);

    let ocupada = false;
    for (const c of yaColocados) {
      if (c.getPosicionActual().mismaPosicion(pos)) {
        ocupada = true;
        break;
      }
    }
    if (!ocupada) return pos;
  }
}

async function main() {
  const tablero = new TableroDeJuego(40, 120);
  tablero.generarObstaculosAleatorios(77);

  const listaPersonajesMalos = [];
  const listaPersonajesBuenos = [];
  const listaTodosLosPersonajes = [];

  for (let i = 0; i < 40; i++) {
    const pos = posicionLibreSinPisarse(tablero, listaTodosLosPersonajes);
    const m = new PersonajeMalo(pos);
    listaPersonajesMalos.push(m);
    listaTodosLosPersonajes.push(m);
  }

  for (let i = 0; i < 40; i++) {
    const pos = posicionLibreSinPisarse(tablero, listaTodosLosPersonajes);
    const b = new PersonajeBueno(pos);
    listaPersonajesBuenos.push(b);
    listaTodosLosPersonajes.push(b);
  }

  while (true) {
    Consola.clearScreen();
    tablero.pintarConPersonajes(listaTodosLosPersonajes);

    const personajesEliminados = [];

    for (const m of listaPersonajesMalos) {
      if (m.isEstaVivo()) {
        m.decidirMovi(tablero, listaPersonajesBuenos, listaTodosLosPersonajes, personajesEliminados);
      }
    }

    for (const b of listaPersonajesBuenos) {
      if (b.isEstaVivo()) {
        b.decidirMovi(tablero, listaPersonajesMalos, listaTodosLosPersonajes);
      }
    }

    for (const c of personajesEliminados) {
      const idxAll = listaTodosLosPersonajes.indexOf(c);
      if (idxAll !== -1) listaTodosLosPersonajes.splice(idxAll, 1);

      if (c instanceof PersonajeBueno) {
        const idxB = listaPersonajesBuenos.indexOf(c);
        if (idxB !== -1) listaPersonajesBuenos.splice(idxB, 1);
      }
      if (c instanceof PersonajeMalo) {
        const idxM = listaPersonajesMalos.indexOf(c);
        if (idxM !== -1) listaPersonajesMalos.splice(idxM, 1);
      }
    }

    if (listaPersonajesBuenos.length === 0) {
      Consola.clearScreen();
      tablero.pintarConPersonajes(listaTodosLosPersonajes);
      console.log("Ganan los malos.");
      break;
    }
    if (listaPersonajesMalos.length === 0) {
      Consola.clearScreen();
      tablero.pintarConPersonajes(listaTodosLosPersonajes);
      console.log("Ganan los buenos.");
      break;
    }

    await sleep(110);
  }
}

main().catch(console.error);
