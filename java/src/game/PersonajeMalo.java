package game;

import java.util.List;

public class PersonajeMalo extends Personaje {

    private PersonajeBueno target;
    private int dy;
    private int dx;

    // Constructor del personaje malo, asigna una posición inicial, un símbolo,
    // visión y arma aleatorios.
    public PersonajeMalo(Posicion position) {
        super(position, "Ø", Vision.random(), Arma.random());

        int i = (int) (Math.random() * 8);
        dy = DIRECCIONES_Y[i];
        dx = DIRECCIONES_X[i];
    }

    /**
     * Intenta fijar el objetivo de un malo hacia un bueno, si no se puede fijar, se
     * intenta otra posicion aleatoria
     * 
     * @param buenos
     */
    private void intentarFijarTarget(List<PersonajeBueno> buenos) {
        // Si ya se ha fijado el objetivo, se vuelve a intentar otra posicion aleatoria
        if (target != null && target.isEstaVivo())
            return;

        target = null;
        int mejor = Integer.MAX_VALUE;

        // Si quedan pocos buenos, se vuelve más agresivo y caza al más cercano sin importar la distancia.
        boolean cazaFinal = buenos.size() < 3;

        // Se busca el bueno más cercano dentro del radio de peligro (o cualquier bueno si quedan pocos)
        for (PersonajeBueno g : buenos) {
            if (!g.isEstaVivo())
                continue;

            int d = getPosicionActual().distanciaManhattan(g.getPosicionActual());

            if (cazaFinal) {
                if (d < mejor) {
                    mejor = d;
                    target = g;
                }
            } else {
                if (d <= 6 && d < mejor) {
                    mejor = d;
                    target = g;
                }
            }
        }
    }

    /**
     * Resolve el combate entre un malo y un bueno
     * @param board
     * @param casilla
     * @param defensor
     * @param muertos
     */
    private void resolverCombate(TableroDeJuego board, Posicion casilla, PersonajeBueno defensor, List<Personaje> muertos) {
        boolean ganaMalo = Combate.ganaAtacante(this, defensor);

        //Si gana el malo se queda en la casilla que ocupaba el bueno
        if (ganaMalo) {
            defensor.die();
            muertos.add(defensor);
            intentarMovimiento(casilla, board);
        } else {
            this.die();
            muertos.add(this);
        }
    }

    /**
     * Decide y mueve el personaje malo
     * @param board
     * @param buenos
     * @param ocupados
     * @param muertos
     */
    public void decidirMovi(TableroDeJuego board, List<PersonajeBueno> buenos, List<Personaje> ocupados,List<Personaje> muertos) {

        if (!isEstaVivo())
            return;

        intentarFijarTarget(buenos);
        // Si el objetivo se ha fijado, se intenta mover hacia él, si no se ha fijado, se mueve aleatoriamente
        if (target != null && target.isEstaVivo()) {
            Posicion posActual = getPosicionActual();
            Posicion posTarget = target.getPosicionActual();
            // Se intenta mover hacia el objetivo
            for (int i = 0; i < 8; i++) {
                Posicion cand = posActual.desplazar(DIRECCIONES_Y[i], DIRECCIONES_X[i]);
                if (cand.mismaPosicion(posTarget)) {
                    resolverCombate(board, cand, target, muertos);
                    return;
                }
            }
        }

        // Si el objetivo no se ha fijado, comeinza el modo "persecución"
        if (target != null && target.isEstaVivo()) {
            for (int paso = 0; paso < 2; paso++) { //Malo muevase 2 velocidades más rápido cuando persiga a un bueno

                Posicion cand = mejorPasoHacia(board, target.getPosicionActual()); // Calcula el mejor paso hacia el objetivo
                if (cand == null)
                    break;

                if (cand.mismaPosicion(target.getPosicionActual())) { // Si el paso es el mismo que el objetivo, se va a la combate
                    resolverCombate(board, cand, target, muertos);
                    break;
                }

                if (!intentarMovimiento(cand, board, ocupados)) { // Si no se puede mover hacia el paso, se vuelve a intentar otro
                    break;
                }
            }
            return;
        }

        // Si no se ha fijado ningún objetivo, se mueve a modo "patrulla"
        Posicion next = getPosicionActual().desplazar(dy, dx);
        if (!intentarMovimiento(next, board, ocupados)) {
            int start = (int) (Math.random() * 8);
            for (int k = 0; k < 8; k++) { 
                int i = (start + k) % 8;
                Posicion cand = getPosicionActual().desplazar(DIRECCIONES_Y[i], DIRECCIONES_X[i]);
                if (intentarMovimiento(cand, board, ocupados)) {
                    dy = DIRECCIONES_Y[i];
                    dx = DIRECCIONES_X[i];
                    break;
                }
            }
        }
    }
}
