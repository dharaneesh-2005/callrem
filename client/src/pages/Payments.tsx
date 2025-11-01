import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, PrinterCheck, Eye, RotateCcw } from "lucide-react";
import ReceiptModal from "@/components/modals/ReceiptModal";
import PaymentModal from "@/components/modals/PaymentModal";
import { useToast } from "@/hooks/use-toast";

export default function Payments() {
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedStudentFee, setSelectedStudentFee] = useState(null);
  const [dateRange, setDateRange] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const { data: pendingFees } = useQuery({
    queryKey: ["/api/student-fees/pending"],
  });

  const handlePrintReceipt = (payment: any) => {
    setSelectedPayment(payment);
    setShowReceiptModal(true);
  };

  const handleRecordPayment = () => {
    if (!pendingFees || pendingFees.length === 0) {
      toast({
        title: "No Pending Fees",
        description: "There are no pending fees to record payments for.",
        variant: "destructive",
      });
      return;
    }
    
    // Use the first pending fee for now, or show a selection modal
    setSelectedStudentFee(pendingFees[0]);
    setShowPaymentModal(true);
  };

  const handleExportPayments = () => {
    if (!filteredPayments || filteredPayments.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no payments to export.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV content
    const headers = [
      "Date",
      "Student Name",
      "Course",
      "Amount",
      "Payment Method",
      "Transaction ID",
      "Status",
      "Notes"
    ];

    const csvContent = [
      headers.join(","),
      ...filteredPayments.map((payment: any) => [
        new Date(payment.createdAt).toLocaleDateString(),
        `"${payment.student?.firstName || ''} ${payment.student?.lastName || ''}"`,
        `"${payment.course?.name || 'N/A'}"`,
        payment.amount,
        payment.paymentMethod,
        payment.razorpayPaymentId || payment.transactionId || '',
        payment.status,
        `"${payment.notes || ''}"`
      ].join(","))
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payments_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Payment data has been exported to CSV file.",
    });
  };

  const filteredPayments = payments?.filter((payment: any) => {
    const matchesMethod = paymentMethodFilter === "all" || payment.paymentMethod === paymentMethodFilter;
    const matchesCourse = courseFilter === "all" || payment.course?.id.toString() === courseFilter;
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    return matchesMethod && matchesCourse && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center py-8">Loading payments...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleExportPayments}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
            onClick={handleRecordPayment}
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        </div>
      </div>

      {/* Payment Filters */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Date Range</Label>
              <Input
                type="date"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              />
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="razorpay">Razorpay</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Course</Label>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger>
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
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Transaction ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Method</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No payments found. Payments will appear here once transactions are made.
                    </td>
                  </tr>
                ) : (
                  filteredPayments?.map((payment: any) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm text-gray-900">{payment.receiptNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {payment.student?.firstName} {payment.student?.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{payment.student?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{payment.course?.name || "N/A"}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">₹{payment.amount}</td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="capitalize">
                          {payment.paymentMethod === "razorpay" && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              Razorpay
                            </span>
                          )}
                          {payment.paymentMethod === "cash" && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Cash
                            </span>
                          )}
                          {payment.paymentMethod === "bank_transfer" && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                              Bank Transfer
                            </span>
                          )}
                          {payment.paymentMethod === "cheque" && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              Cheque
                            </span>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={payment.status === "success" ? "default" : 
                                      payment.status === "failed" ? "destructive" : "secondary"}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintReceipt(payment)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <PrinterCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {payment.status === "success" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
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

      {showReceiptModal && selectedPayment && (
        <ReceiptModal
          payment={selectedPayment}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedPayment(null);
          }}
        />
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
    </div>
  );
}
