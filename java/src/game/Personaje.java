package game;

import java.util.List;

public abstract class Personaje {

    private Posicion posicionActual;
    private final String simbolo;
    private final Vision vision;
    private final Arma arma;
    private boolean estaVivo;

    //Las direcciones de las casillas en la que se puede mover
    protected static final int[] DIRECCIONES_Y = {-1,1,0,0,-1,-1,1,1};
    protected static final int[] DIRECCIONES_X = {0,0,-1,1,-1,1,-1,1};

    public Personaje(Posicion posicion, String simbolo, Vision vision, Arma arma) {
        this.posicionActual = posicion;
        this.simbolo = simbolo;
        this.vision = vision;
        this.arma = arma;
        this.estaVivo = true;
    }

    public Posicion getPosicionActual() {
        return posicionActual;
    }

    public Vision getVision() {
        return vision;
    }

    public Arma getArma() {
        return arma;
    }

    public boolean isEstaVivo() {
        return estaVivo;
    }

    public void die() {
        this.estaVivo = false;
    }

    /**
     * Devuelve el símbolo del personaje, coloreado según su visión. Si el personaje no está vivo, devuelve un espacio en blanco.
     * @return
     */
    public String getSimbolo() {
        if(!estaVivo) return " ";
        return vision.color() + simbolo + Colores.RESET;
    }

    /**
     * Intenta mover el personaje hacia una posición dada, si no se puede mover, devuelve false
     * @param newPos
     * @param board
     * @return
     */
    protected boolean intentarMovimiento(Posicion newPos, TableroDeJuego board) {
        if (board.estaBloqueado(newPos.getY(), newPos.getX())) return false;
        this.posicionActual = newPos;
        return true;
    }

    /**
     * Intenta mover el personaje hacia una posición dada, si no se puede mover, devuelve false. 
     * Sobrecarga para tambien identidicar si en la casilla se encunetra otro personaje
     * @param newPos
     * @param board
     * @param ocupados
     * @return
     */
    protected boolean intentarMovimiento(Posicion newPos, TableroDeJuego board, List<? extends Personaje> ocupados) {
        if (board.estaBloqueado(newPos.getY(), newPos.getX())) return false;

        for (Personaje c : ocupados) {
            if (!c.isEstaVivo()) continue;
            if (c == this) continue;
            if (c.getPosicionActual().mismaPosicion(newPos)) return false;
        }

        this.posicionActual = newPos;
        return true;
    }

    /**
     * Calcula el mejor paso hacia una posición dada, si no se puede mover, devuelve null
     * @param board
     * @param objetivo
     * @param maximizar
     * @param ocupados
     * @return
     */
    protected Posicion calcularMejorMovimiento(TableroDeJuego board, Posicion objetivo, boolean maximizar, List<? extends Personaje> ocupados) {
        Posicion mejor = null;
        int mejorDist = maximizar ? Integer.MIN_VALUE : Integer.MAX_VALUE;

        for(int i=0;i<8;i++){
            Posicion cand = posicionActual.desplazar(DIRECCIONES_Y[i],DIRECCIONES_X[i]);

            if(board.estaBloqueado(cand.getY(),cand.getX())) continue;

            boolean ocupada=false;
            for(Personaje c:ocupados){
                if(!c.isEstaVivo()) continue;
                if(c==this) continue;
                if(c.getPosicionActual().mismaPosicion(cand)){ ocupada=true; break; }
            }
            if(ocupada) continue;

            int d = cand.distanciaManhattan(objetivo);

            if(maximizar){
                if(d>mejorDist){ mejorDist=d; mejor=cand; }
            }else{
                if(d<mejorDist){ mejorDist=d; mejor=cand; }
            }
        }

        return mejor;
    }

    /**
     * Calcula el mejor paso hacia una posición dada, si no se puede mover, devuelve null
     * Sobrecarga para maximizar por defecto
     * @param board
     * @param objetivo
     * @return
     */
    protected Posicion mejorPasoHacia(TableroDeJuego board, Posicion objetivo) {
    Posicion actual = getPosicionActual();
    Posicion mejor = null;
    int mejorDist = Integer.MAX_VALUE;

    for (int i = 0; i < 8; i++) {
        Posicion cand = actual.desplazar(DIRECCIONES_Y[i], DIRECCIONES_X[i]);

        if (board.estaBloqueado(cand.getY(), cand.getX())) continue;

        int d = cand.distanciaManhattan(objetivo);
        if (d < mejorDist) {
            mejorDist = d;
            mejor = cand;
        }
    }
    return mejor;
}

}
