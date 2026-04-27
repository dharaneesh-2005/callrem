import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ModernLayout";
import { TiltCard, ShimmerCard } from "@/components/TiltCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Edit, Trash2, Eye, Mail, Phone as PhoneIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AddStudentModal from "@/components/modals/AddStudentModal";
import { motion } from "framer-motion";

export default function Students() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ["/api/students"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Success",
        description: "Student deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (student: any) => {
    setEditingStudent(student);
    setShowAddModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this student?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredStudents = Array.isArray(students) ? students.filter((student: any) => {
    const matchesSearch = 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && student.isActive) ||
      (statusFilter === "inactive" && !student.isActive);
    
    return matchesSearch && matchesStatus;
  }) : [];

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
        title="Student Management" 
        subtitle="Manage your students and their information"
        action={
          <Button
            onClick={() => {
              setEditingStudent(null);
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/25 flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
        }
      />

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-[#1a1a1a] border-white/10 mb-6 overflow-hidden">
          <ShimmerCard>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-white mb-2">Search Student</Label>
                  <Input
                    type="text"
                    placeholder="Search by name, email, or phone"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-[#242424] border-white/10 text-white placeholder-zinc-500"
                  />
                </div>
                <div>
                  <Label className="text-white mb-2">Course Filter</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="bg-[#242424] border-white/10 text-white">
                      <SelectValue placeholder="All Courses" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      <SelectItem value="all">All Courses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-white mb-2">Status Filter</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-[#242424] border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-white/10">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </ShimmerCard>
        </Card>
      </motion.div>

      {/* Students Table */}
      <div className="modern-table">
        <table className="w-full">
          <thead>
            <tr>
              <th>Student Details</th>
              <th>Contact</th>
              <th>Student ID</th>
              <th>Join Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents?.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-zinc-500">
                  No students found. Add your first student to get started.
                </td>
              </tr>
            ) : (
              filteredStudents?.map((student: any) => (
                <tr key={student.id}>
                  <td>
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mr-4">
                        <span className="text-white font-medium">
                          {student.firstName[0]}{student.lastName[0]}
                        </span>
                      </div>
                      <div className="font-medium text-white">
                        {student.firstName} {student.lastName}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="text-white">{student.email}</div>
                    <div className="text-sm text-zinc-400">{student.phone}</div>
                  </td>
                  <td className="text-white">{student.studentId}</td>
                  <td className="text-white">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <Badge className={student.isActive ? 'status-active' : 'status-inactive'}>
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-400 hover:text-blue-300 hover:bg-white/5"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(student)}
                        className="text-blue-400 hover:text-blue-300 hover:bg-white/5"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(student.id)}
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
        <AddStudentModal
          student={editingStudent}
          onClose={() => {
            setShowAddModal(false);
            setEditingStudent(null);
          }}
        />
      )}
    </div>
  );
}
