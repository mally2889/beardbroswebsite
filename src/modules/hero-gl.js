import {
  WebGLRenderer,
  Scene,
  OrthographicCamera,
  Vector2,
  Vector3,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Clock,
} from 'three';
import { prefersReducedMotion, lerp } from './utils.js';

const frag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uRes;
  uniform vec2 uMouse;
  uniform float uIntro;
  uniform float uPull;
  uniform vec3 uInk;
  uniform vec3 uCopper;
  uniform vec3 uAmber;

  // --- simplex-style value noise + fbm ---
  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash(i), f), dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
      mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)), dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes.xy;
    vec2 p = uv;
    p.x *= uRes.x / uRes.y;

    float t = uTime * 0.06;

    // mouse influence: warp the field gently toward the pointer
    vec2 m = uMouse;
    m.x *= uRes.x / uRes.y;
    float md = length(p - m);
    vec2 pull = normalize(p - m + 0.0001) * exp(-md * 2.4) * 0.35 * uPull;

    // domain-warped fbm smoke
    vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t * 0.7));
    vec2 r = vec2(fbm(p * 1.8 + q * 1.6 + t * 0.5), fbm(p * 1.8 - q * 1.2 - t * 0.3));
    float f = fbm(p * 2.0 + r * 1.9 - pull * 2.0);

    // palette: deep ink -> ember copper -> amber highlights
    float glow = smoothstep(0.15, 0.85, f);
    vec3 col = mix(uInk, uCopper * 0.55, glow);
    col = mix(col, uAmber * 0.85, smoothstep(0.55, 0.95, f) * 0.7);

    // ember hotspot around the mouse
    col += uAmber * exp(-md * 3.2) * 0.12 * uPull;

    // vignette
    float vig = smoothstep(1.25, 0.35, length(uv - 0.5));
    col *= mix(0.65, 1.0, vig);

    // intro fade
    col *= uIntro;

    gl_FragColor = vec4(col, 1.0);
  }
`;

const vert = /* glsl */ `
  void main() { gl_Position = vec4(position, 1.0); }
`;

const hexToVec3 = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return new Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

/**
 * Mounts a full-bleed domain-warped smoke shader inside `holder`. Reusable
 * across pages with different tints so each secondary hero can carry its
 * own mood without duplicating the GLSL. Pauses off-screen and on hidden
 * tabs; falls back to a static CSS gradient with no WebGL / reduced motion.
 */
export function createShaderField(holder, opts = {}) {
  if (!holder) return null;

  const ink = opts.ink || '#0b0a08';
  const copper = opts.copper || '#c97b3c';
  const amber = opts.amber || '#e8b04b';
  const pull = opts.mouseReactive === false ? 0.3 : 1;

  if (prefersReducedMotion()) {
    holder.style.background =
      opts.fallback ||
      `radial-gradient(80% 90% at 30% 20%, ${copper}48, transparent 60%),` +
        `radial-gradient(60% 70% at 80% 80%, ${amber}24, transparent 60%), ${ink}`;
    return null;
  }

  let renderer;
  try {
    renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  } catch {
    return null; // no WebGL — the CSS gradient fallback below covers it
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  holder.appendChild(renderer.domElement);

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = {
    uTime: { value: 0 },
    uRes: { value: new Vector2(1, 1) },
    uMouse: { value: new Vector2(0.5, 0.5) },
    uIntro: { value: 0 },
    uPull: { value: pull },
    uInk: { value: hexToVec3(ink) },
    uCopper: { value: hexToVec3(copper) },
    uAmber: { value: hexToVec3(amber) },
  };
  scene.add(
    new Mesh(
      new PlaneGeometry(2, 2),
      new ShaderMaterial({ fragmentShader: frag, vertexShader: vert, uniforms })
    )
  );

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = holder;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(holder);

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
  const onMove = (e) => {
    const r = holder.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) / r.width;
    mouse.ty = 1 - (e.clientY - r.top) / r.height;
  };
  window.addEventListener('pointermove', onMove);

  let visible = true;
  const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
  io.observe(holder);

  const clock = new Clock();
  let raf;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    mouse.x = lerp(mouse.x, mouse.tx, 0.05);
    mouse.y = lerp(mouse.y, mouse.ty, 0.05);
    uniforms.uMouse.value.set(mouse.x, mouse.y);
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
  };
  tick();

  return {
    /** fade the shader in during the page's hero intro */
    reveal(duration = 2) {
      const start = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - start) / (duration * 1000));
        uniforms.uIntro.value = p * p * (3 - 2 * p);
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      renderer.dispose();
      holder.removeChild(renderer.domElement);
    },
  };
}

/** The homepage's full-viewport hero field, in its original palette. */
export function initHeroGL() {
  return createShaderField(document.querySelector('[data-hero-gl]'));
}
