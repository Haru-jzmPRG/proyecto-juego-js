package game;

public class Consola {
    //Limpia la pantalla
    public static void clearScreen() {
        System.out.print("\033[H");
        System.out.flush();
    }
}
