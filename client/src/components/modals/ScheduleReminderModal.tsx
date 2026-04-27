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
import { X, Bell } from "lucide-react";

interface ScheduleReminderModalProps {
  onClose: () => void;
}

export default function ScheduleReminderModal({ onClose }: ScheduleReminderModalProps) {
  const [selectedStudentFee, setSelectedStudentFee] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [message, setMessage] = useState("");
  const [reminderType, setReminderType] = useState("sms");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: studentFees } = useQuery({
    queryKey: ["/api/student-fees"],
  });

  const scheduleReminderMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/reminders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success",
        description: "Reminder scheduled successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule reminder",
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

    if (!scheduledDate) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    const selectedFee = Array.isArray(studentFees) 
      ? studentFees.find((sf: any) => sf.id === parseInt(selectedStudentFee))
      : null;

    if (!selectedFee) return;

    const defaultMessage = `Dear ${selectedFee.student.firstName}, this is a reminder that you have a pending fee of ₹${selectedFee.pendingAmount} for ${selectedFee.course.name}. Please make the payment at your earliest convenience.`;

    scheduleReminderMutation.mutate({
      studentFeeId: parseInt(selectedStudentFee),
      studentId: selectedFee.student.id,
      scheduledDate: new Date(scheduledDate).toISOString(),
      message: message || defaultMessage,
      reminderType,
      status: "pending",
    });
  };

  const selectedFee = Array.isArray(studentFees) 
    ? studentFees.find((sf: any) => sf.id === parseInt(selectedStudentFee))
    : null;

  // Set default date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-[#1a1a1a] border-white/10">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-white">
            Schedule Reminder
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
                      {sf.student.firstName} {sf.student.lastName} - {sf.course.name} (₹{sf.pendingAmount} pending)
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFee && (
            <div className="bg-[#242424] p-4 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">Student:</span>
                <span className="text-white font-medium">
                  {selectedFee.student.firstName} {selectedFee.student.lastName}
                </span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">Phone:</span>
                <span className="text-white font-medium">{selectedFee.student.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 text-sm">Pending Amount:</span>
                <span className="text-red-400 font-medium">₹{selectedFee.pendingAmount}</span>
              </div>
            </div>
          )}
          
          <div>
            <Label htmlFor="scheduledDate" className="text-white mb-2">
              Schedule Date
            </Label>
            <Input
              id="scheduledDate"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={defaultDate}
              className="bg-[#242424] border-white/10 text-white"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="reminderType" className="text-white mb-2">
              Reminder Type
            </Label>
            <Select value={reminderType} onValueChange={setReminderType}>
              <SelectTrigger className="bg-[#242424] border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="voice">Voice Call (AI)</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="message" className="text-white mb-2">
              Custom Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Leave empty for default message..."
              rows={3}
              className="bg-[#242424] border-white/10 text-white placeholder-zinc-500"
            />
            {selectedFee && !message && (
              <p className="text-xs text-zinc-500 mt-2">
                Default: "Dear {selectedFee.student.firstName}, this is a reminder that you have a pending fee of ₹{selectedFee.pendingAmount} for {selectedFee.course.name}..."
              </p>
            )}
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
              disabled={scheduleReminderMutation.isPending}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Bell className="h-4 w-4 mr-2" />
              {scheduleReminderMutation.isPending ? "Scheduling..." : "Schedule Reminder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
