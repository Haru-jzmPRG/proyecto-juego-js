package game;

public class Posicion {
    private int y; 
    private int x; 

    public Posicion(int y, int x) {
        this.y = y;
        this.x = x;
    }

    public int getY() {
        return y;
    }

    public int getX() {
        return x;
    }

    /**
     * Calcula la distancia manhattan entre dos posiciones
     * @param otra posicion a comparar, buscando a otro personaje
     * @return la distancia manhattan
     */
    public int distanciaManhattan(Posicion otra) {
        return Math.abs(this.y - otra.y) + Math.abs(this.x - otra.x);
    }

    /**
     * Calcula la posicion desplazada
     * @param dy desplazamiento vertical
     * @param dx desplazamiento horizontal
     * @return la posicion desplazada
     */
    public Posicion desplazar(int dy, int dx) {
        return new Posicion(this.y + dy, this.x + dx);
    }

    /**
     * Comprueba si dos posiciones son iguales
     * @param otra posicion a comparar
     * @return true si las posiciones son iguales, false en caso contrario
     */
    public boolean mismaPosicion(Posicion otra) {
        return this.y == otra.y && this.x == otra.x;
    }
}
