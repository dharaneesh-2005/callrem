import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { X } from "lucide-react";

interface AssignFeeModalProps {
  onClose: () => void;
}

export default function AssignFeeModal({ onClose }: AssignFeeModalProps) {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [totalFee, setTotalFee] = useState("");
  const [dueDate, setDueDate] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students } = useQuery({
    queryKey: ["/api/students"],
  });

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/student-fees", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student-fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Course fee assigned successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign course fee",
        variant: "destructive",
      });
    },
  });

  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId);
    const course = courses?.find((c: any) => c.id.toString() === courseId);
    if (course) {
      setTotalFee(course.feeAmount);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent || !selectedCourse || !totalFee) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const feeAmount = parseFloat(totalFee);
    
    mutation.mutate({
      studentId: parseInt(selectedStudent),
      courseId: parseInt(selectedCourse),
      totalFee: feeAmount.toString(),
      paidAmount: "0",
      pendingAmount: feeAmount.toString(),
      dueDate: dueDate || null,
      status: "pending",
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Assign Course Fee
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-2">
              Select Student *
            </Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student: any) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.firstName} {student.lastName} ({student.studentId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
              Select Course *
            </Label>
            <Select value={selectedCourse} onValueChange={handleCourseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a course" />
              </SelectTrigger>
              <SelectContent>
                {courses?.map((course: any) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.name} - ₹{course.feeAmount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="totalFee" className="block text-sm font-medium text-gray-700 mb-2">
              Total Fee Amount (₹) *
            </Label>
            <Input
              id="totalFee"
              type="number"
              value={totalFee}
              onChange={(e) => setTotalFee(e.target.value)}
              placeholder="Enter fee amount"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              Due Date (Optional)
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Assigning..." : "Assign Fee"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
