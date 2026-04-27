import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ModernLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AddCourseModal from "@/components/modals/AddCourseModal";

export default function Courses() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete course",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this course?")) {
      deleteMutation.mutate(id);
    }
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
        title="Course Management" 
        subtitle="Manage courses and their fee structures"
        action={
          <Button
            onClick={() => {
              setEditingCourse(null);
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Course
          </Button>
        }
      />

      <div className="modern-table">
        <table className="w-full">
          <thead>
            <tr>
              <th>Course Name</th>
              <th>Duration</th>
              <th>Fee Amount</th>
              <th>Students Enrolled</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {!Array.isArray(courses) || courses.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-zinc-500">
                  No courses found. Add your first course to get started.
                </td>
              </tr>
            ) : (
              courses.map((course: any) => (
                <tr key={course.id}>
                  <td className="font-medium text-white">{course.name}</td>
                  <td className="text-white">{course.duration} months</td>
                  <td className="text-white">₹{course.feeAmount.toLocaleString()}</td>
                  <td className="text-white">{course._count?.students || 0}</td>
                  <td>
                    <Badge className={course.isActive ? 'status-active' : 'status-inactive'}>
                      {course.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(course)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-white/5"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(course.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-white/5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <AddCourseModal
          course={editingCourse}
          onClose={() => {
            setShowAddModal(false);
            setEditingCourse(null);
          }}
        />
      )}
    </div>
  );
}
