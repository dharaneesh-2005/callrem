import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useLocation } from 'wouter';
import { 
  Search, 
  Users, 
  BookOpen, 
  CreditCard, 
  Phone, 
  Bell,
  Plus,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (callback: () => void) => {
    callback();
    onOpenChange(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl mx-4"
          >
            <Command className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center border-b border-white/10 px-4">
                <Search className="w-5 h-5 text-zinc-500 mr-3" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search..."
                  className="w-full bg-transparent py-4 text-white placeholder-zinc-500 outline-none"
                />
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-xs text-zinc-400">
                  ESC
                </kbd>
              </div>
              <Command.List className="max-h-96 overflow-y-auto p-2">
                <Command.Empty className="py-6 text-center text-sm text-zinc-500">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Navigation" className="text-zinc-500 text-xs font-semibold px-2 py-2">
                  <CommandItem
                    icon={<Users className="w-4 h-4" />}
                    onSelect={() => handleSelect(() => setLocation('/students'))}
                  >
                    Students
                  </CommandItem>
                  <CommandItem
                    icon={<BookOpen className="w-4 h-4" />}
                    onSelect={() => handleSelect(() => setLocation('/courses'))}
                  >
                    Courses
                  </CommandItem>
                  <CommandItem
                    icon={<CreditCard className="w-4 h-4" />}
                    onSelect={() => handleSelect(() => setLocation('/payments'))}
                  >
                    Payments
                  </CommandItem>
                  <CommandItem
                    icon={<Bell className="w-4 h-4" />}
                    onSelect={() => handleSelect(() => setLocation('/reminders'))}
                  >
                    Reminders
                  </CommandItem>
                  <CommandItem
                    icon={<Phone className="w-4 h-4" />}
                    onSelect={() => handleSelect(() => setLocation('/voice'))}
                  >
                    Voice Management
                  </CommandItem>
                </Command.Group>

                <Command.Group heading="Actions" className="text-zinc-500 text-xs font-semibold px-2 py-2 mt-2">
                  <CommandItem
                    icon={<Plus className="w-4 h-4" />}
                    onSelect={() => handleSelect(() => setLocation('/students'))}
                  >
                    Add New Student
                  </CommandItem>
                  <CommandItem
                    icon={<DollarSign className="w-4 h-4" />}
                    onSelect={() => handleSelect(() => setLocation('/payments'))}
                  >
                    Record Payment
                  </CommandItem>
                  <CommandItem
                    icon={<Bell className="w-4 h-4" />}
                    onSelect={() => handleSelect(() => setLocation('/reminders'))}
                  >
                    Schedule Reminder
                  </CommandItem>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CommandItem({ 
  icon, 
  children, 
  onSelect 
}: { 
  icon: React.ReactNode; 
  children: React.ReactNode; 
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-white cursor-pointer hover:bg-white/5 transition-colors data-[selected=true]:bg-white/10"
    >
      <div className="text-zinc-400">{icon}</div>
      <span>{children}</span>
    </Command.Item>
  );
}
