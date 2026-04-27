import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ModernLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Eye, Plus } from "lucide-react";
import RecordPaymentModal from "@/components/modals/RecordPaymentModal";

export default function Payments() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const { data: payments, isLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  const filteredPayments = Array.isArray(payments) ? payments.filter((payment: any) => 
    payment.student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.student?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.receiptNumber?.includes(searchTerm)
  ) : [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="loading-spinner border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Payment Management" 
        subtitle="Track and manage all fee payments"
        action={
          <Button
            onClick={() => setShowPaymentModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Record Payment
          </Button>
        }
      />

      <Card className="bg-[#1a1a1a] border-white/10 mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2">Search Payments</Label>
              <Input
                type="text"
                placeholder="Search by student name or receipt number"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#242424] border-white/10 text-white placeholder-zinc-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="modern-table">
        <table className="w-full">
          <thead>
            <tr>
              <th>Receipt #</th>
              <th>Student</th>
              <th>Course</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Method</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments?.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-zinc-500">
                  No payments found.
                </td>
              </tr>
            ) : (
              filteredPayments?.map((payment: any) => (
                <tr key={payment.id}>
                  <td className="font-medium text-white">{payment.receiptNumber}</td>
                  <td className="text-white">
                    {payment.student?.firstName} {payment.student?.lastName}
                  </td>
                  <td className="text-white">{payment.course?.name}</td>
                  <td className="text-white">₹{payment.amount.toLocaleString()}</td>
                  <td className="text-white">
                    {new Date(payment.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="text-white capitalize">{payment.paymentMethod}</td>
                  <td>
                    <Badge className="status-paid">Paid</Badge>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-white/5"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-white/5"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPaymentModal && (
        <RecordPaymentModal onClose={() => setShowPaymentModal(false)} />
      )}
    </div>
  );
}
