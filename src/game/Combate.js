import { visionGanaA } from "./Vision.js";
import { armaGanaA } from "./Arma.js";

export class Combate {
  static ganaAtacante(atacante, defensor) {
    const elementoAtacante = atacante.getVision();
    const elementoDefensor = defensor.getVision();

    const armaAtacante = atacante.getArma();
    const armaDefensor = defensor.getArma();

    const ventajaElemento = visionGanaA(elementoAtacante, elementoDefensor);
    const desventajaElemento = visionGanaA(elementoDefensor, elementoAtacante);

    const tirada = Math.floor(Math.random() * 10) + 1;

    if (ventajaElemento) return [1,2,3,4,5,6].includes(tirada);
    if (desventajaElemento) return [1,2,3,4].includes(tirada);

    const ventajaArma = armaGanaA(armaAtacante, armaDefensor);
    const desventajaArma = armaGanaA(armaDefensor, armaAtacante);

    if (ventajaArma) return [1,2,3,4,5,6].includes(tirada);
    if (desventajaArma) return [1,2,3,4].includes(tirada);

    return [1,2,3,4,5].includes(tirada);
  }
}
