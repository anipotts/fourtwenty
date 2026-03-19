"use client";

import { useRef, useEffect, useState } from "react";

interface JointImageProps {
  length: number;
  flare?: boolean;
  height?: number;
  filterText?: string;
  onBurnY?: (pct: number) => void;
  onClick?: () => void;
}

const SETTLED = 0.001;
const EASE = 0.12;

export function getBurnPct(length: number): number {
  return 6 + 78 * (1 - Math.max(length, 0.20));
}

function hash(x: number, y: number): number {
  return (((x * 2654435761 ^ y * 2246822519) & 0xFFFF) / 0xFFFF);
}

export default function JointImage({
  length,
  flare = false,
  height = 420,
  filterText = "tap to hit",
  onBurnY,
  onClick,
}: JointImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef({ current: length, target: length });
  const flareRef = useRef(flare);
  const onBurnYRef = useRef(onBurnY);
  const rafRef = useRef<number>(0);
  const width = Math.round(height * 0.22); // slim proportions

  flareRef.current = flare;
  onBurnYRef.current = onBurnY;

  function render(): boolean {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
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

    const cx = width / 2;

    // Joint anatomy
    const filterH = height * 0.16;
    const filterTop = height - filterH;
    const tipH = height * 0.04;
    const paperH = height - filterH - tipH;

    // Burn position
    const burnFraction = Math.max(anim.current, 0.20);
    const burnY = tipH + paperH * (1 - burnFraction);
    const burnPct = getBurnPct(anim.current);
    onBurnYRef.current?.(burnPct);

    // Conical widths — narrow at filter, wider at tip
    const filterHW = width * 0.17;
    const tipHW = width * 0.24;
    const hwAt = (y: number) => {
      const t = Math.max(0, Math.min(1, (filterTop - y) / paperH));
      return filterHW + t * (tipHW - filterHW);
    };

    // ===== FILTER / CRUTCH =====
    const fGrad = ctx.createLinearGradient(cx - filterHW, 0, cx + filterHW, 0);
    fGrad.addColorStop(0, "#ddd2b8");
    fGrad.addColorStop(0.15, "#e8dcca");
    fGrad.addColorStop(0.5, "#f0e8d8");
    fGrad.addColorStop(0.85, "#e8dcca");
    fGrad.addColorStop(1, "#d8ccb4");

    ctx.beginPath();
    ctx.moveTo(cx - filterHW, filterTop);
    ctx.lineTo(cx - filterHW + 1, height);
    ctx.lineTo(cx + filterHW - 1, height);
    ctx.lineTo(cx + filterHW, filterTop);
    ctx.closePath();
    ctx.fillStyle = fGrad;
    ctx.fill();
    ctx.strokeStyle = "rgba(180,168,148,0.4)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Filter fold lines
    ctx.strokeStyle = "rgba(170,158,138,0.25)";
    ctx.lineWidth = 0.4;
    for (let i = 0; i < 7; i++) {
      const y = filterTop + 5 + i * (filterH - 10) / 6;
      ctx.beginPath();
      ctx.moveTo(cx - filterHW + 2, y);
      ctx.lineTo(cx + filterHW - 2, y);
      ctx.stroke();
    }

    // Filter text
    ctx.save();
    ctx.translate(cx, filterTop + filterH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "rgba(180,140,100,0.45)";
    ctx.font = `bold ${filterHW * 0.8}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "1px";
    ctx.fillText(filterText.toUpperCase(), 0, 0);
    ctx.restore();

    // ===== PAPER BODY =====
    if (burnFraction > 0.20) {
      ctx.save();

      // Paper shape
      ctx.beginPath();
      ctx.moveTo(cx - filterHW, filterTop);
      for (let y = filterTop; y >= burnY; y -= 2) {
        const hw = hwAt(y);
        ctx.lineTo(cx - hw, y);
      }
      // Top edge (burn line or tip)
      const topHW = hwAt(burnY);
      ctx.lineTo(cx - topHW, burnY);
      ctx.lineTo(cx + topHW, burnY);
      // Right side back down
      for (let y = burnY; y <= filterTop; y += 2) {
        const hw = hwAt(y);
        ctx.lineTo(cx + hw, y);
      }
      ctx.closePath();
      ctx.clip();

      // Paper base color — off-white
      const pGrad = ctx.createLinearGradient(cx - tipHW, 0, cx + tipHW, 0);
      pGrad.addColorStop(0, "#e4e0d4");
      pGrad.addColorStop(0.2, "#edeae0");
      pGrad.addColorStop(0.5, "#f2efe6");
      pGrad.addColorStop(0.8, "#eae7dc");
      pGrad.addColorStop(1, "#e0dcd2");
      ctx.fillStyle = pGrad;
      ctx.fillRect(cx - tipHW - 2, burnY, tipHW * 2 + 4, filterTop - burnY);

      // Herb showing through — greenish tint
      const herbGrad = ctx.createLinearGradient(0, filterTop, 0, burnY);
      herbGrad.addColorStop(0, "rgba(120,140,100,0.05)");
      herbGrad.addColorStop(0.3, "rgba(110,130,90,0.12)");
      herbGrad.addColorStop(0.6, "rgba(100,120,80,0.18)");
      herbGrad.addColorStop(1, "rgba(90,110,70,0.22)");
      ctx.fillStyle = herbGrad;
      ctx.fillRect(cx - tipHW - 2, burnY, tipHW * 2 + 4, filterTop - burnY);

      // Horizontal herb band (center is darker)
      const herbH = ctx.createLinearGradient(cx - tipHW, 0, cx + tipHW, 0);
      herbH.addColorStop(0, "rgba(100,120,80,0)");
      herbH.addColorStop(0.3, "rgba(100,120,80,0.08)");
      herbH.addColorStop(0.5, "rgba(90,110,70,0.12)");
      herbH.addColorStop(0.7, "rgba(100,120,80,0.08)");
      herbH.addColorStop(1, "rgba(100,120,80,0)");
      ctx.fillStyle = herbH;
      ctx.fillRect(cx - tipHW - 2, burnY, tipHW * 2 + 4, filterTop - burnY);

      // Crinkle texture — organic wrinkle lines
      ctx.strokeStyle = "rgba(180,175,160,0.15)";
      ctx.lineWidth = 0.5;
      for (let y = burnY + 8; y < filterTop - 4; y += 6 + hash(0, Math.floor(y)) * 8) {
        const hw = hwAt(y);
        const wobble = (hash(1, Math.floor(y)) - 0.5) * 3;
        ctx.beginPath();
        ctx.moveTo(cx - hw + 2, y + wobble);
        // Wavy line with 3 control points
        const cp1x = cx - hw / 3;
        const cp1y = y + (hash(2, Math.floor(y)) - 0.5) * 4;
        const cp2x = cx + hw / 3;
        const cp2y = y + (hash(3, Math.floor(y)) - 0.5) * 4;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, cx + hw - 2, y - wobble);
        ctx.stroke();
      }

      // Diagonal creases (2-3 subtle ones)
      ctx.strokeStyle = "rgba(170,165,148,0.1)";
      ctx.lineWidth = 0.6;
      for (let n = 0; n < 3; n++) {
        const startY = burnY + paperH * (0.2 + n * 0.3);
        if (startY > filterTop) break;
        const hw = hwAt(startY);
        ctx.beginPath();
        ctx.moveTo(cx - hw * 0.6, startY - 8);
        ctx.lineTo(cx + hw * 0.4, startY + 12);
        ctx.stroke();
      }

      // Seam/glue line
      ctx.strokeStyle = "rgba(200,195,180,0.2)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(cx + filterHW - 1.5, filterTop - 3);
      ctx.lineTo(cx + hwAt(burnY) - 2, burnY + 5);
      ctx.stroke();
      ctx.setLineDash([]);

      // Paper grain noise via pixel manipulation
      const imgData = ctx.getImageData(0, Math.floor(burnY * dpr), cw, Math.ceil((filterTop - burnY) * dpr));
      const px = imgData.data;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < 10) continue;
        const row = Math.floor(i / 4 / cw);
        const col = (i / 4) % cw;
        const n = hash(col, row + Math.floor(burnY * dpr)) * 10 - 5;
        px[i]   = Math.min(255, Math.max(0, px[i] + n)) | 0;
        px[i+1] = Math.min(255, Math.max(0, px[i+1] + n)) | 0;
        px[i+2] = Math.min(255, Math.max(0, px[i+2] + n)) | 0;
      }
      ctx.putImageData(imgData, 0, Math.floor(burnY * dpr));

      ctx.restore();

      // ===== BURN ZONES (drawn outside clip) =====
      if (anim.current < 0.93) {
        const bHW = hwAt(burnY);

        // Heat discoloration below burn
        for (let dy = 0; dy < 20; dy++) {
          const y = burnY + dy;
          if (y > filterTop) break;
          const t = dy / 20;
          const hw = hwAt(y);
          const alpha = (1 - t) * 0.3;
          ctx.fillStyle = `rgba(120,80,40,${alpha})`;
          ctx.fillRect(cx - hw, y, hw * 2, 1);
        }

        // Ember line
        const emberGrad = ctx.createLinearGradient(cx - bHW, 0, cx + bHW, 0);
        if (isFlare) {
          emberGrad.addColorStop(0, "rgba(200,80,20,0.6)");
          emberGrad.addColorStop(0.3, "rgba(255,140,40,0.8)");
          emberGrad.addColorStop(0.5, "rgba(255,180,60,0.9)");
          emberGrad.addColorStop(0.7, "rgba(255,140,40,0.8)");
          emberGrad.addColorStop(1, "rgba(200,80,20,0.6)");
        } else {
          emberGrad.addColorStop(0, "rgba(100,50,20,0.4)");
          emberGrad.addColorStop(0.3, "rgba(180,70,30,0.6)");
          emberGrad.addColorStop(0.5, "rgba(200,90,40,0.7)");
          emberGrad.addColorStop(0.7, "rgba(180,70,30,0.6)");
          emberGrad.addColorStop(1, "rgba(100,50,20,0.4)");
        }
        ctx.fillStyle = emberGrad;
        ctx.fillRect(cx - bHW, burnY - 1, bHW * 2, 3);

        // Ash cap above ember
        for (let dy = 1; dy < 5; dy++) {
          const y = burnY - dy;
          const t = dy / 5;
          const hw = hwAt(burnY) * (1 - t * 0.15);
          const grey = 140 + hash(dy, 0) * 30;
          ctx.fillStyle = `rgba(${grey},${grey - 8},${grey - 15},${(1 - t) * 0.7})`;
          ctx.fillRect(cx - hw, y, hw * 2, 1);
        }

        // Ember glow
        const r = isFlare ? 18 : 6;
        const glow = ctx.createRadialGradient(cx, burnY, 0, cx, burnY, r);
        glow.addColorStop(0, isFlare ? "rgba(255,100,20,0.3)" : "rgba(255,80,0,0.08)");
        glow.addColorStop(1, "rgba(255,40,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(cx, burnY, r, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ===== TWISTED TIP (when nearly full) =====
    if (anim.current > 0.90) {
      const tipTopY = tipH * 0.3;
      const tipBotY = tipH + 2;
      const tipW = hwAt(tipH) * 0.6;

      ctx.fillStyle = "#e8e4d8";
      ctx.beginPath();
      ctx.moveTo(cx - tipW, tipBotY);
      ctx.quadraticCurveTo(cx - tipW * 0.3, tipTopY, cx, tipTopY - 2);
      ctx.quadraticCurveTo(cx + tipW * 0.3, tipTopY, cx + tipW, tipBotY);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(180,175,160,0.3)";
      ctx.lineWidth = 0.4;
      ctx.stroke();

      // Twist wrinkle
      ctx.strokeStyle = "rgba(170,165,150,0.2)";
      ctx.beginPath();
      ctx.moveTo(cx - tipW * 0.5, tipBotY - 2);
      ctx.quadraticCurveTo(cx, tipTopY + 2, cx + tipW * 0.3, tipBotY - 3);
      ctx.stroke();
    }

    // Paper edge stroke (outside clip to get clean edge)
    if (burnFraction > 0.20) {
      ctx.strokeStyle = "rgba(190,185,170,0.3)";
      ctx.lineWidth = 0.4;
      ctx.beginPath();
      ctx.moveTo(cx - filterHW, filterTop);
      for (let y = filterTop; y >= burnY; y -= 2) {
        ctx.lineTo(cx - hwAt(y), y);
      }
      ctx.moveTo(cx + filterHW, filterTop);
      for (let y = filterTop; y >= burnY; y -= 2) {
        ctx.lineTo(cx + hwAt(y), y);
      }
      ctx.stroke();
    }

    ctx.restore();
    return Math.abs(anim.target - anim.current) > SETTLED;
  }

  useEffect(() => {
    animRef.current.target = length;
    cancelAnimationFrame(rafRef.current);
    const loop = () => {
      if (render()) rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [length, width, height]);

  useEffect(() => { requestAnimationFrame(() => render()); }, [flare]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, cursor: "pointer" }}
      onClick={onClick}
    />
  );
}
