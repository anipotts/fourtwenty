"use client";

import { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface SmokeCanvasProps {
  width?: number;
  height?: number;
  emitX: number;
  emitY: number;
  burst?: boolean;
  className?: string;
}

export default function SmokeCanvas({
  width = 200,
  height = 300,
  emitX,
  emitY,
  burst = false,
  className,
}: SmokeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const burstHandled = useRef(false);

  const createParticle = useCallback(
    (isBurst: boolean): Particle => ({
      x: emitX + (Math.random() - 0.5) * 6,
      y: emitY,
      vx: (Math.random() - 0.5) * (isBurst ? 2 : 0.8),
      vy: -(Math.random() * 1.5 + 0.5) * (isBurst ? 2 : 1),
      size: Math.random() * 8 + 4,
      opacity: isBurst ? 0.5 : 0.3,
      life: 0,
      maxLife: isBurst ? 40 + Math.random() * 20 : 60 + Math.random() * 40,
    }),
    [emitX, emitY]
  );

  useEffect(() => {
    if (burst && !burstHandled.current) {
      burstHandled.current = true;
      for (let i = 0; i < 12; i++) {
        particlesRef.current.push(createParticle(true));
      }
      setTimeout(() => {
        burstHandled.current = false;
      }, 100);
    }
  }, [burst, createParticle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const FPS_INTERVAL = 1000 / 30; // 30fps cap

    const animate = (timestamp: number) => {
      frameRef.current = requestAnimationFrame(animate);

      const elapsed = timestamp - lastFrameRef.current;
      if (elapsed < FPS_INTERVAL) return;
      lastFrameRef.current = timestamp - (elapsed % FPS_INTERVAL);

      ctx.clearRect(0, 0, width, height);

      // Ambient: add 1 particle every ~15 frames
      if (Math.random() < 0.07) {
        particlesRef.current.push(createParticle(false));
      }

      // Cap at 80 particles
      if (particlesRef.current.length > 80) {
        particlesRef.current = particlesRef.current.slice(-60);
      }

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life++;
        if (p.life > p.maxLife) return false;

        p.x += p.vx + Math.sin(p.life * 0.1) * 0.3;
        p.y += p.vy;
        p.vy *= 0.98;
        p.size += 0.15;

        const lifeRatio = p.life / p.maxLife;
        const alpha = p.opacity * (1 - lifeRatio);

        const gradient = ctx.createRadialGradient(
          p.x, p.y, 0,
          p.x, p.y, p.size
        );
        gradient.addColorStop(0, `rgba(200, 200, 200, ${alpha})`);
        gradient.addColorStop(1, `rgba(200, 200, 200, 0)`);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        return true;
      });
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [width, height, createParticle]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`pointer-events-none ${className ?? ""}`}
    />
  );
}
