/* ============================================================
   GENSHIN BATTLE SIM — Lógica del juego
   ============================================================ */

/* ───── Constantes ───── */
const BOARD_ROWS     = 40;
const BOARD_COLS     = 60;
const RADIO_PELIGRO  = 5;
const UMBRAL_PATRULLA = 5;

// Cantidades configurables; se sobreescriben desde los inputs antes de cada partida
let NUM_MALOS  = 40;
let NUM_BUENOS = 40;

const DIR_Y = [-1, 1, 0, 0, -1, -1,  1,  1];
const DIR_X = [ 0, 0,-1, 1, -1,  1, -1,  1];

/* ============================================================
   ENUMS — Vision y Arma
   ============================================================ */
const Vision = {
  PYRO:'PYRO', HYDRO:'HYDRO', ELECTRO:'ELECTRO',
  DENDRO:'DENDRO', ANEMO:'ANEMO', GEO:'GEO', CRYO:'CRYO',
  values: ['PYRO','HYDRO','ELECTRO','DENDRO','ANEMO','GEO','CRYO'],
  random(){ return this.values[Math.floor(Math.random()*7)]; },
  // Cadena elemental: PYRO→CRYO→GEO→ANEMO→DENDRO→ELECTRO→HYDRO→PYRO
  ganaA(a, b){
    const m = { PYRO:'CRYO', HYDRO:'PYRO', ELECTRO:'HYDRO', DENDRO:'ELECTRO', ANEMO:'DENDRO', GEO:'ANEMO', CRYO:'GEO' };
    return m[a] === b;
  },
  color(v){
    const m = {
      PYRO:'#ff6b35', HYDRO:'#4fc3f7', ELECTRO:'#ce93d8',
      DENDRO:'#a5d6a7', ANEMO:'#e0f7fa', GEO:'#ffcc02', CRYO:'#b2ebf2'
    };
    return m[v] || '#ffffff';
  }
};

const Arma = {
  values: ['ESPADA','MANDOBLE','LANZA','ARCO','CATALIZADOR'],
  random(){ return this.values[Math.floor(Math.random()*5)]; },
  // Cadena de armas: ESPADA→CATALIZADOR→ARCO→LANZA→MANDOBLE→ESPADA
  ganaA(a, b){
    const m = { ESPADA:'CATALIZADOR', MANDOBLE:'ESPADA', LANZA:'MANDOBLE', ARCO:'LANZA', CATALIZADOR:'ARCO' };
    return m[a] === b;
  }
};

/* ============================================================
   SVG DATA URIs — imágenes temporales (borrar.svg, raiz.svg, xraiz.svg)
   ============================================================ */
const SVG_OBSTACULO = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8dGV4dCB4PSI1MCIgeT0iNjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNTAiIGZvbnQtd2VpZ2h0PSJub3JtYWwiPuKMqzwvdGV4dD4KPC9zdmc+';
const SVG_MALO      = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8dGV4dCB4PSI1MCIgeT0iNjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDAiIGZvbnQtd2VpZ2h0PSJub3JtYWwiPgogICAgPHRzcGFuIGZvbnQtc2l6ZT0iNDUiIGR5PSIwIj7iiJo8L3RzcGFuPjx0c3BhbiBkeD0iOCI+eDwvdHNwYW4+CiAgPC90ZXh0Pgo8L3N2Zz4=';
const SVG_BUENO     = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8dGV4dCB4PSI1MCIgeT0iNjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IndoaXRlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDAiIGZvbnQtd2VpZ2h0PSJub3JtYWwiPgogICAgeDx0c3BhbiBmb250LXNpemU9IjMwIiBkeT0iLTEwIj4yPC90c3Bhbj4KICA8L3RleHQ+Cjwvc3ZnPg==';

/* ============================================================
   IMÁGENES POR ELEMENTO — COMENTADO para activar cuando tengas
   los assets definitivos. Cuando los tengas listos:
   1. Descomenta este bloque y añade las rutas reales.
   2. Descomenta también "const imgCache = {};" más abajo.
   3. En Renderer.draw(), busca "SECCIÓN COMENTADA" y sigue las instrucciones.

const IMG_MALOS = {
  PYRO:    'assets/malo_pyro.png',
  HYDRO:   'assets/malo_hydro.png',
  ELECTRO: 'assets/malo_electro.png',
  DENDRO:  'assets/malo_dendro.png',
  ANEMO:   'assets/malo_anemo.png',
  GEO:     'assets/malo_geo.png',
  CRYO:    'assets/malo_cryo.png',
};
const IMG_BUENOS = {
  PYRO:    'assets/bueno_pyro.png',
  HYDRO:   'assets/bueno_hydro.png',
  ELECTRO: 'assets/bueno_electro.png',
  DENDRO:  'assets/bueno_dendro.png',
  ANEMO:   'assets/bueno_anemo.png',
  GEO:     'assets/bueno_geo.png',
  CRYO:    'assets/bueno_cryo.png',
};
const imgCache = {};
============================================================ */

/* Pre-cargar imágenes temporales actuales */
const imgObstaculo = new Image(); imgObstaculo.src = SVG_OBSTACULO;
const imgMalo      = new Image(); imgMalo.src      = SVG_MALO;
const imgBueno     = new Image(); imgBueno.src     = SVG_BUENO;

/* ============================================================
   CLASE Posicion
   ============================================================ */
class Posicion {
  constructor(y, x){ this.y = y; this.x = x; }
  desplazar(dy, dx){ return new Posicion(this.y+dy, this.x+dx); }
  distanciaManhattan(otra){ return Math.abs(this.y-otra.y)+Math.abs(this.x-otra.x); }
  mismaPosicion(otra){ return this.y===otra.y && this.x===otra.x; }
}

/* ============================================================
   CLASE Personaje — base abstracta para malos y buenos
   ============================================================ */
class Personaje {
  constructor(posicion, tipo){
    this.pos  = posicion;
    this.tipo = tipo;        // 'malo' | 'bueno'
    this.vision = Vision.random();
    this.arma   = Arma.random();
    this.vivo   = true;
    // Dirección inicial de patrulla aleatoria
    const i = Math.floor(Math.random()*8);
    this.dy = DIR_Y[i];
    this.dx = DIR_X[i];
  }

  die(){ this.vivo = false; }

  intentarMovimiento(newPos, board, ocupados = null){
    if(board.estaBloqueado(newPos.y, newPos.x)) return false;
    if(ocupados){
      for(const c of ocupados){
        if(!c.vivo || c===this) continue;
        if(c.pos.mismaPosicion(newPos)) return false;
      }
    }
    this.pos = newPos;
    return true;
  }

  // Paso hacia un objetivo (minimiza distancia Manhattan)
  mejorPasoHacia(board, objetivo){
    let mejor=null, mejorDist=Infinity;
    for(let i=0;i<8;i++){
      const cand = this.pos.desplazar(DIR_Y[i],DIR_X[i]);
      if(board.estaBloqueado(cand.y,cand.x)) continue;
      const d = cand.distanciaManhattan(objetivo);
      if(d < mejorDist){ mejorDist=d; mejor=cand; }
    }
    return mejor;
  }

  // Paso que maximiza o minimiza distancia a un objetivo (para huir o perseguir)
  calcularMejorMovimiento(board, objetivo, maximizar, ocupados){
    let mejor=null;
    let mejorDist = maximizar ? -Infinity : Infinity;
    for(let i=0;i<8;i++){
      const cand = this.pos.desplazar(DIR_Y[i],DIR_X[i]);
      if(board.estaBloqueado(cand.y,cand.x)) continue;
      let ocup=false;
      for(const c of ocupados){
        if(!c.vivo||c===this) continue;
        if(c.pos.mismaPosicion(cand)){ ocup=true; break; }
      }
      if(ocup) continue;
      const d = cand.distanciaManhattan(objetivo);
      if(maximizar ? d>mejorDist : d<mejorDist){ mejorDist=d; mejor=cand; }
    }
    return mejor;
  }

  // Movimiento de patrulla: sigue la dirección actual o busca una libre al chocar
  moverse_patrulla(board, ocupados){
    const next = this.pos.desplazar(this.dy, this.dx);
    if(!this.intentarMovimiento(next, board, ocupados)){
      const start = Math.floor(Math.random()*8);
      for(let k=0;k<8;k++){
        const i=(start+k)%8;
        const cand = this.pos.desplazar(DIR_Y[i],DIR_X[i]);
        if(this.intentarMovimiento(cand, board, ocupados)){
          this.dy=DIR_Y[i]; this.dx=DIR_X[i]; break;
        }
      }
    }
  }
}

/* ============================================================
   PersonajeMalo — persigue y ataca a los buenos
   ============================================================ */
class PersonajeMalo extends Personaje {
  constructor(pos){ super(pos,'malo'); this.target=null; }

  // Fija el bueno más cercano como objetivo; en caza final va a por cualquiera
  intentarFijarTarget(buenos){
    if(this.target && this.target.vivo) return;
    this.target=null;
    let mejor=Infinity;
    const cazaFinal = buenos.length < 3;
    for(const g of buenos){
      if(!g.vivo) continue;
      const d = this.pos.distanciaManhattan(g.pos);
      if(cazaFinal || d<=6){
        if(d<mejor){ mejor=d; this.target=g; }
      }
    }
  }

  resolverCombate(board, casilla, defensor, muertos, log){
    const gana = Combate.ganaAtacante(this, defensor);
    if(gana){
      defensor.die(); muertos.push(defensor);
      this.intentarMovimiento(casilla, board);
      log.push({ tipo:'malo_gana', visM:this.vision, visB:defensor.vision });
    } else {
      this.die(); muertos.push(this);
      log.push({ tipo:'bueno_gana', visM:this.vision, visB:defensor.vision });
    }
  }

  decidirMovi(board, buenos, ocupados, muertos, log){
    if(!this.vivo) return;
    this.intentarFijarTarget(buenos);

    // Paso 1: comprueba si el target está adyacente → combate directo
    if(this.target && this.target.vivo){
      for(let i=0;i<8;i++){
        const cand = this.pos.desplazar(DIR_Y[i],DIR_X[i]);
        if(cand.mismaPosicion(this.target.pos)){
          this.resolverCombate(board, cand, this.target, muertos, log);
          return;
        }
      }
    }

    // Paso 2: persecución (2 pasos por turno cuando tiene target)
    if(this.target && this.target.vivo){
      for(let paso=0;paso<2;paso++){
        const cand = this.mejorPasoHacia(board, this.target.pos);
        if(!cand) break;
        if(cand.mismaPosicion(this.target.pos)){
          this.resolverCombate(board, cand, this.target, muertos, log);
          break;
        }
        if(!this.intentarMovimiento(cand, board, ocupados)) break;
      }
      return;
    }

    // Paso 3: sin target → patrulla
    this.moverse_patrulla(board, ocupados);
  }
}

/* ============================================================
   PersonajeBueno — huye de los malos, patrulla cuando quedan pocos
   ============================================================ */
class PersonajeBueno extends Personaje {
  constructor(pos){ super(pos,'bueno'); }

  decidirMovi(board, malos, ocupados){
    if(!this.vivo) return;

    // Busca el malo más cercano
    let masCercano=null, dist=Infinity;
    for(const m of malos){
      if(!m.vivo) continue;
      const d=this.pos.distanciaManhattan(m.pos);
      if(d<dist){ dist=d; masCercano=m; }
    }

    // Si entra en radio de peligro, huye
    if(masCercano && dist<=RADIO_PELIGRO){
      for(let paso=0;paso<1;paso++){
        const mejorPos = this.calcularMejorMovimiento(board, masCercano.pos, true, ocupados);
        if(!mejorPos) break;
        if(!this.intentarMovimiento(mejorPos, board, ocupados)) break;
      }
      return;
    }

    // Si quedan muy pocos malos, el bueno se anima y patrulla
    if(malos.length <= UMBRAL_PATRULLA){
      this.moverse_patrulla(board, ocupados);
    }
  }
}

/* ============================================================
   Combate — resuelve el enfrentamiento entre dos personajes
   Ventaja de visión o arma: 60/40 a favor del atacante o defensor.
   Sin ventaja: 50/50.
   ============================================================ */
class Combate {
  static ganaAtacante(atacante, defensor){
    const vA=atacante.vision, vD=defensor.vision;
    const aA=atacante.arma,   aD=defensor.arma;
    const tirada = Math.floor(Math.random()*10)+1;
    if(Vision.ganaA(vA,vD)) return tirada<=6;
    if(Vision.ganaA(vD,vA)) return tirada<=4;
    if(Arma.ganaA(aA,aD))   return tirada<=6;
    if(Arma.ganaA(aD,aA))   return tirada<=4;
    return tirada<=5;
  }
}

/* ============================================================
   TableroDeJuego — gestiona la cuadrícula y los obstáculos
   ============================================================ */
class TableroDeJuego {
  constructor(rows, cols){
    this.rows=rows; this.cols=cols;
    this.grid = Array.from({length:rows}, ()=>new Uint8Array(cols));
  }
  dentroDelArray(y,x){ return y>=0&&y<this.rows&&x>=0&&x<this.cols; }
  dentroInterior(y,x){ return y>0&&y<this.rows-1&&x>0&&x<this.cols-1; }
  esBorde(y,x){ return y===0||y===this.rows-1||x===0||x===this.cols-1; }
  esObstaculo(y,x){ if(!this.dentroDelArray(y,x))return false; return this.grid[y][x]===1; }
  estaBloqueado(y,x){ if(!this.dentroDelArray(y,x))return true; if(this.esBorde(y,x))return true; return this.esObstaculo(y,x); }
  ponerObstaculo(y,x){ if(!this.dentroInterior(y,x))return false; if(this.grid[y][x]===1)return false; this.grid[y][x]=1; return true; }

  generarObstaculosAleatorios(n){
    let puestos=0, intentos=0;
    while(puestos<n && intentos<n*50){
      intentos++;
      const y=1+Math.floor(Math.random()*(this.rows-2));
      const x=1+Math.floor(Math.random()*(this.cols-2));
      if(this.ponerObstaculo(y,x)) puestos++;
    }
  }

  posicionLibreAleatoria(){
    while(true){
      const y=1+Math.floor(Math.random()*(this.rows-2));
      const x=1+Math.floor(Math.random()*(this.cols-2));
      if(!this.esObstaculo(y,x)) return new Posicion(y,x);
    }
  }
}

/* ============================================================
   Renderer — dibuja el tablero y los personajes sobre el canvas
   ============================================================ */
class Renderer {
  constructor(canvas, board){
    this.canvas=canvas; this.board=board;
    this.ctx=canvas.getContext('2d');
    this.resize();
  }

  resize(){
    const container = this.canvas.parentElement;
    const maxW = container.clientWidth - 16;
    this.cell = Math.max(4, Math.floor(maxW / this.board.cols));
    this.canvas.width  = this.board.cols * this.cell;
    this.canvas.height = this.board.rows * this.cell;
  }

  draw(personajes, flash=[]){
    const { ctx, cell, board } = this;

    // Fondo oscuro del tablero
    ctx.fillStyle = '#070d15';
    ctx.fillRect(0,0,this.canvas.width,this.canvas.height);

    // Bordes y obstáculos
    for(let y=0;y<board.rows;y++){
      for(let x=0;x<board.cols;x++){
        const px=x*cell, py=y*cell;
        if(board.esBorde(y,x)){
          ctx.fillStyle = 'rgba(200,169,110,0.35)';
          ctx.fillRect(px,py,cell,cell);
        } else if(board.esObstaculo(y,x)){
          if(imgObstaculo.complete && cell>=6){
            ctx.drawImage(imgObstaculo, px, py, cell, cell);
          } else {
            ctx.fillStyle = 'rgba(80,100,140,0.6)';
            ctx.fillRect(px+1,py+1,cell-2,cell-2);
          }
        }
      }
    }

    // Flash de combate (posiciones donde ocurrió un combate este turno)
    for(const f of flash){
      ctx.fillStyle = f.tipo==='malo_gana'
        ? 'rgba(255,80,80,0.6)'
        : 'rgba(100,255,160,0.6)';
      ctx.fillRect(f.x*cell, f.y*cell, cell, cell);
    }

    // Personajes
    for(const p of personajes){
      if(!p.vivo) continue;
      const px=p.pos.x*cell, py=p.pos.y*cell;
      const col = Vision.color(p.vision);

      if(cell >= 8){
        // Halo circular del color del elemento
        ctx.save();
        ctx.globalAlpha=0.35;
        ctx.fillStyle=col;
        ctx.beginPath();
        ctx.arc(px+cell/2, py+cell/2, cell*0.48, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();

        // Imagen del personaje
        const img = p.tipo==='malo' ? imgMalo : imgBueno;

        /* -------------------------------------------------------
           SECCIÓN COMENTADA: imágenes individuales por elemento
           Cuando tengas los assets definitivos:
           1. Descomenta IMG_MALOS, IMG_BUENOS e imgCache arriba.
           2. Comenta o borra las 2 líneas de "const img = ..." de arriba.
           3. Descomenta el bloque de abajo.

        const imgMap = p.tipo==='malo' ? IMG_MALOS : IMG_BUENOS;
        const cacheKey = p.tipo + '_' + p.vision;
        if(!imgCache[cacheKey]){
          imgCache[cacheKey] = new Image();
          imgCache[cacheKey].src = imgMap[p.vision];
        }
        const img = imgCache[cacheKey];
        ------------------------------------------------------- */

        if(img.complete){
          ctx.save();
          ctx.drawImage(img, px, py, cell, cell);
          // Tinte del color del elemento sobre la imagen
          ctx.globalAlpha=0.3;
          ctx.fillStyle=col;
          ctx.fillRect(px,py,cell,cell);
          ctx.restore();
        } else {
          ctx.fillStyle=col;
          ctx.fillRect(px+1,py+1,cell-2,cell-2);
        }

      } else {
        // Pixel sólido para celdas muy pequeñas
        ctx.fillStyle=col;
        ctx.fillRect(px,py,cell,cell);
      }
    }
  }
}

/* ============================================================
   ESTADO GLOBAL Y BUCLE DE JUEGO
   ============================================================ */
let board, malos, buenos, todos, renderer;
let gameRunning=false, gamePaused=false, gameOver=false;
let turnCount=0;
let loopTimeout=null;
let initMalos=40, initBuenos=40;
const logBuffer=[];

// Referencias al DOM
const canvas      = document.getElementById('game-canvas');
const btnStart    = document.getElementById('btn-start');
const btnPause    = document.getElementById('btn-pause');
const btnReset    = document.getElementById('btn-reset');
const speedSlider = document.getElementById('speed-slider');
const speedLabel  = document.getElementById('speed-label');

// Convierte el valor del slider (1-10) en milisegundos de delay (300ms-30ms)
function getSpeed(){
  const v = parseInt(speedSlider.value);
  return Math.round(30 + (10-v)*(300-30)/9);
}

speedSlider.addEventListener('input', () => {
  speedLabel.textContent = speedSlider.value + 'x';
});

/* ───── Inicializar partida ───── */
function initGame(){
  // Leer cantidades configuradas por el usuario (con clamp de seguridad)
  NUM_MALOS  = Math.max(1, Math.min(200, parseInt(document.getElementById('input-malos').value)  || 40));
  NUM_BUENOS = Math.max(1, Math.min(200, parseInt(document.getElementById('input-buenos').value) || 40));
  const numObstaculos = Math.max(0, Math.min(500, parseInt(document.getElementById('input-obstaculos').value) || 77));

  // Actualizar inputs con valores validados
  document.getElementById('input-malos').value      = NUM_MALOS;
  document.getElementById('input-buenos').value     = NUM_BUENOS;
  document.getElementById('input-obstaculos').value = numObstaculos;

  // Crear tablero
  board = new TableroDeJuego(BOARD_ROWS, BOARD_COLS);
  board.generarObstaculosAleatorios(numObstaculos);

  malos=[]; buenos=[]; todos=[];

  // Genera una posición libre que no esté ocupada por otro personaje
  const posLibreSinPisarse = () => {
    while(true){
      const p = board.posicionLibreAleatoria();
      if(!todos.find(t => t.pos.mismaPosicion(p))) return p;
    }
  };

  for(let i=0;i<NUM_MALOS;i++){
    const m = new PersonajeMalo(posLibreSinPisarse());
    malos.push(m); todos.push(m);
  }
  for(let i=0;i<NUM_BUENOS;i++){
    const b = new PersonajeBueno(posLibreSinPisarse());
    buenos.push(b); todos.push(b);
  }

  initMalos  = malos.length;
  initBuenos = buenos.length;
  turnCount  = 0;
  logBuffer.length = 0;

  renderer = new Renderer(canvas, board);
  renderer.draw(todos);
  updateUI([]);
  hideResult();
}

/* ───── Tick del juego ───── */
function gameTick(){
  if(!gameRunning || gamePaused || gameOver) return;
  turnCount++;

  const muertos  = [];
  const turnLog  = [];

  // Los malos se mueven y atacan
  for(const m of malos){
    if(m.vivo) m.decidirMovi(board, buenos, todos, muertos, turnLog);
  }
  // Los buenos se mueven y huyen
  for(const b of buenos){
    if(b.vivo) b.decidirMovi(board, malos, todos);
  }

  // Eliminar muertos de todas las listas
  for(const c of muertos){
    todos.splice(todos.indexOf(c), 1);
    if(c.tipo==='bueno') buenos.splice(buenos.indexOf(c), 1);
    if(c.tipo==='malo')  malos.splice(malos.indexOf(c),  1);
  }

  renderer.draw(todos, []);
  updateUI(turnLog);

  // Comprobar condición de victoria
  if(buenos.length === 0){
    showResult('Los Malvados Triunfan', 'La oscuridad consume Teyvat', 'malos-ganan');
    gameOver = true; return;
  }
  if(malos.length === 0){
    showResult('Los Héroes Prevalecen', 'La luz restaura la armonía', 'buenos-ganan');
    gameOver = true; return;
  }

  loopTimeout = setTimeout(gameTick, getSpeed());
}

/* ───── Actualizar paneles laterales ───── */
function updateUI(turnLog){
  const mVivos = malos.filter(m=>m.vivo).length;
  const bVivos = buenos.filter(b=>b.vivo).length;

  document.getElementById('malos-count').textContent = mVivos;
  document.getElementById('buenos-count').textContent = bVivos;
  document.getElementById('pb-malo').style.width  = (mVivos/initMalos*100)+'%';
  document.getElementById('pb-bueno').style.width = (bVivos/initBuenos*100)+'%';
  document.getElementById('turn-num').textContent = turnCount;

  // Conteo por visión para cada facción
  const vKeys = ['PYRO','HYDRO','ELECTRO','DENDRO','ANEMO','GEO','CRYO'];
  const vLow  = ['pyro','hydro','electro','dendro','anemo','geo','cryo'];
  const mCount={}, bCount={};
  for(const v of vKeys){ mCount[v]=0; bCount[v]=0; }
  for(const m of malos)  if(m.vivo) mCount[m.vision]++;
  for(const b of buenos) if(b.vivo) bCount[b.vision]++;
  for(let i=0;i<vKeys.length;i++){
    document.getElementById('m-'+vLow[i]).textContent = mCount[vKeys[i]] || '-';
    document.getElementById('b-'+vLow[i]).textContent = bCount[vKeys[i]] || '-';
  }

  // Log de combates
  if(turnLog.length > 0){
    for(const l of turnLog){
      logBuffer.unshift({ t:turnCount, ...l });
      if(logBuffer.length > 60) logBuffer.pop();
    }
    const logEl  = document.getElementById('combat-log');
    const frag   = document.createDocumentFragment();
    for(const l of turnLog){
      const div = document.createElement('div');
      div.className = 'log-entry ' + (l.tipo==='malo_gana' ? 'log-malo-gana' : 'log-bueno-gana');
      const arrow = l.tipo==='malo_gana' ? '▼' : '▲';
      div.innerHTML = `<span class="lo-t">T${turnCount}</span> ${arrow} ${l.visM} vs ${l.visB}`;
      frag.appendChild(div);
    }
    logEl.insertBefore(frag, logEl.firstChild);
  }
}

/* ───── Banner de resultado ───── */
function showResult(title, sub, cls){
  const banner  = document.getElementById('result-banner');
  const titleEl = document.getElementById('result-title');
  const subEl   = document.getElementById('result-sub');
  titleEl.textContent = title;
  titleEl.className   = 'result-title ' + cls;
  subEl.textContent   = sub;
  banner.classList.add('show');
}
function hideResult(){
  document.getElementById('result-banner').classList.remove('show');
}

/* ───── Bloquear / desbloquear inputs de configuración ───── */
function setInputsDisabled(disabled){
  document.getElementById('input-malos').disabled      = disabled;
  document.getElementById('input-buenos').disabled     = disabled;
  document.getElementById('input-obstaculos').disabled = disabled;
}

/* ============================================================
   LISTENERS DE BOTONES
   ============================================================ */
btnStart.addEventListener('click', () => {
  initGame();
  gameRunning=true; gamePaused=false; gameOver=false;
  btnStart.disabled=true;
  btnPause.disabled=false;
  btnReset.disabled=false;
  btnPause.textContent='Pausar';
  setInputsDisabled(true);
  gameTick();
});

btnPause.addEventListener('click', () => {
  if(!gameRunning || gameOver) return;
  gamePaused = !gamePaused;
  btnPause.textContent = gamePaused ? 'Reanudar' : 'Pausar';
  if(!gamePaused) gameTick();
});

btnReset.addEventListener('click', () => {
  clearTimeout(loopTimeout);
  gameRunning=false; gamePaused=false; gameOver=false;
  btnStart.disabled=false;
  btnPause.disabled=true;
  btnReset.disabled=true;
  btnPause.textContent='Pausar';
  setInputsDisabled(false);
  initGame();
});

/* ───── Init visual al cargar la página ───── */
window.addEventListener('load', () => {
  board = new TableroDeJuego(BOARD_ROWS, BOARD_COLS);
  board.generarObstaculosAleatorios(77);
  renderer = new Renderer(canvas, board);
  renderer.draw([]);
});

window.addEventListener('resize', () => {
  if(renderer){ renderer.resize(); renderer.draw(todos||[]); }
});
