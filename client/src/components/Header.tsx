import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface HeaderProps {
  activeSection: string;
}

const sectionTitles: Record<string, string> = {
  overview: "Overview",
  courses: "Course Management",
  students: "Student Management",
  "student-fees": "Student Fees Management",
  payments: "Payment History",
  reminders: "Payment Reminders",
};

export default function Header({ activeSection }: HeaderProps) {
  const { user } = useAuth();

  return (
    <header className="bg-gradient-to-r from-white to-gray-50 shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-8">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {sectionTitles[activeSection] || "Dashboard"}
        </h1>
        <div className="hidden md:block w-px h-6 bg-gray-300"></div>
        <span className="hidden md:inline-block text-sm text-gray-500 font-medium">
          Fee Management System
        </span>
      </div>
      <div className="flex items-center space-x-4">
        <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-3 shadow-sm">
            <span className="text-white text-sm font-bold">
              {user?.username ? user.username.slice(0, 2).toUpperCase() : "AD"}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-900 font-semibold text-sm">
              {user?.username || "Admin User"}
            </span>
            <span className="text-gray-500 text-xs">Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
