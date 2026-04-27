import { useEffect, useRef, useState } from 'react';

interface ParticleTextProps {
  text: string;
  fontSize?: number;
  particleSize?: number;
  particleGap?: number;
  mouseRadius?: number;
  returnSpeed?: number;
  color?: string;
}

interface Particle {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
}

export function ParticleText({
  text,
  fontSize = 80,
  particleSize = 2,
  particleGap = 3,
  mouseRadius = 100,
  returnSpeed = 0.05,
  color = '#3b82f6'
}: ParticleTextProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Set canvas size
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      initParticles();
    };

    const initParticles = () => {
      particlesRef.current = [];
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set text properties
      ctx.font = `bold ${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Draw text
      const rect = canvas.getBoundingClientRect();
      ctx.fillText(text, rect.width / 2, rect.height / 2);
      
      // Get pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      
      // Create particles from text pixels
      for (let y = 0; y < canvas.height; y += particleGap) {
        for (let x = 0; x < canvas.width; x += particleGap) {
          const index = (y * canvas.width + x) * 4;
          const alpha = pixels[index + 3];
          
          if (alpha > 128) {
            particlesRef.current.push({
              x: x / window.devicePixelRatio,
              y: y / window.devicePixelRatio,
              baseX: x / window.devicePixelRatio,
              baseY: y / window.devicePixelRatio,
              vx: 0,
              vy: 0,
              size: particleSize
            });
          }
        }
      }
      
      // Clear canvas for animation
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      const mouse = mouseRef.current;
      
      particlesRef.current.forEach(particle => {
        // Calculate distance from mouse
        const dx = mouse.x - particle.x;
        const dy = mouse.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Repel particles from mouse
        if (distance < mouseRadius) {
          const force = (mouseRadius - distance) / mouseRadius;
          const angle = Math.atan2(dy, dx);
          particle.vx -= Math.cos(angle) * force * 2;
          particle.vy -= Math.sin(angle) * force * 2;
        }
        
        // Return to base position
        particle.vx += (particle.baseX - particle.x) * returnSpeed;
        particle.vy += (particle.baseY - particle.y) * returnSpeed;
        
        // Apply velocity with damping
        particle.vx *= 0.95;
        particle.vy *= 0.95;
        
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Draw particle
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    animate();

    return () => {
      window.removeEventListener('resize', updateSize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [text, fontSize, particleSize, particleGap, mouseRadius, returnSpeed, color]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: 'none' }}
    />
  );
}

// Compact version for header
export function ParticleTextCompact({ text }: { text: string }) {
  return (
    <div className="w-48 h-12">
      <ParticleText
        text={text}
        fontSize={32}
        particleSize={1.5}
        particleGap={2}
        mouseRadius={60}
        returnSpeed={0.08}
        color="#3b82f6"
      />
    </div>
  );
}

// Large version for login/hero
export function ParticleTextHero({ text }: { text: string }) {
  return (
    <div className="w-full h-32 min-w-[800px]">
      <ParticleText
        text={text}
        fontSize={80}
        particleSize={2}
        particleGap={3}
        mouseRadius={120}
        returnSpeed={0.05}
        color="#3b82f6"
      />
    </div>
  );
}
