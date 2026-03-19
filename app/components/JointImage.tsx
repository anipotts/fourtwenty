"use client";

import { useRef, useEffect, useCallback, useMemo } from "react";

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

  // Generate a stable random burn edge pattern (slight canoe + bumps)
  const burnEdge = useMemo(() => {
    const points: number[] = [];
    const segments = 20;
    // Canoe bias: one side burns slightly faster
    const canoeBias = (Math.random() - 0.5) * 0.4;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments; // 0 = left edge, 1 = right edge
      // Base shape: slight V or canoe curve
      const canoe = canoeBias * Math.sin(t * Math.PI) * 8;
      // Random bumps
      const bump = (Math.random() - 0.5) * 5;
      points.push(canoe + bump);
    }
    return points;
  }, []);

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

    const cx = displayWidth / 2;

    // Image anatomy (measured from the actual joint.webp):
    // Top ~6% = twisted tip
    // Middle ~78% = paper/herb body
    // Bottom ~16% = RAW filter/crutch
    const tipEnd = displayHeight * 0.06;
    const filterStart = displayHeight * 0.84;
    const burnableRange = filterStart - tipEnd;

    // Burn position: where the burn line sits
    // length=1 means tip is intact (burn at tipEnd), length=0 means burned to filter
    const burnY = tipEnd + burnableRange * (1 - Math.max(length, 0.01));

    // Joint width at any Y (conical: wider at top in image coords because tip is up)
    // Actually in this image the wide end is at the TOP (tip) and narrow at filter
    // At tipEnd: ~9% of width, at filterStart: ~5.5% of width
    const jointHalfWAt = (y: number) => {
      const t = (y - tipEnd) / burnableRange;
      return displayWidth * (0.045 - t * 0.02); // wider at top, narrower at bottom
    };

    // ===== Draw full image, then erase the burned portion =====
    ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

    // Erase everything above the burn line with an irregular edge
    if (length < 0.95) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";

      const hw = jointHalfWAt(burnY);
      const edgeWidth = hw * 2 + 10;
      const leftX = cx - hw - 5;

      ctx.beginPath();
      // Start above the image
      ctx.moveTo(0, 0);
      ctx.lineTo(displayWidth, 0);
      ctx.lineTo(displayWidth, burnY + 5);

      // Irregular burn edge across the joint width
      for (let i = burnEdge.length - 1; i >= 0; i--) {
        const t = i / (burnEdge.length - 1);
        const x = leftX + edgeWidth * (1 - t);
        const y = burnY + burnEdge[i];
        if (i === burnEdge.length - 1) {
          ctx.lineTo(x, y);
        } else {
          // Smooth the edge with quadratic curves
          const nextI = i + 1;
          const nextT = nextI / (burnEdge.length - 1);
          const nextX = leftX + edgeWidth * (1 - nextT);
          const nextY = burnY + burnEdge[nextI];
          const cpX = (x + nextX) / 2;
          const cpY = (y + nextY) / 2;
          ctx.quadraticCurveTo(nextX, nextY, cpX, cpY);
        }
      }

      ctx.lineTo(0, burnY + 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // ===== CHERRY / EMBER at burn line =====
    if (length > 0.01 && length < 0.95) {
      const hw = jointHalfWAt(burnY);

      // Outer glow (only when flaring)
      if (flare) {
        const glowR = hw * 5;
        const glow = ctx.createRadialGradient(cx, burnY, hw * 0.5, cx, burnY, glowR);
        glow.addColorStop(0, "rgba(255,100,20,0.3)");
        glow.addColorStop(0.4, "rgba(255,60,0,0.1)");
        glow.addColorStop(1, "rgba(255,40,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(cx, burnY, glowR, glowR * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ash edge — irregular, following the burn edge pattern
      ctx.save();
      ctx.beginPath();
      const edgeWidth = hw * 2 + 4;
      const leftX = cx - hw - 2;
      for (let i = 0; i < burnEdge.length; i++) {
        const t = i / (burnEdge.length - 1);
        const x = leftX + edgeWidth * t;
        const y = burnY + burnEdge[i] - 1;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      for (let i = burnEdge.length - 1; i >= 0; i--) {
        const t = i / (burnEdge.length - 1);
        const x = leftX + edgeWidth * t;
        const y = burnY + burnEdge[i] + 3;
        ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Ash + ember gradient
      const ashGrad = ctx.createLinearGradient(cx - hw, 0, cx + hw, 0);
      if (flare) {
        ashGrad.addColorStop(0, "#884422");
        ashGrad.addColorStop(0.3, "#cc5500");
        ashGrad.addColorStop(0.5, "#ff7722");
        ashGrad.addColorStop(0.7, "#cc5500");
        ashGrad.addColorStop(1, "#884422");
      } else {
        ashGrad.addColorStop(0, "#555048");
        ashGrad.addColorStop(0.3, "#6a5e4e");
        ashGrad.addColorStop(0.5, "#7a6a55");
        ashGrad.addColorStop(0.7, "#6a5e4e");
        ashGrad.addColorStop(1, "#555048");
      }
      ctx.fillStyle = ashGrad;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }, [length, flare, displayHeight, burnEdge]);

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
