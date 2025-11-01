import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X, CreditCard } from "lucide-react";

interface PaymentModalProps {
  studentFee: any;
  onClose: () => void;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentModal({ studentFee, onClose }: PaymentModalProps) {
  const [amount, setAmount] = useState(studentFee.pendingAmount);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [notes, setNotes] = useState("");
  const [isTestMode, setIsTestMode] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Test payment mutation for debugging
  const testPaymentMutation = useMutation({
    mutationFn: async () => {
      console.log("Creating test payment record...");
      return await apiRequest("POST", "/api/payments/record", {
        studentFeeId: studentFee.id,
        amount: parseFloat(amount),
        paymentMethod: "test",
        transactionId: `TEST_${Date.now()}`,
        status: "success",
        notes: notes || "Test payment for debugging"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Test Payment Recorded",
        description: "Test payment recorded successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record test payment",
        variant: "destructive",
      });
    },
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

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/payments/create-order", data);
      return response.json();
    },
    onSuccess: (order) => {
      console.log("Order created successfully:", order);
      console.log("Razorpay Key ID:", import.meta.env.VITE_RAZORPAY_KEY_ID);

      // Load Razorpay script dynamically
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to load Razorpay payment gateway",
          variant: "destructive",
        });
      };
      script.onload = () => {
        console.log("Razorpay script loaded successfully");
        console.log("Window.Razorpay available:", !!window.Razorpay);
        
        const razorpayKeyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
        
        console.log("Creating Razorpay options with:", {
          key: razorpayKeyId,
          amount: order.amount,
          currency: order.currency,
          order_id: order.id
        });
        const options = {
          key: razorpayKeyId,
          amount: order.amount,
          currency: order.currency,
          name: "FeeManager",
          description: `Payment for ${studentFee.course.name}`,
          order_id: order.id,
          handler: async function (response: any) {
            console.log("Payment success response:", response);
            try {
              await apiRequest("POST", "/api/payments/verify", {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                studentFeeId: studentFee.id,
                amount: parseFloat(amount),
              });
              
              queryClient.invalidateQueries({ queryKey: ["/api/student-fees"] });
              queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
              queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
              
              toast({
                title: "Success",
                description: "Payment completed successfully",
              });
              onClose();
            } catch (error: any) {
              toast({
                title: "Error",
                description: error.message || "Payment verification failed",
                variant: "destructive",
              });
            }
          },
          modal: {
            ondismiss: function() {
              console.log("Payment modal dismissed");
            },
            escape: false,
            backdrop_close: false
          },
          prefill: {
            name: `${studentFee.student.firstName} ${studentFee.student.lastName}`,
            email: studentFee.student.email,
            contact: studentFee.student.phone,
          },
          theme: {
            color: "#3b82f6",
          },
        };
        
        try {
          if (!window.Razorpay) {
            throw new Error("Razorpay SDK not loaded");
          }

          const rzp = new window.Razorpay(options);
          
          // Add error handler for payment failures
          rzp.on('payment.failed', function (response: any) {
            console.error('Payment failed:', response.error);
            toast({
              title: "Payment Failed",
              description: response.error.description || "Payment could not be processed",
              variant: "destructive",
            });
          });
          
          console.log("Opening Razorpay checkout...");
          rzp.open();
        } catch (error: any) {
          console.error("Error initializing Razorpay:", error);
          toast({
            title: "Payment Error",
            description: error.message || "Failed to initialize payment gateway",
            variant: "destructive",
          });
        }
      };
      document.body.appendChild(script);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment order",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "razorpay") {
      createOrderMutation.mutate({
        amount: parseFloat(amount),
        studentFeeId: studentFee.id,
      });
    } else {
      recordPaymentMutation.mutate({
        studentFeeId: studentFee.id,
        amount: parseFloat(amount),
        paymentMethod,
        notes,
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Collect Payment
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {/* Student Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl mb-4 border border-blue-100">
          <div className="flex items-center">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4 shadow-sm">
              <span className="text-white font-bold">
                {studentFee.student.firstName[0]}{studentFee.student.lastName[0]}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {studentFee.student.firstName} {studentFee.student.lastName}
              </div>
              <div className="text-sm text-gray-600">
                {studentFee.course.name} • Pending: <span className="font-medium text-red-600">₹{studentFee.pendingAmount}</span>
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              max={studentFee.pendingAmount}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="razorpay">Razorpay (Online)</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {paymentMethod !== "razorpay" && (
            <div>
              <Label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment notes..."
                rows={2}
              />
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {/* Test button for debugging */}
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => testPaymentMutation.mutate()}
              disabled={testPaymentMutation.isPending}
            >
              {testPaymentMutation.isPending ? "Testing..." : "Test Payment"}
            </Button>
            <Button 
              type="submit" 
              disabled={recordPaymentMutation.isPending || createOrderMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {recordPaymentMutation.isPending || createOrderMutation.isPending 
                ? "Processing..." 
                : paymentMethod === "razorpay" 
                  ? "Pay with Razorpay" 
                  : "Record Payment"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
