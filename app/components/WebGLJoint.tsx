"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { JointPhase } from "../hooks/useServerStream";

interface WebGLJointProps {
  length: number;
  phase: JointPhase;
  rollingStartedAt: number;
  flare?: boolean;
  onClick?: () => void;
}

// ========== DIMENSIONS ==========
const PAPER_LEN = 3.8;
const PAPER_R_LIT = 0.22; // wide end on -X (lit)
const PAPER_R_FILTER = 0.14; // narrow end on +X (meets filter)
const FILTER_LEN = 0.58;
const FILTER_R = 0.135;
const TWIST_H = 0.32;
const TWIST_R = 0.17;

const PAPER_MIN_X = -PAPER_LEN / 2; // -1.9 (lit)
const PAPER_MAX_X = PAPER_LEN / 2; //  +1.9 (filter side)
const FILTER_CENTER_X = PAPER_MAX_X + FILTER_LEN / 2 - 0.02;
const TWIST_CENTER_X = PAPER_MIN_X - TWIST_H / 2 + 0.02;

const FILTER_LINE = 0.2;
const ROLL_DURATION = 2200;
const IGNITE_DURATION = 500;
const FLARE_DURATION = 480;

const EASE = 0.08;
const SETTLED = 0.0015;

// ========== COLORS ==========
const EMBER_WARM = new THREE.Color(0xd44410);
const EMBER_HOT = new THREE.Color(0xffb040);
const EMBER_COOL = new THREE.Color(0x7a2a10);
const ASH_COLOR = new THREE.Color(0x1c1813);
const HERB_COLOR = new THREE.Color(0x2a3b1a);
const PAPER_COLOR = new THREE.Color(0xece4cb);
const FILTER_COLOR = new THREE.Color(0xc7a478);

const SMOKE_MAX = 200;
const SMOKE_LIFE_MS = 3200;

// ========== HELPERS ==========
function paperRadiusAt(x: number): number {
  // Lerp from LIT (wide) to FILTER (narrow)
  const t = Math.max(0, Math.min(1, (x - PAPER_MIN_X) / PAPER_LEN));
  return PAPER_R_LIT + (PAPER_R_FILTER - PAPER_R_LIT) * t;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function makeSmokeTexture(): THREE.CanvasTexture {
  const size = 64;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,0.85)");
  g.addColorStop(0.45, "rgba(230,230,230,0.3)");
  g.addColorStop(1, "rgba(210,210,210,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

function makeFlameTexture(): THREE.CanvasTexture {
  const w = 64;
  const h = 96;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  // Flame teardrop: bright yellow core → orange → transparent
  const g = ctx.createRadialGradient(w / 2, h * 0.7, 0, w / 2, h * 0.55, w * 0.5);
  g.addColorStop(0, "rgba(255,245,200,1)");
  g.addColorStop(0.25, "rgba(255,200,80,0.95)");
  g.addColorStop(0.6, "rgba(255,110,30,0.6)");
  g.addColorStop(1, "rgba(180,60,10,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.6, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  // Teardrop top
  ctx.beginPath();
  ctx.moveTo(w / 2 - 8, h * 0.55);
  ctx.quadraticCurveTo(w / 2, h * 0.05, w / 2 + 8, h * 0.55);
  ctx.fillStyle = "rgba(255,180,50,0.85)";
  ctx.fill();
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

function makePaperTexture(): THREE.CanvasTexture {
  // Tall strip texture — wraps around the cylinder (wrapS repeating)
  const w = 512;
  const h = 1024;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;

  // Cream base
  ctx.fillStyle = "#ede6d1";
  ctx.fillRect(0, 0, w, h);

  // Herb visible through translucent paper — denser down the "middle" (front)
  const herb = ctx.createLinearGradient(0, 0, w, 0);
  herb.addColorStop(0, "rgba(66,94,42,0)");
  herb.addColorStop(0.25, "rgba(72,100,48,0.18)");
  herb.addColorStop(0.5, "rgba(56,80,32,0.34)");
  herb.addColorStop(0.75, "rgba(72,100,48,0.18)");
  herb.addColorStop(1, "rgba(66,94,42,0)");
  ctx.fillStyle = herb;
  ctx.fillRect(0, 0, w, h);

  // Herb flecks (darker spots)
  for (let i = 0; i < 240; i++) {
    const x = w * 0.18 + Math.random() * w * 0.64;
    const y = Math.random() * h;
    const r = 2 + Math.random() * 5;
    const alpha = 0.08 + Math.random() * 0.16;
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(40,60,24,${alpha})`);
    grd.addColorStop(1, "rgba(40,60,24,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.75, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Fine paper grain
  const img = ctx.getImageData(0, 0, w, h);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 9;
    img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
    img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
    img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
  }
  ctx.putImageData(img, 0, 0);

  // Diagonal glue seam
  ctx.strokeStyle = "rgba(170,158,128,0.42)";
  ctx.setLineDash([3, 7]);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(w * 0.78, 0);
  ctx.lineTo(w * 0.58, h);
  ctx.stroke();
  ctx.setLineDash([]);

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function makeFilterTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 64;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;

  const bg = ctx.createLinearGradient(0, 0, w, 0);
  bg.addColorStop(0, "#a88354");
  bg.addColorStop(0.5, "#d6b082");
  bg.addColorStop(1, "#a88354");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Horizontal ridges (RAW crutch look)
  ctx.strokeStyle = "rgba(90,60,25,0.55)";
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 9; i++) {
    const y = (i / 9) * h + h / 18;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

export default function WebGLJoint({
  length,
  phase,
  rollingStartedAt,
  flare = false,
  onClick,
}: WebGLJointProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const lengthTargetRef = useRef(length);
  const phaseRef = useRef<JointPhase>(phase);
  const rollingStartedAtRef = useRef(rollingStartedAt);
  const flareEndRef = useRef(0);
  const ignitingStartRef = useRef(0);
  const prevPhaseRef = useRef<JointPhase>(phase);

  lengthTargetRef.current = length;
  phaseRef.current = phase;
  rollingStartedAtRef.current = rollingStartedAt;

  // Detect unlit → lit to trigger the client-only "igniting" micro-phase
  useEffect(() => {
    if (prevPhaseRef.current === "unlit" && phase === "lit") {
      ignitingStartRef.current = performance.now();
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    if (flare) flareEndRef.current = performance.now() + FLARE_DURATION;
  }, [flare]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const getSize = () => ({
      w: mount.clientWidth || window.innerWidth,
      h: mount.clientHeight || window.innerHeight,
    });
    const initial = getSize();

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(26, initial.w / initial.h, 0.1, 100);
    camera.position.set(0, 0.45, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initial.w, initial.h);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.localClippingEnabled = true;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // ====== LIGHTING ======
    scene.add(new THREE.AmbientLight(0xffffff, 0.58));

    const key = new THREE.DirectionalLight(0xfff1dc, 0.85);
    key.position.set(3, 4, 5);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xbcd0ff, 0.32);
    rim.position.set(-3, 1, -2);
    scene.add(rim);

    const emberLight = new THREE.PointLight(EMBER_WARM, 0, 2.2, 2);
    scene.add(emberLight);

    // ====== TEXTURES ======
    const paperTex = makePaperTexture();
    const filterTex = makeFilterTexture();
    const smokeTex = makeSmokeTexture();
    const flameTex = makeFlameTexture();

    // ====== JOINT GROUP ======
    const jointGroup = new THREE.Group();
    scene.add(jointGroup);

    // ----- Paper body (cone-shaped cylinder, along X) -----
    // cylinder is created along Y, rotated around Z by π/2 so wide end ends up at -X
    const paperGeom = new THREE.CylinderGeometry(
      PAPER_R_LIT, // top (at +Y originally, goes to -X after rotation)
      PAPER_R_FILTER, // bottom (at -Y, goes to +X)
      PAPER_LEN,
      72,
      6,
      true // open-ended — cut face handled by separate herb-cap mesh
    );

    // Clip plane: world-space. Clips x < constant.
    const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -PAPER_MIN_X + 1);
    const clippingPlanes = [clipPlane];

    const paperMat = new THREE.MeshStandardMaterial({
      map: paperTex,
      color: PAPER_COLOR,
      roughness: 0.84,
      metalness: 0,
      clippingPlanes,
      clipShadows: true,
      side: THREE.FrontSide,
    });
    const paper = new THREE.Mesh(paperGeom, paperMat);
    paper.rotation.z = Math.PI / 2;
    jointGroup.add(paper);

    // ----- Filter (crutch) -----
    const filterGeom = new THREE.CylinderGeometry(FILTER_R, FILTER_R, FILTER_LEN, 48);
    const filterMat = new THREE.MeshStandardMaterial({
      map: filterTex,
      color: FILTER_COLOR,
      roughness: 0.95,
      metalness: 0,
    });
    const filter = new THREE.Mesh(filterGeom, filterMat);
    filter.rotation.z = Math.PI / 2;
    filter.position.x = FILTER_CENTER_X;
    jointGroup.add(filter);

    // Tiny dark band where paper meets filter
    const seamGeom = new THREE.CylinderGeometry(FILTER_R + 0.003, PAPER_R_FILTER + 0.003, 0.04, 48);
    const seamMat = new THREE.MeshStandardMaterial({ color: 0x6e4e2a, roughness: 1 });
    const seam = new THREE.Mesh(seamGeom, seamMat);
    seam.rotation.z = Math.PI / 2;
    seam.position.x = PAPER_MAX_X - 0.005;
    jointGroup.add(seam);

    // ----- Twist tip (only visible in unlit + rolling rebuild) -----
    const twistGeom = new THREE.ConeGeometry(TWIST_R, TWIST_H, 24);
    const twistMat = new THREE.MeshStandardMaterial({
      color: 0xe8e0c6,
      roughness: 0.88,
      metalness: 0,
    });
    const twist = new THREE.Mesh(twistGeom, twistMat);
    twist.rotation.z = Math.PI / 2; // point along -X
    twist.position.x = TWIST_CENTER_X;
    jointGroup.add(twist);

    // ====== EMBER / ASH / HERB-CAP group (positioned at burn plane) ======
    const tipGroup = new THREE.Group();
    jointGroup.add(tipGroup);

    // Herb-cap: disc at burn plane showing dark-olive herb interior (instead of hollow paper)
    const herbCapGeom = new THREE.CircleGeometry(1, 48);
    const herbCapMat = new THREE.MeshStandardMaterial({
      color: HERB_COLOR,
      roughness: 0.95,
      emissive: 0x1a2410,
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide,
    });
    const herbCap = new THREE.Mesh(herbCapGeom, herbCapMat);
    herbCap.rotation.y = -Math.PI / 2; // face -X
    tipGroup.add(herbCap);

    // Ash ellipsoid (slightly larger than paper radius → peeks around the paper edge as a dark rim)
    const ashGeom = new THREE.SphereGeometry(1, 24, 14);
    const ashMat = new THREE.MeshStandardMaterial({
      color: ASH_COLOR,
      roughness: 1,
      metalness: 0,
    });
    const ash = new THREE.Mesh(ashGeom, ashMat);
    tipGroup.add(ash);

    // Ember ellipsoid — emissive band around the paper edge
    const emberGeom = new THREE.SphereGeometry(1, 24, 14);
    const emberMat = new THREE.MeshStandardMaterial({
      color: EMBER_WARM,
      emissive: EMBER_WARM,
      emissiveIntensity: 2.4,
      roughness: 0.5,
      metalness: 0,
      transparent: true,
      opacity: 1,
    });
    const ember = new THREE.Mesh(emberGeom, emberMat);
    tipGroup.add(ember);

    // Hot core — additive blend, brighter yellow center
    const coreMat = new THREE.SpriteMaterial({
      map: smokeTex,
      color: EMBER_HOT,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Sprite(coreMat);
    tipGroup.add(core);

    // Glow halo
    const glowMat = new THREE.SpriteMaterial({
      map: smokeTex,
      color: 0xff8a40,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Sprite(glowMat);
    tipGroup.add(glow);

    // Igniting flame — only visible during igniting micro-phase
    const flameMat = new THREE.SpriteMaterial({
      map: flameTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const flame = new THREE.Sprite(flameMat);
    flame.scale.set(0.5, 0.75, 1);
    flame.visible = false;
    tipGroup.add(flame);

    // ====== SMOKE (independent of jointGroup so it doesn't spin during rolling) ======
    const positions = new Float32Array(SMOKE_MAX * 3);
    const velocities = new Float32Array(SMOKE_MAX * 3);
    const lifetimes = new Float32Array(SMOKE_MAX);
    const starts = new Float32Array(SMOKE_MAX);
    const sizes = new Float32Array(SMOKE_MAX);
    const alphas = new Float32Array(SMOKE_MAX);
    const grays = new Float32Array(SMOKE_MAX); // 1 = white smoke, 0.5 = gray (roach)

    const smokeGeom = new THREE.BufferGeometry();
    smokeGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    smokeGeom.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    smokeGeom.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));
    smokeGeom.setAttribute("gray", new THREE.BufferAttribute(grays, 1));

    const smokeMat = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: smokeTex },
        pixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        attribute float gray;
        varying float vAlpha;
        varying float vGray;
        uniform float pixelRatio;
        void main() {
          vAlpha = alpha;
          vGray = gray;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pixelRatio * (200.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        varying float vAlpha;
        varying float vGray;
        void main() {
          vec4 c = texture2D(map, gl_PointCoord);
          vec3 tint = mix(vec3(0.55), vec3(1.0), vGray);
          gl_FragColor = vec4(c.rgb * tint, c.a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const smokePoints = new THREE.Points(smokeGeom, smokeMat);
    scene.add(smokePoints);

    let smokeCursor = 0;
    const spawnSmoke = (worldPos: THREE.Vector3, graynessMul: number, burst: boolean) => {
      const count = burst ? 4 : 1;
      for (let k = 0; k < count; k++) {
        const i = smokeCursor;
        smokeCursor = (smokeCursor + 1) % SMOKE_MAX;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.05;
        positions[i * 3] = worldPos.x + Math.cos(angle) * r;
        positions[i * 3 + 1] = worldPos.y + 0.04;
        positions[i * 3 + 2] = worldPos.z + Math.sin(angle) * r;
        velocities[i * 3] = (Math.random() - 0.5) * (burst ? 0.010 : 0.003);
        velocities[i * 3 + 1] = 0.008 + Math.random() * 0.012 + (burst ? 0.005 : 0);
        velocities[i * 3 + 2] = (Math.random() - 0.5) * (burst ? 0.010 : 0.003);
        sizes[i] = 22 + Math.random() * 20 + (burst ? 10 : 0);
        lifetimes[i] = SMOKE_LIFE_MS * (0.8 + Math.random() * 0.4);
        starts[i] = performance.now();
        grays[i] = graynessMul;
      }
    };

    // ====== ANIMATION LOOP ======
    // displayLength is eased toward the effective length target, which depends on phase.
    let displayLength = lengthTargetRef.current;
    let rafId = 0;

    const update = () => {
      const now = performance.now();
      const currentPhase = phaseRef.current;

      // Effective length target — phase-dependent
      let targetLen = lengthTargetRef.current;
      if (currentPhase === "rolling") {
        const p = Math.max(0, Math.min(1, (now - rollingStartedAtRef.current) / ROLL_DURATION));
        const easedP = smoothstep(0, 1, p);
        targetLen = lerp(FILTER_LINE, 1.0, easedP);
      } else if (currentPhase === "unlit") {
        targetLen = 1.0;
      }

      const diff = targetLen - displayLength;
      displayLength += Math.abs(diff) > SETTLED ? diff * EASE : diff;

      // Igniting micro-phase (client-only)
      let ignitingP = 0;
      const inIgniting =
        ignitingStartRef.current > 0 && now - ignitingStartRef.current < IGNITE_DURATION;
      if (inIgniting) {
        ignitingP = (now - ignitingStartRef.current) / IGNITE_DURATION;
      }

      // Compute burn X from visual length
      const burnX = PAPER_MIN_X + (1 - displayLength) * PAPER_LEN;
      clipPlane.constant = -burnX;

      // Radius at the burn
      const burnR = paperRadiusAt(burnX);

      // Position tip/ember assembly at burn plane
      tipGroup.position.set(burnX, 0, 0);

      // Herb-cap disc covers the cut face
      herbCap.position.set(0.002, 0, 0);
      herbCap.scale.set(1, burnR * 0.94, burnR * 0.94);

      // Ash ellipsoid — slightly wider than paper so it rims the edge
      ash.position.set(-0.01, 0, 0);
      ash.scale.set(0.045, burnR * 1.02, burnR * 1.02);

      // Ember ellipsoid — slightly wider still, emissive rim
      ember.position.set(-0.015, 0, 0);
      ember.scale.set(0.055, burnR * 1.09, burnR * 1.09);

      // Pulse & flare
      const flaring = now < flareEndRef.current;
      const pulse = 0.82 + Math.sin(now * 0.006) * 0.18;

      // ===== PHASE BRANCH =====
      // Defaults
      let emberTargetOpacity = 0;
      let emberColor = EMBER_WARM;
      let emberIntensity = 0;
      let glowOpacity = 0;
      let coreOpacity = 0;
      let lightIntensity = 0;
      let emitSmoke = false;
      let smokeRate = 0;
      let smokeGray = 1;
      let twistVisible = false;
      let twistScale = 1;
      let herbCapOpacity = 0;

      if (currentPhase === "unlit") {
        twistVisible = true;
        twistScale = 1;
        emberTargetOpacity = 0;
        glowOpacity = 0;
        coreOpacity = 0;
        lightIntensity = 0;
        herbCapOpacity = 0; // no cut visible
      } else if (currentPhase === "rolling") {
        const p = Math.max(0, Math.min(1, (now - rollingStartedAtRef.current) / ROLL_DURATION));
        const ep = smoothstep(0, 1, p);
        // Ember fades out during first ~30%
        const emberFade = 1 - smoothstep(0, 0.3, p);
        emberTargetOpacity = emberFade;
        emberColor = EMBER_WARM;
        emberIntensity = 1.8 * emberFade;
        glowOpacity = 0.3 * emberFade;
        coreOpacity = 0.5 * emberFade;
        lightIntensity = 0.7 * emberFade;
        // Twist grows in the second half
        twistVisible = ep > 0.4;
        twistScale = smoothstep(0.4, 0.95, p);
        herbCapOpacity = emberFade;
        // Spin around long axis (X)
        jointGroup.rotation.x = p * Math.PI * 4;
        emitSmoke = false;
      } else if (currentPhase === "lit" || currentPhase === "roach") {
        twistVisible = false;
        herbCapOpacity = 1;

        if (inIgniting) {
          // Client-only transition: twist shrinks, ember fades in, flame flickers
          twistVisible = true;
          twistScale = 1 - ignitingP;
          emberTargetOpacity = ignitingP;
          emberColor = EMBER_HOT;
          emberIntensity = 1.0 + ignitingP * 2.2;
          glowOpacity = 0.15 + ignitingP * 0.35;
          coreOpacity = 0.3 + ignitingP * 0.5;
          lightIntensity = ignitingP * 1.4;
          herbCapOpacity = ignitingP;
          // Flame sprite shown briefly
          flame.visible = ignitingP < 0.7;
          flame.position.set(-0.08, 0.02, 0);
          flame.scale.set(0.35 * (1 - ignitingP * 0.3), 0.55 * (1 - ignitingP * 0.3), 1);
          flameMat.opacity = (1 - ignitingP) * 0.85;
          emitSmoke = true;
          smokeRate = 0.08;
          smokeGray = 1;
        } else if (currentPhase === "lit") {
          flame.visible = false;
          emberTargetOpacity = 1;
          emberColor = flaring ? EMBER_HOT : EMBER_WARM;
          emberIntensity = (flaring ? 3.4 : 2.0) * (0.92 + pulse * 0.08);
          glowOpacity = flaring ? 0.55 : 0.32 + Math.sin(now * 0.005) * 0.04;
          coreOpacity = (flaring ? 0.85 : 0.5) * pulse;
          lightIntensity = (flaring ? 2.0 : 0.95) * (0.9 + pulse * 0.1);
          emitSmoke = true;
          smokeRate = flaring ? 0.32 : 0.14;
          smokeGray = 1;
        } else {
          // roach — cooler, dimmer, grayer smoke
          flame.visible = false;
          emberTargetOpacity = 1;
          emberColor = EMBER_COOL;
          emberIntensity = 1.1 * (0.92 + pulse * 0.08);
          glowOpacity = 0.2 + Math.sin(now * 0.004) * 0.03;
          coreOpacity = 0.3 * pulse;
          lightIntensity = 0.4 * (0.9 + pulse * 0.1);
          emitSmoke = true;
          smokeRate = 0.04;
          smokeGray = 0.35;
        }
      }

      // Apply ember state
      emberMat.emissive.copy(emberColor);
      emberMat.color.copy(emberColor);
      emberMat.emissiveIntensity = emberIntensity;
      emberMat.opacity = emberTargetOpacity;
      ashMat.opacity = emberTargetOpacity;
      ashMat.transparent = emberTargetOpacity < 1;
      herbCapMat.opacity = herbCapOpacity;
      herbCapMat.transparent = herbCapOpacity < 1;

      // Ember light follows burn position (world coords — ember moves with group if jointGroup rotates)
      const emberWorld = new THREE.Vector3(burnX - 0.12, 0.05, 0.15);
      jointGroup.localToWorld(emberWorld.set(burnX - 0.12, 0.05, 0.15));
      emberLight.position.copy(emberWorld);
      emberLight.intensity = lightIntensity;
      emberLight.color.copy(emberColor);

      // Core sprite
      const coreS = burnR * (currentPhase === "lit" && flaring ? 2.6 : 1.8) * pulse;
      core.scale.set(coreS, coreS, 1);
      coreMat.opacity = coreOpacity;
      core.position.set(-0.02, 0, 0);

      // Glow sprite
      const glowS = burnR * (currentPhase === "lit" && flaring ? 4.8 : 3.0);
      glow.scale.set(glowS, glowS, 1);
      glowMat.opacity = glowOpacity;
      glow.position.set(-0.03, 0, 0);

      // Twist visibility + scale
      twist.visible = twistVisible;
      if (twistVisible) {
        twist.scale.set(twistScale, twistScale, twistScale);
      }

      // Reset joint rotation if not rolling (in case a stale roll left it offset)
      if (currentPhase !== "rolling") {
        jointGroup.rotation.x = 0;
        // Subtle sway
        jointGroup.rotation.y = Math.sin(now * 0.0006) * 0.025;
        jointGroup.rotation.z = Math.sin(now * 0.0004) * 0.012;
      }

      // Smoke spawning (in world coords so it doesn't rotate with roll — but roll phase skips spawning)
      if (emitSmoke && !inIgniting && Math.random() < smokeRate) {
        const wpos = new THREE.Vector3(burnX, 0, 0);
        jointGroup.localToWorld(wpos);
        spawnSmoke(wpos, smokeGray, false);
      } else if (inIgniting && Math.random() < smokeRate) {
        const wpos = new THREE.Vector3(burnX, 0, 0);
        jointGroup.localToWorld(wpos);
        spawnSmoke(wpos, smokeGray, false);
      }
      if (flaring && currentPhase === "lit" && Math.random() < 0.5) {
        const wpos = new THREE.Vector3(burnX, 0, 0);
        jointGroup.localToWorld(wpos);
        spawnSmoke(wpos, 1, true);
      }

      // Update smoke particles
      for (let i = 0; i < SMOKE_MAX; i++) {
        if (lifetimes[i] <= 0) {
          alphas[i] = 0;
          continue;
        }
        const age = now - starts[i];
        if (age > lifetimes[i]) {
          lifetimes[i] = 0;
          alphas[i] = 0;
          continue;
        }
        const t = age / lifetimes[i];
        positions[i * 3] += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];
        velocities[i * 3 + 1] *= 0.996;
        velocities[i * 3] += (Math.random() - 0.5) * 0.0006;
        velocities[i * 3 + 2] += (Math.random() - 0.5) * 0.0006;
        sizes[i] += 0.28;
        alphas[i] = (t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8) * 0.42;
      }
      smokeGeom.attributes.position.needsUpdate = true;
      smokeGeom.attributes.alpha.needsUpdate = true;
      smokeGeom.attributes.size.needsUpdate = true;
      smokeGeom.attributes.gray.needsUpdate = true;

      renderer.render(scene, camera);
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);

    const ro = new ResizeObserver(() => {
      const { w, h } = getSize();
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.dispose();
      paperGeom.dispose();
      paperMat.dispose();
      filterGeom.dispose();
      filterMat.dispose();
      seamGeom.dispose();
      seamMat.dispose();
      twistGeom.dispose();
      twistMat.dispose();
      herbCapGeom.dispose();
      herbCapMat.dispose();
      ashGeom.dispose();
      ashMat.dispose();
      emberGeom.dispose();
      emberMat.dispose();
      coreMat.dispose();
      glowMat.dispose();
      flameMat.dispose();
      smokeGeom.dispose();
      smokeMat.dispose();
      paperTex.dispose();
      filterTex.dispose();
      smokeTex.dispose();
      flameTex.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{ position: "absolute", inset: 0, cursor: "pointer", touchAction: "manipulation" }}
      onClick={onClick}
      role="button"
      aria-label="tap to hit the joint"
    />
  );
}
