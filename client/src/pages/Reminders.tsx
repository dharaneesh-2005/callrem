import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Phone, CalendarPlus, X, MessageSquare, Clock, CheckCircle, AlertCircle, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Reminders() {
  const [callScript, setCallScript] = useState(
    "Hello {{studentName}}, this is a reminder that you have a pending fee of {{pendingAmount}} rupees for {{courseName}}. Please make the payment at your earliest convenience. Thank you."
  );

  const [callTiming, setCallTiming] = useState("9am-6pm");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleScript, setScheduleScript] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [customMessage, setCustomMessage] = useState("");

  const [voiceSettings, setVoiceSettings] = useState("alice");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reminders, isLoading } = useQuery({
    queryKey: ["/api/reminders"],
  });

  const sendBulkMutation = useMutation({
    mutationFn: async (data: { customTemplate: string; language: string }) => {
      await apiRequest("POST", "/api/reminders/send-bulk", {
        ...data,
        language: selectedLanguage
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
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



  const sendIndividualMutation = useMutation({
    mutationFn: async (reminder: any) => {
      // Process the template with actual data or use default based on language
      let processedMessage = callScript;
      
      // Use Tamil template if Tamil is selected (regardless of current template)
      if (selectedLanguage === 'ta') {
        processedMessage = `வணக்கம் {{studentName}}, உங்களுக்கு {{courseName}} பாடத்திற்காக {{pendingAmount}} ரூபாய் கட்டணம் நிலுவையில் உள்ளது என்பதை நினைவூட்டுகிறோம். தயவு செய்து விரைவில் கட்டணம் செலுத்துங்கள். நன்றி.`;
      }
      
      processedMessage = processedMessage
        .replace(/{{studentName}}/g, `${reminder.student.firstName} ${reminder.student.lastName}`)
        .replace(/{{pendingAmount}}/g, reminder.studentFee.pendingAmount)
        .replace(/{{courseName}}/g, reminder.course.name);

      console.log("Sending reminder:", {
        language: selectedLanguage,
        processedMessage: processedMessage,
        originalScript: callScript
      });

      const response = await apiRequest("POST", "/api/reminders/send", {
        studentFeeId: reminder.studentFee.id,
        phoneNumber: reminder.student.phone,
        studentName: `${reminder.student.firstName} ${reminder.student.lastName}`,
        courseName: reminder.course.name,
        pendingAmount: reminder.studentFee.pendingAmount,
        customMessage: processedMessage,
        language: selectedLanguage,
      });
      console.log("Reminder API response:", response);
      return response;
    },
    onSuccess: (data) => {
      console.log("Reminder sent successfully:", data);
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success",
        description: "Voice reminder sent successfully",
      });
    },
    onError: (error: any) => {
      console.error("Reminder error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send voice reminder",
        variant: "destructive",
      });
    },
  });

  const handleSendBulk = () => {
    const confirmMessage = selectedLanguage === 'ta' 
      ? "நிலுவையில் உள்ள கட்டணம் கொண்ட அனைத்து மாணவர்களுக்கும் ஊடாடும் நினைவூட்டல்களை அனுப்ப விரும்புகிறீர்களா? மாணவர்கள் தங்கள் கட்டணம் பற்றி கேள்விகள் கேட்கலாம்."
      : "Send interactive reminders to all students with pending payments? Students can ask questions about their fees during the call.";
    
    if (confirm(confirmMessage)) {
      // Use Tamil template if Tamil is selected (regardless of current template)
      let templateToSend = callScript;
      if (selectedLanguage === 'ta') {
        templateToSend = `வணக்கம் {{studentName}}, உங்களுக்கு {{courseName}} பாடத்திற்காக {{pendingAmount}} ரூபாய் கட்டணம் நிலுவையில் உள்ளது என்பதை நினைவூட்டுகிறோம். தயவு செய்து விரைவில் கட்டணம் செலுத்துங்கள். நன்றி.`;
      }
      
      sendBulkMutation.mutate({
        customTemplate: templateToSend,
        language: selectedLanguage
      });
    }
  };



  const handleSendIndividual = (reminder: any) => {
    sendIndividualMutation.mutate(reminder);
  };

  const handleScheduleReminder = () => {
    setScheduleScript(callScript);
    setShowScheduleModal(true);
  };

  const scheduleReminderMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/reminders/schedule", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({
        title: "Success", 
        description: "Reminders scheduled successfully for all students with pending fees",
      });
      setShowScheduleModal(false);
      setScheduleDate("");
      setScheduleTime("");
      setScheduleScript("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule reminder",
        variant: "destructive",
      });
    },
  });

  const handleSubmitSchedule = () => {
    if (!scheduleDate || !scheduleTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time for the scheduled reminder",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    if (scheduledDateTime <= new Date()) {
      toast({
        title: "Invalid Time",
        description: "Please select a future date and time",
        variant: "destructive",
      });
      return;
    }

    // Use Tamil template if Tamil is selected (regardless of current template)
    let templateToSchedule = scheduleScript;
    if (selectedLanguage === 'ta') {
      templateToSchedule = `வணக்கம் {{studentName}}, உங்களுக்கு {{courseName}} பாடத்திற்காக {{pendingAmount}} ரூபாய் கட்டணம் நிலுவையில் உள்ளது என்பதை நினைவூட்டுகிறோம். தயவு செய்து விரைவில் கட்டணம் செலுத்துங்கள். நன்றி.`;
    }

    scheduleReminderMutation.mutate({
      scheduledAt: scheduledDateTime.toISOString(),
      customTemplate: templateToSchedule,
      type: "voice",
      language: selectedLanguage
    });
  };

  // Calculate stats
  const totalSent = reminders?.length || 0;
  const successful = reminders?.filter((r: any) => r.status === "sent" || r.status === "delivered").length || 0;
  const failed = reminders?.filter((r: any) => r.status === "failed").length || 0;
  const pending = reminders?.filter((r: any) => r.status === "pending").length || 0;
  const successRate = totalSent > 0 ? Math.round((successful / totalSent) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex-1 p-8">
        <div className="text-center py-8">Loading reminders...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payment Reminders</h2>
        <div className="flex space-x-3">
          <Button
            onClick={handleSendBulk}
            disabled={sendBulkMutation.isPending}
            className="bg-yellow-500 text-white hover:bg-yellow-600 flex items-center gap-2"
          >
            <Phone className="h-4 w-4" />
            {sendBulkMutation.isPending ? "Sending..." : "Send Interactive Reminders"}
          </Button>
          <Button
            onClick={handleScheduleReminder}
            className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
          >
            <CalendarPlus className="h-4 w-4" />
            Schedule Reminder
          </Button>
        </div>
      </div>

      {/* Reminder Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{totalSent}</div>
              <div className="text-gray-600 mt-1">Total Sent</div>
              <div className="text-sm text-gray-500 mt-1">This month</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{successful}</div>
              <div className="text-gray-600 mt-1">Successful</div>
              <div className="text-sm text-gray-500 mt-1">{successRate}% success rate</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{failed}</div>
              <div className="text-gray-600 mt-1">Failed</div>
              <div className="text-sm text-gray-500 mt-1">Invalid numbers</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{pending}</div>
              <div className="text-gray-600 mt-1">Pending</div>
              <div className="text-sm text-gray-500 mt-1">To be sent</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Twilio Configuration */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Twilio Configuration</h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">Call Script Template</Label>
              <Textarea
                value={callScript}
                onChange={(e) => setCallScript(e.target.value)}
                rows={4}
                placeholder={selectedLanguage === 'ta' 
                  ? "வணக்கம் {{studentName}}, உங்களுக்கு {{courseName}} பாடத்திற்காக {{pendingAmount}} ரூபாய் கட்டணம் நிலுவையில் உள்ளது..."
                  : "Hello {{studentName}}, this is a reminder that you have a pending fee of {{pendingAmount}} rupees for {{courseName}}..."
                }
                className="w-full"
              />
              <div className="mt-2 text-xs text-gray-500">
                Available placeholders: {`{{studentName}}, {{pendingAmount}}, {{courseName}}`}
              </div>
              {selectedLanguage === 'ta' && (
                <div className="mt-2 text-xs text-blue-600">
                  Default Tamil template will be used if script is empty: வணக்கம் {`{{studentName}}`}, உங்களுக்கு {`{{courseName}}`} பாடத்திற்காக {`{{pendingAmount}}`} ரூபாய் கட்டணம் நிலுவையில் உள்ளது...
                </div>
              )}
              
              {/* Template Preview */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                <Label className="block text-sm font-medium text-gray-700 mb-2">Preview:</Label>
                <div className="text-sm text-gray-700">
                  {callScript
                    .replace(/{{studentName}}/g, "John Doe")
                    .replace(/{{pendingAmount}}/g, "15000")
                    .replace(/{{courseName}}/g, "Computer Science")}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Language</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English (Indian)</SelectItem>
                    <SelectItem value="ta">Tamil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Voice Settings</Label>
                <Select value={voiceSettings} onValueChange={setVoiceSettings}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alice">Alice (Female, English)</SelectItem>
                    <SelectItem value="polly">Polly (Female, Indian English)</SelectItem>
                    <SelectItem value="man">Man (Male, English)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Call Timing</Label>
                <Select value={callTiming} onValueChange={setCallTiming}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9am-6pm">9:00 AM - 6:00 PM</SelectItem>
                    <SelectItem value="10am-8pm">10:00 AM - 8:00 PM</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder History */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Reminder History</h3>
        </div>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Phone Number</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Pending Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Last Reminder</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reminders?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      No reminders found. Send your first reminder to see the history here.
                    </td>
                  </tr>
                ) : (
                  reminders?.map((reminder: any) => (
                    <tr key={reminder.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {reminder.student?.firstName} {reminder.student?.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{reminder.course?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-900">{reminder.student?.phone}</td>
                      <td className="px-6 py-4 text-red-600 font-medium">
                        ₹{reminder.studentFee?.pendingAmount}
                      </td>
                      <td className="px-6 py-4 text-gray-900">
                        {reminder.status === "scheduled" && reminder.scheduledAt ? 
                          `Scheduled: ${new Date(reminder.scheduledAt).toLocaleString()}` :
                          reminder.sentAt ? new Date(reminder.sentAt).toLocaleDateString() : "Not sent"
                        }
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={
                          reminder.status === "sent" || reminder.status === "delivered" ? "default" :
                          reminder.status === "failed" ? "destructive" : 
                          reminder.status === "scheduled" ? "outline" : "secondary"
                        }>
                          {reminder.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          onClick={() => handleSendIndividual(reminder)}
                          disabled={sendIndividualMutation.isPending}
                          className="bg-yellow-500 text-white hover:bg-yellow-600"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call Now
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Reminder Modal */}
      {showScheduleModal && (
        <Dialog open={showScheduleModal} onOpenChange={setShowScheduleModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule Reminder</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Date</Label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium text-gray-700 mb-2">Time</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">Call Script Template</Label>
                <Textarea
                  value={scheduleScript}
                  onChange={(e) => setScheduleScript(e.target.value)}
                  rows={4}
                  placeholder="Hello {{studentName}}, this is a reminder that you have a pending fee of {{pendingAmount}} rupees for {{courseName}}..."
                  className="w-full"
                />
                <div className="mt-2 text-xs text-gray-500">
                  Available placeholders: {`{{studentName}}, {{pendingAmount}}, {{courseName}}`}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CalendarPlus className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">Scheduled Reminder</h3>
                    <div className="mt-1 text-sm text-yellow-700">
                      This reminder will be sent to all students with pending fees at the scheduled time.
                      {scheduleDate && scheduleTime && (
                        <div className="mt-2 font-medium">
                          Scheduled for: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitSchedule}
                  disabled={scheduleReminderMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {scheduleReminderMutation.isPending ? "Scheduling..." : "Schedule Reminder"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}


    </div>
  );
}
