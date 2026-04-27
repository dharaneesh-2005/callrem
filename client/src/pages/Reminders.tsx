import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ModernLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Plus, Trash2, Send, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ScheduleReminderModal from "@/components/modals/ScheduleReminderModal";

export default function Reminders() {
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [reminderScript, setReminderScript] = useState(
    "Dear {studentName}, this is a reminder that you have a pending fee of ₹{pendingAmount} for {courseName}. Please make the payment at your earliest convenience. Thank you!"
  );
  const [selectedStudentFee, setSelectedStudentFee] = useState("");
  const [reminderType, setReminderType] = useState("sms");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reminders, isLoading } = useQuery({
    queryKey: ["/api/reminders"],
  });

  const { data: studentFees } = useQuery({
    queryKey: ["/api/student-fees"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success",
        description: "Reminder deleted successfully",
      });
    },
  });

  const sendInstantReminderMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/reminders/send-instant", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Reminder sent successfully",
      });
      setSelectedStudentFee("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder",
        variant: "destructive",
      });
    },
  });

  const handleSendInstant = () => {
    if (!selectedStudentFee) {
      toast({
        title: "Error",
        description: "Please select a student",
        variant: "destructive",
      });
      return;
    }

    const selectedFee = Array.isArray(studentFees) 
      ? studentFees.find((sf: any) => sf.id === parseInt(selectedStudentFee))
      : null;

    if (!selectedFee) return;

    // Replace placeholders in script
    const personalizedMessage = reminderScript
      .replace('{studentName}', `${selectedFee.student.firstName} ${selectedFee.student.lastName}`)
      .replace('{pendingAmount}', selectedFee.pendingAmount.toString())
      .replace('{courseName}', selectedFee.course.name);

    sendInstantReminderMutation.mutate({
      studentFeeId: selectedFee.id,
      phoneNumber: selectedFee.student.phone,
      message: personalizedMessage,
      reminderType,
    });
  };

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
        title="Payment Reminders" 
        subtitle="Automated reminders for pending payments"
        action={
          <Button 
            onClick={() => setShowScheduleModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Schedule Reminder
          </Button>
        }
      />

      {/* Instant Reminder Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Script Editor */}
        <Card className="bg-[#1a1a1a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Reminder Script Template
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white mb-2">Message Template</Label>
              <Textarea
                value={reminderScript}
                onChange={(e) => setReminderScript(e.target.value)}
                rows={6}
                className="bg-[#242424] border-white/10 text-white placeholder-zinc-500 font-mono text-sm"
                placeholder="Enter your reminder message template..."
              />
              <p className="text-xs text-zinc-500 mt-2">
                Available placeholders: {"{studentName}"}, {"{pendingAmount}"}, {"{courseName}"}
              </p>
            </div>
            <Button 
              variant="outline"
              className="w-full bg-[#242424] border-white/10 text-white hover:bg-white/5"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </Button>
          </CardContent>
        </Card>

        {/* Instant Trigger */}
        <Card className="bg-[#1a1a1a] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send Instant Reminder
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white mb-2">Select Student</Label>
              <Select value={selectedStudentFee} onValueChange={setSelectedStudentFee}>
                <SelectTrigger className="bg-[#242424] border-white/10 text-white">
                  <SelectValue placeholder="Choose student..." />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10">
                  {Array.isArray(studentFees) && studentFees
                    .filter((sf: any) => sf.pendingAmount > 0)
                    .map((sf: any) => (
                      <SelectItem key={sf.id} value={sf.id.toString()}>
                        {sf.student.firstName} {sf.student.lastName} - {sf.course.name} (₹{sf.pendingAmount})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white mb-2">Reminder Type</Label>
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

            {selectedStudentFee && Array.isArray(studentFees) && (
              <div className="bg-[#242424] p-4 rounded-xl border border-white/10">
                <p className="text-xs text-zinc-500 mb-2">Preview:</p>
                <p className="text-sm text-white">
                  {reminderScript
                    .replace('{studentName}', 
                      (() => {
                        const sf = studentFees.find((s: any) => s.id === parseInt(selectedStudentFee));
                        return sf ? `${sf.student.firstName} ${sf.student.lastName}` : '';
                      })()
                    )
                    .replace('{pendingAmount}', 
                      (() => {
                        const sf = studentFees.find((s: any) => s.id === parseInt(selectedStudentFee));
                        return sf ? sf.pendingAmount.toString() : '';
                      })()
                    )
                    .replace('{courseName}', 
                      (() => {
                        const sf = studentFees.find((s: any) => s.id === parseInt(selectedStudentFee));
                        return sf ? sf.course.name : '';
                      })()
                    )}
                </p>
              </div>
            )}

            <Button 
              onClick={handleSendInstant}
              disabled={sendInstantReminderMutation.isPending || !selectedStudentFee}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendInstantReminderMutation.isPending ? "Sending..." : "Send Now"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Reminders List */}
      <h3 className="text-xl font-bold text-white mb-4">Scheduled Reminders</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!Array.isArray(reminders) || reminders.length === 0 ? (
          <Card className="bg-[#1a1a1a] border-white/10 col-span-full">
            <CardContent className="p-8 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
              <h3 className="text-xl font-semibold text-white mb-2">No Scheduled Reminders</h3>
              <p className="text-zinc-400">Schedule your first reminder to get started</p>
            </CardContent>
          </Card>
        ) : (
          reminders.map((reminder: any) => (
            <Card key={reminder.id} className="bg-[#1a1a1a] border-white/10 hover:border-white/20 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-500/10 rounded-xl">
                    <Bell className="w-6 h-6 text-blue-400" />
                  </div>
                  <Badge className={
                    reminder.status === 'sent' ? 'status-paid' :
                    reminder.status === 'pending' ? 'status-pending' :
                    'status-inactive'
                  }>
                    {reminder.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {reminder.student?.firstName} {reminder.student?.lastName}
                </h3>
                <p className="text-zinc-400 text-sm mb-4 line-clamp-2">
                  {reminder.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {new Date(reminder.scheduledDate).toLocaleDateString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(reminder.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-white/5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {showScheduleModal && (
        <ScheduleReminderModal onClose={() => setShowScheduleModal(false)} />
      )}
    </div>
  );
}
