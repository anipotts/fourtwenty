"use client";

import { useRef, useEffect, useCallback } from "react";

interface JointImageProps {
  length: number;
  flare?: boolean;
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
    const aspect = img.naturalWidth / img.naturalHeight;
    const displayWidth = displayHeight * aspect;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    // Joint geometry in the image:
    // - Filter/crutch is bottom ~13%
    // - Twisted tip is top ~5%
    // - The joint center is roughly at 50% of width
    // - Joint width: ~6% of displayWidth at filter, ~4% at tip
    const filterRatio = 0.13;
    const tipRatio = 0.05;
    const burnableHeight = displayHeight * (1 - filterRatio - tipRatio);
    const visiblePaperHeight = burnableHeight * Math.max(length, 0.02);
    const burnY = displayHeight * tipRatio + (burnableHeight - visiblePaperHeight);

    // Draw joint image clipped to show burn progress
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, burnY, displayWidth, displayHeight - burnY);
    ctx.clip();
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);
    ctx.restore();

    // ===== CHERRY at burn line =====
    if (length > 0.02 && length < 0.95) {
      const cx = displayWidth * 0.5;
      const cherryY = burnY;

      // Joint width at burn point — the joint is conical
      // At filter (bottom): ~6% of width, at tip (top): ~3.5%
      const t = 1 - length; // 0 at full, 1 at roach
      const jointHalfW = displayWidth * (0.03 + t * 0.01);

      // Subtle outer glow
      if (flare) {
        const glowR = jointHalfW * 4;
        const glow = ctx.createRadialGradient(cx, cherryY, 0, cx, cherryY, glowR);
        glow.addColorStop(0, "rgba(255,100,20,0.25)");
        glow.addColorStop(0.5, "rgba(255,60,0,0.08)");
        glow.addColorStop(1, "rgba(255,40,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(cx, cherryY, glowR, glowR * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ash ring — thin gray edge
      ctx.fillStyle = "#555";
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.ellipse(cx, cherryY, jointHalfW + 1, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Ember core
      const emberGrad = ctx.createRadialGradient(
        cx, cherryY, 0,
        cx, cherryY, jointHalfW
      );
      if (flare) {
        emberGrad.addColorStop(0, "#ffcc44");
        emberGrad.addColorStop(0.3, "#ff6600");
        emberGrad.addColorStop(0.7, "#cc3300");
        emberGrad.addColorStop(1, "#662200");
      } else {
        emberGrad.addColorStop(0, "#aa4400");
        emberGrad.addColorStop(0.4, "#773300");
        emberGrad.addColorStop(0.8, "#443322");
        emberGrad.addColorStop(1, "#332222");
      }
      ctx.fillStyle = emberGrad;
      ctx.beginPath();
      ctx.ellipse(cx, cherryY, jointHalfW, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
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
