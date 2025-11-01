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

interface AddCourseModalProps {
  course?: any;
  onClose: () => void;
}

export default function AddCourseModal({ course, onClose }: AddCourseModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [feeAmount, setFeeAmount] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (course) {
      setName(course.name || "");
      setDescription(course.description || "");
      setDuration(course.duration || "");
      setFeeAmount(course.feeAmount || "");
    }
  }, [course]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const url = course ? `/api/courses/${course.id}` : "/api/courses";
      const method = course ? "PUT" : "POST";
      await apiRequest(method, url, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: course ? "Course updated successfully" : "Course created successfully",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save course",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !duration || !feeAmount) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      name,
      description,
      duration,
      feeAmount,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {course ? "Edit Course" : "Add New Course"}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Course Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter course name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Course description"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Duration *
            </Label>
            <Input
              id="duration"
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 6 months"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="feeAmount" className="block text-sm font-medium text-gray-700 mb-2">
              Fee Amount (₹) *
            </Label>
            <Input
              id="feeAmount"
              type="number"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              placeholder="25000"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : course ? "Update Course" : "Save Course"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
