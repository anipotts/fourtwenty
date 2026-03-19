"use client";

import { useRef, useEffect, useCallback } from "react";

interface JointCanvasProps {
  /** 0 = roach, 1 = full */
  length: number;
  /** Cherry flare on hit */
  flare?: boolean;
  /** Canvas width */
  width?: number;
  /** Canvas height */
  height?: number;
  className?: string;
  onClick?: () => void;
}

export default function JointCanvas({
  length,
  flare = false,
  width = 120,
  height = 400,
  className,
  onClick,
}: JointCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const w = width * dpr;
      const h = height * dpr;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(dpr, dpr);

      // Joint geometry — vertical, filter at bottom, cherry at top
      const cx = width / 2;
      const filterH = 50;
      const filterW = 16;
      const maxPaperH = height - filterH - 60; // leave room for cherry/smoke
      const paperH = maxPaperH * Math.max(length, 0.02);
      const topPaperY = height - filterH - paperH;
      const filterTopY = height - filterH;

      // Conical taper
      const filterHalfW = filterW / 2;
      const tipHalfW = filterHalfW + 3;
      const halfWAt = (y: number) => {
        const t = (filterTopY - y) / Math.max(paperH, 1);
        return filterHalfW + t * (tipHalfW - filterHalfW);
      };

      // Slight rotation
      ctx.translate(cx, height / 2);
      ctx.rotate((-12 * Math.PI) / 180);
      ctx.translate(-cx, -height / 2);

      // ===== FILTER / CRUTCH =====
      const filterGrad = ctx.createLinearGradient(
        cx - filterHalfW, 0, cx + filterHalfW, 0
      );
      filterGrad.addColorStop(0, "#e8e3d8");
      filterGrad.addColorStop(0.3, "#f0ebe0");
      filterGrad.addColorStop(0.7, "#ede8dc");
      filterGrad.addColorStop(1, "#e2ddd2");

      ctx.fillStyle = filterGrad;
      ctx.beginPath();
      ctx.roundRect(cx - filterHalfW, filterTopY, filterW, filterH, 2);
      ctx.fill();

      // Filter fold lines
      ctx.strokeStyle = "rgba(180, 170, 155, 0.3)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 6; i++) {
        const y = filterTopY + 6 + i * 7;
        ctx.beginPath();
        ctx.moveTo(cx - filterHalfW + 2, y);
        ctx.lineTo(cx + filterHalfW - 2, y);
        ctx.stroke();
      }

      // "tap to hit" text on filter
      ctx.fillStyle = "rgba(160, 150, 135, 0.5)";
      ctx.font = `${5.5}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("tap to hit", cx, filterTopY + filterH / 2);

      // ===== PAPER BODY =====
      if (paperH > 2) {
        // Paper shape — conical trapezoid
        ctx.beginPath();
        ctx.moveTo(cx - filterHalfW, filterTopY);
        ctx.lineTo(cx - halfWAt(topPaperY), topPaperY);
        ctx.quadraticCurveTo(cx, topPaperY - 2, cx + halfWAt(topPaperY), topPaperY);
        ctx.lineTo(cx + filterHalfW, filterTopY);
        ctx.closePath();

        // Paper gradient — white with slight warmth
        const paperGrad = ctx.createLinearGradient(
          cx - tipHalfW, 0, cx + tipHalfW, 0
        );
        paperGrad.addColorStop(0, "#e8e5de");
        paperGrad.addColorStop(0.2, "#f2efea");
        paperGrad.addColorStop(0.5, "#f5f2ec");
        paperGrad.addColorStop(0.8, "#f0ede6");
        paperGrad.addColorStop(1, "#e6e3dc");
        ctx.fillStyle = paperGrad;
        ctx.fill();

        // Herb showing through — darker band in center, more toward cherry
        ctx.save();
        ctx.clip();

        const herbGrad = ctx.createLinearGradient(0, filterTopY, 0, topPaperY);
        herbGrad.addColorStop(0, "rgba(100, 85, 55, 0)");
        herbGrad.addColorStop(0.3, "rgba(100, 85, 55, 0.06)");
        herbGrad.addColorStop(0.6, "rgba(90, 75, 45, 0.14)");
        herbGrad.addColorStop(0.85, "rgba(80, 65, 35, 0.22)");
        herbGrad.addColorStop(1, "rgba(70, 55, 30, 0.28)");
        ctx.fillStyle = herbGrad;
        ctx.fillRect(cx - tipHalfW - 2, topPaperY, tipHalfW * 2 + 4, paperH);

        // Horizontal herb band
        const herbHGrad = ctx.createLinearGradient(
          cx - tipHalfW, 0, cx + tipHalfW, 0
        );
        herbHGrad.addColorStop(0, "rgba(90, 75, 45, 0)");
        herbHGrad.addColorStop(0.3, "rgba(90, 75, 45, 0.1)");
        herbHGrad.addColorStop(0.5, "rgba(80, 65, 35, 0.15)");
        herbHGrad.addColorStop(0.7, "rgba(90, 75, 45, 0.1)");
        herbHGrad.addColorStop(1, "rgba(90, 75, 45, 0)");
        ctx.fillStyle = herbHGrad;
        ctx.fillRect(cx - tipHalfW - 2, topPaperY, tipHalfW * 2 + 4, paperH);

        // Paper grain noise — pixel level
        const imageData = ctx.getImageData(
          (cx - tipHalfW - 2) * dpr,
          topPaperY * dpr,
          (tipHalfW * 2 + 4) * dpr,
          paperH * dpr
        );
        const pixels = imageData.data;
        for (let i = 0; i < pixels.length; i += 4) {
          const noise = (Math.random() - 0.5) * 12;
          pixels[i] = Math.min(255, Math.max(0, pixels[i] + noise));
          pixels[i + 1] = Math.min(255, Math.max(0, pixels[i + 1] + noise));
          pixels[i + 2] = Math.min(255, Math.max(0, pixels[i + 2] + noise));
        }
        ctx.putImageData(
          imageData,
          (cx - tipHalfW - 2) * dpr,
          topPaperY * dpr
        );

        // Wrinkle lines
        ctx.strokeStyle = "rgba(200, 190, 170, 0.15)";
        ctx.lineWidth = 0.4;
        const wrinkleCount = Math.floor(paperH / 14);
        for (let i = 0; i < wrinkleCount; i++) {
          const y = filterTopY - (i + 1) * 14;
          if (y < topPaperY) break;
          const hw = halfWAt(y);
          ctx.beginPath();
          ctx.moveTo(cx - hw + 1, y + (Math.random() - 0.5) * 2);
          ctx.lineTo(cx + hw - 1, y + (Math.random() - 0.5) * 2);
          ctx.stroke();
        }

        // Seam line (glue edge)
        ctx.strokeStyle = "rgba(210, 200, 180, 0.25)";
        ctx.lineWidth = 0.6;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(cx + filterHalfW - 1.5, filterTopY - 2);
        ctx.lineTo(cx + halfWAt(topPaperY) - 2, topPaperY + 4);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();

        // Paper edge stroke
        ctx.beginPath();
        ctx.moveTo(cx - filterHalfW, filterTopY);
        ctx.lineTo(cx - halfWAt(topPaperY), topPaperY);
        ctx.quadraticCurveTo(cx, topPaperY - 2, cx + halfWAt(topPaperY), topPaperY);
        ctx.lineTo(cx + filterHalfW, filterTopY);
        ctx.strokeStyle = "rgba(200, 195, 180, 0.4)";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      // ===== CHERRY / EMBER =====
      if (length > 0.02 && paperH > 2) {
        const cherryY = topPaperY;
        const cherryHW = halfWAt(topPaperY);

        // Outer glow
        const glowR = flare ? 25 : 12;
        const glow = ctx.createRadialGradient(cx, cherryY, 0, cx, cherryY, glowR);
        glow.addColorStop(0, flare ? "rgba(255,120,20,0.5)" : "rgba(255,80,0,0.15)");
        glow.addColorStop(0.6, flare ? "rgba(255,80,0,0.15)" : "rgba(255,60,0,0.05)");
        glow.addColorStop(1, "rgba(255,40,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(cx, cherryY, glowR, glowR * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ash cap
        const ashGrad = ctx.createRadialGradient(
          cx - 1, cherryY - 1, 0,
          cx, cherryY, cherryHW + 1
        );
        ashGrad.addColorStop(0, flare ? "#885522" : "#555");
        ashGrad.addColorStop(0.3, flare ? "#aa4411" : "#4a4a4a");
        ashGrad.addColorStop(0.6, "#3a3532");
        ashGrad.addColorStop(1, "#2a2522");
        ctx.fillStyle = ashGrad;
        ctx.beginPath();
        ctx.ellipse(cx, cherryY, cherryHW + 0.5, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hot ember center when flaring
        if (flare) {
          const emberGrad = ctx.createRadialGradient(
            cx, cherryY + 0.5, 0,
            cx, cherryY, cherryHW - 1
          );
          emberGrad.addColorStop(0, "rgba(255,200,80,0.7)");
          emberGrad.addColorStop(0.4, "rgba(255,100,20,0.5)");
          emberGrad.addColorStop(1, "rgba(200,50,0,0)");
          ctx.fillStyle = emberGrad;
          ctx.beginPath();
          ctx.ellipse(cx, cherryY + 0.5, cherryHW - 1, 3.5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Ember grain pixels
        const cherryImgData = ctx.getImageData(
          (cx - cherryHW - 2) * dpr,
          (cherryY - 6) * dpr,
          (cherryHW * 2 + 4) * dpr,
          12 * dpr
        );
        const cp = cherryImgData.data;
        for (let i = 0; i < cp.length; i += 4) {
          if (cp[i + 3] > 10) {
            const n = (Math.random() - 0.5) * 20;
            cp[i] = Math.min(255, Math.max(0, cp[i] + n));
            cp[i + 1] = Math.min(255, Math.max(0, cp[i + 1] + n * 0.7));
            cp[i + 2] = Math.min(255, Math.max(0, cp[i + 2] + n * 0.3));
          }
        }
        ctx.putImageData(
          cherryImgData,
          (cx - cherryHW - 2) * dpr,
          (cherryY - 6) * dpr
        );
      }

      ctx.restore();
    },
    [width, height, length, flare, dpr]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    draw(ctx);
  }, [draw, width, height, dpr]);

  return (
    <canvas
      ref={canvasRef}
      width={width * dpr}
      height={height * dpr}
      style={{ width, height, cursor: "pointer" }}
      className={className}
      onClick={onClick}
    />
  );
}
