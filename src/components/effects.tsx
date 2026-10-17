"use client";

import { useEffect, useRef } from "react";

/* ------------------------------------------------------------------ */
/*  Starfield + drifting petals background                             */
/* ------------------------------------------------------------------ */

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let stars: { x: number; y: number; r: number; a: number; speed: number }[] = [];
    let raf = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(190, Math.floor(window.innerWidth / 7));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 1.3 + 0.2,
        a: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.02 + 0.004,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const star of stars) {
        star.a += star.speed;
        const opacity = 0.18 + Math.abs(Math.sin(star.a)) * 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 235, 250, ${opacity})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    if (reduce) {
      // Draw a single static frame.
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const star of stars) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 235, 250, 0.55)";
        ctx.fill();
      }
    } else {
      draw();
    }

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/*  Petals (decorative, low count)                                     */
/* ------------------------------------------------------------------ */

const PETALS = ["🌸", "💗", "✦", "💫", "🌷", "♡"];

export function usePetals(enabled = true, intervalMs = 2600) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const spawn = () => {
      const petal = document.createElement("div");
      petal.className = "petal";
      petal.textContent = PETALS[Math.floor(Math.random() * PETALS.length)] ?? "✦";
      petal.style.left = `${Math.random() * 100}vw`;
      petal.style.fontSize = `${10 + Math.random() * 16}px`;
      petal.style.setProperty("--drift", `${Math.random() * 160 - 80}px`);
      petal.style.animationDuration = `${10 + Math.random() * 8}s`;
      document.body.appendChild(petal);
      window.setTimeout(() => petal.remove(), 20000);
    };

    spawn();
    const timer = window.setInterval(spawn, intervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, intervalMs]);
}

/* ------------------------------------------------------------------ */
/*  Heart rain — "Release the love 💗"                                 */
/* ------------------------------------------------------------------ */

const HEART_SYMBOLS = ["💗", "💖", "❤️", "💕", "♥", "💞", "✦", "💘"];

export function releaseHearts(count = 70, symbols: string[] = HEART_SYMBOLS) {
  if (typeof document === "undefined") return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    // Respect the preference: show a short, static confirmation instead.
    const note = document.createElement("div");
    note.className = "toast toast-ok";
    note.textContent = "💗 Love released !";
    document.body.appendChild(note);
    window.setTimeout(() => note.remove(), 2600);
    return;
  }

  const pool = symbols.length > 0 ? symbols : HEART_SYMBOLS;
  for (let i = 0; i < count; i += 1) {
    const heart = document.createElement("div");
    heart.className = "heart";
    heart.textContent = pool[Math.floor(Math.random() * pool.length)] ?? "💗";
    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.fontSize = `${14 + Math.random() * 30}px`;
    heart.style.setProperty("--drift", `${Math.random() * 220 - 110}px`);
    const duration = 3.4 + Math.random() * 3.6;
    heart.style.animationDuration = `${duration}s`;
    heart.style.animationDelay = `${Math.random() * 0.9}s`;
    document.body.appendChild(heart);
    window.setTimeout(() => heart.remove(), (duration + 1.4) * 1000);
  }
}
