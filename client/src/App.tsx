import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ModernLayout } from "@/components/ModernLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Courses from "@/pages/Courses";
import Payments from "@/pages/Payments";
import Reminders from "@/pages/Reminders";
import StudentFees from "@/pages/StudentFees";
import VoiceManagement from "@/pages/VoiceManagement";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="glass-card p-8 animate-in text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/30 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Loading FeeManager</h3>
              <p className="text-zinc-400">Initializing your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Login} />
      ) : (
        <ModernLayout>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/students" component={Students} />
          <Route path="/courses" component={Courses} />
          <Route path="/payments" component={Payments} />
          <Route path="/reminders" component={Reminders} />
          <Route path="/student-fees" component={StudentFees} />
          <Route path="/voice" component={VoiceManagement} />
        </ModernLayout>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
