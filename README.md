# ⚔️ Genshin Battle Sim

> Proyecto de clase — Programación Orientada a Objetos y Arrays Bidimensionales  
> Traslado de simulación de batalla en Java (terminal) a JavaScript con interfaz web.

---

## 📖 Introducción

Este proyecto nació como una simulación de batalla por turnos desarrollada en **Java para la terminal**, como ejercicio de POO y arrays bidimensionales. La lógica se estructuró en clases independientes (`Personaje`, `PersonajeMalo`, `PersonajeBueno`, `TableroDeJuego`, `Combate`, `Vision`, `Arma`, `Posicion`) que se comunicaban entre sí siguiendo los principios de herencia, encapsulamiento y polimorfismo.

Para la landing page del proyecto, el código Java fue trasladado íntegramente a **JavaScript**, manteniendo la misma arquitectura de clases y lógica de juego, y añadiendo una interfaz visual con **HTML5 Canvas**, **CSS** y una estética inspirada en *Genshin Impact*. El tablero que antes se pintaba carácter a carácter en consola ahora se renderiza frame a frame sobre un canvas adaptativo.

---

## 🎮 Mecánicas del juego

### El tablero
- Cuadrícula de **40 filas × 60 columnas**.
- Rodeado de un borde infranqueable.
- Se generan obstáculos en posiciones aleatorias del interior.
- El tamaño visual de las celdas es **adaptativo a la pantalla**.

### Los personajes
Hay dos facciones: **malos** (Facción Oscura) y **buenos** (Facción de la Luz). Cada personaje recibe al crearse:
- Una **Visión elemental** aleatoria: `Pyro`, `Hydro`, `Electro`, `Dendro`, `Anemo`, `Geo` o `Cryo`.
- Un **Arma** aleatoria: `Espada`, `Mandoble`, `Lanza`, `Arco` o `Catalizador`.

### Comportamiento de los malos
1. **Patrulla**: se mueven en línea recta rebotando al chocar con obstáculos o bordes.
2. **Detección**: si un bueno entra en un radio de 6 casillas, el malo lo fija como objetivo.
3. **Persecución**: cuando tiene objetivo, se mueve **2 pasos por turno** hacia él (doble velocidad).
4. **Caza final**: cuando quedan menos de 3 buenos, todos los malos van a por el más cercano sin importar la distancia.
5. **Combate**: si el objetivo está adyacente, resuelve el combate.

### Comportamiento de los buenos
1. **Huida**: si un malo entra en su radio de peligro (5 casillas), el bueno huye en la dirección más alejada posible.
2. **Patrulla**: cuando quedan muy pocos malos (≤5), el bueno se anima y empieza a moverse.

### Sistema de combate
Cuando un malo intenta moverse a la casilla de un bueno, se resuelve un combate:

| Situación | Probabilidad de ganar el atacante |
|---|---|
| Ventaja de Visión elemental | 60% |
| Desventaja de Visión elemental | 40% |
| Ventaja de Arma (sin ventaja elemental) | 60% |
| Desventaja de Arma (sin ventaja elemental) | 40% |
| Sin ventaja de ningún tipo | 50% |

### Cadena elemental (quién gana a quién)
```
Pyro → Cryo → Geo → Anemo → Dendro → Electro → Hydro → Pyro
```

### Cadena de armas
```
Espada → Catalizador → Arco → Lanza → Mandoble → Espada
```

---

## ⚙️ Controles

| Control | Función |
|---|---|
| **Iniciar Batalla** | Genera el tablero y lanza la simulación |
| **Pausar / Reanudar** | Congela o reanuda el bucle de juego |
| **Reiniciar** | Para la partida y vuelve al estado inicial |
| **⚔ Malos** | Cantidad de personajes malos (1–200) |
| **✦ Buenos** | Cantidad de personajes buenos (1–200) |
| **■ Obstác.** | Cantidad de obstáculos generados (0–500) |
| **Velocidad** | Slider 1×–10× que ajusta el delay entre turnos |

---

## 🖼️ Assets — Imágenes del juego

> Las imágenes deben colocarse en la carpeta `juego/assets/` con exactamente estos nombres.  
> Una vez añadidas, descomenta el bloque `IMG_MALOS` / `IMG_BUENOS` en `juego/game.js`.

### Facción Oscura — Malos

| Elemento | Archivo esperado | Vista previa |
|---|---|---|
| Pyro | `assets/malo_pyro.svg` | *(pendiente)* |
| Hydro | `assets/malo_hydro.svg` | *(pendiente)* |
| Electro | `assets/malo_electro.svg` | *(pendiente)* |
| Dendro | `assets/malo_dendro.svg` | *(pendiente)* |
| Anemo | `assets/malo_anemo.svg` | *(pendiente)* |
| Geo | `assets/malo_geo.svg` | *(pendiente)* |
| Cryo | `assets/malo_cryo.svg` | *(pendiente)* |

### Facción de la Luz — Buenos

| Elemento | Archivo esperado | Vista previa |
|---|---|---|
| Pyro | `assets/PYRO.png` | ![PYRO](docs/assets/PYRO.png) |
| Hydro | `assets/HYDRO.png` | ![HYDRO](docs/assets/HYDRO.png) |
| Electro | `assets/ELECTRO.png` | ![ELECTRO](docs/assets/ELECTRO.png) |
| Dendro | `assets/DENDRO.png` | ![DENDRO](docs/assets/DENDRO.png) |
| Anemo | `assets/ANEMO.png` | ![ANEMO](docs/assets/ANEMO.png) |
| Geo | `assets/GEO.png` | ![GEO](docs/assets/GEO.png) |
| Cryo | `assets/CRYO.png` | ![CRYO](docs/assets/CRYO.png) |

### Obstáculos

| Elemento | Archivo esperado | Vista previa |
|---|---|---|
| Obstáculo | `assets/obstaculo.svg` | *(pendiente)* |

---

## 📁 Estructura del repositorio

```
/                          ← raíz del repositorio (GitHub Pages sirve desde aquí)
│
├── README.md
│
├── java/                  ← código fuente original en Java
│   └── src/
│       └── game/
│           ├── App.java
│           ├── Arma.java
│           ├── Colores.java
│           ├── Combate.java
│           ├── Consola.java
│           ├── Personaje.java
│           ├── PersonajeBueno.java
│           ├── PersonajeMalo.java
│           ├── Posicion.java
│           ├── TableroDeJuego.java
│           └── Vision.java
│
└── docs/                 ← versión web (la que sirve GitHub Pages)
    ├── index.html          ← punto de entrada
    ├── style.css
    ├── game.js
    └── assets/             ← imágenes SVG de personajes y obstáculos
        ├── malo_pyro.svg
        ├── malo_hydro.svg
        ├── malo_electro.svg
        ├── malo_dendro.svg
        ├── malo_anemo.svg
        ├── malo_geo.svg
        ├── malo_cryo.svg
        ├── bueno_pyro.svg
        ├── bueno_hydro.svg
        ├── bueno_electro.svg
        ├── bueno_dendro.svg
        ├── bueno_anemo.svg
        ├── bueno_geo.svg
        ├── bueno_cryo.svg
        └── obstaculo.svg
```

> **Nota GitHub Pages**: en Settings → Pages selecciona la rama `main` y como carpeta `/juego` (no la raíz), para que sirva directamente el `index.html` de la web sin exponer el código Java.

---

## 🛠️ Tecnologías

- **Java** — lógica original (POO, arrays 2D, enums, herencia)
- **JavaScript ES6+** — traslado de la lógica (clases, herencia, canvas API)
- **HTML5 Canvas** — renderizado del tablero frame a frame
- **CSS3** — interfaz visual con estética Genshin Impact
- **GitHub Pages** — despliegue estático gratuito