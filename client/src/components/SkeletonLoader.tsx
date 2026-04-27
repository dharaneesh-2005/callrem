import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-white/10 rounded-xl" />
        <div className="w-16 h-6 bg-white/10 rounded-full" />
      </div>
      <div className="space-y-3">
        <div className="w-24 h-8 bg-white/10 rounded" />
        <div className="w-32 h-4 bg-white/10 rounded" />
      </div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
      <div className="p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 bg-white/10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="w-48 h-4 bg-white/10 rounded" />
              <div className="w-32 h-3 bg-white/10 rounded" />
            </div>
            <div className="w-24 h-4 bg-white/10 rounded" />
            <div className="w-20 h-6 bg-white/10 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
      <div className="w-48 h-6 bg-white/10 rounded mb-6 animate-pulse" />
      <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
    </div>
  );
}

// Shimmer effect skeleton
export function ShimmerSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-white/5 rounded ${className}`}>
      <motion.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
    </div>
  );
}
