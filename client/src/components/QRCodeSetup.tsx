import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Copy, Check } from "lucide-react";

interface QRCodeSetupProps {
  username: string;
  onClose: () => void;
}

export default function QRCodeSetup({ username, onClose }: QRCodeSetupProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [manualEntryKey, setManualEntryKey] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setupTwoFactor();
  }, [username]);

  const setupTwoFactor = async () => {
    try {
      setIsLoading(true);
      const response = await apiRequest("POST", "/api/auth/setup-2fa", { username });
      const data = await response.json();
      
      setQrCodeDataUrl(data.qrCodeDataUrl);
      setManualEntryKey(data.manualEntryKey);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to setup 2FA",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(manualEntryKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Secret key copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Please enter a valid 6-digit code",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsVerifying(true);
      const response = await apiRequest("POST", "/api/auth/verify-2fa", {
        username,
        totpCode: verificationCode,
      });
      
      const data = await response.json();
      
      if (data.valid) {
        toast({
          title: "Success",
          description: "2FA setup completed successfully! You can now log in.",
        });
        onClose();
      } else {
        toast({
          title: "Error",
          description: "Invalid verification code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Setting up 2FA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <Card className="bg-white rounded-2xl shadow-xl">
          <CardContent className="pt-8">
            <div className="text-center mb-6">
              <Button
                variant="ghost"
                onClick={onClose}
                className="absolute top-4 left-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
              
              <h2 className="text-2xl font-bold text-gray-900 mt-8">Setup Two-Factor Authentication</h2>
              <p className="mt-2 text-gray-600">Secure your account with 2FA</p>
            </div>

            <div className="space-y-6">
              {/* Step 1: Scan QR Code */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Step 1: Scan QR Code</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Open your authenticator app (Google Authenticator, Authy, etc.) and scan this QR code:
                </p>
                <div className="flex justify-center mb-4">
                  {qrCodeDataUrl && (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="2FA QR Code" 
                      className="border border-gray-300 rounded-lg"
                    />
                  )}
                </div>
              </div>

              {/* Step 2: Manual Entry */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Step 2: Or Enter Manually</h3>
                <p className="text-sm text-gray-600 mb-2">
                  If you can't scan the QR code, enter this key manually:
                </p>
                <div className="flex items-center space-x-2">
                  <Input
                    value={manualEntryKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Step 3: Verify */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Step 3: Verify Setup</h3>
                <form onSubmit={verifyCode}>
                  <Label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Enter the 6-digit code from your authenticator app:
                  </Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="000000"
                    className="text-center text-lg tracking-widest mb-4"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full bg-primary text-white hover:bg-primary/90"
                  >
                    {isVerifying ? "Verifying..." : "Complete Setup"}
                  </Button>
                </form>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
