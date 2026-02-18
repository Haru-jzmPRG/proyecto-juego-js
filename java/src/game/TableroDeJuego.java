package game;

import java.util.List;

public class TableroDeJuego {
    private final int ALTO; //altura del tablero
    private final int ANCHO; //ancho del tablero
    private final int[][] TABLERO; //Array para represnetar el tablero, 0 = libre, 1 = obstaculo

    public TableroDeJuego(int alto, int ancho) {
        this.ALTO = alto;
        this.ANCHO = ancho;
        this.TABLERO = new int[alto][ancho];
    }

    public int getALTO() {
        return ALTO;
    }

    public int getANCHO() {
        return ANCHO;
    }

    /**
     * Comprueba si el punto esta dentro del tablero, evita que se generen errores de array out of bounds
     * @param y y del punto
     * @param x x del punto
     * @return true si esta dentro del tablero, false si no
     */
    public boolean dentroDelArray(int y, int x) {
        return y >= 0 && y < ALTO && x >= 0 && x < ANCHO;
    }

    /**
     * Comprueba si el punto esta dentro del tablero, incluyendo los bordes, 
     * evita que se generen objetos en los bordes y fuera del tablero
     * @param y
     * @param x
     * @return true si esta dentro del tablero, false si no
     */
    public boolean dentroInterior(int y, int x) {
        return y > 0 && y < ALTO - 1 && x > 0 && x < ANCHO - 1;
    }

    public boolean esBorde(int y, int x) {
        return y == 0 || y == ALTO - 1 || x == 0 || x == ANCHO - 1;
    }

    /**
     * Comprueba si hay un obstaculo en la posicion dada, para no que los personajes no puedan pasar por ahí, normalmente rebotan
     * @param y
     * @param x
     * @return true si hay un obstaculo, false si no
     */
    public boolean esObstaculo(int y, int x) {
        if (!dentroDelArray(y, x)) return false;
        return TABLERO[y][x] == 1;
    }

    /**
     * Comprueba si el punto esta bloqueado, es un obstaculo o un borde, para que los personajes no puedan pasar 
     * y reboten a otra direccion
     * @param y
     * @param x
     * @return true si esta bloqueado, false si no
     */
    public boolean estaBloqueado(int y, int x) {
        if (!dentroDelArray(y, x)) return true;
        if (esBorde(y, x)) return true;
        return esObstaculo(y, x);
    }

    /**
     * Pone un obstaculo en la posicion dada, para que los personajes no puedan pasar por ahí
     * @param y
     * @param x
     * @return true si se pudo poner el obstaculo, false si no se pudo (si esta fuera del tablero o ya hay un obstaculo)
     */
    public boolean ponerObstaculo(int y, int x) {
        if (!dentroInterior(y, x)) return false;
        if (TABLERO[y][x] == 1) return false;
        TABLERO[y][x] = 1;
        return true;
    }

    /**
     * Genera una cantidad dada de obstaculos en posiciones aleatorias del tablero, para que el juego sea mas interesante 
     * y no tan predecible
     * @param cantidad
     */
    public void generarObstaculosAleatorios(int cantidad) {
        int puestos = 0;
        int intentos = 0;
        int maxIntentos = cantidad * 50;

        while (puestos < cantidad && intentos < maxIntentos) {
            intentos++;

            int y = 1 + (int) (Math.random() * (ALTO - 2));
            int x = 1 + (int) (Math.random() * (ANCHO - 2));

            if (ponerObstaculo(y, x)) puestos++;
        }
    }

    /**
     * Comprueba las posiciones libres del tablero para que los personjaes puedan aparecer
     * Al mismo tiempor comprueba si hay obstaculos para no genrear personais ahi
     * @return un array con la posicion libre encontrada, formato [y, x]
     */
    public int[] posicionLibreAleatoria() {
        while (true) {
            int y = 1 + (int) (Math.random() * (ALTO - 2));
            int x = 1 + (int) (Math.random() * (ANCHO - 2));

            if (!esObstaculo(y, x)) {
                return new int[]{y, x};
            }
        }
    }

    /**
     * Funcion para pintar el tablero con los obstaculos y los personajes, se llama en cada turno para actualizar el tablero
     * @param personajes
     */
    public void pintarConPersonajes(List<? extends Personaje> personajes) {

        //Cosa de Victor: no se imprimer el tablero directamente, se usa un StringBuilder para construir el tablero como 
        // un string y luego imprimirlo de una sola vez, para evitar parpadeos en la consola
        StringBuilder buffer = new StringBuilder();

        for (int y = 0; y < ALTO; y++) {
            for (int x = 0; x < ANCHO; x++) {

                Personaje p = null; //recuerda p es un personaje
                for (Personaje c : personajes) { //c es otro personaje, se recorre la lista de personajes para ver si alguno esta en la posicion actual del tablero
                    if (!c.isEstaVivo()) continue;
                    if (c.getPosicionActual().getY() == y && c.getPosicionActual().getX() == x) {//si hay un personaje en la posicion actual del tablero, se guarda en p
                        p = c;
                        break;
                    }
                }

                //si p es null, entonces no hay ningun personaje en la posicion actual del tablero, se imprime un espacio
                if (p != null) {
                    buffer.append(p.getSimbolo());
                    continue;
                }

                if (y == 0 && x == 0) buffer.append("┌");
                else if (y == 0 && x == ANCHO - 1) buffer.append("┐");
                else if (y == ALTO - 1 && x == 0) buffer.append("└");
                else if (y == ALTO - 1 && x == ANCHO - 1) buffer.append("┘");
                else if (y == 0 || y == ALTO - 1) buffer.append("─");
                else if (x == 0 || x == ANCHO - 1) buffer.append("│");
                else if (esObstaculo(y, x)) buffer.append("■");
                else buffer.append(" ");
            }
            buffer.append("\n");
        }

        System.out.print(buffer.toString());
    }
}
