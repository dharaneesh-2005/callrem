import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";

interface AddStudentModalProps {
  student?: any;
  onClose: () => void;
}

export default function AddStudentModal({ student, onClose }: AddStudentModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [studentId, setStudentId] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (student) {
      setFirstName(student.firstName || "");
      setLastName(student.lastName || "");
      setEmail(student.email || "");
      setPhone(student.phone || "");
      setAddress(student.address || "");
      setStudentId(student.studentId || "");
    } else {
      // Generate student ID for new students
      setStudentId(`STU${Date.now().toString().slice(-6)}`);
    }
  }, [student]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = student ? `/api/students/${student.id}` : "/api/students";
      const method = student ? "PUT" : "POST";
      await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: student ? "Student updated successfully" : "Student created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save student",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName || !email || !phone || !studentId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      firstName,
      lastName,
      email,
      phone,
      address,
      studentId,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {student ? "Edit Student" : "Add New Student"}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </Label>
              <Input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </Label>
              <Input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@email.com"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 9876543210"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
              Student ID *
            </Label>
            <Input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="STU001"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Student address"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : student ? "Update Student" : "Save Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
