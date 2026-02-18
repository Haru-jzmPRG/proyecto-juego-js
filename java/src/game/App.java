package game;

import java.util.ArrayList;

public class App {

    public static void main(String[] args) throws InterruptedException {

        //Creación del tablero con decicion de altura y anchura, proporción de alto 1 y ancho 3
        TableroDeJuego tablero = new TableroDeJuego(40, 120);
        //Generación de obstaculos aleatorios en el tablero eligiendo la cantidad
        tablero.generarObstaculosAleatorios(77);

        //Creación de los personajes malos y buenos 
        ArrayList<PersonajeMalo> listaPersonajesMalos = new ArrayList<>();
        ArrayList<PersonajeBueno> listaPersonajesBuenos = new ArrayList<>();
        ArrayList<Personaje> listaTodosLosPersonajes = new ArrayList<>();

        //Generar personajes malos en el tablero con cantidad dada, busca las posciciones libreas y los añade a los
        //listados de malos y de todos los personajes
        for (int i = 0; i < 40; i++) {
            Posicion pos = posicionLibreSinPisarse(tablero, listaTodosLosPersonajes);
            PersonajeMalo m = new PersonajeMalo(pos);
            listaPersonajesMalos.add(m);
            listaTodosLosPersonajes.add(m);
        }

        //Generar personajes buenos en el tablero con cantidad dada, busca las posciciones libreas y los añade a los
        //listados de buenos y de todos los personajes
        for (int i = 0; i < 40; i++) {
            Posicion pos = posicionLibreSinPisarse(tablero, listaTodosLosPersonajes);
            PersonajeBueno b = new PersonajeBueno(pos);
            listaPersonajesBuenos.add(b);
            listaTodosLosPersonajes.add(b);
        }

        //Bucle del juego
        //Se repite hasta que quede solo un tipo de personaje en el tablero
        //Limpia la pantalla, pinta el tablero con los personajes, cada personaje decide su movimiento, 
        // se eliminan los personajes muertos, se comprueba si hay un ganador y se repite el proceso
        while (true) {
            Consola.clearScreen();

            tablero.pintarConPersonajes(listaTodosLosPersonajes);

            ArrayList<Personaje> personajesEliminados = new ArrayList<>();

            for (PersonajeMalo m : listaPersonajesMalos) {
                if (m.isEstaVivo()) {
                    m.decidirMovi(tablero, listaPersonajesBuenos, listaTodosLosPersonajes, personajesEliminados);
                }
            }

            for (PersonajeBueno b : listaPersonajesBuenos) {
                if (b.isEstaVivo()) {
                    b.decidirMovi(tablero, listaPersonajesMalos, listaTodosLosPersonajes);
                }
            }

            for (Personaje c : personajesEliminados) {
                listaTodosLosPersonajes.remove(c);
                if (c instanceof PersonajeBueno) listaPersonajesBuenos.remove(c);
                if (c instanceof PersonajeMalo) listaPersonajesMalos.remove(c);
            }

            if (listaPersonajesBuenos.isEmpty()) {
                Consola.clearScreen();
                tablero.pintarConPersonajes(listaTodosLosPersonajes);
                System.out.println("Ganan los malos.");
                break;
            }
            if (listaPersonajesMalos.isEmpty()) {
                Consola.clearScreen();
                tablero.pintarConPersonajes(listaTodosLosPersonajes);
                System.out.println("Ganan los buenos.");
                break;
            }

            Thread.sleep(110);
        }
    }

    /**
     * Funcion para buscar una posicion libre en el tablero, evita que se repitan posiciones ya colocadas 
     * para los personajes, esto hace que no se pisen entre ellos al colocarlos por primera vez en el tablero
     * @param board
     * @param yaColocados
     * @return
     */
    private static Posicion posicionLibreSinPisarse(TableroDeJuego board, ArrayList<Personaje> yaColocados) {
        while (true) {
            int[] p = board.posicionLibreAleatoria();
            Posicion pos = new Posicion(p[0], p[1]);

            boolean ocupada = false;
            for (Personaje c : yaColocados) {
                if (c.getPosicionActual().mismaPosicion(pos)) {
                    ocupada = true;
                    break;
                }
            }
            if (!ocupada) return pos;
        }
    }

}
