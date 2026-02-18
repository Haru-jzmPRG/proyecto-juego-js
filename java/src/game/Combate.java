package game;

public class Combate {

    public static boolean ganaAtacante(Personaje atacante, Personaje defensor) {

    Vision elementoAtacante = atacante.getVision();
    Vision elementoDefensor = defensor.getVision();

    Arma armaAtacante = atacante.getArma();
    Arma armaDefensor = defensor.getArma();

    boolean ventajaElemento = elementoAtacante.ganaA(elementoDefensor);
    boolean desventajaElemento = elementoDefensor.ganaA(elementoAtacante);

    int tirada = (int)(Math.random() * 10) + 1;

    //Un 60/40 a favor del atacante si tiene ventaja de vision
    //Si el atacante gana, se devuelve true
    if (ventajaElemento) {
        switch (tirada) {
            case 1,2,3,4,5,6:
                return true;
            default:
                return false;
        }
    }
    //Si el defensor gana, se devuelve true
    if (desventajaElemento) {
        switch (tirada) {
            case 1,2,3,4:
                return true; 
            default:
                return false;
        }
    }

    boolean ventajaArma = armaAtacante.ganaA(armaDefensor);
    boolean desventajaArma = armaDefensor.ganaA(armaAtacante);

    //Un 60/40 a favor del atacante si tiene ventaja de arma
    //Si el atacante gana, se devuelve true
    if (ventajaArma) {
        switch (tirada) {
            case 1,2,3,4,5,6:
                return true;
            default:
                return false;
        }
    }

    //Si el defensor gana, se devuelve true
    if (desventajaArma) {
        switch (tirada) {
            case 1,2, 3, 4:
                return true;
            default:
                return false;
        }
    }

    //50/50 en caso de empate en armas y visiones
    switch (tirada) {
        case 1,2,3,4,5:
            return true;
        default:
            return false;
    }
}

}
