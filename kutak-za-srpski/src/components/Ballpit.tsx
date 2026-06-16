"use client";

import { CSSProperties, useEffect, useRef } from "react";

type BallpitProps = {
  count?: number;
  gravity?: number;
  friction?: number;
  wallBounce?: number;
  followCursor?: boolean;
  colors?: string[];
  className?: string;
  style?: CSSProperties;
};

type Ball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
};

export function Ballpit({
  count = 190,
  gravity = 0.5,
  friction = 0.9975,
  wallBounce = 0.95,
  followCursor = false,
  colors = ["#5227FF", "#7cff67", "#ff6b6b"],
  className,
  style,
}: BallpitProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const devicePixelRatio = Math.max(1, window.devicePixelRatio || 1);
    let width = 1;
    let height = 1;
    const balls: Ball[] = [];
    let animationFrameId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(width * devicePixelRatio);
      canvas.height = Math.floor(height * devicePixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

      if (balls.length === 0) {
        for (let index = 0; index < count; index += 1) {
          const radius = 8 + Math.random() * 14;
          balls.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 1.8,
            vy: Math.random() * 1.2,
            r: radius,
            color: colors[index % colors.length] ?? colors[0] ?? "#5227FF",
          });
        }
      }
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);

      for (const ball of balls) {
        if (followCursor && pointerRef.current.active) {
          const dx = pointerRef.current.x - ball.x;
          const dy = pointerRef.current.y - ball.y;
          ball.vx += dx * 0.0002;
          ball.vy += dy * 0.0002;
        }

        ball.vy += gravity * 0.03;
        ball.vx *= friction;
        ball.vy *= friction;
        ball.x += ball.vx;
        ball.y += ball.vy;

        if (ball.x - ball.r < 0) {
          ball.x = ball.r;
          ball.vx = Math.abs(ball.vx) * wallBounce;
        }

        if (ball.x + ball.r > width) {
          ball.x = width - ball.r;
          ball.vx = -Math.abs(ball.vx) * wallBounce;
        }

        if (ball.y - ball.r < 0) {
          ball.y = ball.r;
          ball.vy = Math.abs(ball.vy) * wallBounce;
        }

        if (ball.y + ball.r > height) {
          ball.y = height - ball.r;
          ball.vy = -Math.abs(ball.vy) * wallBounce;
          ball.vx *= 0.98;
        }

        context.beginPath();
        context.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        context.fillStyle = ball.color;
        context.globalAlpha = 0.82;
        context.fill();
      }

      context.globalAlpha = 1;
      animationFrameId = window.requestAnimationFrame(draw);
    };

    resizeCanvas();
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    const handlePointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true,
      };
    };

    const handlePointerLeave = () => {
      pointerRef.current.active = false;
    };

    if (followCursor) {
      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerleave", handlePointerLeave);
    }

    draw();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
      if (followCursor) {
        container.removeEventListener("pointermove", handlePointerMove);
        container.removeEventListener("pointerleave", handlePointerLeave);
      }
    };
  }, [colors, count, followCursor, friction, gravity, wallBounce]);

  return (
    <div ref={containerRef} className={className} style={style} aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}