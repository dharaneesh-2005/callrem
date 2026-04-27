import { motion } from 'framer-motion';

interface LogoProps {
  size?: number;
  animated?: boolean;
}

export function Logo({ size = 40, animated = true }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Outer Ring */}
      <motion.circle
        cx="50"
        cy="50"
        r="45"
        stroke="url(#logoGradient)"
        strokeWidth="3"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: animated ? 1 : 1, 
          opacity: 1,
          rotate: animated ? 360 : 0
        }}
        transition={{ 
          pathLength: { duration: 2, ease: "easeInOut" },
          opacity: { duration: 0.5 },
          rotate: { duration: 20, repeat: Infinity, ease: "linear" }
        }}
        style={{ originX: '50px', originY: '50px' }}
      />

      {/* Inner Hexagon */}
      <motion.path
        d="M 50 15 L 75 30 L 75 60 L 50 75 L 25 60 L 25 30 Z"
        fill="url(#logoGradient)"
        opacity="0.2"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.2 }}
        transition={{ duration: 1, delay: 0.5 }}
        style={{ originX: '50px', originY: '50px' }}
      />

      {/* Dollar Sign */}
      <motion.g
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        style={{ originX: '50px', originY: '50px' }}
      >
        <path
          d="M 50 30 L 50 25 M 50 70 L 50 75"
          stroke="url(#logoGradient)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 40 35 C 40 32 43 30 50 30 C 57 30 60 32 60 35 C 60 38 57 40 50 42 C 43 44 40 46 40 50 C 40 54 43 56 50 56 C 57 56 60 54 60 50"
          stroke="url(#logoGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>

      {/* Animated Particles */}
      {animated && (
        <>
          <motion.circle
            cx="50"
            cy="50"
            r="2"
            fill="#3b82f6"
            animate={{
              x: [0, 20, 0],
              y: [0, -20, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="2"
            fill="#8b5cf6"
            animate={{
              x: [0, -20, 0],
              y: [0, 20, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          <motion.circle
            cx="50"
            cy="50"
            r="2"
            fill="#06b6d4"
            animate={{
              x: [0, 15, 0],
              y: [0, 15, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </>
      )}
    </svg>
  );
}

// Compact logo for sidebar
export function CompactLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      
      <circle
        cx="50"
        cy="50"
        r="45"
        stroke="url(#compactGradient)"
        strokeWidth="4"
        fill="none"
      />
      
      <path
        d="M 50 30 L 50 25 M 50 70 L 50 75"
        stroke="url(#compactGradient)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M 40 35 C 40 32 43 30 50 30 C 57 30 60 32 60 35 C 60 38 57 40 50 42 C 43 44 40 46 40 50 C 40 54 43 56 50 56 C 57 56 60 54 60 50"
        stroke="url(#compactGradient)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
