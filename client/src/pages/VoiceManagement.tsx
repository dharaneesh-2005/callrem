import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Phone, MessageSquare, Activity, TestTube, Brain, PhoneCall } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface CallLog {
  id: number;
  callSid: string;
  toNumber: string;
  fromNumber: string;
  status: string;
  duration: number;
  speechResults: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ConversationLog {
  id: number;
  callSid: string;
  userSpeech: string | null;
  botResponse: string | null;
  intent: string | null;
  confidence: string;
  language: string;
  timestamp: string;
  student: {
    id: number;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

export default function VoiceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [language, setLanguage] = useState("en");
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [testText, setTestText] = useState("");
  const [testLanguage, setTestLanguage] = useState("en");
  const [testStudentId, setTestStudentId] = useState<number | null>(null);

  // Fetch data
  const { data: callLogs, isLoading: loadingCalls } = useQuery<CallLog[]>({
    queryKey: ["/api/voice/call-logs"],
  });

  const { data: conversationLogs, isLoading: loadingConversations } = useQuery<ConversationLog[]>({
    queryKey: ["/api/voice/conversation-logs"],
  });

  const { data: students, isLoading: loadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Mutations
  const initiateCallMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; language: string; studentId?: number }) => {
      const response = await apiRequest("POST", "/api/voice/initiate-call", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Voice Call Initiated",
        description: `Call started successfully. Call SID: ${data.callSid}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/voice/call-logs"] });
      setPhoneNumber("");
    },
    onError: (error: any) => {
      toast({
        title: "Call Failed",
        description: error.message || "Failed to initiate voice call",
        variant: "destructive",
      });
    },
  });

  const testGeminiMutation = useMutation({
    mutationFn: async (data: { text: string; language: string; studentId?: number }) => {
      const response = await apiRequest("POST", "/api/voice/test-gemini", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Gemini Test Completed",
        description: `Intent: ${data.result.intent} (${Math.round(data.result.confidence * 100)}% confidence)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to test Gemini processing",
        variant: "destructive",
      });
    },
  });

  const handleInitiateCall = () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    initiateCallMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      language,
      studentId: selectedStudent || undefined,
    });
  };

  const handleTestGemini = () => {
    if (!testText.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter text to test",
        variant: "destructive",
      });
      return;
    }

    testGeminiMutation.mutate({
      text: testText.trim(),
      language: testLanguage,
      studentId: testStudentId || undefined,
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "default";
      case "in-progress":
        return "secondary";
      case "failed":
        return "destructive";
      case "initiated":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getIntentBadgeVariant = (intent: string | null) => {
    if (!intent) return "outline";
    switch (intent.toLowerCase()) {
      case "fee_inquiry":
        return "default";
      case "support":
        return "destructive";
      case "payment":
        return "secondary";
      case "information":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voice AI Management</h1>
          <p className="text-muted-foreground">
            Manage intelligent voice calls and Gemini AI responses
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Phone className="h-6 w-6 text-primary" />
          <Brain className="h-6 w-6 text-primary" />
        </div>
      </div>

      <Tabs defaultValue="initiate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="initiate" className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4" />
            Initiate Call
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="h-4 w-4" />
            Test Gemini
          </TabsTrigger>
          <TabsTrigger value="calls" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Call Logs
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="initiate">
          <Card>
            <CardHeader>
              <CardTitle>Initiate Intelligent Voice Call</CardTitle>
              <CardDescription>
                Start an AI-powered voice call with speech recognition and Gemini AI responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+91 9876543210 or 9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student">Student (Optional)</Label>
                  <Select value={selectedStudent?.toString() || "none"} onValueChange={(value) => setSelectedStudent(value === "none" ? null : parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student for context" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific student</SelectItem>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.firstName} {student.lastName} ({student.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleInitiateCall}
                disabled={initiateCallMutation.isPending}
                className="w-full"
              >
                {initiateCallMutation.isPending ? "Initiating Call..." : "Start Voice Call"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Gemini AI Processing</CardTitle>
              <CardDescription>
                Test how Gemini AI processes text input with student context
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testText">Test Text</Label>
                <Textarea
                  id="testText"
                  placeholder="Enter text to test (e.g., 'I need help with my fees', 'What are my pending payments?')"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testLanguage">Language</Label>
                  <Select value={testLanguage} onValueChange={setTestLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ta">Tamil (தமிழ்)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testStudent">Student Context</Label>
                  <Select value={testStudentId?.toString() || "none"} onValueChange={(value) => setTestStudentId(value === "none" ? null : parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select student for context" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No student context</SelectItem>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.firstName} {student.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleTestGemini}
                disabled={testGeminiMutation.isPending}
                className="w-full"
              >
                {testGeminiMutation.isPending ? "Testing..." : "Test Gemini AI"}
              </Button>

              {testGeminiMutation.data && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Test Results</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Input:</Label>
                      <p className="text-sm text-muted-foreground">{testGeminiMutation.data.input}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Intent:</Label>
                        <div className="mt-1">
                          <Badge variant={getIntentBadgeVariant(testGeminiMutation.data.result.intent)}>
                            {testGeminiMutation.data.result.intent}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Confidence:</Label>
                        <p className="text-sm">{Math.round(testGeminiMutation.data.result.confidence * 100)}%</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">AI Response:</Label>
                      <p className="text-sm text-muted-foreground">{testGeminiMutation.data.result.response}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Should Transfer:</Label>
                        <Badge variant={testGeminiMutation.data.result.shouldTransfer ? "destructive" : "secondary"}>
                          {testGeminiMutation.data.result.shouldTransfer ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Department:</Label>
                        <Badge variant="outline">{testGeminiMutation.data.result.department}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calls">
          <Card>
            <CardHeader>
              <CardTitle>Call Logs</CardTitle>
              <CardDescription>
                View all voice call records and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCalls ? (
                <div className="text-center py-8">Loading call logs...</div>
              ) : callLogs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No call logs found. Initiate a voice call to see logs here.
                </div>
              ) : (
                <div className="space-y-4">
                  {callLogs?.map((call) => (
                    <Card key={call.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{call.callSid}</Badge>
                            <Badge variant={getStatusBadgeVariant(call.status)}>
                              {call.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            From: {call.fromNumber} → To: {call.toNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(call.createdAt), "PPpp")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            Duration: {call.duration > 0 ? `${call.duration}s` : "N/A"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Logs</CardTitle>
              <CardDescription>
                View detailed conversation exchanges and AI responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingConversations ? (
                <div className="text-center py-8">Loading conversation logs...</div>
              ) : conversationLogs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No conversation logs found. Voice interactions will appear here.
                </div>
              ) : (
                <div className="space-y-4">
                  {conversationLogs?.map((conversation) => (
                    <Card key={conversation.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{conversation.callSid}</Badge>
                            {conversation.intent && (
                              <Badge variant={getIntentBadgeVariant(conversation.intent)}>
                                {conversation.intent}
                              </Badge>
                            )}
                            <Badge variant="secondary">{conversation.language}</Badge>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            {format(new Date(conversation.timestamp), "PPpp")}
                          </div>
                        </div>
                        
                        {conversation.student && (
                          <div className="text-sm">
                            <span className="font-medium">Student: </span>
                            {conversation.student.firstName} {conversation.student.lastName} 
                            ({conversation.student.phone})
                          </div>
                        )}

                        {conversation.userSpeech && (
                          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                            <Label className="text-xs font-medium text-blue-600 dark:text-blue-400">User:</Label>
                            <p className="text-sm mt-1">{conversation.userSpeech}</p>
                          </div>
                        )}

                        {conversation.botResponse && (
                          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                            <Label className="text-xs font-medium text-green-600 dark:text-green-400">AI:</Label>
                            <p className="text-sm mt-1">{conversation.botResponse}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Confidence: {Math.round(parseFloat(conversation.confidence) * 100)}%</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}