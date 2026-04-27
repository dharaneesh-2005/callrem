import { useState } from "react";
import { PageHeader } from "@/components/ModernLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Phone, Activity, Brain } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function VoiceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [phoneNumber, setPhoneNumber] = useState("");
  const [language, setLanguage] = useState("en");

  const { data: callLogs, isLoading: loadingCalls } = useQuery({
    queryKey: ["/api/voice/call-logs"],
  });

  const { data: conversationLogs, isLoading: loadingConversations } = useQuery({
    queryKey: ["/api/voice/conversation-logs"],
  });

  const initiateCallMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; language: string }) => {
      const response = await apiRequest("POST", "/api/voice/initiate-call", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Call initiated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/voice/call-logs"] });
      setPhoneNumber("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to initiate call",
        variant: "destructive",
      });
    },
  });

  const handleInitiateCall = (e: React.FormEvent) => {
    e.preventDefault();
    initiateCallMutation.mutate({ phoneNumber, language });
  };

  return (
    <div>
      <PageHeader 
        title="Voice Management" 
        subtitle="AI-powered voice call system"
      />

      <Tabs defaultValue="initiate" className="space-y-6">
        <TabsList className="bg-[#1a1a1a] border border-white/10">
          <TabsTrigger value="initiate" className="data-[state=active]:bg-blue-500">
            <Phone className="w-4 h-4 mr-2" />
            Initiate Call
          </TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-blue-500">
            <Activity className="w-4 h-4 mr-2" />
            Call Logs
          </TabsTrigger>
          <TabsTrigger value="conversations" className="data-[state=active]:bg-blue-500">
            <Brain className="w-4 h-4 mr-2" />
            Conversations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="initiate">
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Initiate Voice Call</CardTitle>
              <CardDescription className="text-zinc-400">
                Start an AI-powered voice call to a student
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInitiateCall} className="space-y-6">
                <div>
                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1234567890"
                    className="bg-[#242424] border-white/10 text-white placeholder-zinc-500"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="language" className="text-white">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-[#242424] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  disabled={initiateCallMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  {initiateCallMutation.isPending ? "Initiating..." : "Initiate Call"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Call Logs</CardTitle>
              <CardDescription className="text-zinc-400">
                History of all voice calls
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCalls ? (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner border-blue-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(callLogs) && callLogs.length > 0 ? (
                    callLogs.map((log: any) => (
                      <div 
                        key={log.id}
                        className="p-4 bg-[#242424] rounded-xl border border-white/5 hover:border-white/10 transition-all"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{log.toNumber}</span>
                          <Badge className={
                            log.status === 'completed' ? 'bg-green-500' :
                            log.status === 'failed' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }>
                            {log.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-zinc-400">
                          <p>Duration: {log.duration}s</p>
                          <p>Date: {format(new Date(log.createdAt), 'PPp')}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-500">
                      No call logs found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations">
          <Card className="bg-[#1a1a1a] border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Conversation Logs</CardTitle>
              <CardDescription className="text-zinc-400">
                AI conversation transcripts and analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingConversations ? (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner border-blue-500" />
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(conversationLogs) && conversationLogs.length > 0 ? (
                    conversationLogs.map((log: any) => (
                      <div 
                        key={log.id}
                        className="p-4 bg-[#242424] rounded-xl border border-white/5"
                      >
                        <div className="mb-3">
                          <Badge className="bg-blue-500 mb-2">{log.intent || 'Unknown'}</Badge>
                          <p className="text-sm text-zinc-400">
                            Confidence: {log.confidence} | Language: {log.language}
                          </p>
                        </div>
                        {log.userSpeech && (
                          <div className="mb-2">
                            <p className="text-xs text-zinc-500 mb-1">User:</p>
                            <p className="text-white">{log.userSpeech}</p>
                          </div>
                        )}
                        {log.botResponse && (
                          <div>
                            <p className="text-xs text-zinc-500 mb-1">Bot:</p>
                            <p className="text-zinc-300">{log.botResponse}</p>
                          </div>
                        )}
                        <p className="text-xs text-zinc-600 mt-2">
                          {format(new Date(log.timestamp), 'PPp')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-zinc-500">
                      No conversation logs found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
