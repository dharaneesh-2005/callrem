import { ReactNode } from 'react';
import Tilt from 'react-parallax-tilt';
import { motion } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glare?: boolean;
}

export function TiltCard({ children, className = '', glare = true }: TiltCardProps) {
  return (
    <Tilt
      tiltMaxAngleX={5}
      tiltMaxAngleY={5}
      glareEnable={glare}
      glareMaxOpacity={0.2}
      glareColor="#3b82f6"
      glarePosition="all"
      glareBorderRadius="16px"
      scale={1.02}
      transitionSpeed={2000}
      className={className}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </Tilt>
  );
}

// Glowing Card with animated border
export function GlowCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500 animate-pulse" />
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

// Shimmer effect card
export function ShimmerCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      {children}
    </div>
  );
}
