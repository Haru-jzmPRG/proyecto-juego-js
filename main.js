import { TableroDeJuego } from "./src/game/TableroDeJuego.js";
import { Posicion } from "./src/game/Posicion.js";
import { PersonajeMalo } from "./src/game/PersonajeMalo.js";
import { PersonajeBueno } from "./src/game/PersonajeBueno.js";

const screen = document.getElementById("screen");
const goodCount = document.getElementById("goodCount");
const badCount = document.getElementById("badCount");
const status = document.getElementById("status");

const btnStart = document.getElementById("btnStart");
const btnPause = document.getElementById("btnPause");
const btnReset = document.getElementById("btnReset");

const speed = document.getElementById("speed");
const speedValue = document.getElementById("speedValue");

let timer = null;
let tickMs = Number(speed.value);

let tablero;
let malos = [];
let buenos = [];
let todos = [];

function posicionLibreSinPisarse(board, yaColocados) {
  while (true) {
    const [y, x] = board.posicionLibreAleatoria();
    const pos = new Posicion(y, x);

    let ocupada = false;
    for (const c of yaColocados) {
      if (c.getPosicionActual().mismaPosicion(pos)) { ocupada = true; break; }
    }
    if (!ocupada) return pos;
  }
}

function setupGame() {
  tablero = new TableroDeJuego(40, 120);
  tablero.generarObstaculosAleatorios(77);

  malos = [];
  buenos = [];
  todos = [];

  for (let i = 0; i < 40; i++) {
    const pos = posicionLibreSinPisarse(tablero, todos);
    const m = new PersonajeMalo(pos);
    malos.push(m); todos.push(m);
  }

  for (let i = 0; i < 40; i++) {
    const pos = posicionLibreSinPisarse(tablero, todos);
    const b = new PersonajeBueno(pos);
    buenos.push(b); todos.push(b);
  }

  status.textContent = "Listo";
  render();
}

function render() {
  // Render HTML (span por celda para poder colorear)
  screen.innerHTML = tablero.renderHTML(todos);

  goodCount.textContent = String(buenos.filter(b => b.isEstaVivo()).length);
  badCount.textContent = String(malos.filter(m => m.isEstaVivo()).length);
}

function step() {
  const eliminados = [];

  for (const m of malos) {
    if (m.isEstaVivo()) m.decidirMovi(tablero, buenos, todos, eliminados);
  }
  for (const b of buenos) {
    if (b.isEstaVivo()) b.decidirMovi(tablero, malos, todos);
  }

  // Quitar eliminados de listas
  for (const c of eliminados) {
    const iAll = todos.indexOf(c);
    if (iAll !== -1) todos.splice(iAll, 1);

    const iB = buenos.indexOf(c);
    if (iB !== -1) buenos.splice(iB, 1);

    const iM = malos.indexOf(c);
    if (iM !== -1) malos.splice(iM, 1);
  }

  // Condición final
  if (buenos.length === 0) {
    status.textContent = "Ganan los malos";
    stop();
  } else if (malos.length === 0) {
    status.textContent = "Ganan los buenos";
    stop();
  } else {
    status.textContent = "Jugando";
  }

  render();
}

function start() {
  if (timer) return;
  timer = setInterval(step, tickMs);
  btnStart.disabled = true;
  btnPause.disabled = false;
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
  btnStart.disabled = false;
  btnPause.disabled = true;
}

btnStart.addEventListener("click", start);
btnPause.addEventListener("click", stop);
btnReset.addEventListener("click", () => { stop(); setupGame(); });

speed.addEventListener("input", () => {
  tickMs = Number(speed.value);
  speedValue.textContent = `${tickMs}ms`;
  if (timer) { stop(); start(); }
});

speedValue.textContent = `${tickMs}ms`;
setupGame();
