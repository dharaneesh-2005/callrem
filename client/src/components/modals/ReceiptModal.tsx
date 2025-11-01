import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, PrinterCheck } from "lucide-react";

interface ReceiptModalProps {
  payment: any;
  onClose: () => void;
}

export default function ReceiptModal({ payment, onClose }: ReceiptModalProps) {
  const handlePrint = () => {
    const receiptContent = document.getElementById("receiptContent");
    if (receiptContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html>
          <head>
            <title>Payment Receipt</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { margin: 0; padding: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body class="bg-white">
            ${receiptContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Payment Receipt
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={handlePrint}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                <PrinterCheck className="h-4 w-4 mr-2" />
                PrinterCheck
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div id="receiptContent" className="border-2 border-gray-300 p-6 bg-white">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">FeeManager Institute</h2>
            <p className="text-gray-600">Payment Receipt</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Receipt No:</p>
              <p className="font-medium">{payment.receiptNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date:</p>
              <p className="font-medium">{new Date(payment.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Student Name:</p>
              <p className="font-medium">
                {payment.student?.firstName} {payment.student?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Student ID:</p>
              <p className="font-medium">{payment.student?.studentId || "N/A"}</p>
            </div>
          </div>
          
          <div className="border-t border-b border-gray-300 py-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{payment.course?.name || "Course Fee"}</p>
                <p className="text-sm text-gray-600">Payment for course fees</p>
              </div>
              <p className="text-xl font-bold">₹{payment.amount}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Payment Method:</p>
              <p className="font-medium capitalize">{payment.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transaction ID:</p>
              <p className="font-medium">
                {payment.razorpayPaymentId || payment.transactionId || "N/A"}
              </p>
            </div>
          </div>
          
          {payment.notes && (
            <div className="mb-6">
              <p className="text-sm text-gray-600">Notes:</p>
              <p className="font-medium">{payment.notes}</p>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-600 border-t border-gray-300 pt-4">
            <p>Thank you for your payment!</p>
            <p>Contact: admin@feemanager.com | +91 9876543210</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
