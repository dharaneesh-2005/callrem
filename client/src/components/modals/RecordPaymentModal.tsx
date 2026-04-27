import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, CreditCard } from "lucide-react";

interface RecordPaymentModalProps {
  onClose: () => void;
}

export default function RecordPaymentModal({ onClose }: RecordPaymentModalProps) {
  const [selectedStudentFee, setSelectedStudentFee] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: studentFees } = useQuery({
    queryKey: ["/api/student-fees"],
  });

  const recordPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/payments/record", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentFee) {
      toast({
        title: "Error",
        description: "Please select a student",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    recordPaymentMutation.mutate({
      studentFeeId: parseInt(selectedStudentFee),
      amount: parseFloat(amount),
      paymentMethod,
      notes,
      transactionId: `MANUAL_${Date.now()}`,
      status: "success",
    });
  };

  const selectedFee = Array.isArray(studentFees) 
    ? studentFees.find((sf: any) => sf.id === parseInt(selectedStudentFee))
    : null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-[#1a1a1a] border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-white">
            Record Payment
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-white/5">
              <X className="h-4 w-4 text-white" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="studentFee" className="text-white mb-2">
              Select Student & Course
            </Label>
            <Select value={selectedStudentFee} onValueChange={setSelectedStudentFee}>
              <SelectTrigger className="bg-[#242424] border-white/10 text-white">
                <SelectValue placeholder="Choose student..." />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                {Array.isArray(studentFees) && studentFees
                  .filter((sf: any) => sf.pendingAmount > 0)
                  .map((sf: any) => (
                    <SelectItem key={sf.id} value={sf.id.toString()}>
                      {sf.student.firstName} {sf.student.lastName} - {sf.course.name} (Pending: ₹{sf.pendingAmount})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFee && (
            <div className="bg-[#242424] p-4 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">Total Fee:</span>
                <span className="text-white font-medium">₹{selectedFee.totalAmount}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">Paid:</span>
                <span className="text-green-400 font-medium">₹{selectedFee.paidAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Pending:</span>
                <span className="text-red-400 font-medium">₹{selectedFee.pendingAmount}</span>
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="amount" className="text-white mb-2">
              Payment Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              max={selectedFee?.pendingAmount}
              className="bg-[#242424] border-white/10 text-white placeholder-zinc-500"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="paymentMethod" className="text-white mb-2">
              Payment Method
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="bg-[#242424] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="card">Card</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes" className="text-white mb-2">
              Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Payment notes..."
              rows={2}
              className="bg-[#242424] border-white/10 text-white placeholder-zinc-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="bg-[#242424] border-white/10 text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={recordPaymentMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {recordPaymentMutation.isPending ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
