import { PageHeader } from "@/components/ModernLayout";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, Clock, TrendingUp, ArrowUpRight, BookOpen, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<any>({
    queryKey: ["/api/payments"],
  });

  const { data: courses, isLoading: coursesLoading } = useQuery<any>({
    queryKey: ["/api/courses"],
  });

  const { data: studentFees, isLoading: feesLoading } = useQuery<any>({
    queryKey: ["/api/student-fees"],
  });

  const isLoading = statsLoading || paymentsLoading || coursesLoading || feesLoading;

  // Calculate real data from payments
  const paymentMethodData = useMemo(() => {
    if (!payments || !Array.isArray(payments)) return [];
    
    const methodCounts: Record<string, number> = {};
    payments.forEach((payment: any) => {
      const method = payment.paymentMethod || 'unknown';
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });

    return Object.entries(methodCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('_', ' '),
      value
    }));
  }, [payments]);

  // Calculate course enrollment from student fees
  const courseEnrollmentData = useMemo(() => {
    if (!courses || !Array.isArray(courses) || !studentFees || !Array.isArray(studentFees)) return [];
    
    const enrollmentCounts: Record<string, number> = {};
    studentFees.forEach((fee: any) => {
      const courseName = fee.course?.name || 'Unknown';
      enrollmentCounts[courseName] = (enrollmentCounts[courseName] || 0) + 1;
    });

    return Object.entries(enrollmentCounts)
      .map(([course, students]) => ({ course, students }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 5); // Top 5 courses
  }, [courses, studentFees]);

  // Get recent payments
  const recentPayments = useMemo(() => {
    if (!payments || !Array.isArray(payments)) return [];
    
    return payments
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((payment: any) => ({
        studentName: `${payment.student?.firstName || ''} ${payment.student?.lastName || ''}`.trim() || 'Unknown',
        courseName: payment.course?.name || 'Unknown',
        amount: payment.amount,
        date: payment.createdAt,
      }));
  }, [payments]);

  // Calculate total revenue
  const totalRevenue = useMemo(() => {
    if (!payments || !Array.isArray(payments)) return 0;
    return payments
      .filter((p: any) => p.status === 'success')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  }, [payments]);

  // Calculate collection rate
  const collectionRate = useMemo(() => {
    if (!studentFees || !Array.isArray(studentFees)) return 0;
    
    const totalAmount = studentFees.reduce((sum: number, fee: any) => sum + (fee.totalAmount || 0), 0);
    const paidAmount = studentFees.reduce((sum: number, fee: any) => sum + (fee.paidAmount || 0), 0);
    
    return totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;
  }, [studentFees]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Dashboard" 
        subtitle="Welcome back! Here's your overview"
      />

      {/* Stats Grid with Animation */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <motion.div variants={item}>
          <Card className="bg-[#1a1a1a] border-white/10 hover:border-white/20 transition-all overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  Active
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter value={stats?.totalStudents || 0} />
                </p>
                <p className="text-zinc-400 text-sm">Total Students</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-[#1a1a1a] border-white/10 hover:border-white/20 transition-all overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  Total
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">
                  ₹<AnimatedCounter value={totalRevenue} />
                </p>
                <p className="text-zinc-400 text-sm">Total Revenue</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-[#1a1a1a] border-white/10 hover:border-white/20 transition-all overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-orange-400" />
                </div>
                <div className="flex items-center gap-1 text-orange-400 text-sm font-semibold">
                  <Clock className="w-4 h-4" />
                  Pending
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">
                  ₹<AnimatedCounter value={stats?.pendingPayments || 0} />
                </p>
                <p className="text-zinc-400 text-sm">Pending Amount</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="bg-[#1a1a1a] border-white/10 hover:border-white/20 transition-all overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-violet-500/10 rounded-xl group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-violet-400" />
                </div>
                <div className="flex items-center gap-1 text-emerald-400 text-sm font-semibold">
                  <ArrowUpRight className="w-4 h-4" />
                  Rate
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold text-white mb-1">
                  <AnimatedCounter value={collectionRate} suffix="%" />
                </p>
                <p className="text-zinc-400 text-sm">Collection Rate</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Course Enrollment */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Course Enrollment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {courseEnrollmentData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={courseEnrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="course" stroke="#888" />
                    <YAxis stroke="#888" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a1a', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="students" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-zinc-500">
                  No enrollment data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paymentMethodData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentMethodData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethodData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a1a', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-zinc-500">
                  No payment data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="bg-[#1a1a1a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPayments.length > 0 ? (
                recentPayments.map((payment: any, index: number) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-[#242424] rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-white font-semibold text-sm">
                          {payment.studentName?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{payment.studentName}</p>
                        <p className="text-zinc-500 text-sm">{payment.courseName}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">₹{payment.amount?.toLocaleString()}</p>
                      <p className="text-zinc-500 text-sm">{new Date(payment.date).toLocaleDateString()}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500">
                  No recent payments
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
