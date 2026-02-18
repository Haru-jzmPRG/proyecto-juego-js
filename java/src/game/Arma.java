package game;

public enum Arma {
    ESPADA, MANDOBLE, LANZA, ARCO, CATALIZADOR;

    public boolean ganaA(Arma otra) {
        return switch (this) {
            case ESPADA -> otra == CATALIZADOR;
            case MANDOBLE -> otra == ESPADA;
            case LANZA -> otra == MANDOBLE;
            case ARCO -> otra == LANZA;
            case CATALIZADOR -> otra == ARCO;
        };
    }

    public static Arma random() {
        Arma[] arma = values();
        return arma[(int) (Math.random() * arma.length)];
    }
}
