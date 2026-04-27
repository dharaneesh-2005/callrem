import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { setAuthToken } from "@/lib/authUtils";
import { GraduationCap } from "lucide-react";
import QRCodeSetup from "@/components/QRCodeSetup";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQRSetup, setShowQRSetup] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<{
    registrationOpen: boolean;
    isFirstUser: boolean;
    totalUsers: number;
  } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRegistrationStatus = async () => {
      try {
        const response = await fetch("/api/auth/registration-status");
        const data = await response.json();
        setRegistrationStatus(data);
      } catch (error) {
        console.error("Failed to fetch registration status:", error);
      }
    };

    fetchRegistrationStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/auth/login", {
        username,
        password,
        totpCode,
      });

      const data = await response.json();
      setAuthToken(data.token);
      
      toast({
        title: "Success",
        description: "Login successful!",
      });

      // Refresh the page to trigger auth state update
      window.location.href = "/";
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const requestData: any = { username, password };
      
      // Add admin key if registration is restricted
      if (registrationStatus && !registrationStatus.registrationOpen) {
        if (!adminKey.trim()) {
          toast({
            title: "Error",
            description: "Admin key is required for registration",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        requestData.adminKey = adminKey;
      }

      const response = await apiRequest("POST", "/api/auth/register", requestData);

      toast({
        title: "Success",
        description: "Account created successfully! You can now login.",
      });
      
      setIsRegistering(false);
      setPassword("");
      setAdminKey("");
      setTotpCode("");
      
      // Refresh registration status
      const statusResponse = await fetch("/api/auth/registration-status");
      const statusData = await statusResponse.json();
      setRegistrationStatus(statusData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Registration failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetup2FA = () => {
    if (!username) {
      toast({
        title: "Error",
        description: "Please enter your username first",
        variant: "destructive",
      });
      return;
    }
    setShowQRSetup(true);
  };

  if (showQRSetup) {
    return <QRCodeSetup username={username} onClose={() => setShowQRSetup(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="max-w-md w-full space-y-8 p-8">
        <Card className="bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl">
          <CardContent className="pt-8">
            <div className="text-center mb-8">
              <div className="mx-auto h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                <GraduationCap className="text-white text-xl" />
              </div>
              <h2 className="text-3xl font-bold text-white">Fee Management</h2>
              <p className="mt-2 text-zinc-400">
                {isRegistering ? "Create your account" : "Sign in to your account"}
              </p>
            </div>
            
            <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-6">
              <div>
                <Label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full px-4 py-3 bg-[#242424] border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-[#242424] border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  required
                />
              </div>
              
              {!isRegistering && (
                <div>
                  <Label htmlFor="otp" className="block text-sm font-medium text-white mb-2">
                    2FA Code <span className="text-xs text-zinc-500">(optional - if configured)</span>
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value)}
                    placeholder="000000"
                    className="w-full px-4 py-3 bg-[#242424] border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-center text-lg tracking-widest"
                  />
                </div>
              )}
              
              {isRegistering && registrationStatus && !registrationStatus.registrationOpen && (
                <div>
                  <Label htmlFor="adminKey" className="block text-sm font-medium text-white mb-2">
                    Admin Registration Key <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="adminKey"
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Enter admin registration key"
                    className="w-full px-4 py-3 bg-[#242424] border border-white/10 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    required
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Contact the system administrator for the registration key.
                  </p>
                </div>
              )}
              
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg hover:shadow-lg hover:shadow-blue-500/25 transition-all font-medium"
              >
                {isLoading 
                  ? (isRegistering ? "Creating Account..." : "Signing In...") 
                  : (isRegistering ? "Create Account" : "Sign In")
                }
              </Button>
              
              <div className="text-center space-y-2">
                {registrationStatus && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering);
                      setTotpCode("");
                      setAdminKey("");
                    }}
                    className="text-blue-400 hover:text-blue-300 text-sm block w-full"
                  >
                    {isRegistering 
                      ? "Already have an account? Sign In" 
                      : registrationStatus.registrationOpen 
                        ? "Create first admin account"
                        : "Admin registration (key required)"
                    }
                  </button>
                )}
                
                {registrationStatus && !registrationStatus.registrationOpen && !isRegistering && (
                  <p className="text-xs text-zinc-500">
                    Registration is restricted. Contact administrator for access.
                  </p>
                )}
                
                {!isRegistering && (
                  <button
                    type="button"
                    onClick={handleSetup2FA}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Setup 2FA on your device?
                  </button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
