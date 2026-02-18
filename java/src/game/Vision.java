package game;
//enum(Def W3 School): una "clase" especial, nos permite representar un grupo de constantes, normalmente finals.
public enum Vision {
    PYRO, HYDRO, ELECTRO, DENDRO, ANEMO, GEO, CRYO;
    //Condicional de criterio sobre que vision gana a la otra
    public boolean ganaA(Vision otra) {
        return switch (this) {
            case PYRO -> otra == CRYO;
            case HYDRO -> otra == PYRO;
            case ELECTRO -> otra == HYDRO;
            case DENDRO -> otra == ELECTRO;
            case ANEMO -> otra == DENDRO;
            case GEO -> otra == ANEMO;
            case CRYO -> otra == GEO;
        };
    }
    /**
     * Generar vision aleatoria para todos los personajes, esto hace que sea totalmente al azar cada resultado
     * @return una vision aleatoria por personaje
     */
    public static Vision random() {
        Vision[] v = values();
        return v[(int) (Math.random() * v.length)];
    }

    //Listado de colores para cada vision, enlazado desde la clase colores
    public String color() {
        return switch (this) {
            case PYRO -> Colores.PYRO;
            case HYDRO -> Colores.HYDRO;
            case CRYO -> Colores.CRYO;
            case ELECTRO -> Colores.ELECTRO;
            case DENDRO -> Colores.DENDRO;
            case ANEMO -> Colores.ANEMO;
            case GEO -> Colores.GEO;
        };
    }
}
