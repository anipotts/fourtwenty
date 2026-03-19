"use client";

import { useRef, useEffect, useState } from "react";

interface JointImageProps {
  length: number;
  flare?: boolean;
  height?: number;
  onBurnY?: (pct: number) => void;
  onClick?: () => void;
}

const SETTLED = 0.001;
const EASE = 0.12;
const ZONES = { ash: 4, ember: 3, heat: 18, fade: 6 } as const;

export function getBurnPct(length: number): number {
  return 6 + 78 * (1 - Math.max(length, 0.20));
}

function hashNoise(x: number, y: number): number {
  return (((x * 2654435761 ^ y * 2246822519) & 0xFFFF) / 0xFFFF - 0.5) * 20;
}

export default function JointImage({
  length,
  flare = false,
  height = 400,
  onBurnY,
  onClick,
}: JointImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const animRef = useRef({ current: length, target: length });
  const flareRef = useRef(flare);
  const onBurnYRef = useRef(onBurnY);
  const rafRef = useRef<number>(0);
  const [width, setWidth] = useState(0);

  flareRef.current = flare;
  onBurnYRef.current = onBurnY;

  function render(): boolean {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !width) return false;

    let ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return false;

    const dpr = window.devicePixelRatio || 1;
    const anim = animRef.current;
    const diff = anim.target - anim.current;
    anim.current += Math.abs(diff) > SETTLED ? diff * EASE : diff;
    const isFlare = flareRef.current;

    const cw = width * dpr;
    const ch = height * dpr;
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw;
      canvas.height = ch;
    }

    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.drawImage(img, 0, 0, width, height);

    const burnPct = getBurnPct(anim.current);
    const burnY = (burnPct / 100) * height;
    onBurnYRef.current?.(burnPct);

    const { ash, ember, heat, fade } = ZONES;
    const startRow = Math.max(0, Math.floor((burnY - fade - 2) * dpr));
    const endRow = Math.min(ch, Math.ceil((burnY + ash + ember + heat + 2) * dpr));

    if (startRow > 0) ctx.clearRect(0, 0, width, startRow / dpr);

    if (endRow > startRow) {
      const regionH = endRow - startRow;
      const imageData = ctx.getImageData(0, startRow, cw, regionH);
      const px = imageData.data;

      for (let row = 0; row < regionH; row++) {
        const y = (startRow + row) / dpr;
        const d = y - burnY;

        for (let col = 0; col < cw; col++) {
          const i = (row * cw + col) * 4;
          if (px[i + 3] < 10) continue;

          if (d < -fade) {
            px[i + 3] = 0;
          } else if (d < 0) {
            const t = 1 - (-d / fade);
            px[i]   = (px[i] * 0.4 + 140 * 0.6) | 0;
            px[i+1] = (px[i+1] * 0.4 + 130 * 0.6) | 0;
            px[i+2] = (px[i+2] * 0.4 + 120 * 0.6) | 0;
            px[i+3] = (px[i+3] * t * t) | 0;
          } else if (d < ash) {
            const grey = (130 + hashNoise(col, startRow + row)) | 0;
            px[i] = grey; px[i+1] = grey - 5; px[i+2] = grey - 10;
            px[i+3] = (200 + (d / ash) * 55) | 0;
          } else if (d < ash + ember) {
            const t = (d - ash) / ember;
            const mix = 1 - t * 0.6;
            px[i]   = (px[i] * (1-mix) + (isFlare ? 255 : 200) * mix) | 0;
            px[i+1] = (px[i+1] * (1-mix) + (isFlare ? 120+t*40 : 70+t*40) * mix) | 0;
            px[i+2] = (px[i+2] * (1-mix) + (isFlare ? 30 : 20) * mix) | 0;
          } else if (d < ash + ember + heat) {
            const t = (d - ash - ember) / heat;
            const darken = 1 - (1 - t) * 0.35;
            const brown = (1 - t) * 0.2;
            px[i]   = Math.min(255, (px[i] * darken + 60 * brown) | 0);
            px[i+1] = (px[i+1] * darken * (1 - brown * 0.3)) | 0;
            px[i+2] = (px[i+2] * darken * (1 - brown * 0.6)) | 0;
          }
        }
      }
      ctx.putImageData(imageData, 0, startRow);
    }

    if (anim.current < 0.95 && anim.current > 0.20) {
      const r = isFlare ? 20 : 8;
      const glow = ctx.createRadialGradient(width/2, burnY+ash+1, 0, width/2, burnY+ash+1, r);
      glow.addColorStop(0, isFlare ? "rgba(255,100,20,0.35)" : "rgba(255,80,0,0.1)");
      glow.addColorStop(1, "rgba(255,40,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(width/2, burnY+ash+1, r, r*0.5, 0, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
    return Math.abs(anim.target - anim.current) > SETTLED;
  }

  // Start animation loop whenever length changes
  useEffect(() => {
    animRef.current.target = length;
    cancelAnimationFrame(rafRef.current);
    const loop = () => {
      const needsMore = render();
      if (needsMore) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [length, width, height]);

  // Re-render single frame on flare
  useEffect(() => {
    requestAnimationFrame(() => render());
  }, [flare]);

  // Load image once
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setWidth(Math.round(height * (img.naturalWidth / img.naturalHeight)));
    };
    img.src = "/joint.webp";
  }, [height]);

  if (!width) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, cursor: "pointer" }}
      onClick={onClick}
    />
  );
}
