"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface WebGLJointProps {
  length: number;
  flare?: boolean;
  onClick?: () => void;
}

const MIN_BURN = 0.2;
const EASE = 0.14;
const SETTLED = 0.0015;

const EMBER_COLOR = new THREE.Color(0xd44410);
const EMBER_HOT = new THREE.Color(0xffa030);
const ASH_COLOR = new THREE.Color(0x1d1a16);

const SMOKE_MAX = 180;
const SMOKE_LIFE_MS = 3400;

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

export default function WebGLJoint({
  length,
  flare = false,
  onClick,
}: WebGLJointProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetLengthRef = useRef(length);
  const flareEndRef = useRef(0);
  const burstQueueRef = useRef(0);

  targetLengthRef.current = length;
  useEffect(() => {
    if (flare) {
      flareEndRef.current = performance.now() + 480;
      burstQueueRef.current += 16;
    }
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
    const camera = new THREE.PerspectiveCamera(32, initial.w / initial.h, 0.1, 100);
    camera.position.set(0, 0.6, 7.5);
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

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    const key = new THREE.DirectionalLight(0xfff1dc, 0.85);
    key.position.set(3, 4, 5);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xbad2ff, 0.35);
    rim.position.set(-3, 1, -2);
    scene.add(rim);

    const emberLight = new THREE.PointLight(0xff5820, 1.0, 1.8, 2);
    scene.add(emberLight);

    const smokeTex = makeSmokeTexture();

    // Ember overlays — facing +X (aligned to burn plane at the lit end)
    const tipGroup = new THREE.Group();
    tipGroup.visible = false;
    scene.add(tipGroup);

    // Squashed-sphere ember — visible from any camera angle
    const emberGeom = new THREE.SphereGeometry(1, 24, 16);
    const emberMat = new THREE.MeshStandardMaterial({
      color: EMBER_COLOR,
      emissive: EMBER_COLOR,
      emissiveIntensity: 2.4,
      roughness: 0.45,
    });
    const ember = new THREE.Mesh(emberGeom, emberMat);
    tipGroup.add(ember);

    // Dark ash core inside the ember glow
    const ashGeom = new THREE.SphereGeometry(1, 16, 12);
    const ashMat = new THREE.MeshStandardMaterial({
      color: ASH_COLOR,
      roughness: 1,
    });
    const ash = new THREE.Mesh(ashGeom, ashMat);
    tipGroup.add(ash);

    // Hot white-yellow core, pulses
    const coreGeom = new THREE.SphereGeometry(1, 16, 12);
    const coreMat = new THREE.MeshBasicMaterial({
      color: EMBER_HOT,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeom, coreMat);
    tipGroup.add(core);

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

    // ===== SMOKE =====
    const positions = new Float32Array(SMOKE_MAX * 3);
    const velocities = new Float32Array(SMOKE_MAX * 3);
    const lifetimes = new Float32Array(SMOKE_MAX);
    const starts = new Float32Array(SMOKE_MAX);
    const sizes = new Float32Array(SMOKE_MAX);
    const alphas = new Float32Array(SMOKE_MAX);

    const smokeGeom = new THREE.BufferGeometry();
    smokeGeom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    smokeGeom.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    smokeGeom.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

    const smokeMat = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: smokeTex },
        pixelRatio: { value: renderer.getPixelRatio() },
      },
      vertexShader: `
        attribute float size;
        attribute float alpha;
        varying float vAlpha;
        uniform float pixelRatio;
        void main() {
          vAlpha = alpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * pixelRatio * (200.0 / -mv.z);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        varying float vAlpha;
        void main() {
          vec4 c = texture2D(map, gl_PointCoord);
          gl_FragColor = vec4(c.rgb, c.a * vAlpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    const smokePoints = new THREE.Points(smokeGeom, smokeMat);
    scene.add(smokePoints);

    let smokeCursor = 0;
    const spawnSmoke = (pos: THREE.Vector3, burst: boolean) => {
      const count = burst ? 5 : 1;
      for (let k = 0; k < count; k++) {
        const i = smokeCursor;
        smokeCursor = (smokeCursor + 1) % SMOKE_MAX;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.06;
        positions[i * 3]     = pos.x + Math.cos(angle) * r;
        positions[i * 3 + 1] = pos.y + 0.03;
        positions[i * 3 + 2] = pos.z + Math.sin(angle) * r;
        velocities[i * 3]     = (Math.random() - 0.5) * (burst ? 0.010 : 0.003);
        velocities[i * 3 + 1] = 0.008 + Math.random() * 0.012 + (burst ? 0.006 : 0);
        velocities[i * 3 + 2] = (Math.random() - 0.5) * (burst ? 0.010 : 0.003);
        sizes[i] = 22 + Math.random() * 22 + (burst ? 10 : 0);
        lifetimes[i] = SMOKE_LIFE_MS * (0.8 + Math.random() * 0.4);
        starts[i] = performance.now();
      }
    };

    // ===== LOAD MODEL =====
    // Clip plane in world coords: clips x < constant (removes LEFT / twist side as burn advances)
    const clipPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 999);
    const clippingPlanes = [clipPlane];

    let model: THREE.Group | null = null;
    let modelMinX = 0;
    let modelMaxX = 0;

    const loader = new GLTFLoader();
    loader.load(
      "/joint.glb",
      (gltf) => {
        model = gltf.scene;

        // Dig into the model structure
        const pre = new THREE.Box3().setFromObject(model);
        const preSize = pre.getSize(new THREE.Vector3());
        console.log("[joint] native bbox size:", preSize.x.toFixed(3), preSize.y.toFixed(3), preSize.z.toFixed(3));

        const meshes: Array<{ name: string; size: THREE.Vector3; matName: string }> = [];
        model.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const m = obj as THREE.Mesh;
            const b = new THREE.Box3().setFromObject(m);
            const s = b.getSize(new THREE.Vector3());
            const mat = Array.isArray(m.material) ? m.material[0] : m.material;
            meshes.push({ name: m.name, size: s, matName: (mat as THREE.Material)?.name || "?" });
          }
        });
        console.log("[joint] meshes:", meshes.map(m => `${m.name}(${m.matName}) ${m.size.x.toFixed(2)}x${m.size.y.toFixed(2)}x${m.size.z.toFixed(2)}`).join(" | "));

        // Long axis
        const dims: Array<"x" | "y" | "z"> = ["x", "y", "z"];
        const longAxis = dims[
          [preSize.x, preSize.y, preSize.z].indexOf(
            Math.max(preSize.x, preSize.y, preSize.z)
          )
        ];
        console.log("[joint] long axis:", longAxis);

        // Rotate so long axis is X (horizontal)
        if (longAxis === "y") {
          model.rotation.z = -Math.PI / 2;
        } else if (longAxis === "z") {
          model.rotation.y = Math.PI / 2;
        }
        model.updateMatrixWorld(true);

        // Scale to span ~5.5 units along X
        const bbox = new THREE.Box3().setFromObject(model);
        const size = bbox.getSize(new THREE.Vector3());
        console.log("[joint] post-rotate size:", size.x.toFixed(3), size.y.toFixed(3), size.z.toFixed(3));
        model.scale.setScalar(5.5 / size.x);
        model.updateMatrixWorld(true);

        // Center
        const bbox2 = new THREE.Box3().setFromObject(model);
        model.position.sub(bbox2.getCenter(new THREE.Vector3()));
        model.updateMatrixWorld(true);

        // Determine which end is the twist/lit end (narrower cross-section near extreme)
        const bb = new THREE.Box3().setFromObject(model);
        const sampleRadiusAtX = (x: number, band: number) => {
          let maxR = 0;
          model!.traverse((obj) => {
            if ((obj as THREE.Mesh).isMesh) {
              const mesh = obj as THREE.Mesh;
              const geom = mesh.geometry as THREE.BufferGeometry;
              const pos = geom.attributes.position;
              if (!pos) return;
              const mat = mesh.matrixWorld;
              const v = new THREE.Vector3();
              for (let i = 0; i < pos.count; i++) {
                v.fromBufferAttribute(pos, i).applyMatrix4(mat);
                if (Math.abs(v.x - x) < band) {
                  const r = Math.sqrt(v.y * v.y + v.z * v.z);
                  if (r > maxR) maxR = r;
                }
              }
            }
          });
          return maxR;
        };

        // Sample at multiple depths to reliably detect the tapering (twist) end
        const leftClose = sampleRadiusAtX(bb.min.x + 0.08, 0.06);
        const leftInner = sampleRadiusAtX(bb.min.x + 0.4, 0.1);
        const rightClose = sampleRadiusAtX(bb.max.x - 0.08, 0.06);
        const rightInner = sampleRadiusAtX(bb.max.x - 0.4, 0.1);
        console.log("[joint] radii -X close/inner:", leftClose.toFixed(3), leftInner.toFixed(3),
          "+X close/inner:", rightClose.toFixed(3), rightInner.toFixed(3));

        // Twist end has rapid taper: close-to-edge radius much smaller than a bit inside.
        // Filter end is ~cylindrical: close and inner radii similar.
        const leftTaperRatio = leftInner > 0 ? leftClose / leftInner : 1;
        const rightTaperRatio = rightInner > 0 ? rightClose / rightInner : 1;
        console.log("[joint] taper ratios -X:", leftTaperRatio.toFixed(3),
          "+X:", rightTaperRatio.toFixed(3));

        // Lower taper ratio = more tapered = twist/lit end. Put it on -X (LEFT for viewer).
        if (rightTaperRatio < leftTaperRatio) {
          model.rotation.y += Math.PI;
          model.updateMatrixWorld(true);
          const bbFlip = new THREE.Box3().setFromObject(model);
          model.position.sub(bbFlip.getCenter(new THREE.Vector3()));
          model.updateMatrixWorld(true);
          console.log("[joint] flipped so twist/lit end is on -X (left)");
        } else {
          console.log("[joint] no flip needed — twist already on -X");
        }

        // Final bbox for burn
        const final = new THREE.Box3().setFromObject(model);
        modelMinX = final.min.x;
        modelMaxX = final.max.x;
        console.log("[joint] final X range:", modelMinX.toFixed(3), "→", modelMaxX.toFixed(3));

        // Apply clipping to all materials
        model.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              if (m) {
                (m as THREE.Material).clippingPlanes = clippingPlanes;
                (m as THREE.Material).clipShadows = true;
              }
            });
          }
        });

        scene.add(model);
        tipGroup.visible = true;
      },
      undefined,
      (err) => {
        console.error("Failed to load joint.glb:", err);
      }
    );

    // ===== ANIMATION =====
    let animLength = targetLengthRef.current;
    let rafId = 0;

    const update = () => {
      const now = performance.now();
      const diff = targetLengthRef.current - animLength;
      animLength += Math.abs(diff) > SETTLED ? diff * EASE : diff;

      if (model) {
        const burnFrac = Math.max(animLength, MIN_BURN);
        const modelLen = modelMaxX - modelMinX;
        // Twist/lit end is on -X. Burn consumes -X side as length decreases.
        // burnFrac=1 → burnX = modelMinX (no clipping). burnFrac=0.2 → burnX near modelMaxX.
        const burnX = modelMaxX - modelLen * burnFrac;
        clipPlane.constant = -burnX; // plane eq: x + constant < 0 → x < burnX clipped

        // Burn radius at the burn plane (narrower near twist tip)
        const tBurn = 1 - (burnX - modelMinX) / modelLen; // 0 at filter, 1 at twist
        const burnR = 0.22 - 0.12 * tBurn; // fuller when burning wide body, thinner at twist

        // Position the ember assembly at the burn plane
        tipGroup.position.set(burnX, 0, 0);

        // Ember plug — thin along X, round in YZ. Sits at burn tip.
        ember.position.set(-0.01, 0, 0);
        ember.scale.set(0.035, burnR * 1.05, burnR * 1.05);

        // Ash plug slightly inset to -X (the consumed side)
        ash.position.set(-0.03, 0, 0);
        ash.scale.set(0.03, burnR * 0.85, burnR * 0.85);

        const flaring = now < flareEndRef.current;
        const pulse = 0.75 + Math.sin(now * 0.007) * 0.25;

        // Hot core slightly in front of ember (more visible)
        core.position.set(0.002, 0, 0);
        const coreR = burnR * (flaring ? 0.7 : 0.45) * pulse;
        core.scale.set(0.025, coreR, coreR);
        coreMat.opacity = flaring ? 0.85 : 0.42 * pulse;
        (coreMat.color as THREE.Color).copy(flaring ? EMBER_HOT : EMBER_COLOR).lerp(EMBER_HOT, flaring ? 1 : 0.4);

        emberMat.emissive.copy(EMBER_COLOR).lerp(EMBER_HOT, flaring ? 0.8 : 0.3);
        emberMat.emissiveIntensity = (flaring ? 3.6 : 2.0) * (0.92 + pulse * 0.08);

        glow.position.set(-0.02, 0, 0);
        const glowS = burnR * (flaring ? 5.0 : 3.0);
        glow.scale.set(glowS, glowS, 1);
        glowMat.opacity = flaring ? 0.55 : 0.32 + Math.sin(now * 0.005) * 0.04;

        emberLight.position.set(burnX - 0.1, 0.05, 0.15);
        emberLight.intensity = flaring ? 2.2 : 0.95 * (0.9 + pulse * 0.1);
        emberLight.color.copy(flaring ? EMBER_HOT : EMBER_COLOR);

        // Subtle sway
        const sway = Math.sin(now * 0.0007) * 0.015;
        model.rotation.y = sway;

        // Smoke spawns at burn, rises straight up
        if (animLength > MIN_BURN + 0.001) {
          if (Math.random() < (flaring ? 0.32 : 0.14)) {
            spawnSmoke(new THREE.Vector3(burnX, 0, 0), false);
          }
          while (burstQueueRef.current > 0) {
            spawnSmoke(new THREE.Vector3(burnX, 0, 0), true);
            burstQueueRef.current--;
          }
        }
      }

      for (let i = 0; i < SMOKE_MAX; i++) {
        if (lifetimes[i] <= 0) { alphas[i] = 0; continue; }
        const age = now - starts[i];
        if (age > lifetimes[i]) {
          lifetimes[i] = 0;
          alphas[i] = 0;
          continue;
        }
        const t = age / lifetimes[i];
        positions[i * 3]     += velocities[i * 3];
        positions[i * 3 + 1] += velocities[i * 3 + 1];
        positions[i * 3 + 2] += velocities[i * 3 + 2];
        velocities[i * 3 + 1] *= 0.996;
        velocities[i * 3]     += (Math.random() - 0.5) * 0.0006;
        velocities[i * 3 + 2] += (Math.random() - 0.5) * 0.0006;
        sizes[i] += 0.28;
        alphas[i] = (t < 0.2 ? t / 0.2 : 1 - (t - 0.2) / 0.8) * 0.4;
      }
      smokeGeom.attributes.position.needsUpdate = true;
      smokeGeom.attributes.alpha.needsUpdate = true;
      smokeGeom.attributes.size.needsUpdate = true;

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
      emberGeom.dispose();
      emberMat.dispose();
      ashGeom.dispose();
      ashMat.dispose();
      coreGeom.dispose();
      coreMat.dispose();
      smokeGeom.dispose();
      smokeMat.dispose();
      glowMat.dispose();
      smokeTex.dispose();
      if (model) {
        model.traverse((obj) => {
          if ((obj as THREE.Mesh).isMesh) {
            const mesh = obj as THREE.Mesh;
            mesh.geometry.dispose();
            const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => m && (m as THREE.Material).dispose());
          }
        });
      }
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
