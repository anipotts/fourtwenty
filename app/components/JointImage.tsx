"use client";

import { useRef, useEffect, useCallback } from "react";

interface JointImageProps {
  /** 0 = roach, 1 = full */
  length: number;
  /** Cherry flare on hit */
  flare?: boolean;
  /** Display height in px */
  displayHeight?: number;
  className?: string;
  onClick?: () => void;
}

export default function JointImage({
  length,
  flare = false,
  displayHeight = 400,
  className,
  onClick,
}: JointImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const loadedRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !loadedRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Maintain aspect ratio from original image
    const aspect = img.naturalWidth / img.naturalHeight;
    const displayWidth = displayHeight * aspect;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // The joint image: filter is at bottom ~15% of height, paper is above
    // Burn = clip from top. At length=1, show full. At length=0, show only filter.
    const filterRatio = 0.15; // bottom 15% is the filter/crutch
    const burnableHeight = displayHeight * (1 - filterRatio);
    const visiblePaperHeight = burnableHeight * Math.max(length, 0.02);
    const clipTop = displayHeight - (displayHeight * filterRatio) - visiblePaperHeight;

    // Draw the joint image, clipped to show burn progress
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, clipTop, displayWidth, displayHeight - clipTop);
    ctx.clip();
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
    ctx.restore();

    // ===== CHERRY / EMBER at the burn line =====
    if (length > 0.02 && length < 0.98) {
      const cherryY = clipTop;
      const cx = displayWidth / 2;

      // The joint is conical — wider at top. Estimate width at burn point.
      const widthAtBurn = displayWidth * (0.08 + length * 0.06);

      // Outer glow
      const glowR = flare ? 30 : 15;
      const glow = ctx.createRadialGradient(cx, cherryY, 0, cx, cherryY, glowR);
      glow.addColorStop(0, flare ? "rgba(255,120,20,0.6)" : "rgba(255,80,0,0.2)");
      glow.addColorStop(0.5, flare ? "rgba(255,80,0,0.2)" : "rgba(255,60,0,0.06)");
      glow.addColorStop(1, "rgba(255,40,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(cx, cherryY, glowR, glowR * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ash cap — dark, textured
      const ashGrad = ctx.createRadialGradient(
        cx, cherryY, 0,
        cx, cherryY, widthAtBurn
      );
      ashGrad.addColorStop(0, flare ? "#cc5500" : "#4a4440");
      ashGrad.addColorStop(0.3, flare ? "#993300" : "#3a3835");
      ashGrad.addColorStop(0.7, "#2e2c2a");
      ashGrad.addColorStop(1, "#222");
      ctx.fillStyle = ashGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cherryY, widthAtBurn, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ember pixel grain
      const grainSize = Math.ceil(widthAtBurn * 2 + 4);
      const grainData = ctx.getImageData(
        (cx - widthAtBurn - 2) * dpr,
        (cherryY - 5) * dpr,
        grainSize * dpr,
        10 * dpr
      );
      const px = grainData.data;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] > 20) {
          const n = (Math.random() - 0.5) * 25;
          px[i] = Math.min(255, Math.max(0, px[i] + n));
          px[i + 1] = Math.min(255, Math.max(0, px[i + 1] + n * 0.6));
          px[i + 2] = Math.min(255, Math.max(0, px[i + 2] + n * 0.3));
        }
      }
      ctx.putImageData(
        grainData,
        (cx - widthAtBurn - 2) * dpr,
        (cherryY - 5) * dpr
      );

      // Hot ember flare
      if (flare) {
        const emberGrad = ctx.createRadialGradient(
          cx, cherryY, 0,
          cx, cherryY, widthAtBurn * 0.7
        );
        emberGrad.addColorStop(0, "rgba(255,220,100,0.7)");
        emberGrad.addColorStop(0.5, "rgba(255,100,20,0.4)");
        emberGrad.addColorStop(1, "rgba(200,50,0,0)");
        ctx.fillStyle = emberGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cherryY, widthAtBurn * 0.7, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }, [length, flare, displayHeight]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      loadedRef.current = true;
      draw();
    };
    img.src = "/joint.webp";
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ cursor: "pointer" }}
      onClick={onClick}
    />
  );
}
