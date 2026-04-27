import * as HoverCard from '@radix-ui/react-hover-card';
import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RichTooltipProps {
  trigger: ReactNode;
  children: ReactNode;
}

export function RichTooltip({ trigger, children }: RichTooltipProps) {
  return (
    <HoverCard.Root openDelay={200} closeDelay={100}>
      <HoverCard.Trigger asChild>
        {trigger}
      </HoverCard.Trigger>
      <AnimatePresence>
        <HoverCard.Portal>
          <HoverCard.Content
            className="z-50"
            sideOffset={5}
            asChild
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 shadow-2xl max-w-sm"
            >
              {children}
              <HoverCard.Arrow className="fill-[#1a1a1a]" />
            </motion.div>
          </HoverCard.Content>
        </HoverCard.Portal>
      </AnimatePresence>
    </HoverCard.Root>
  );
}

// Quick info tooltip
export function QuickInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500 font-medium">{label}</p>
      <p className="text-sm text-white font-semibold">{value}</p>
    </div>
  );
}
