import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, Loader2, Edit, Archive, Trash2, Download, Eye, Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { adminApi, type Student } from "@/services/adminApi";
import { toast } from "sonner";

interface StudentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentId: string;
  class: string;
  gender: string;
  dob: string;
  address: string;
  aadharId: string;
  fatherName: string;
  motherName: string;
}

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    studentId: "",
    class: "",
    gender: "male",
    dob: "",
    address: "",
    aadharId: "",
    fatherName: "",
    motherName: "",
  });
  const itemsPerPage = 5;
  const queryClient = useQueryClient();

  const archivedParam = statusFilter === "all" ? undefined : statusFilter === "archived";

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-students', currentPage, searchTerm, classFilter, statusFilter],
    queryFn: () =>
      adminApi.getStudents({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        class: classFilter !== "all" ? classFilter : undefined,
        archived: archivedParam,
      }),
  });

  const addMutation = useMutation({
    mutationFn: (data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      studentId: string;
      class: string;
      password: string;
      gender?: string;
      dob?: string;
      address?: string;
      aadharId?: string;
      fatherName?: string;
      motherName?: string;
      session?: string;
    }) => adminApi.addStudent(data),
    onSuccess: () => {
      toast.success("Student added successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add student");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Student> }) =>
      adminApi.updateStudent(id, data),
    onSuccess: () => {
      toast.success("Student updated successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      setIsEditDialogOpen(false);
      setEditingStudent(null);
      resetForm();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to update student");
    },
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => adminApi.importStudentsCsv(file),
    onSuccess: (response) => {
      const data = response.data;
      toast.success(`Import completed! Added ${data.addedCount} students`);
      if (data.errorCount > 0) {
        toast.warning(`${data.errorCount} students failed to import`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to import students");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteStudent(id),
    onSuccess: () => {
      toast.success("Student deleted successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to delete student");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => adminApi.archiveStudent(id),
    onSuccess: () => {
      toast.success("Student archived successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to archive student");
    },
  });

  const unarchiveMutation = useMutation({
    mutationFn: (id: string) => adminApi.unarchiveStudent(id),
    onSuccess: () => {
      toast.success("Student unarchived successfully");
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Failed to unarchive student");
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      studentId: "",
      class: "",
      gender: "male",
      dob: "",
      address: "",
      aadharId: "",
      fatherName: "",
      motherName: "",
    });
  };

  const handleView = (student: Student) => {
    setViewingStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone || "",
      studentId: student.studentId,
      class: student.class,
      gender: student.gender || "male",
      dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : "",
      address: student.address || "",
      aadharId: student.aadharId || "",
      fatherName: student.fatherName || "",
      motherName: student.motherName || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      const updateData: Partial<Student> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        studentId: formData.studentId,
        class: formData.class,
        gender: formData.gender,
        dob: formData.dob,
        address: formData.address,
        aadharId: formData.aadharId,
        fatherName: formData.fatherName,
        motherName: formData.motherName,
      };
      updateMutation.mutate({ id: editingStudent._id, data: updateData });
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const addData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      studentId: formData.studentId,
      class: formData.class,
      password: formData.studentId, // Default password is student ID
      gender: formData.gender,
      dob: formData.dob,
      address: formData.address,
      aadharId: formData.aadharId,
      fatherName: formData.fatherName,
      motherName: formData.motherName,
      session: new Date().getFullYear().toString(),
    };
    addMutation.mutate(addData);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      importMutation.mutate(file);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this student?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleArchive = (student: Student) => {
    if (student.archived) {
      unarchiveMutation.mutate(student._id);
    } else {
      if (confirm("Are you sure you want to archive this student?")) {
        archiveMutation.mutate(student._id);
      }
    }
  };

  const handleExport = () => {
    const students = data?.data?.students || [];
    if (students.length === 0) {
      toast.error("No students to export");
      return;
    }
    adminApi.exportStudentsCsv(students);
    toast.success("Students exported successfully");
  };

  const students = data?.data?.students || [];
  const totalDocuments = data?.data?.totalDocuments || 0;
  const totalPages = Math.ceil(totalDocuments / itemsPerPage);

  // Get unique classes for filter
  const classes = Array.from(
    new Set(
      (data?.data?.classSummary as Array<{ class: string }> | undefined)?.map((cs) => cs.class) || []
    )
  ).sort() as string[];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Student Management</h1>
          <p className="text-muted-foreground">View and manage student records</p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button 
            variant="outline" 
            className="gap-2" 
            onClick={() => fileInputRef.current?.click()}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import CSV
              </>
            )}
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button className="gap-2" onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}>
            <Plus className="w-4 h-4" />
            Add Student
          </Button>
        </div>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Students List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or student ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={classFilter}
              onValueChange={(value) => {
                setClassFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">Error loading students. Please try again.</p>
            </div>
          ) : (
            <>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: Student, index: number) => (
                      <motion.tr
                        key={student._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-medium">{student.studentId}</TableCell>
                        <TableCell>
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell>{student.class}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.phone || "N/A"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={student.archived ? "secondary" : "default"}
                            className={!student.archived ? "bg-success" : ""}
                          >
                            {student.archived ? "Archived" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(student)}
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(student)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleArchive(student)}
                              disabled={archiveMutation.isPending || unarchiveMutation.isPending}
                              title={student.archived ? "Unarchive" : "Archive"}
                            >
                              <Archive className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(student._id)}
                              disabled={deleteMutation.isPending}
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {students.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No students found</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, totalDocuments)} of {totalDocuments}{" "}
                    students
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* View Student Profile Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {viewingStudent && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{viewingStudent.firstName} {viewingStudent.lastName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Student ID</p>
                  <p className="font-medium">{viewingStudent.studentId}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{viewingStudent.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{viewingStudent.phone || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Class</p>
                  <p className="font-medium">{viewingStudent.class}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Roll No</p>
                  <p className="font-medium">{viewingStudent.rollNo || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Gender</p>
                  <p className="font-medium capitalize">{viewingStudent.gender || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">
                    {viewingStudent.dob
                      ? new Date(viewingStudent.dob).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Father's Name</p>
                  <p className="font-medium">{viewingStudent.fatherName || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Mother's Name</p>
                  <p className="font-medium">{viewingStudent.motherName || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Aadhar ID</p>
                  <p className="font-medium">{viewingStudent.aadharId || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Session</p>
                  <p className="font-medium">{viewingStudent.session || "N/A"}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium">{viewingStudent.address || "N/A"}</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant={viewingStudent.archived ? "secondary" : "default"}
                    className={!viewingStudent.archived ? "bg-success" : ""}
                  >
                    {viewingStudent.archived ? "Archived" : "Active"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (viewingStudent) handleEdit(viewingStudent);
            }}>
              Edit Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-firstName">First Name *</Label>
                <Input
                  id="add-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-lastName">Last Name *</Label>
                <Input
                  id="add-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-studentId">Student ID *</Label>
                <Input
                  id="add-studentId"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                  placeholder="e.g., STU001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email *</Label>
                <Input
                  id="add-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  placeholder="student@example.com"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone</Label>
                <Input
                  id="add-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10-digit mobile number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-class">Class *</Label>
                <Input
                  id="add-class"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  required
                  placeholder="e.g., 10-A"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-dob">Date of Birth</Label>
                <Input
                  id="add-dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-fatherName">Father's Name</Label>
                <Input
                  id="add-fatherName"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-motherName">Mother's Name</Label>
                <Input
                  id="add-motherName"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-address">Address</Label>
              <Input
                id="add-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-aadharId">Aadhar ID</Label>
              <Input
                id="add-aadharId"
                value={formData.aadharId}
                onChange={(e) => setFormData({ ...formData, aadharId: e.target.value })}
                placeholder="12-digit Aadhar number"
              />
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Default password will be set to the Student ID. 
                Student can change it after first login.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Student"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-firstName">First Name *</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastName">Last Name *</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-studentId">Student ID *</Label>
                <Input
                  id="edit-studentId"
                  value={formData.studentId}
                  onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-class">Class *</Label>
                <Input
                  id="edit-class"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dob">Date of Birth</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fatherName">Father Name</Label>
                <Input
                  id="edit-fatherName"
                  value={formData.fatherName}
                  onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-motherName">Mother Name</Label>
                <Input
                  id="edit-motherName"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-aadharId">Aadhar ID</Label>
              <Input
                id="edit-aadharId"
                value={formData.aadharId}
                onChange={(e) => setFormData({ ...formData, aadharId: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Student"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
