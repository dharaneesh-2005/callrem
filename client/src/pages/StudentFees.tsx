import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Phone, Plus, History, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AssignFeeModal from "@/components/modals/AssignFeeModal";
import PaymentModal from "@/components/modals/PaymentModal";

export default function StudentFees() {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStudentFee, setSelectedStudentFee] = useState(null);
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: studentFees, isLoading } = useQuery({
    queryKey: ["/api/student-fees"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: payments } = useQuery({
    queryKey: ["/api/payments"],
  });

  const remindMutation = useMutation({
    mutationFn: async (studentFee: any) => {
      await apiRequest("POST", "/api/reminders/send", {
        studentFeeId: studentFee.id,
        phoneNumber: studentFee.student.phone,
        studentName: `${studentFee.student.firstName} ${studentFee.student.lastName}`,
        courseName: studentFee.course.name,
        pendingAmount: studentFee.pendingAmount,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reminder sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder",
        variant: "destructive",
      });
    },
  });

  const remindAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/reminders/send-bulk");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Bulk reminders sent successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send bulk reminders",
        variant: "destructive",
      });
    },
  });

  const handleCollectPayment = (studentFee: any) => {
    setSelectedStudentFee(studentFee);
    setShowPaymentModal(true);
  };

  const handleRemindStudent = (studentFee: any) => {
    remindMutation.mutate(studentFee);
  };

  const handleRemindAll = () => {
    if (confirm("Are you sure you want to send reminders to all students with pending payments?")) {
      remindAllMutation.mutate();
    }
  };

  const handleViewHistory = (studentFee: any) => {
    setSelectedStudentFee(studentFee);
    setShowHistoryModal(true);
  };

  const filteredFees = studentFees?.filter((fee: any) => {
    const matchesCourse = courseFilter === "all" || fee.course.id.toString() === courseFilter;
    const matchesStatus = statusFilter === "all" || fee.status === statusFilter;
    return matchesCourse && matchesStatus;
  });

  // Calculate stats
  const totalPending = filteredFees?.reduce((sum: number, fee: any) => 
    fee.status !== "paid" ? sum + parseFloat(fee.pendingAmount) : sum, 0) || 0;
  const partialPayments = filteredFees?.reduce((sum: number, fee: any) => 
    fee.status === "partial" ? sum + parseFloat(fee.paidAmount) : sum, 0) || 0;
  const fullyPaid = filteredFees?.reduce((sum: number, fee: any) => 
    fee.status === "paid" ? sum + parseFloat(fee.totalFee) : sum, 0) || 0;

  const pendingCount = filteredFees?.filter((fee: any) => fee.status !== "paid").length || 0;
  const partialCount = filteredFees?.filter((fee: any) => fee.status === "partial").length || 0;
  const paidCount = filteredFees?.filter((fee: any) => fee.status === "paid").length || 0;

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center py-8">Loading student fees...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Student Fees Management</h2>
        <div className="flex space-x-3">
          <Button
            onClick={handleRemindAll}
            disabled={remindAllMutation.isPending}
            className="bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-2"
          >
            <Phone className="h-4 w-4" />
            {remindAllMutation.isPending ? "Sending..." : "Remind All"}
          </Button>
          <Button
            onClick={() => setShowAssignModal(true)}
            className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Assign Course Fee
          </Button>
        </div>
      </div>

      {/* Fee Assignment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">₹{totalPending.toLocaleString()}</div>
              <div className="text-gray-600 mt-1">Total Pending</div>
              <div className="text-sm text-gray-500 mt-1">{pendingCount} students</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">₹{partialPayments.toLocaleString()}</div>
              <div className="text-gray-600 mt-1">Partial Payments</div>
              <div className="text-sm text-gray-500 mt-1">{partialCount} students</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">₹{fullyPaid.toLocaleString()}</div>
              <div className="text-gray-600 mt-1">Fully Paid</div>
              <div className="text-sm text-gray-500 mt-1">{paidCount} students</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Fees Table */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Fee Assignments</h3>
            <div className="flex space-x-3">
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses?.map((course: any) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Total Fee</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Paid Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Pending</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Due Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFees?.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No fee assignments found. Assign courses to students to get started.
                    </td>
                  </tr>
                ) : (
                  filteredFees?.map((fee: any) => (
                    <tr key={fee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-medium">
                              {fee.student.firstName[0]}{fee.student.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {fee.student.firstName} {fee.student.lastName}
                            </div>
                            <div className="text-sm text-gray-600">{fee.student.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{fee.course.name}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">₹{fee.totalFee}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">₹{fee.paidAmount}</td>
                      <td className="px-6 py-4 text-red-600 font-medium">₹{fee.pendingAmount}</td>
                      <td className="px-6 py-4 text-gray-900">
                        {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : "No due date"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {fee.status !== "paid" && (
                            <Button
                              size="sm"
                              onClick={() => handleCollectPayment(fee)}
                              className="bg-green-500 text-white hover:bg-green-600"
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Collect
                            </Button>
                          )}
                          {fee.status !== "paid" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRemindStudent(fee)}
                              disabled={remindMutation.isPending}
                              className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                            >
                              <Phone className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewHistory(fee)}
                            className="border-blue-500 text-blue-600 hover:bg-blue-50"
                          >
                            <History className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {showAssignModal && (
        <AssignFeeModal onClose={() => setShowAssignModal(false)} />
      )}

      {showPaymentModal && selectedStudentFee && (
        <PaymentModal
          studentFee={selectedStudentFee}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedStudentFee(null);
          }}
        />
      )}

      {showHistoryModal && selectedStudentFee && (
        <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Payment History - {selectedStudentFee.student.firstName} {selectedStudentFee.student.lastName}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Course</p>
                    <p className="font-medium">{selectedStudentFee.course.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Fee</p>
                    <p className="font-medium">₹{selectedStudentFee.totalFee}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paid Amount</p>
                    <p className="font-medium text-green-600">₹{selectedStudentFee.paidAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pending Amount</p>
                    <p className="font-medium text-red-600">₹{selectedStudentFee.pendingAmount}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Payment Records</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {payments?.filter((payment: any) => payment.studentFeeId === selectedStudentFee.id)
                    .map((payment: any) => (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">₹{payment.amount}</span>
                              <Badge variant={payment.status === "success" ? "default" : 
                                            payment.status === "failed" ? "destructive" : "secondary"}>
                                {payment.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 capitalize">{payment.paymentMethod}</p>
                            {payment.notes && (
                              <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {payment.razorpayPaymentId || payment.transactionId || "No ID"}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  {payments?.filter((payment: any) => payment.studentFeeId === selectedStudentFee.id).length === 0 && (
                    <p className="text-gray-500 text-center py-4">No payment records found</p>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
