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
   IMÁGENES DE PERSONAJES Y OBSTÁCULOS
   Añade o cambia las rutas cuando tengas más assets.
   Si un elemento no tiene imagen, usa '' y se dibujará
   el fallback de formas geométricas automáticamente.
   ============================================================ */
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
  PYRO:    'assets/PYRO.png',
  HYDRO:   'assets/HYDRO.png',
  ELECTRO: 'assets/ELECTRO.png',
  DENDRO:  'assets/DENDRO.png',
  ANEMO:   'assets/ANEMO.png',
  GEO:     'assets/GEO.png',
  CRYO:    'assets/CRYO.png',
};
const imgCache = {};

/* Obstáculo — pon la ruta a tu imagen o deja '' para el dibujado procedural */
const imgObstaculo = new Image();
imgObstaculo.src = ''; // ej: 'assets/obstaculo.png'

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
   Renderer v5 — Entornos 2D fieles a Genshin Impact
   Referencia: tablero Inazuma (madera oscura, cristales Electro,
   barandilla japonesa, sakura rosa, aura violeta de borde)
   Claros: Mondstadt, Liyue, Sumeru, Fontaine
   Oscuros: Inazuma, Natlan, Snezhnaya
   ============================================================ */

let _frame = 0;

const RT = {

  mondstadt: {
    dark: false,
    extA: '#6aaa78', extB: '#4a8858',
    floorA: '#8a9e78', floorB: '#7a9068', floorC: '#9eaa80',
    engraveColor: 'rgba(120,180,100,0.22)',
    wallA: '#7a8870', wallB: '#5a6858', wallTop: '#aabb90', wallGlow: '#c8f070',
    obsA: '#58a898', obsB: '#3a7a78', obsGlow: '#90e0d0', obsFace: '#c0f0e8',
    extGlow: 'rgba(150,220,120,0.18)',
    partCol: '#e0f8b0', partGlow: 'rgba(180,240,120,0.45)', partType: 'spore',
    flashM: 'rgba(220,70,50,0.6)', flashB: 'rgba(80,200,120,0.6)',
    haloM: '#e05040', haloB: '#40c870',
  },

  liyue: {
    dark: false,
    extA: '#c8a050', extB: '#9a7030',
    floorA: '#c0a878', floorB: '#b09868', floorC: '#d0b888',
    engraveColor: 'rgba(200,140,40,0.22)',
    wallA: '#a02808', wallB: '#7a1800', wallTop: '#d84010', wallGlow: '#f8c030',
    obsA: '#c89020', obsB: '#9a6808', obsGlow: '#f8e060', obsFace: '#fff0a0',
    extGlow: 'rgba(240,160,30,0.2)',
    partCol: '#f8c840', partGlow: 'rgba(250,180,40,0.55)', partType: 'lantern',
    flashM: 'rgba(220,50,20,0.65)', flashB: 'rgba(248,190,40,0.65)',
    haloM: '#e03010', haloB: '#f8c020',
  },

  inazuma: {
    dark: true,
    extA: '#1e0a2e', extB: '#100418',
    floorA: '#3c2c1c', floorB: '#302214', floorC: '#403020',
    engraveColor: 'rgba(210,110,255,0.16)',
    wallA: '#521a08', wallB: '#3a0e04', wallTop: '#7a2e10', wallGlow: '#e82030',
    obsA: '#8030d0', obsB: '#5c18a8', obsGlow: '#d070ff', obsFace: '#eebbff',
    extGlow: 'rgba(180,60,255,0.15)',
    partCol: '#f0a0e8', partGlow: 'rgba(240,140,220,0.55)', partType: 'petal',
    flashM: 'rgba(160,30,220,0.65)', flashB: 'rgba(220,120,255,0.65)',
    haloM: '#a020c8', haloB: '#d860ff',
  },

  sumeru: {
    dark: false,
    extA: '#3a6820', extB: '#264810',
    floorA: '#4a7030', floorB: '#3c6028', floorC: '#5a8038',
    engraveColor: 'rgba(80,220,80,0.18)',
    wallA: '#2c4818', wallB: '#1c3010', wallTop: '#48703a', wallGlow: '#70f070',
    obsA: '#d0a830', obsB: '#a07818', obsGlow: '#f8e060', obsFace: '#fff090',
    extGlow: 'rgba(60,220,80,0.18)',
    partCol: '#70f080', partGlow: 'rgba(90,230,110,0.5)', partType: 'spore',
    flashM: 'rgba(180,140,10,0.6)', flashB: 'rgba(60,220,90,0.6)',
    haloM: '#c8a020', haloB: '#30d860',
  },

  fontaine: {
    dark: false,
    extA: '#4898c8', extB: '#2868a0',
    floorA: '#7aaac8', floorB: '#6898b8', floorC: '#90bcd8',
    engraveColor: 'rgba(160,230,255,0.2)',
    wallA: '#c8a030', wallB: '#987810', wallTop: '#e0c050', wallGlow: '#50e0ff',
    obsA: '#1898d8', obsB: '#0870b0', obsGlow: '#60e8ff', obsFace: '#b0f4ff',
    extGlow: 'rgba(30,160,240,0.2)',
    partCol: '#70e8ff', partGlow: 'rgba(80,230,255,0.55)', partType: 'bubble',
    flashM: 'rgba(10,80,200,0.6)', flashB: 'rgba(40,220,255,0.6)',
    haloM: '#0848c8', haloB: '#20d0ff',
  },

  natlan: {
    dark: true,
    extA: '#280c00', extB: '#180400',
    floorA: '#2e1000', floorB: '#200800', floorC: '#381408',
    engraveColor: 'rgba(255,90,10,0.2)',
    wallA: '#901010', wallB: '#680808', wallTop: '#c01810', wallGlow: '#ff4010',
    obsA: '#603010', obsB: '#401808', obsGlow: '#ff6010', obsFace: '#ff9840',
    extGlow: 'rgba(230,70,10,0.22)',
    partCol: '#ff9030', partGlow: 'rgba(255,130,40,0.65)', partType: 'ember',
    flashM: 'rgba(220,30,10,0.7)', flashB: 'rgba(255,120,30,0.7)',
    haloM: '#e01808', haloB: '#ff7010',
  },

  snezhnaya: {
    dark: true,
    extA: '#0c1830', extB: '#080e20',
    floorA: '#101c34', floorB: '#0c1428', floorC: '#162040',
    engraveColor: 'rgba(160,210,255,0.14)',
    wallA: '#1c3060', wallB: '#101e48', wallTop: '#2840708', wallGlow: '#90d0ff',
    obsA: '#1c3468', wallTop2: '#283870',
    obsA: '#1c3468', obsB: '#102040', obsGlow: '#90d0ff', obsFace: '#c8eeff',
    extGlow: 'rgba(80,140,240,0.16)',
    partCol: '#d0ecff', partGlow: 'rgba(200,230,255,0.5)', partType: 'snow',
    flashM: 'rgba(30,60,200,0.6)', flashB: 'rgba(120,200,255,0.6)',
    haloM: '#1838c0', haloB: '#60b0ff',
  },
};

function makeParticles(W, H, n) {
  const a = [];
  for (let i = 0; i < n; i++) {
    a.push({
      x: Math.random() * W, y: Math.random() * H,
      r: 0.7 + Math.random() * 2.2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.15 - Math.random() * 0.5,
      off: Math.random() * Math.PI * 2,
      rot: Math.random() * Math.PI * 2,
      life: Math.random(),
    });
  }
  return a;
}

function getActiveRegion() {
  return document.documentElement.getAttribute('data-region') || 'mondstadt';
}

class Renderer {
  constructor(canvas, board) {
    this.canvas = canvas; this.board = board;
    this.ctx = canvas.getContext('2d');
    this._lastReg = null; this._parts = null;
    this.resize();
  }

  resize() {
    const maxW = this.canvas.parentElement.clientWidth - 8;
    // En móvil (pantalla estrecha) rotamos el tablero: usamos rows como ancho
    // y cols como alto, para aprovechar mejor el espacio vertical.
    const isMobile = window.innerWidth < 960;
    const dispCols = isMobile ? this.board.rows : this.board.cols;
    const dispRows = isMobile ? this.board.cols : this.board.rows;
    this.cell = Math.max(6, Math.floor(maxW / dispCols));
    this.canvas.width  = dispCols * this.cell;
    this.canvas.height = dispRows * this.cell;
    this._rotated = isMobile;
    this._parts = null;
  }

  _ensureParts(W, H, reg) {
    if (this._parts && this._lastReg === reg) return;
    this._lastReg = reg;
    const n = reg === 'natlan' ? 58 : reg === 'snezhnaya' ? 65 : reg === 'inazuma' ? 52 : 32;
    this._parts = makeParticles(W, H, n);
  }

  /* ── Grabado en suelo según región ── */
  _engrave(ctx, px, py, cell, t, ix, iy) {
    if (cell < 7) return;
    const cx = px + cell / 2, cy = py + cell / 2, s = cell * 0.36;
    const reg = getActiveRegion();
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = t.engraveColor;
    ctx.lineWidth = Math.max(0.5, cell * 0.065);

    if (reg === 'inazuma') {
      /* Flor de ume (ciruela japonesa) — igual que en la imagen */
      if ((ix + iy) % 4 === 0) {
        for (let a = 0; a < 5; a++) {
          const ang = a * (Math.PI * 2 / 5) - Math.PI / 2;
          ctx.beginPath();
          ctx.ellipse(
            cx + Math.cos(ang) * s * 0.48, cy + Math.sin(ang) * s * 0.48,
            s * 0.25, s * 0.18, ang, 0, Math.PI * 2
          );
          ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(cx, cy, s * 0.1, 0, Math.PI * 2); ctx.stroke();
      } else if ((ix + iy) % 4 === 2) {
        ctx.beginPath(); ctx.arc(cx, cy, s * 0.65, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, s * 0.28, 0, Math.PI * 2); ctx.stroke();
      }
    } else if (reg === 'mondstadt') {
      if ((ix + iy) % 5 === 0) {
        /* Cruz del viento con círculo */
        ctx.beginPath();
        ctx.moveTo(cx - s, cy); ctx.lineTo(cx + s, cy);
        ctx.moveTo(cx, cy - s); ctx.lineTo(cx, cy + s);
        ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, s * 0.38, 0, Math.PI * 2); ctx.stroke();
        /* Aspas */
        for (let a = 0; a < 4; a++) {
          const ang = a * Math.PI / 2 + Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(ang) * s * 0.38, cy + Math.sin(ang) * s * 0.38);
          ctx.lineTo(cx + Math.cos(ang) * s * 0.78, cy + Math.sin(ang) * s * 0.78);
          ctx.stroke();
        }
      }
    } else if (reg === 'liyue') {
      if ((ix * 2 + iy) % 6 === 0) {
        /* Nube doble (nube de Liyue) */
        ctx.beginPath();
        ctx.arc(cx - s * 0.28, cy, s * 0.38, Math.PI * 0.65, Math.PI * 2.35); ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + s * 0.28, cy, s * 0.38, Math.PI * 1.65, Math.PI * 3.35); ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy - s * 0.28, s * 0.28, Math.PI * 1.15, Math.PI * 2.85); ctx.stroke();
      }
    } else if (reg === 'fontaine') {
      if ((ix + iy * 2) % 7 === 0) {
        /* Engranaje */
        ctx.beginPath(); ctx.arc(cx, cy, s * 0.52, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, s * 0.24, 0, Math.PI * 2); ctx.stroke();
        for (let ti = 0; ti < 8; ti++) {
          const a2 = ti * Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a2) * s * 0.52, cy + Math.sin(a2) * s * 0.52);
          ctx.lineTo(cx + Math.cos(a2) * s * 0.72, cy + Math.sin(a2) * s * 0.72);
          ctx.stroke();
        }
      }
    } else if (reg === 'sumeru') {
      if ((ix + iy) % 5 === 0) {
        /* Hoja de Dendro */
        ctx.beginPath();
        ctx.moveTo(cx, cy - s); ctx.quadraticCurveTo(cx + s * 0.7, cy, cx, cy + s);
        ctx.quadraticCurveTo(cx - s * 0.7, cy, cx, cy - s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - s * 0.7); ctx.lineTo(cx, cy + s * 0.7); ctx.stroke();
      }
    } else if (reg === 'natlan') {
      if ((ix + iy) % 5 === 1) {
        /* Grieta de lava */
        ctx.beginPath();
        ctx.moveTo(px, cy + s * 0.3);
        ctx.lineTo(cx - s * 0.4, cy); ctx.lineTo(cx + s * 0.4, cy - s * 0.2);
        ctx.lineTo(px + cell, cy + s * 0.1); ctx.stroke();
      }
    } else if (reg === 'snezhnaya') {
      if ((ix + iy) % 5 === 0) {
        /* Copo de nieve de 6 puntas */
        for (let a = 0; a < 6; a++) {
          const ang = a * Math.PI / 3;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + Math.cos(ang) * s * 0.7, cy + Math.sin(ang) * s * 0.7);
          ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(cx, cy, s * 0.18, 0, Math.PI * 2); ctx.stroke();
      }
    }
    ctx.restore();
  }

  /* ════════════════════════════════════════════════════════
     SPRITES DE BORDE POR REGIÓN
     ─────────────────────────────────────────────────────
     Cuando tengas los assets diseñados, pon las rutas aquí.
     Cada región necesita 6 imágenes (misma resolución cuadrada):
       h  → tile horizontal  (se repite en top y bottom)
       v  → tile vertical    (se repite en left y right)
       tl → esquina top-left
       tr → esquina top-right
       bl → esquina bottom-left
       br → esquina bottom-right

     Ejemplo de nombres de archivo sugeridos:
       assets/bordes/inazuma_h.png
       assets/bordes/inazuma_v.png
       assets/bordes/inazuma_tl.png  etc.

     Si una ruta está vacía ('') se usa el dibujo procedural.
     ════════════════════════════════════════════════════════ */
  static get BORDER_SPRITES() {
    return {
      mondstadt: { h: 'assets/mondstadt_horizontal.png', v: 'assets/mondstadt_vertical.png', tl: 'assets/mondstadt_esquina_sup_izq.png', tr: 'assets/mondstadt_esquina_sup_der.png', bl: 'assets/mondstadt_esquina_inf_izq.png', br: 'assets/mondstadt_esquina_inf_der.png' },
      liyue:     { h:'assets/liyue_horizontal.png', v:'assets/liyue_vertical.png', tl:'assets/liyue_esquina_sup_izq.png', tr:'assets/liyue_esquina_sup_der.png', bl:'assets/liyue_esquina_inf_izq.png', br:'assets/liyue_esquina_inf_der.png' },
      inazuma:   { h:'assets/inazuma_horizontal.png', v:'assets/inazuma_vertical.png', tl:'assets/inazuma_esquina_sup_izq.png', tr:'assets/inazuma_esquina_sup_der.png', bl:'assets/inazuma_esquina_inf_izq.png', br:'assets/inazuma_esquina_inf_der.png' },
      sumeru:    { h:'assets/sumeru_horizontal.png', v:'assets/sumeru_vertical.png', tl:'assets/sumeru_esquina_sup_izq.png', tr:'assets/sumeru_esquina_sup_der.png', bl:'assets/sumeru_esquina_inf_izq.png', br:'assets/sumeru_esquina_inf_der.png' },
      fontaine:  { h:'assets/fontaine_horizontal.png', v:'assets/fontaine_vertical.png', tl:'assets/fontaine_esquina_sup_izq.png', tr:'assets/fontaine_esquina_sup_der.png', bl:'assets/fontaine_esquina_inf_izq.png', br:'assets/fontaine_esquina_inf_der.png' },
      natlan:    { h:'assets/natlan_horizontal.png', v:'assets/natlan_vertical.png', tl:'assets/natlan_esquina_sup_izq.png', tr:'assets/natlan_esquina_sup_der.png', bl:'assets/natlan_esquina_inf_izq.png', br:'assets/natlan_esquina_inf_der.png' },
      snezhnaya: { h:'assets/snezhnaya_horizontal.png', v:'assets/snezhnaya_vertical.png', tl:'assets/snezhnaya_esquina_sup_izq.png', tr:'assets/snezhnaya_esquina_sup_der.png', bl:'assets/snezhnaya_esquina_inf_izq.png', br:'assets/snezhnaya_esquina_inf_der.png' },
    };
  }

  /* Caché de imágenes de borde (se rellena automáticamente) */
  _getBorderImg(reg, key) {
    if (!this._borderCache) this._borderCache = {};
    const ck = reg + '_' + key;
    if (this._borderCache[ck] !== undefined) return this._borderCache[ck];
    const src = (Renderer.BORDER_SPRITES[reg] || {})[key] || '';
    if (!src) { this._borderCache[ck] = null; return null; }
    const img = new Image();
    img.src = src;
    this._borderCache[ck] = img;
    return img;
  }

  /* Determina qué tipo de tile de borde es esta celda */
  _borderType(y, x, rows, cols) {
    const top    = y === 0;
    const bottom = y === rows - 1;
    const left   = x === 0;
    const right  = x === cols - 1;
    if (top    && left)  return 'tl';
    if (top    && right) return 'tr';
    if (bottom && left)  return 'bl';
    if (bottom && right) return 'br';
    if (top    || bottom) return 'h';
    return 'v';
  }

  /* ── Muro perimetral ── */
  _wall(ctx, px, py, cell, t, y, x, rows, cols) {
    const reg  = getActiveRegion();
    const btype = this._borderType(y, x, rows, cols);
    const img  = this._getBorderImg(reg, btype);

    if (img) {
      /* ── Sprite de borde cargado ── */
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, px, py, cell, cell);
        /* Glow interior sutil encima del sprite */
        const isInner =
          (x === 1 && y >= 1 && y <= rows-2) ||
          (x === cols-2 && y >= 1 && y <= rows-2) ||
          (y === 1 && x >= 1 && x <= cols-2) ||
          (y === rows-2 && x >= 1 && x <= cols-2);
        if (isInner) {
          ctx.save();
          ctx.globalAlpha = 0.25; ctx.fillStyle = t.wallGlow;
          ctx.fillRect(px, py, cell, cell);
          ctx.restore();
        }
      } else {
        /* Imagen cargando — relleno temporal del color base */
        ctx.fillStyle = t.wallB; ctx.fillRect(px, py, cell, cell);
      }
      return;
    }

    /* ── Dibujo procedural (mientras no haya sprite) ── */
    const s = Math.max(1, Math.floor(cell * 0.17));
    ctx.fillStyle = t.wallB; ctx.fillRect(px, py, cell, cell);
    ctx.save();
    ctx.globalAlpha = 0.5; ctx.fillStyle = t.wallTop;
    ctx.fillRect(px, py, cell, s);
    ctx.globalAlpha = 0.3; ctx.fillStyle = t.wallA;
    ctx.fillRect(px, py, s, cell);
    const isInnerEdge =
      (x === 1 && y >= 1 && y <= rows-2) ||
      (x === cols-2 && y >= 1 && y <= rows-2) ||
      (y === 1 && x >= 1 && x <= cols-2) ||
      (y === rows-2 && x >= 1 && x <= cols-2);
    if (isInnerEdge) {
      ctx.globalAlpha = 0.4; ctx.fillStyle = t.wallGlow;
      ctx.fillRect(px, py, cell, cell);
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.15; ctx.fillStyle = '#000';
    ctx.fillRect(px, py, 1, cell); ctx.fillRect(px, py, cell, 1);
    ctx.restore();
  }

  /* ── Obstáculo ── */
  _obs(ctx, px, py, cell, t) {
    if (cell < 5) { ctx.fillStyle = t.obsB; ctx.fillRect(px, py, cell, cell); return; }
    /* Si hay imagen de obstáculo y el tablero está rotado, dibujar sin rotar */
    if (imgObstaculo.src && imgObstaculo.complete && imgObstaculo.naturalWidth > 0) {
      if (this._rotated) {
        ctx.save();
        const cx = px + cell / 2, cy = py + cell / 2;
        ctx.translate(cx, cy); ctx.rotate(-Math.PI / 2); ctx.translate(-cx, -cy);
        ctx.drawImage(imgObstaculo, px, py, cell, cell);
        ctx.restore();
      } else {
        ctx.drawImage(imgObstaculo, px, py, cell, cell);
      }
      return;
    }
    const s = Math.max(1, Math.floor(cell * 0.14));
    const s2 = Math.max(1, Math.floor(cell * 0.07));
    const reg = getActiveRegion();

    if (reg === 'inazuma' || reg === 'fontaine' || reg === 'snezhnaya') {
      /* Cristal cúbico semitransparente (como cubos en la imagen de Inazuma) */
      ctx.fillStyle = t.obsB; ctx.fillRect(px, py, cell, cell);
      ctx.fillStyle = t.obsA; ctx.fillRect(px + s, py + s, cell - s * 2, cell - s * 2);
      ctx.save();
      ctx.globalAlpha = 0.5; ctx.fillStyle = t.obsFace;
      ctx.fillRect(px + s, py + s, cell * 0.38, s2 * 2);
      ctx.fillRect(px + s, py + s, s2 * 2, cell * 0.38);
      ctx.globalAlpha = 0.22; ctx.fillStyle = t.obsGlow;
      ctx.fillRect(px + s * 2, py + s * 2, cell - s * 4, cell - s * 4);
      ctx.globalAlpha = 0.65; ctx.strokeStyle = t.obsGlow;
      ctx.lineWidth = Math.max(0.5, cell * 0.07);
      ctx.strokeRect(px + s, py + s, cell - s * 2, cell - s * 2);
      ctx.restore();
    } else {
      /* Roca con profundidad */
      ctx.fillStyle = t.obsB; ctx.fillRect(px, py, cell, cell);
      ctx.fillStyle = t.obsA; ctx.fillRect(px, py, cell - s, cell - s);
      ctx.fillStyle = t.obsB; ctx.fillRect(px + cell - s, py, s, cell);
      ctx.fillStyle = t.obsB; ctx.fillRect(px, py + cell - s, cell, s);
      ctx.save();
      ctx.globalAlpha = 0.45; ctx.fillStyle = t.obsFace;
      ctx.fillRect(px + s2, py + s2, cell * 0.38, s2 * 2);
      ctx.fillRect(px + s2, py + s2, s2 * 2, cell * 0.38);
      ctx.globalAlpha = 0.18; ctx.fillStyle = t.obsGlow;
      ctx.beginPath(); ctx.arc(px + cell / 2, py + cell * 0.35, cell * 0.22, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  /* ── Capa de ambiente ── */
  _ambient(ctx, W, H, cell, t, reg, fr) {
    ctx.save();
    switch (reg) {
      case 'mondstadt': {
        /* Cielo y nubes */
        const sg = ctx.createLinearGradient(0, 0, 0, H * 0.35);
        sg.addColorStop(0, '#8ac8f0'); sg.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.14; ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H * 0.35);
        ctx.globalAlpha = 0.16; ctx.fillStyle = '#fff';
        for (let i = 0; i < 3; i++) {
          const cx = (W * 0.15 + i * W * 0.33 + Math.sin(fr * 0.004 + i * 2) * cell * 3) % W;
          ctx.beginPath(); ctx.ellipse(cx, cell * 1.4, cell * 3.8, cell * 1, 0, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.ellipse(cx + cell * 1.8, cell * 1.0, cell * 2.2, cell * 0.75, 0, 0, Math.PI * 2); ctx.fill();
        }
        break;
      }
      case 'liyue': {
        /* Bruma dorada del atardecer */
        const gg = ctx.createRadialGradient(W * 0.72, H * 0.18, 0, W * 0.72, H * 0.18, W * 0.65);
        gg.addColorStop(0, 'rgba(248,190,40,0.2)'); gg.addColorStop(1, 'transparent');
        ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 0.1; ctx.fillStyle = '#c07008';
        ctx.fillRect(0, H * 0.76, W, H * 0.24);
        ctx.globalAlpha = 0.09; ctx.strokeStyle = '#f0c040';
        ctx.lineWidth = Math.max(0.5, cell * 0.18);
        for (let wi = 0; wi < 4; wi++) {
          const wy = H * 0.79 + wi * cell * 1.4;
          const sh = Math.sin(fr * 0.028 + wi) * cell;
          ctx.beginPath(); ctx.moveTo(0, wy); ctx.quadraticCurveTo(W / 2 + sh, wy - cell * 0.8, W, wy); ctx.stroke();
        }
        break;
      }
      case 'inazuma': {
        /* Resplandor Electro en todo el área (campo de batalla místico) */
        const ig = ctx.createRadialGradient(W / 2, H / 2, cell * 2, W / 2, H / 2, W * 0.62);
        ig.addColorStop(0, 'rgba(140,40,220,0.11)'); ig.addColorStop(1, 'transparent');
        ctx.fillStyle = ig; ctx.fillRect(0, 0, W, H);
        /* Aura pulsante en el borde interior de la arena (como en la imagen) */
        const ap = 0.06 + 0.04 * Math.sin(fr * 0.055);
        ctx.globalAlpha = ap; ctx.fillStyle = '#9030e8';
        const bi = cell * 1; // grosor del borde
        ctx.fillRect(bi, bi, W - bi * 2, bi);               // top inner
        ctx.fillRect(bi, H - bi * 2, W - bi * 2, bi);       // bottom inner
        ctx.fillRect(bi, bi, bi, H - bi * 2);                // left inner
        ctx.fillRect(W - bi * 2, bi, bi, H - bi * 2);       // right inner
        /* Flash de rayo periódico */
        const lf = fr % 240;
        if (lf < 6) {
          ctx.globalAlpha = 0.14 * (1 - lf / 6);
          ctx.fillStyle = '#d0a8ff'; ctx.fillRect(0, 0, W, H);
        }
        break;
      }
      case 'sumeru': {
        const lg = ctx.createLinearGradient(0, 0, W, H);
        lg.addColorStop(0, 'rgba(40,200,60,0.07)'); lg.addColorStop(1, 'transparent');
        ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 0.06; ctx.fillStyle = '#28c848';
        for (let ri = 0; ri < 4; ri++) {
          const lx = ri * W / 3.2 + Math.sin(fr * 0.005 + ri) * cell * 2;
          ctx.beginPath();
          ctx.moveTo(lx - cell, 0); ctx.lineTo(lx + cell * 3, H);
          ctx.lineTo(lx + cell * 5, H); ctx.lineTo(lx + cell, 0);
          ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'fontaine': {
        /* Cáusticas de agua */
        ctx.globalAlpha = 0.055;
        for (let li = 0; li < 5; li++) {
          const lx = li * W / 4 + Math.sin(fr * 0.007 + li * 1.4) * cell * 3.5;
          ctx.fillStyle = '#50d0ff';
          ctx.beginPath();
          ctx.moveTo(lx, 0); ctx.lineTo(lx + cell * 2, H);
          ctx.lineTo(lx + cell * 4.5, H); ctx.lineTo(lx + cell * 2.5, 0);
          ctx.closePath(); ctx.fill();
        }
        break;
      }
      case 'natlan': {
        const lp = 0.55 + 0.45 * Math.abs(Math.sin(fr * 0.022));
        ctx.globalAlpha = 0.13 * lp;
        for (let gi = 0; gi < 8; gi++) {
          ctx.fillStyle = gi % 2 === 0 ? '#ff3500' : '#ff6808';
          const gx = (gi * W / 7 + (gi % 2 === 0 ? fr * 0.18 : -fr * 0.18)) % W;
          ctx.fillRect(gx < 0 ? gx + W : gx, 0, cell * 0.55, H);
        }
        ctx.globalAlpha = 0.07; ctx.fillStyle = '#b81800';
        ctx.fillRect(0, H * 0.65, W, H * 0.35);
        break;
      }
      case 'snezhnaya': {
        /* Aurora boreal */
        for (let ai = 0; ai < 3; ai++) {
          ctx.globalAlpha = 0.05;
          const ag = ctx.createLinearGradient(0, 0, W, 0);
          const ash = fr * 0.0028 + ai * 1.6;
          ag.addColorStop(0, 'transparent');
          ag.addColorStop(0.28 + Math.sin(ash) * 0.14, ai === 0 ? '#2020ff' : ai === 1 ? '#00b0a0' : '#7000b0');
          ag.addColorStop(0.78 + Math.cos(ash) * 0.1, 'transparent');
          ag.addColorStop(1, 'transparent');
          ctx.fillStyle = ag;
          ctx.fillRect(0, ai * H / 4, W, H / 4);
        }
        ctx.globalAlpha = 0.04; ctx.fillStyle = '#90c0ff';
        ctx.fillRect(0, H * 0.58, W, H * 0.42);
        break;
      }
    }
    ctx.restore();
  }

  /* ── Partículas ── */
  _particles(ctx, W, H, t, reg, fr) {
    if (!this._parts) return;
    ctx.save();
    for (const p of this._parts) {
      if (reg === 'inazuma') {
        p.y += 0.28; p.x += Math.sin(fr * 0.008 + p.off) * 0.42; p.rot += 0.016;
      } else if (reg === 'liyue') {
        p.y += p.vy * 0.65; p.x += Math.sin(fr * 0.009 + p.off) * 0.32;
      } else if (reg === 'natlan') {
        p.y += p.vy * 1.7; p.x += p.vx + Math.sin(fr * 0.02 + p.off) * 0.45; p.life -= 0.0038;
      } else if (reg === 'snezhnaya') {
        p.y -= p.vy * 0.55; p.x += 0.18 + Math.sin(fr * 0.005 + p.off) * 0.22;
      } else if (reg === 'fontaine') {
        p.y += p.vy * 0.75; p.x += Math.sin(fr * 0.011 + p.off) * 0.2;
      } else {
        p.y += p.vy * 0.5; p.x += Math.cos(fr * 0.007 + p.off) * 0.3;
      }
      if (p.x < -8) p.x = W + 4;
      if (p.x > W + 8) p.x = -4;
      if (p.y < -8) { p.y = H + 4; p.x = Math.random() * W; }
      if (p.y > H + 8) { p.y = -4; p.x = Math.random() * W; }
      if (p.life <= 0) { p.life = 1; p.y = H + 4; p.x = Math.random() * W; }

      const pulse = 0.42 + 0.58 * Math.abs(Math.sin(fr * 0.022 + p.off));
      ctx.globalAlpha = pulse * 0.78;

      if (t.partType === 'petal') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = t.partCol;
        ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.5, p.r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else if (t.partType === 'lantern') {
        ctx.fillStyle = t.partCol;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y - p.r * 1.9); ctx.lineTo(p.x + p.r, p.y);
        ctx.lineTo(p.x, p.y + p.r * 1.9); ctx.lineTo(p.x - p.r, p.y);
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = pulse * 0.18; ctx.fillStyle = t.partGlow;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2); ctx.fill();
      } else if (t.partType === 'bubble') {
        ctx.strokeStyle = t.partCol; ctx.lineWidth = Math.max(0.5, p.r * 0.38);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.25, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = pulse * 0.1; ctx.fillStyle = t.partCol;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.25, 0, Math.PI * 2); ctx.fill();
      } else if (t.partType === 'ember') {
        ctx.fillStyle = pulse > 0.62 ? '#ffdd28' : t.partCol;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.82, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = pulse * 0.22; ctx.fillStyle = t.partGlow;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = t.partCol;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = pulse * 0.18; ctx.fillStyle = t.partCol;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* ════════════════════════════════
     DRAW PRINCIPAL
  ════════════════════════════════ */
  draw(personajes, flash = []) {
    const { ctx, cell, board } = this;
    const reg = getActiveRegion();
    const t   = RT[reg] || RT.mondstadt;
    const W   = this.canvas.width, H = this.canvas.height;
    _frame++; const fr = _frame;

    // En móvil el canvas está físicamente rotado 90°:
    // el canvas tiene dimensión (rows*cell) × (cols*cell) pero los
    // personajes viven en coordenadas (cols×rows). Rotamos el contexto
    // para que todo el código de dibujado funcione sin cambios.
    const rotated = !!this._rotated;
    ctx.save();
    if (rotated) {
      ctx.translate(W, 0);
      ctx.rotate(Math.PI / 2);
      // Tras rotar 90°, el "nuevo" ancho es H y el "nuevo" alto es W
    }

    this._ensureParts(rotated ? H : W, rotated ? W : H, reg);

    /* 1. FONDO */
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, t.extA); bg.addColorStop(1, t.extB);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    /* 2. AMBIENTE */
    this._ambient(ctx, W, H, cell, t, reg, fr);

    /* 3. CELDAS */
    for (let y = 0; y < board.rows; y++) {
      for (let x = 0; x < board.cols; x++) {
        const px = x * cell, py = y * cell;

        if (board.esBorde(y, x)) {
          this._wall(ctx, px, py, cell, t, y, x, board.rows, board.cols);

        } else if (board.esObstaculo(y, x)) {
          /* Suelo bajo el obstáculo */
          const vi = ((x * 3 + y * 7) & 0xF) / 80.0;
          ctx.fillStyle = t.floorA; ctx.fillRect(px, py, cell, cell);
          if (vi > 0.07) {
            ctx.save(); ctx.globalAlpha = vi;
            ctx.fillStyle = t.floorB; ctx.fillRect(px, py, cell, cell);
            ctx.restore();
          }
          this._obs(ctx, px, py, cell, t);

        } else {
          /* Suelo interior con textura sutil */
          const vi = ((x * 3 + y * 7) & 0xF) / 80.0;
          ctx.fillStyle = t.floorA; ctx.fillRect(px, py, cell, cell);
          if (vi > 0.07) {
            ctx.save(); ctx.globalAlpha = vi;
            ctx.fillStyle = vi > 0.14 ? t.floorC : t.floorB;
            ctx.fillRect(px, py, cell, cell);
            ctx.restore();
          }

          /* Juntas de losas */
          if (cell >= 5) {
            ctx.save();
            if (reg === 'inazuma' && y % 2 === 0) {
              /* Tablones de madera horizontales — como en la imagen */
              ctx.globalAlpha = 0.08; ctx.fillStyle = '#000';
              ctx.fillRect(px, py, cell, 1);
            }
            if ((reg === 'liyue' || reg === 'fontaine' || reg === 'mondstadt') && cell >= 7) {
              ctx.globalAlpha = 0.08; ctx.fillStyle = '#000';
              if (x % 3 === 0) ctx.fillRect(px, py, 1, cell);
              if (y % 3 === 0) ctx.fillRect(px, py, cell, 1);
            }
            if (reg === 'snezhnaya' && x % 8 === 3) {
              ctx.globalAlpha = 0.1; ctx.fillStyle = 'rgba(150,210,255,0.9)';
              ctx.fillRect(px, py, 1, cell);
            }
            if (reg === 'natlan') {
              /* Grietas de lava en el suelo */
              if ((x + y * 3) % 11 === 0) {
                ctx.globalAlpha = 0.2; ctx.fillStyle = '#ff4000';
                ctx.fillRect(px, py + cell / 2, cell, 1);
              }
            }
            ctx.restore();
          }

          /* Grabado decorativo */
          this._engrave(ctx, px, py, cell, t, x, y);
        }
      }
    }

    /* 4. PARTÍCULAS */
    this._particles(ctx, W, H, t, reg, fr);

    /* 5. FLASH COMBATE */
    for (const fl of flash) {
      ctx.fillStyle = fl.tipo === 'malo_gana' ? t.flashM : t.flashB;
      ctx.fillRect(fl.x * cell, fl.y * cell, cell, cell);
    }

    /* 6. PERSONAJES */
    for (const p of personajes) {
      if (!p.vivo) continue;
      const px = p.pos.x * cell, py = p.pos.y * cell;
      const elCol = Vision.color(p.vision);
      const haloC = p.tipo === 'malo' ? t.haloM : t.haloB;
      const hpulse = 0.5 + 0.5 * Math.sin(fr * 0.055 + px * 0.04 + py * 0.04);

      if (cell >= 8) {
        /* Sombra */
        ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(px + cell/2, py + cell*0.87, cell*0.3, cell*0.1, 0, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        /* Halo equipo */
        ctx.save(); ctx.globalAlpha = 0.22 + hpulse * 0.12; ctx.fillStyle = haloC;
        ctx.beginPath(); ctx.arc(px + cell/2, py + cell/2, cell*0.52, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        /* Anillo elemental */
        ctx.save(); ctx.globalAlpha = 0.55 + hpulse * 0.3;
        ctx.strokeStyle = elCol; ctx.lineWidth = Math.max(0.8, cell * 0.1);
        ctx.beginPath(); ctx.arc(px + cell/2, py + cell/2, cell*0.34, 0, Math.PI*2); ctx.stroke();
        ctx.restore();

        /* Sprite — imagen por elemento, con fallback a formas si no existe */
        const imgMap  = p.tipo === 'malo' ? IMG_MALOS : IMG_BUENOS;
        const cacheKey = p.tipo + '_' + p.vision;
        if (!imgCache[cacheKey]) {
          const src = imgMap[p.vision] || '';
          if (src) {
            imgCache[cacheKey] = new Image();
            imgCache[cacheKey].src = src;
          } else {
            imgCache[cacheKey] = null; // sin asset → fallback
          }
        }
        const img = imgCache[cacheKey];

        if (img && img.complete && img.naturalWidth > 0) {
          /* Imagen cargada correctamente — contra-rotamos si el tablero está rotado
             para que el sprite se vea siempre derecho */
          if (this._rotated) {
            ctx.save();
            const cx = px + cell / 2, cy = py + cell / 2;
            ctx.translate(cx, cy); ctx.rotate(-Math.PI / 2); ctx.translate(-cx, -cy);
            ctx.drawImage(img, px, py, cell, cell);
            ctx.restore();
          } else {
            ctx.drawImage(img, px, py, cell, cell);
          }
          ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = elCol;
          ctx.fillRect(px, py, cell, cell); ctx.restore();
        } else if (img && !img.complete) {
          /* Imagen en carga — fallback temporal */
          ctx.save();
          ctx.fillStyle = elCol; ctx.globalAlpha = 0.5;
          ctx.fillRect(px, py, cell, cell);
          ctx.restore();
        } else {
          /* Sin asset definido — fallback permanente: cabeza + cuerpo */
          ctx.save();
          ctx.fillStyle = elCol; ctx.globalAlpha = 0.9;
          ctx.beginPath(); ctx.arc(px+cell/2, py+cell*0.38, cell*0.24, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = haloC; ctx.globalAlpha = 0.75;
          const bw = cell * 0.3;
          ctx.fillRect(px+cell/2-bw/2, py+cell*0.58, bw, cell*0.3);
          ctx.restore();
        }

      } else if (cell >= 4) {
        ctx.fillStyle = haloC; ctx.fillRect(px, py, cell, cell);
        ctx.save(); ctx.globalAlpha = 0.72; ctx.fillStyle = elCol;
        ctx.fillRect(px+1, py+1, cell-2, cell-2); ctx.restore();
      } else {
        ctx.fillStyle = elCol; ctx.fillRect(px, py, cell, cell);
      }
    }

    // Restaurar transformación de rotación móvil
    ctx.restore();
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