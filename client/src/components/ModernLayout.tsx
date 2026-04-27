import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  Phone, 
  Users, 
  CreditCard, 
  BookOpen, 
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  User,
  ChevronRight,
  Command as CommandIcon
} from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { motion } from 'framer-motion';
import { GradientOrbs, FloatingShapes } from './AnimatedBackground';
import { CompactLogo } from './Logo';
import { removeAuthToken } from '@/lib/authUtils';
import { ParticleTextCompact } from './ParticleText';
import { NotificationsPanel } from './NotificationsPanel';
import { SettingsModal } from './SettingsModal';

interface ModernLayoutProps {
  children: ReactNode;
}

interface NavItem {
  icon: any;
  label: string;
  path: string;
  badge?: string;
}

const navigation: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Students', path: '/students' },
  { icon: BookOpen, label: 'Courses', path: '/courses' },
  { icon: CreditCard, label: 'Payments', path: '/payments' },
  { icon: Phone, label: 'Voice Calls', path: '/voice', badge: 'AI' },
  { icon: Bell, label: 'Reminders', path: '/reminders' },
];

export function ModernLayout({ children }: ModernLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    removeAuthToken();
    setLocation('/');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Animated Background Elements */}
      <GradientOrbs />
      <FloatingShapes />
      
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full bg-[#141414] border-r border-white/10">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <CompactLogo size={40} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">FeeManager</h1>
                <p className="text-xs text-zinc-500">AI-Powered</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || (item.path !== '/dashboard' && location.startsWith(item.path));
              
              return (
                <Link key={item.path} href={item.path}>
                  <a className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}>
                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-zinc-500'
                    }`} />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-1 text-xs font-semibold bg-violet-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </a>
                </Link>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <div className="w-10 h-10 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-zinc-500">admin@feemanager.com</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-red-500/10 transition-colors group"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#141414] border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
              
              {/* Particle Text Effect */}
              <div className="hidden lg:block">
                <ParticleTextCompact text="FeeManager" />
              </div>
              
              {/* Search */}
              <button
                onClick={() => setCommandOpen(true)}
                className="relative hidden md:flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/20 transition-all group"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm">Search...</span>
                <kbd className="ml-auto hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-xs text-zinc-500 group-hover:text-zinc-400">
                  ⌘K
                </kbd>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button 
                onClick={() => setNotificationsOpen(true)}
                className="relative p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </button>
              
              {/* Settings */}
              <button 
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Command Palette */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      
      {/* Notifications Panel */}
      <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      
      {/* Settings Modal */}
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

// Reusable components for consistent styling
export function PageHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-8 animate-in stagger-1">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
        {subtitle && <p className="text-zinc-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatsCard({ title, value, change, icon: Icon, trend = 'up' }: {
  title: string;
  value: string;
  change?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const trendColors = {
    up: 'text-emerald-500',
    down: 'text-red-500',
    neutral: 'text-zinc-500'
  };

  return (
    <div className="glass-card hover-glow animate-in">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/25">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change && (
          <span className={`text-sm font-semibold ${trendColors[trend]}`}>
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white mb-1">{value}</p>
        <p className="text-zinc-400 text-sm">{title}</p>
      </div>
    </div>
  );
}
