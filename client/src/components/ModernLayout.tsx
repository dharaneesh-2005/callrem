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
  ChevronRight
} from 'lucide-react';

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
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full bg-[#141414] border-r border-white/10">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Phone className="w-5 h-5 text-white" />
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
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-gradient-to-br from-zinc-700 to-zinc-800 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-zinc-500">admin@feemanager.com</p>
              </div>
              <LogOut className="w-4 h-4 text-zinc-500 hover:text-white transition-colors" />
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
              
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search students, payments..."
                  className="pl-10 pr-4 py-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-xl hover:bg-white/5 transition-colors">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              </button>
              
              {/* Settings */}
              <button className="p-2 rounded-xl hover:bg-white/5 transition-colors">
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
