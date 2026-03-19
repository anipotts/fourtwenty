"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface JointImageProps {
  length: number;
  flare?: boolean;
  height?: number;
  onClick?: () => void;
}

/** Burn line as % from top — never past the filter */
export function getBurnPct(length: number): number {
  const clamped = Math.max(length, 0.20);
  return 6 + 78 * (1 - clamped);
}

export default function JointImage({
  length,
  flare = false,
  height = 400,
  onClick,
}: JointImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const animRef = useRef({ current: 1, target: 1 });
  const rafRef = useRef<number>(0);
  const [width, setWidth] = useState(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !width) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Smooth lerp toward target
    const anim = animRef.current;
    const diff = anim.target - anim.current;
    anim.current += Math.abs(diff) > 0.001 ? diff * 0.12 : diff;

    // Size canvas to match image aspect ratio at retina res
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.drawImage(img, 0, 0, width, height);

    // Burn line in pixels
    const burnY = (getBurnPct(anim.current) / 100) * height;

    // Zone sizes (px)
    const ASH = 4, EMBER = 3, HEAT = 18, FADE = 6;

    // Only process rows that are affected (burn zone ± margin)
    const startRow = Math.max(0, Math.floor((burnY - FADE - 2) * dpr));
    const endRow = Math.min(canvas.height, Math.ceil((burnY + ASH + EMBER + HEAT + 2) * dpr));
    const fullHeight = canvas.height;

    // Erase everything above the fade zone
    if (startRow > 0) {
      ctx.clearRect(0, 0, canvas.width, startRow / dpr);
    }

    // Process the burn zone pixels
    if (endRow > startRow) {
      const regionH = endRow - startRow;
      const imageData = ctx.getImageData(0, startRow, canvas.width, regionH);
      const px = imageData.data;
      const cw = canvas.width;

      for (let row = 0; row < regionH; row++) {
        const y = (startRow + row) / dpr;
        const d = y - burnY;

        for (let col = 0; col < cw; col++) {
          const i = (row * cw + col) * 4;
          if (px[i + 3] < 10) continue;

          if (d < -FADE) {
            px[i + 3] = 0;
          } else if (d < 0) {
            const t = 1 - (-d / FADE);
            px[i]   = (px[i] * 0.4 + 140 * 0.6) | 0;
            px[i+1] = (px[i+1] * 0.4 + 130 * 0.6) | 0;
            px[i+2] = (px[i+2] * 0.4 + 120 * 0.6) | 0;
            px[i+3] = (px[i+3] * t * t) | 0;
          } else if (d < ASH) {
            const grey = 130 + ((Math.random() - 0.5) * 20) | 0;
            px[i] = grey; px[i+1] = grey - 5; px[i+2] = grey - 10;
            px[i+3] = (200 + (d / ASH) * 55) | 0;
          } else if (d < ASH + EMBER) {
            const t = (d - ASH) / EMBER;
            const mix = 1 - t * 0.6;
            const eR = flare ? 255 : 200;
            const eG = flare ? 120 + t * 40 : 70 + t * 40;
            const eB = flare ? 30 : 20;
            px[i]   = (px[i] * (1-mix) + eR * mix) | 0;
            px[i+1] = (px[i+1] * (1-mix) + eG * mix) | 0;
            px[i+2] = (px[i+2] * (1-mix) + eB * mix) | 0;
          } else if (d < ASH + EMBER + HEAT) {
            const t = (d - ASH - EMBER) / HEAT;
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

    // Ember glow overlay
    if (anim.current < 0.95 && anim.current > 0.20) {
      const r = flare ? 20 : 8;
      const glow = ctx.createRadialGradient(width/2, burnY+ASH+1, 0, width/2, burnY+ASH+1, r);
      glow.addColorStop(0, flare ? "rgba(255,100,20,0.35)" : "rgba(255,80,0,0.1)");
      glow.addColorStop(1, "rgba(255,40,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(width/2, burnY+ASH+1, r, r*0.5, 0, 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();

    if (Math.abs(anim.target - anim.current) > 0.001) {
      rafRef.current = requestAnimationFrame(render);
    }
  }, [flare, width, height]);

  useEffect(() => {
    animRef.current.target = length;
    rafRef.current = requestAnimationFrame(function loop() {
      render();
      if (Math.abs(animRef.current.target - animRef.current.current) > 0.001) {
        rafRef.current = requestAnimationFrame(loop);
      }
    });
    return () => cancelAnimationFrame(rafRef.current);
  }, [length, render]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setWidth(Math.round(height * (img.naturalWidth / img.naturalHeight)));
      render();
    };
    img.src = "/joint.webp";
  }, [height, render]);

  if (!width) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, cursor: "pointer" }}
      onClick={onClick}
    />
  );
}
