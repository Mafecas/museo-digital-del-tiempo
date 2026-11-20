/* =========================================================
   ARCHIVO DEL TIEMPO — viewer.js
   Visor 3D (Three.js) y escena de bienvenida (nube de puntos real)
   ========================================================= */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (n) => n.toLocaleString('es-CO');

/* ---------------------------------------------------------
   1. ESCENA DE BIENVENIDA
   Nubes de puntos muestreadas de las mallas reales, coloreadas
   con su textura original, que se transforman entre objetos.
   --------------------------------------------------------- */
export function createIntroScene(canvas, cloudsUrl, names, onCaption) {
  const N = 7000, BYTES = N * 9;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    onCaption && onCaption('Exposición digital · Archivo del Tiempo');
    return { leave() {}, dispose() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.55, 5.2);
  const root = new THREE.Group();
  scene.add(root);

  // anillo de "cámaras" (posiciones de captura) y suelo
  const ring = new THREE.Group();
  root.add(ring);
  const camPts = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const y = Math.sin(a * 3) * 0.12;
    camPts.push(Math.cos(a) * 1.85, 0.15 + y, Math.sin(a) * 1.85);
  }
  const camGeo = new THREE.BufferGeometry();
  camGeo.setAttribute('position', new THREE.Float32BufferAttribute(camPts, 3));
  ring.add(new THREE.Points(camGeo, new THREE.PointsMaterial({ color: 0xc9a96a, size: 0.05, transparent: true, opacity: 0.85, depthWrite: false })));
  const orbit = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 160 }, (_, i) => { const a = i / 160 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * 1.85, 0.15 + Math.sin(a * 3) * 0.12, Math.sin(a) * 1.85); })),
    new THREE.LineBasicMaterial({ color: 0xe7d6b2, transparent: true, opacity: 0.16 }));
  ring.add(orbit);
  for (let k = 0; k < 3; k++) {
    const r = 1.2 + k * 0.45;
    const c = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 128 }, (_, i) => { const a = i / 128 * Math.PI * 2; return new THREE.Vector3(Math.cos(a) * r, -1.02, Math.sin(a) * r); })),
      new THREE.LineBasicMaterial({ color: 0xe7d6b2, transparent: true, opacity: 0.1 - k * 0.025 }));
    root.add(c);
  }

  const uniforms = { uMix: { value: 0 }, uTime: { value: 0 }, uSize: { value: 30 }, uPR: { value: renderer.getPixelRatio() }, uFade: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec3 posB; attribute vec3 colA; attribute vec3 colB; attribute float rnd;
      uniform float uMix, uTime, uSize, uPR, uFade;
      varying vec3 vCol; varying float vA;
      void main(){
        float t = smoothstep(rnd*0.45, rnd*0.45+0.55, uMix);
        vec3 p = mix(position, posB, t);
        float burst = sin(t*3.14159);
        vec3 dir = normalize(p + vec3(0.0001, 0.0002, 0.0003));
        p += dir * burst * (0.25 + rnd*0.55) + vec3(0.0, burst*0.15, 0.0);
        p += 0.006 * vec3(sin(uTime*1.3 + rnd*40.0), cos(uTime*1.1 + rnd*30.0), sin(uTime*0.9 + rnd*20.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPR * (0.65 + rnd*0.7) / -mv.z;
        vCol = mix(colA, colB, t);
        vA = uFade * (0.55 + 0.45*(1.0-burst));
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vCol; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float a = smoothstep(0.5, 0.1, d);
        gl_FragColor = vec4(vCol * 1.12 + 0.03, a * vA);
        #include <colorspace_fragment>
      }`
  });
  const geo = new THREE.BufferGeometry();
  const cloud = new THREE.Points(geo, mat);
  cloud.frustumCulled = false;
  root.add(cloud);

  let clouds = null, cur = 0, phase = 'hold', phaseT = 0, alive = true, leaving = false, raf = 0;
  const HOLD = 4.6, MORPH = 2.4;
  const setPair = (a, b) => {
    geo.setAttribute('position', new THREE.BufferAttribute(clouds[a].pos, 3));
    geo.setAttribute('posB', new THREE.BufferAttribute(clouds[b].pos, 3));
    geo.setAttribute('colA', new THREE.BufferAttribute(clouds[a].col, 3));
    geo.setAttribute('colB', new THREE.BufferAttribute(clouds[b].col, 3));
  };
  const caption = (i) => onCaption && onCaption(`Nube de puntos real · ${String(i + 1).padStart(2, '0')} ${names[i]} · ${fmt(N)} puntos de la malla`);

  fetch(cloudsUrl).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(buf => {
    clouds = [];
    const count = Math.floor(buf.byteLength / BYTES);
    for (let k = 0; k < count; k++) {
      const q = new Int16Array(buf, k * BYTES, N * 3);
      const c = new Uint8Array(buf, k * BYTES + N * 6, N * 3);
      const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
      for (let i = 0; i < N * 3; i++) { pos[i] = q[i] / 32000; col[i] = Math.pow(c[i] / 255, 2.2); }
      clouds.push({ pos, col });
    }
    const rnd = new Float32Array(N); for (let i = 0; i < N; i++) rnd[i] = Math.random();
    geo.setAttribute('rnd', new THREE.BufferAttribute(rnd, 1));
    setPair(0, 1 % clouds.length);
    caption(0);
  }).catch(() => onCaption && onCaption('Exposición digital · Archivo del Tiempo'));

  // arrastrar para girar
  let rotY = 0.6, velY = 0, dragging = false, lastX = 0;
  canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; });
  window.addEventListener('pointerup', () => dragging = false);
  window.addEventListener('pointermove', e => { if (!dragging) return; velY = (e.clientX - lastX) * 0.004; lastX = e.clientX; });

  let w = 0, h = 0, lookX = 0.4, lookY = 0.03;
  const resize = () => {
    w = canvas.clientWidth; h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    const mobile = w < 900;
    root.position.set(mobile ? 0 : 1.15, mobile ? 1.15 : 0.05, 0);
    root.scale.setScalar(mobile ? 0.72 : 1);
    uniforms.uSize.value = mobile ? 28 : 36;
    lookY = mobile ? 0.1 : 0.03; lookX = mobile ? 0 : 0.4;
  };
  window.addEventListener('resize', resize); resize();

  const clock = new THREE.Clock();
  let zoom = 0;
  const loop = () => {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    const still = reduceMotion();
    uniforms.uTime.value += dt;
    uniforms.uFade.value = Math.min(1, uniforms.uFade.value + dt * 0.6);
    if (!dragging) velY *= 0.94;
    rotY += velY + (still ? 0 : dt * 0.12);
    root.rotation.y = rotY;
    ring.rotation.y = -uniforms.uTime.value * 0.05;
    if (clouds && clouds.length > 1 && !still) {
      phaseT += dt;
      if (phase === 'hold' && phaseT > HOLD) { phase = 'morph'; phaseT = 0; }
      if (phase === 'morph') {
        uniforms.uMix.value = Math.min(1, phaseT / MORPH);
        if (phaseT >= MORPH) {
          cur = (cur + 1) % clouds.length;
          setPair(cur, (cur + 1) % clouds.length);
          uniforms.uMix.value = 0; phase = 'hold'; phaseT = 0; caption(cur);
        }
      }
    }
    if (leaving) { zoom = Math.min(1, zoom + dt * 0.8); camera.position.z = 5.2 - zoom * zoom * 3.2; uniforms.uFade.value = Math.max(0, 1 - zoom * 1.2); }
    camera.lookAt(lookX, lookY, 0);
    renderer.render(scene, camera);
  };
  loop();

  return {
    leave() { leaving = true; },
    dispose() {
      alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize);
      geo.dispose(); mat.dispose(); camGeo.dispose(); renderer.dispose();
    }
  };
}

/* ---------------------------------------------------------
   2. VISOR DE MODELOS
   --------------------------------------------------------- */
const ICONS = {
  rotate: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10-6.5z"/></svg>',
  center: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
  reset: '<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.3-5.7"/><path d="M4 4v5h5"/></svg>',
  mode: '<svg viewBox="0 0 24 24"><path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="m3 13 9 5 9-5"/></svg>',
  light: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
};
// «Original» muestra la textura tal como la entrega Pix4D (illum 0: sin sombreado añadido)
const MODES = [['original', 'Original'], ['relieve', 'Relieve'], ['malla', 'Malla'], ['arcilla', 'Geometría']];
const PRESETS = {
  museo:   { label: 'Museo',   env: 0.55, hemi: 0.55, key: 1.55, rim: 0.9, el: 42, keyColor: 0xffe7c4 },
  estudio: { label: 'Estudio', env: 1.0,  hemi: 0.75, key: 0.9,  rim: 0.35, el: 55, keyColor: 0xffffff },
  rasante: { label: 'Rasante', env: 0.12, hemi: 0.1,  key: 3.4,  rim: 0.25, el: 9,  keyColor: 0xfff1dc },
};

let sharedLoader = null;
export function getLoader() {
  if (!sharedLoader) { sharedLoader = new GLTFLoader(); sharedLoader.setMeshoptDecoder(MeshoptDecoder); }
  return sharedLoader;
}

export function prefersMobileModel() {
  try {
    const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl');
    const max = gl ? gl.getParameter(gl.MAX_TEXTURE_SIZE) : 4096;
    const ext = gl && gl.getExtension('WEBGL_lose_context'); ext && ext.loseContext();
    const small = Math.min(screen.width, screen.height) < 820 && matchMedia('(pointer: coarse)').matches;
    return max < 8192 || small;
  } catch (e) { return true; }
}

export class ModelViewer {
  constructor(container, meta) {
    this.el = container; this.meta = meta;
    this.state = { auto: !reduceMotion(), paused: false, mode: 'original', preset: 'museo', intensity: 1, azimuth: 35 };
    this._buildUI();
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      this._error('Tu navegador no tiene WebGL activo, necesario para el visor 3D.', 'Prueba con una versión reciente de Chrome, Edge, Firefox o Safari.');
      return;
    }
    const r = this.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 1.0;
    r.setClearColor(0x000000, 0);
    this.el.prepend(r.domElement);
    r.domElement.setAttribute('aria-label', `Modelo 3D interactivo: ${meta.name}`);
    r.domElement.tabIndex = 0;

    this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    this.envTex = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    this.scene.environment = this.envTex;

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.01, 200);
    this.controls = new OrbitControls(this.camera, r.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.07, rotateSpeed: 0.75, zoomSpeed: 0.9, autoRotateSpeed: 0.7, screenSpacePanning: true });
    this.controls.addEventListener('start', () => this._kick());

    this.hemi = new THREE.HemisphereLight(0xfff4e2, 0x0c2b31, 0.6);
    this.key = new THREE.DirectionalLight(0xffe7c4, 1.5);
    this.rim = new THREE.DirectionalLight(0x9fd0d8, 0.8);
    this.scene.add(this.hemi, this.key, this.rim, this.key.target);

    this.clock = new THREE.Clock();
    this.visible = true;
    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(this.el);
    this._io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    this._io.observe(this.el);
    this._onFs = () => { this.el.classList.toggle('is-fs', !!document.fullscreenElement); setTimeout(() => this._resize(), 50); };
    document.addEventListener('fullscreenchange', this._onFs);
    this._onKey = (e) => { if (e.key === 'Escape' && this.el.classList.contains('is-pseudo-fs')) this.toggleFullscreen(); };
    document.addEventListener('keydown', this._onKey);
    this._resize();
    this._applyLight();
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  /* ---------- interfaz ---------- */
  _buildUI() {
    const m = this.meta;
    this.el.innerHTML = `
      <div class="viewer__hud">
        <span class="mono">Visor 3D · <b data-tris>geometría real</b></span>
        ${m.badge ? `<span class="mono viewer__badge">${m.badge}</span>` : ''}
        ${m.versions ? `<div class="vswitch" role="tablist" aria-label="Versión del modelo">${m.versions.map((x, i) => `<button role="tab" class="vswitch__b${i === 0 ? ' is-on' : ''}" data-version="${x.key}" aria-selected="${i === 0}"><b>${x.label}</b><span>${x.sub}</span></button>`).join('')}</div>` : ''}
        <span class="mono viewer__hint">Arrastra para girar · rueda para acercar</span>
      </div>
      <div class="viewer__bar" role="toolbar" aria-label="Controles del visor 3D">
        <button class="vbtn" data-a="auto" aria-pressed="true" title="Giro automático">${ICONS.rotate}<span class="lbl">Giro</span></button>
        <button class="vbtn" data-a="pause" aria-pressed="false" title="Pausar animación">${ICONS.pause}<span class="lbl">Pausar</span></button>
        <span class="vsep"></span>
        <button class="vbtn" data-a="center" title="Centrar objeto">${ICONS.center}<span class="lbl">Centrar</span></button>
        <button class="vbtn" data-a="reset" title="Restablecer cámara">${ICONS.reset}<span class="lbl">Restablecer</span></button>
        <span class="vsep"></span>
        <button class="vbtn" data-a="mode" title="Cambiar visualización">${ICONS.mode}<span class="lbl" data-mode-l>Original</span></button>
        <button class="vbtn" data-a="light" aria-expanded="false" title="Iluminación">${ICONS.light}<span class="lbl">Luz</span></button>
        <button class="vbtn" data-a="full" title="Pantalla completa">${ICONS.full}<span class="lbl">Ampliar</span></button>
      </div>
      <div class="vlight" role="group" aria-label="Visualización e iluminación">
        <p>Visualización</p>
        <div class="chips" data-modes>${MODES.map(([k, l]) => `<button class="chip${k === 'original' ? ' is-on' : ''}" data-mode="${k}">${l}</button>`).join('')}</div>
        <p>Iluminación <span class="vlight__note">(modos Relieve y Geometría)</span></p>
        <div class="chips">${Object.entries(PRESETS).map(([k, p]) => `<button class="chip${k === 'museo' ? ' is-on' : ''}" data-preset="${k}">${p.label}</button>`).join('')}</div>
        <label>Intensidad <input type="range" min="0.2" max="2" step="0.05" value="1" data-r="intensity"></label>
        <label>Dirección de la luz <input type="range" min="0" max="360" step="1" value="35" data-r="azimuth"></label>
      </div>
      <div class="viewer__state" data-state>
        <div>
          <div class="loader"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44"/></svg><span data-pct>0%</span></div>
          <p class="mono">Cargando reconstrucción</p>
          <p data-size>${m.sizeLabel || ''}</p>
        </div>
      </div>`;
    const $ = (s) => this.el.querySelector(s);
    this.el.querySelectorAll('[data-version]').forEach(b => b.addEventListener('click', () => this.setVersion(b.dataset.version)));
    this.ui = { state: $('[data-state]'), pct: $('[data-pct]'), ring: $('.loader .fg'), tris: $('[data-tris]'), light: $('.vlight'), modeL: $('[data-mode-l]') };
    this.el.querySelector('.viewer__bar').addEventListener('click', (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'auto') { this.state.auto = !this.state.auto; if (this.state.auto) this.state.paused = false; }
      if (a === 'pause') this.state.paused = !this.state.paused;
      if (a === 'center') this.center();
      if (a === 'reset') this.reset();
      if (a === 'mode') { const i = MODES.findIndex(x => x[0] === this.state.mode); this.setMode(MODES[(i + 1) % MODES.length][0]); }
      if (a === 'light') { const o = this.ui.light.classList.toggle('is-open'); b.setAttribute('aria-expanded', o); b.classList.toggle('is-on', o); }
      if (a === 'full') this.toggleFullscreen();
      this._syncButtons(); this._kick();
    });
    this.ui.light.addEventListener('click', (e) => {
      const mb = e.target.closest('[data-mode]');
      if (mb) { this.setMode(mb.dataset.mode); this._kick(); return; }
      const c = e.target.closest('[data-preset]'); if (!c) return;
      if (this.state.mode === 'original' || this.state.mode === 'malla') this.setMode('relieve');
      this.state.preset = c.dataset.preset;
      this.ui.light.querySelectorAll('.chip').forEach(x => x.classList.toggle('is-on', x === c));
      this._applyLight(); this._kick();
    });
    this.ui.light.addEventListener('input', (e) => {
      const k = e.target.dataset.r; if (!k) return;
      if (this.state.mode === 'original' || this.state.mode === 'malla') this.setMode('relieve');
      this.state[k] = parseFloat(e.target.value); this._applyLight(); this._kick();
    });
    this._syncButtons();
  }
  _syncButtons() {
    const q = (a) => this.el.querySelector(`[data-a="${a}"]`);
    const auto = q('auto'), pause = q('pause');
    auto.classList.toggle('is-on', this.state.auto); auto.setAttribute('aria-pressed', this.state.auto);
    pause.classList.toggle('is-on', this.state.paused); pause.setAttribute('aria-pressed', this.state.paused);
    pause.innerHTML = (this.state.paused ? ICONS.play : ICONS.pause) + `<span class="lbl">${this.state.paused ? 'Reanudar' : 'Pausar'}</span>`;
    pause.title = this.state.paused ? 'Reanudar animación' : 'Pausar animación';
    if (this.ui.modeL) this.ui.modeL.textContent = MODES.find(x => x[0] === this.state.mode)[1];
    if (this.ui.light) this.ui.light.querySelectorAll('[data-mode]').forEach(c => c.classList.toggle('is-on', c.dataset.mode === this.state.mode));
  }

  /* ---------- carga ---------- */
  setVersion(key) {
    const ver = (this.meta.versions || []).find(x => x.key === key);
    if (!ver || key === this.version || this._loading) return;
    this.el.querySelectorAll('[data-version]').forEach(b => { const on = b.dataset.version === key; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
    this.el.classList.toggle('is-enhanced', !!ver.pedestal);
    this.load(ver.url, { pedestal: !!ver.pedestal, keepView: true, key });
  }
  load(url, opts = {}) {
    if (!this.renderer) return;
    this.version = opts.key || (this.meta.versions ? this.meta.versions[0].key : 'original');
    this._loading = true;
    this.ui.state.classList.remove('is-hidden');
    this._setProgress(0);
    if (location.protocol === 'file:' && !url.startsWith('data:')) {
      this._error('El visor 3D necesita un servidor local.', 'Abre el portafolio con INICIAR_PORTAFOLIO.bat (Windows) o con «python iniciar.py». Así el navegador puede leer los modelos GLB.');
      return;
    }
    getLoader().load(url, (gltf) => {
      this._loading = false;
      if (this.disposed) { disposeTree(gltf.scene); return; }
      let view = null;
      if (opts.keepView && this.modelGroup && this.radius) {
        view = { dir: this.camera.position.clone().sub(this.controls.target).divideScalar(this.radius), off: this.controls.target.clone().sub(this.modelCenter).divideScalar(this.radius) };
      }
      this._removeModel();
      this._install(gltf.scene, { pedestal: !!opts.pedestal, view });
      this.ui.state.classList.add('is-hidden');
    }, (ev) => {
      if (ev.lengthComputable && ev.total) this._setProgress(ev.loaded / ev.total);
      else if (ev.loaded) this.ui.pct.textContent = (ev.loaded / 1048576).toFixed(1) + ' MB';
    }, (err) => {
      this._loading = false;
      console.warn('Error al cargar el modelo', err);
      this._error('No fue posible cargar el modelo 3D.', 'Verifica que el archivo exista en assets/models/ y que el portafolio se esté sirviendo desde un servidor local.', url);
    });
  }
  _setProgress(p) {
    this.ui.pct.textContent = Math.round(p * 100) + '%';
    this.ui.ring.style.strokeDashoffset = 276.5 * (1 - p);
  }
  _error(title, msg, retryUrl) {
    this.ui.state.classList.remove('is-hidden');
    this.ui.state.innerHTML = `<div role="alert"><p class="err-t">${title}</p><p>${msg}</p>${retryUrl ? '<button class="btn btn--sm btn--primary" type="button" data-retry><span>Reintentar</span></button>' : ''}</div>`;
    const b = this.ui.state.querySelector('[data-retry]');
    if (b) b.addEventListener('click', () => { this.ui.state.innerHTML = '<div><div class="loader"><svg viewBox="0 0 100 100"><circle class="bg" cx="50" cy="50" r="44"/><circle class="fg" cx="50" cy="50" r="44"/></svg><span data-pct>0%</span></div><p class="mono">Cargando reconstrucción</p></div>'; this.ui.pct = this.ui.state.querySelector('[data-pct]'); this.ui.ring = this.ui.state.querySelector('.fg'); this.load(retryUrl); });
  }

  _removeModel() {
    if (!this.modelGroup) return;
    this.scene.remove(this.modelGroup);
    disposeTree(this.modelGroup);
    (this.meshes || []).forEach(m => { m.clay.dispose(); m.dark.dispose(); m.flat.dispose(); m.orig.dispose(); m.wire.material.dispose(); });
    this.meshes = []; this.modelGroup = null;
  }
  _install(model, opts = {}) {
    // normalizar tamaño (el modelo conserva su forma y proporciones reales)
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model, true);
    const size = box.getSize(new THREE.Vector3());
    const s = 2 / Math.max(size.x, size.y, size.z);
    const wrap = new THREE.Group();
    wrap.add(model);
    wrap.scale.setScalar(s);
    const group = new THREE.Group();
    group.add(wrap);
    this.scene.add(group);
    this.modelGroup = group;
    wrap.updateMatrixWorld(true);

    let tris = 0, rad = 0, minY = Infinity; const samples = [];
    const v = new THREE.Vector3();
    this.meshes = [];
    const found = [];
    model.traverse((o) => { if (o.isMesh) found.push(o); });
    found.forEach((o) => {
      const g = o.geometry;
      tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
      const pos = g.attributes.position;
      const step = Math.max(1, Math.floor(pos.count / 40000));
      for (let i = 0; i < pos.count; i += step) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
        rad = Math.max(rad, Math.hypot(v.x, v.z)); minY = Math.min(minY, v.y);
        samples.push(v.x, v.y, v.z);
      }
      const orig = o.material;
      if (orig.map) {
        orig.map.anisotropy = this.renderer.capabilities.getMaxAnisotropy(); orig.map.colorSpace = THREE.SRGBColorSpace;
        downscaleIfNeeded(orig.map, this.meta.maxTexture || this.renderer.capabilities.maxTextureSize);
      }
      const vc = !!g.attributes.color;
      orig.side = THREE.DoubleSide; orig.metalness = 0; orig.roughness = 0.9;
      // textura original sin sombreado ni mapeo tonal: los colores se ven exactamente como en Pix4D
      const flat = new THREE.MeshBasicMaterial({ map: orig.map, vertexColors: vc, side: THREE.DoubleSide, toneMapped: false, transparent: orig.transparent, depthWrite: !orig.transparent, alphaTest: orig.alphaTest || 0 });
      if (orig.transparent) { orig.depthWrite = false; o.renderOrder = 2; }
      const clay = new THREE.MeshStandardMaterial({ color: vc ? 0xa99f8e : 0xd8ccb6, roughness: 0.62, metalness: 0, side: THREE.DoubleSide });
      const dark = new THREE.MeshStandardMaterial({ color: 0x1c2a2d, roughness: 0.8, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
      const wire = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xe0c58f, wireframe: true, transparent: true, opacity: 0.2, depthWrite: false }));
      wire.visible = false; o.add(wire);
      this.meshes.push({ mesh: o, orig, flat, clay, dark, wire });
    });
    this.ui.tris.textContent = `${fmt(Math.round(tris))} triángulos`;

    // halo de luz bajo la pieza (la base capturada se conserva tal cual)
    const glowTex = radialTexture();
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(rad * 3.4, rad * 3.4), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, toneMapped: false }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = Math.min(-0.004, minY - 0.004);
    floor.renderOrder = -1;
    group.add(floor);

    // pedestal de exhibición (solo versión mejorada)
    if (opts.pedestal) {
      const pr = rad * 1.01, top = minY - 0.002;
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(pr, pr * 1.06, 0.9, 128, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x0b1d21, roughness: 0.42, metalness: 0.35, side: THREE.DoubleSide }));
      cyl.position.y = top - 0.45;
      const cap = new THREE.Mesh(new THREE.CircleGeometry(pr, 128), new THREE.MeshStandardMaterial({ color: 0x08171a, roughness: 0.6, metalness: 0.2 }));
      cap.rotation.x = -Math.PI / 2; cap.position.y = top - 0.001;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(pr, 0.0055, 8, 160), new THREE.MeshStandardMaterial({ color: 0xc9a96a, roughness: 0.3, metalness: 0.9 }));
      ring.rotation.x = Math.PI / 2; ring.position.y = top;
      floor.position.y = top - 0.9;
      floor.scale.setScalar(2);
      group.add(cyl, cap, ring);
    }

    // encuadre centrado en el objeto (no en toda la superficie de apoyo)
    const ys = []; for (let i = 1; i < samples.length; i += 3) ys.push(samples[i]);
    ys.sort((a, b) => a - b);
    const yTop = ys[Math.floor(ys.length * 0.998)] || 1;
    const cut = yTop * 0.12;
    // caja robusta del objeto: percentiles de los puntos sobre la superficie (ignora bordes ruidosos)
    const px = [], py = [], pz = [];
    for (let i = 0; i < samples.length; i += 3) if (samples[i + 1] > cut) { px.push(samples[i]); py.push(samples[i + 1]); pz.push(samples[i + 2]); }
    const pct = (arr, q) => { const c = arr.slice().sort((m, n) => m - n); return c[Math.min(c.length - 1, Math.max(0, Math.floor(q * (c.length - 1))))]; };
    const ob = new THREE.Box3();
    if (px.length > 50) {
      // centro por mediana y radio por percentil, para descartar fragmentos del borde de la mesa
      const mx = pct(px, 0.5), mz = pct(pz, 0.5);
      const rr = px.map((x, i) => Math.hypot(x - mx, pz[i] - mz));
      const rlim = pct(rr, 0.9) * 1.25;
      px.forEach((x, i) => { if (rr[i] <= rlim) ob.expandByPoint(v.set(x, py[i], pz[i])); });
    }
    if (ob.isEmpty()) ob.setFromObject(wrap, true);
    ob.min.y = Math.min(ob.min.y, 0);
    // cámara inicial
    const full = new THREE.Box3().setFromObject(wrap, true).getBoundingSphere(new THREE.Sphere());
    this.modelCenter = ob.getCenter(new THREE.Vector3());
    const sph = ob.getBoundingSphere(new THREE.Sphere());
    this.radius = sph.radius;
    const dist = (sph.radius / Math.sin(THREE.MathUtils.degToRad(this.camera.fov / 2))) * (this.meta.zoom || 1.15);
    const az = THREE.MathUtils.degToRad(this.meta.az ?? 32), el = THREE.MathUtils.degToRad(this.meta.el ?? 26);
    this.home = {
      target: this.modelCenter.clone(),
      pos: this.modelCenter.clone().add(new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist)),
    };
    this.camera.near = dist / 200; this.camera.far = (dist + full.radius) * 20; this.camera.updateProjectionMatrix();
    this.controls.minDistance = sph.radius * 0.25;
    this.controls.maxDistance = Math.max(dist * 3, full.radius * 4);
    this.controls.maxPolarAngle = Math.PI * 0.62;
    if (opts.view) {
      // al cambiar de versión: misma dirección de mirada, encuadre recalculado
      const d = this.home.pos.distanceTo(this.home.target);
      const dir = opts.view.dir.clone().normalize();
      this.controls.target.copy(this.modelCenter);
      this.camera.position.copy(this.modelCenter).addScaledVector(dir, d * 1.25);
      this.controls.update();
      this._tween(this.modelCenter.clone().addScaledVector(dir, d), this.modelCenter.clone(), 900);
    } else {
      this.camera.position.copy(this.home.pos).multiplyScalar(1.6);
      this.controls.target.copy(this.home.target);
      this._tween(this.home.pos, this.home.target, 1600);
    }
    this._applyLight();
    this.setMode(this.state.mode);
  }

  /* ---------- acciones ---------- */
  setMode(mode) {
    this.state.mode = mode;
    (this.meshes || []).forEach(({ mesh, orig, flat, clay, dark, wire }) => {
      mesh.material = mode === 'original' ? flat : mode === 'relieve' ? orig : mode === 'arcilla' ? clay : dark;
      mesh.visible = !((orig.transparent || orig.alphaTest > 0) && (mode === 'malla' || mode === 'arcilla'));   // sombras y terreno recortado solo acompañan a la textura
      wire.visible = mode === 'malla';
    });
    this._syncButtons();
  }
  center() {
    if (!this.home) return;
    const off = this.camera.position.clone().sub(this.controls.target);
    this._tween(this.modelCenter.clone().add(off), this.modelCenter.clone(), 900);
  }
  reset() {
    if (!this.home) return;
    this.state.preset = 'museo'; this.state.intensity = 1; this.state.azimuth = 35;
    this.ui.light.querySelectorAll('.chip').forEach(x => x.classList.toggle('is-on', x.dataset.preset === 'museo'));
    this.ui.light.querySelector('[data-r="intensity"]').value = 1;
    this.ui.light.querySelector('[data-r="azimuth"]').value = 35;
    this._applyLight();
    this._tween(this.home.pos.clone(), this.home.target.clone(), 1100);
  }
  toggleFullscreen() {
    const el = this.el;
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    if (el.classList.contains('is-pseudo-fs')) { el.classList.remove('is-pseudo-fs'); this._resize(); return; }
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => { el.classList.add('is-pseudo-fs'); this._resize(); });
    } else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
    else { el.classList.add('is-pseudo-fs'); this._resize(); }
  }
  _applyLight() {
    if (!this.key) return;
    const p = PRESETS[this.state.preset], k = this.state.intensity;
    this.scene.environmentIntensity = p.env * k;
    this.hemi.intensity = p.hemi * k;
    this.key.intensity = p.key * k; this.key.color.setHex(p.keyColor);
    this.rim.intensity = p.rim * k;
    const R = 10, az = THREE.MathUtils.degToRad(this.state.azimuth), el = THREE.MathUtils.degToRad(p.el);
    this.key.position.set(Math.sin(az) * Math.cos(el) * R, Math.sin(el) * R, Math.cos(az) * Math.cos(el) * R);
    this.rim.position.set(-Math.sin(az) * R, 4, -Math.cos(az) * R);
  }
  _tween(pos, target, ms) {
    const p0 = this.camera.position.clone(), t0 = this.controls.target.clone();
    const start = performance.now(), dur = reduceMotion() ? 1 : ms;
    this._tw = { p0, t0, pos, target, start, dur };
  }
  _kick() { this._lastInput = performance.now(); }
  _resize() {
    if (!this.renderer) return;
    const w = this.el.clientWidth, h = this.el.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  _loop() {
    if (this.disposed) return;
    this._raf = requestAnimationFrame(this._loop);
    if (!this.visible || document.hidden) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);
    if (this._tw) {
      const { p0, t0, pos, target, start, dur } = this._tw;
      const t = Math.min(1, (performance.now() - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      this.camera.position.lerpVectors(p0, pos, e);
      this.controls.target.lerpVectors(t0, target, e);
      if (t >= 1) this._tw = null;
    }
    const idle = !this._lastInput || performance.now() - this._lastInput > 2500;
    this.controls.autoRotate = this.state.auto && !this.state.paused && idle && !this._tw;
    this.controls.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this._raf);
    this._ro && this._ro.disconnect(); this._io && this._io.disconnect();
    document.removeEventListener('fullscreenchange', this._onFs);
    document.removeEventListener('keydown', this._onKey);
    if (document.fullscreenElement === this.el) document.exitFullscreen().catch(() => {});
    if (!this.renderer) return;
    this.controls.dispose();
    this._removeModel();
    disposeTree(this.scene);
    this.envTex && this.envTex.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss && this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}

export function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    ms.forEach((m) => { for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); } m.dispose(); });
  });
}

// En equipos con límite de textura menor (o teléfonos) se reduce la textura de 8192 px
// en el propio navegador, sin necesidad de un segundo archivo.
function downscaleIfNeeded(tex, limit) {
  const img = tex.image; if (!img || !img.width) return;
  const max = Math.min(limit || 8192, 8192);
  if (img.width <= max && img.height <= max) return;
  const sc = max / Math.max(img.width, img.height);
  const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
  const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, c.width, c.height);
  if (img.close) img.close();
  tex.image = c; tex.needsUpdate = true;
}

export function radialTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, 'rgba(201,169,106,0.16)');
  gr.addColorStop(0.4, 'rgba(60,110,115,0.08)');
  gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------------------------------------------------------
   3. VITRINA: pieza en rotación continua dentro de la página
   --------------------------------------------------------- */
// la vitrina repite piezas: cada archivo se descarga una sola vez y se vuelve a interpretar desde memoria
const bufCache = new Map();
function loadCached(url, onLoad, onError) {
  if (!bufCache.has(url)) bufCache.set(url, fetch(url).then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }));
  bufCache.get(url).then(buf => getLoader().parse(buf, '', onLoad, onError)).catch((e) => { bufCache.delete(url); onError && onError(e); });
}

export function createShowcase(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  pm.dispose();
  scene.environmentIntensity = 0.55;
  const hemi = new THREE.HemisphereLight(0xfff4e2, 0x0c2b31, 0.5);
  const key = new THREE.DirectionalLight(0xffe7c4, 1.5); key.position.set(4, 7, 6);
  const rim = new THREE.DirectionalLight(0x9fd0d8, 0.75); rim.position.set(-5, 3, -4);
  scene.add(hemi, key, rim);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
  const pivot = new THREE.Group(); scene.add(pivot);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ map: radialTexture(), transparent: true, depthWrite: false, toneMapped: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -0.02; glow.renderOrder = -1; pivot.add(glow);
  let model = null, spin = 0, vel = 0, drag = false, lastX = 0, visible = false, alive = true, fade = 0, token = 0;
  const clock = new THREE.Clock();
  const obs = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.05 });
  obs.observe(canvas);
  canvas.addEventListener('pointerdown', (e) => { drag = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointerup', (e) => { drag = false; try { canvas.releasePointerCapture(e.pointerId); } catch (_) {} });
  canvas.addEventListener('pointermove', (e) => { if (!drag) return; vel = (e.clientX - lastX) * 0.012; lastX = e.clientX; });
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize); resize();
  function clear() {
    if (!model) return;
    pivot.remove(model); disposeTree(model); model = null;
  }
  const api = {
    load(url, onDone) {
      const mine = ++token;
      loadCached(url, (gltf) => {
        if (!alive || mine !== token) { disposeTree(gltf.scene); return; }
        clear();
        const root = gltf.scene;
        root.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(root, true);
        const size = box.getSize(new THREE.Vector3());
        const s = 2 / Math.max(size.x, size.y, size.z);
        const wrap = new THREE.Group(); wrap.add(root); wrap.scale.setScalar(s);
        wrap.updateMatrixWorld(true);
        const pts = [];
        root.traverse((o) => {
          if (!o.isMesh) return;
          const m = o.material;
          if (m.map) { m.map.anisotropy = renderer.capabilities.getMaxAnisotropy(); m.map.colorSpace = THREE.SRGBColorSpace; }
          m.side = THREE.DoubleSide;
          const g = o.geometry, pos = g.attributes.position;
          const step = Math.max(1, Math.floor(pos.count / 9000));
          const v = new THREE.Vector3();
          for (let i = 0; i < pos.count; i += step) { v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld); pts.push(v.clone()); }
        });
        const bb = new THREE.Box3().setFromObject(wrap, true);
        const ys = pts.map(p => p.y).sort((a, b) => a - b);
        const yTop = ys[Math.floor(ys.length * 0.998)] || bb.max.y;
        const cut = bb.min.y + (yTop - bb.min.y) * 0.22;      // deja fuera la mesa
        const up = pts.filter(p => p.y > cut);
        const pct = (arr, q) => { const c = arr.slice().sort((m, n) => m - n); return c[Math.min(c.length - 1, Math.max(0, Math.floor(q * (c.length - 1))))]; };
        const mx = up.length ? pct(up.map(p => p.x), 0.5) : 0, mz = up.length ? pct(up.map(p => p.z), 0.5) : 0;
        const rr = up.map(p => Math.hypot(p.x - mx, p.z - mz));
        const rad = up.length ? pct(rr, 0.97) : bb.getSize(new THREE.Vector3()).length() / 2;
        const yB = up.length ? pct(up.map(p => p.y), 0.004) : bb.min.y;
        const half = Math.max(rad, (yTop - yB) * 0.62);
        wrap.position.sub(new THREE.Vector3(mx, Math.min(bb.min.y, yB), mz));
        pivot.add(wrap);
        model = wrap;
        const dist = (half / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.22;
        const cy = (yTop - Math.min(bb.min.y, yB)) * 0.52;
        camera.position.set(0, cy + dist * 0.40, dist);
        camera.lookAt(0, cy * 0.95, 0);
        glow.scale.setScalar(Math.max(1, rad * 1.7));
        fade = 0;
        onDone && onDone();
      }, () => onDone && onDone(new Error('load')));
    },
    dispose() { alive = false; obs.disconnect(); window.removeEventListener('resize', resize); clear(); renderer.dispose(); },
  };
  (function loop() {
    if (!alive) return;
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible || document.hidden || !model) return;
    if (!drag) vel *= 0.93;
    spin += vel + (reduceMotion() ? 0 : dt * 0.28);
    pivot.rotation.y = spin;
    fade = Math.min(1, fade + dt * 1.6);
    pivot.scale.setScalar(0.82 + 0.18 * (1 - Math.pow(1 - fade, 3)));
    pivot.position.y = (1 - fade) * -0.12;
    renderer.render(scene, camera);
  })();
  return api;
}

/* ---------------------------------------------------------
   4. RETRATO CON PROFUNDIDAD (biografías)
   Cada píxel se desplaza según su mapa de profundidad: al mover el
   cursor la cara se adelanta y el contorno se queda atrás, como al
   recorrer un modelo 3D.
   --------------------------------------------------------- */
export function createDepthPortrait(canvas, imgUrl, depthUrl, onReady) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' }); }
  catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const u = { uImg: { value: null }, uDepth: { value: null }, uMouse: { value: new THREE.Vector2() }, uFit: { value: new THREE.Vector2(1, 1) } };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, transparent: true,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */`
      uniform sampler2D uImg, uDepth; uniform vec2 uMouse, uFit; varying vec2 vUv;
      void main(){
        // la imagen se ajusta al ancho y se apoya en el borde inferior
        vec2 uv = vec2(vUv.x, vUv.y * uFit.y);
        vec2 off = vec2(0.0);
        for (int i = 0; i < 4; i++) { float d = texture2D(uDepth, uv + off).r; off = uMouse * (d - 0.32) * 0.045; }
        vec2 p = uv + off;
        if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) discard;
        vec4 c = texture2D(uImg, p);
        float d = texture2D(uDepth, p).r;
        c.rgb *= 0.9 + 0.18 * d;              // lo que está más cerca recibe un poco más de luz
        gl_FragColor = c;
      }`,
  });
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  const L = new THREE.TextureLoader();
  let loaded = 0, imgAspect = 0.75, alive = true, visible = false;
  const done = () => { if (++loaded === 2) { resize(); onReady && onReady(); } };
  const prep = (t) => { t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
  L.load(imgUrl, (t) => { u.uImg.value = prep(t); imgAspect = t.image.width / t.image.height; done(); });
  L.load(depthUrl, (t) => { u.uDepth.value = prep(t); done(); });
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    u.uFit.value.set(1, (w / h) / imgAspect);     // >1: sobra espacio arriba (transparente)
  };
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(canvas);
  const target = new THREE.Vector2(), cur = new THREE.Vector2();
  let t = 0, last = performance.now();
  (function loop(now) {
    if (!alive) return;
    requestAnimationFrame(loop);
    if (!visible || document.hidden || loaded < 2) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    const idle = target.lengthSq() === 0 && !reduceMotion();
    const goal = idle ? new THREE.Vector2(Math.sin(t * 0.6) * 0.35, Math.sin(t * 0.43) * 0.15) : target;
    cur.lerp(goal, Math.min(1, dt * 5));
    u.uMouse.value.copy(cur);
    renderer.render(scene, cam);
  })(performance.now());
  return {
    point(x, y) { target.set(x, y); },     // -1..1
    release() { target.set(0, 0); },
    dispose() { alive = false; ro.disconnect(); io.disconnect(); renderer.dispose(); },
  };
}
