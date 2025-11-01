import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Courses from "./Courses";
import Students from "./Students";
import StudentFees from "./StudentFees";
import Payments from "./Payments";
import Reminders from "./Reminders";
import VoiceManagement from "./VoiceManagement";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Book, Clock, CheckCircle } from "lucide-react";

export default function Dashboard() {
  const [activeSection, setActiveSection] = useState("overview");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const renderSection = () => {
    switch (activeSection) {
      case "courses":
        return <Courses />;
      case "students":
        return <Students />;
      case "student-fees":
        return <StudentFees />;
      case "payments":
        return <Payments />;
      case "reminders":
        return <Reminders />;
      case "voice":
        return <VoiceManagement />;
      default:
        return (
          <div className="flex-1 p-8 bg-gray-50 min-h-screen">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back!</h2>
              <p className="text-gray-600">Here's what's happening with your fee management system today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Students</p>
                      <p className="text-3xl font-bold text-white">
                        {isLoading ? "..." : stats?.totalStudents || 0}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                      <Users className="text-white text-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Total Courses</p>
                      <p className="text-3xl font-bold text-white">
                        {isLoading ? "..." : stats?.totalCourses || 0}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                      <Book className="text-white text-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-sm font-medium">Pending Payments</p>
                      <p className="text-3xl font-bold text-white">
                        ₹{isLoading ? "..." : stats?.pendingPayments || 0}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                      <Clock className="text-white text-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl shadow-lg border-0 hover:shadow-xl transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm font-medium">Collected Today</p>
                      <p className="text-3xl font-bold text-white">
                        ₹{isLoading ? "..." : stats?.collectedToday || 0}
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                      <CheckCircle className="text-white text-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-t-xl">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600 mt-1">Latest transactions and system updates</p>
              </div>
              <CardContent className="p-6">
                <div className="text-center py-12 text-gray-500">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No recent activity</p>
                  <p className="text-sm text-gray-500 mt-1">Recent activity will appear here when payments and other actions are performed.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />
      
      <div className="ml-64 flex flex-col min-h-screen">
        <Header activeSection={activeSection} />
        {renderSection()}
      </div>
    </div>
  );
}
