import { PageHeader, StatsCard } from "@/components/ModernLayout";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, Clock, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="loading-spinner border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Welcome back! Here's your overview"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Students"
          value={stats?.totalStudents?.toString() || "0"}
          change="+12%"
          icon={Users}
          trend="up"
        />
        <StatsCard
          title="Total Revenue"
          value={`₹${stats?.totalRevenue?.toLocaleString() || "0"}`}
          change="+8%"
          icon={DollarSign}
          trend="up"
        />
        <StatsCard
          title="Pending Payments"
          value={stats?.pendingPayments?.toString() || "0"}
          change="-5%"
          icon={Clock}
          trend="down"
        />
        <StatsCard
          title="Collection Rate"
          value={`${stats?.collectionRate || "0"}%`}
          change="+3%"
          icon={TrendingUp}
          trend="up"
        />
      </div>

      {/* Recent Activity */}
      <div className="glass-card">
        <h3 className="text-xl font-bold text-white mb-6">Recent Activity</h3>
        <div className="space-y-4">
          {stats?.recentPayments?.map((payment: any, index: number) => (
            <div 
              key={index}
              className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-white/5 hover:border-white/10 transition-all"
            >
              <div>
                <p className="text-white font-medium">{payment.studentName}</p>
                <p className="text-zinc-500 text-sm">{payment.courseName}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">₹{payment.amount}</p>
                <p className="text-zinc-500 text-sm">{new Date(payment.date).toLocaleDateString()}</p>
              </div>
            </div>
          )) || (
            <div className="text-center py-8 text-zinc-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
