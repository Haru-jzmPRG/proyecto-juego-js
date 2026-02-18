package game;

import java.util.List;

public class PersonajeBueno extends Personaje {

    private int dy;
    private int dx;

    // Constructor del personaje bueno, asigna una posición inicial, un símbolo,
    // visión y arma aleatorias.
    public PersonajeBueno(Posicion position){
        super(position, "ß", Vision.random(), Arma.random());

        int i = (int)(Math.random() * 8);
        dy = DIRECCIONES_Y[i];
        dx = DIRECCIONES_X[i];
    }

    /**
     * Decide y mueve el personaje bueno
     * @param board
     * @param malos
     * @param ocupados
     */
    public void decidirMovi(TableroDeJuego board, List<PersonajeMalo> malos, List<Personaje> ocupados){

        if(!isEstaVivo()) return;

        PersonajeMalo masCercano = null;
        int dist = Integer.MAX_VALUE;

        // Se busca el malo más cercano dentro del radio de peligro (o cualquier malo si quedan pocos)
        for(PersonajeMalo m: malos){ //m es un malo
            if(!m.isEstaVivo()) continue;
            int d = getPosicionActual().distanciaManhattan(m.getPosicionActual());
            if(d < dist){
                dist = d;
                masCercano = m;
            }
        }

        //Cantidad de casillas que "ve" el bueno en su radio para detectar el peligro
        int RADIO_PELIGRO = 5;

        //Si entra un malo en su radio de peligro el bueno huye
        if(masCercano != null && dist <= RADIO_PELIGRO){
            for(int paso=0; paso<1; paso++){
                Posicion mejorPos = calcularMejorMovimiento(board, masCercano.getPosicionActual(), true, ocupados);
                if(mejorPos == null) break;
                if(!intentarMovimiento(mejorPos, board, ocupados)) break;
            }
            return;
        }
        
        int UMBRAL_PATRULLA = 5;

        if(malos.size() <= UMBRAL_PATRULLA){
            Posicion next = getPosicionActual().desplazar(dy, dx);

            if(!intentarMovimiento(next, board, ocupados)){
                int start = (int)(Math.random() * 8);
                for(int k=0;k<8;k++){
                    int i = (start + k) % 8;
                    Posicion cand = getPosicionActual().desplazar(DIRECCIONES_Y[i], DIRECCIONES_X[i]);
                    if(intentarMovimiento(cand, board, ocupados)){
                        dy = DIRECCIONES_Y[i];
                        dx = DIRECCIONES_X[i];
                        break;
                    }
                }
            }
        }
    }
}
