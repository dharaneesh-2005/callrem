import { GraduationCap, LayoutDashboard, Book, Users, CreditCard, Receipt, Phone, Brain, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { removeAuthToken } from "@/lib/authUtils";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export default function Sidebar({ activeSection, setActiveSection }: SidebarProps) {
  const handleLogout = () => {
    removeAuthToken();
    window.location.href = "/";
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "courses", label: "Courses", icon: Book },
    { id: "students", label: "Students", icon: Users },
    { id: "student-fees", label: "Student Fees", icon: CreditCard },
    { id: "payments", label: "Payments", icon: Receipt },
    { id: "reminders", label: "Reminders", icon: Phone },
    { id: "voice", label: "Voice AI", icon: Brain },
  ];

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-gray-900 to-gray-800 shadow-2xl">
      <div className="flex items-center justify-center h-16 px-4 border-b border-gray-700">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <GraduationCap className="text-white h-6 w-6" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">FeeManager</span>
        </div>
      </div>
      
      <nav className="mt-8 px-4">
        <ul className="space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-xl transition-all duration-200 transform ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white hover:scale-102"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full bg-gray-700 text-gray-300 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all duration-200 rounded-xl"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
