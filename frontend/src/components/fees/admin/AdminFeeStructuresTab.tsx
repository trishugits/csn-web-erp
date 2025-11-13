import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash2, Users, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/adminApi";
import { CreatePaymentDialog } from "@/components/fees/CreatePaymentDialog";

interface AdminFeeStructuresTabProps {
  session: string;
}

const CLASSES = ['P.G.', 'L.K.G', 'U.K.G.', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export function AdminFeeStructuresTab({ session }: AdminFeeStructuresTabProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreatePaymentDialogOpen, setIsCreatePaymentDialogOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);
  const [editingStructure, setEditingStructure] = useState<any>(null);
  const [formData, setFormData] = useState({
    class: "",
    session: session,
    tuitionFee: 0,
    transportFee: 0,
    examFee: 0,
    otherCharges: 0,
  });

  const queryClient = useQueryClient();

  const { data: feeStructuresData, isLoading } = useQuery({
    queryKey: ['admin-fee-structures', session],
    queryFn: () => adminApi.getFeeStructure({ session }),
  });

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['admin-students', selectedStructure?.class],
    queryFn: async () => {
      if (!selectedStructure?.class) {
        console.log('No class selected for students query');
        return { data: { docs: [] } };
      }
      console.log('Fetching students for class:', selectedStructure.class);
      const response = await adminApi.getStudents({ 
        class: selectedStructure.class, 
        limit: 1000,
        archived: false 
      });
      console.log('Students fetched:', response.data);
      return response.data;
    },
    enabled: !!selectedStructure?.class,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.createFeeStructure(data),
    onSuccess: () => {
      toast.success("Fee structure created successfully!");
      queryClient.invalidateQueries({ queryKey: ['admin-fee-structures'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create fee structure");
    },
  });


  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateFeeStructure(id, data),
    onSuccess: () => {
      toast.success("Fee structure updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['admin-fee-structures'] });
      setIsEditDialogOpen(false);
      setEditingStructure(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update fee structure");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteFeeStructure(id),
    onSuccess: () => {
      toast.success("Fee structure deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['admin-fee-structures'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete fee structure");
    },
  });

  const createPaymentsMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.type === 'all') {
        return adminApi.createPaymentsForPeriod({
          class: selectedStructure.class,
          session: selectedStructure.session,
          period: data.period,
          dueDate: data.dueDate,
        });
      } else {
        return adminApi.createPaymentForStudent({
          studentId: data.studentId!,
          class: selectedStructure.class,
          session: selectedStructure.session,
          period: data.period,
          dueDate: data.dueDate,
        });
      }
    },
    onSuccess: (response, variables) => {
      const count = variables.type === 'all' 
        ? response.data?.createdCount || studentsData?.data?.totalDocuments || 0
        : 1;
      toast.success(`Successfully created ${count} payment record(s)!`);
      queryClient.invalidateQueries({ queryKey: ['admin-payment-tracking'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-summary'] });
      setIsCreatePaymentDialogOpen(false);
      setSelectedStructure(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create payment records");
    },
  });

  const feeStructures = feeStructuresData?.data?.feeStructures || [];
  const students = studentsData?.students || [];
  
  // Log students for debugging
  console.log('Students data:', students.length, 'students for class:', selectedStructure?.class);

  const resetForm = () => {
    setFormData({
      class: "",
      session: session,
      tuitionFee: 0,
      transportFee: 0,
      examFee: 0,
      otherCharges: 0,
    });
  };

  const handleEdit = (structure: any) => {
    setEditingStructure(structure);
    setFormData({
      class: structure.class,
      session: structure.session,
      tuitionFee: structure.tuitionFee,
      transportFee: structure.transportFee,
      examFee: structure.examFee,
      otherCharges: structure.otherCharges,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (structure: any) => {
    if (confirm(`Are you sure you want to delete the fee structure for ${structure.class} - ${structure.session}?`)) {
      deleteMutation.mutate(structure._id);
    }
  };

  const handleCreateStructure = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleUpdateStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStructure) {
      updateMutation.mutate({
        id: editingStructure._id,
        data: formData,
      });
    }
  };

  const totalFee = formData.tuitionFee + formData.transportFee + formData.examFee + formData.otherCharges;

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Fee Structures - Session {session}</CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Fee Structure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : feeStructures.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No fee structures found for this session</p>
              <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                Create Fee Structure
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Tuition</TableHead>
                    <TableHead>Transport</TableHead>
                    <TableHead>Exam</TableHead>
                    <TableHead>Other</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructures.map((structure: any, index: number) => (
                    <motion.tr
                      key={structure._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="hover:bg-accent/50 transition-colors"
                    >
                      <TableCell className="font-medium">{structure.class}</TableCell>
                      <TableCell>{structure.session}</TableCell>
                      <TableCell>₹{structure.tuitionFee?.toLocaleString()}</TableCell>
                      <TableCell>₹{structure.transportFee?.toLocaleString()}</TableCell>
                      <TableCell>₹{structure.examFee?.toLocaleString()}</TableCell>
                      <TableCell>₹{structure.otherCharges?.toLocaleString()}</TableCell>
                      <TableCell className="font-bold">₹{structure.totalFee?.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStructure(structure);
                              setIsCreatePaymentDialogOpen(true);
                            }}
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Create Payments
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(structure)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(structure)}
                            disabled={deleteMutation.isPending}
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
          )}
        </CardContent>
      </Card>


      {/* Create Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Fee Structure</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateStructure} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select value={formData.class} onValueChange={(value) => setFormData({ ...formData, class: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="session">Academic Session *</Label>
                <Input
                  id="session"
                  value={formData.session}
                  onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tuitionFee">Tuition Fee (₹) *</Label>
                <Input
                  id="tuitionFee"
                  type="number"
                  value={formData.tuitionFee || ''}
                  onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transportFee">Transport Fee (₹)</Label>
                <Input
                  id="transportFee"
                  type="number"
                  value={formData.transportFee || ''}
                  onChange={(e) => setFormData({ ...formData, transportFee: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examFee">Exam Fee (₹)</Label>
                <Input
                  id="examFee"
                  type="number"
                  value={formData.examFee || ''}
                  onChange={(e) => setFormData({ ...formData, examFee: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherCharges">Other Charges (₹)</Label>
                <Input
                  id="otherCharges"
                  type="number"
                  value={formData.otherCharges || ''}
                  onChange={(e) => setFormData({ ...formData, otherCharges: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Fee:</span>
                <span className="text-2xl font-bold text-primary">₹{totalFee.toLocaleString()}</span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Fee Structure"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar structure */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Fee Structure</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStructure} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Input value={formData.class} disabled />
              </div>
              <div className="space-y-2">
                <Label>Session</Label>
                <Input value={formData.session} disabled />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tuitionFee">Tuition Fee (₹) *</Label>
                <Input
                  id="edit-tuitionFee"
                  type="number"
                  value={formData.tuitionFee || ''}
                  onChange={(e) => setFormData({ ...formData, tuitionFee: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-transportFee">Transport Fee (₹)</Label>
                <Input
                  id="edit-transportFee"
                  type="number"
                  value={formData.transportFee || ''}
                  onChange={(e) => setFormData({ ...formData, transportFee: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-examFee">Exam Fee (₹)</Label>
                <Input
                  id="edit-examFee"
                  type="number"
                  value={formData.examFee || ''}
                  onChange={(e) => setFormData({ ...formData, examFee: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-otherCharges">Other Charges (₹)</Label>
                <Input
                  id="edit-otherCharges"
                  type="number"
                  value={formData.otherCharges || ''}
                  onChange={(e) => setFormData({ ...formData, otherCharges: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total Fee:</span>
                <span className="text-2xl font-bold text-primary">₹{totalFee.toLocaleString()}</span>
              </div>
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
                  "Update Fee Structure"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Payment Dialog */}
      <CreatePaymentDialog
        open={isCreatePaymentDialogOpen}
        onOpenChange={setIsCreatePaymentDialogOpen}
        feeStructure={selectedStructure}
        students={students}
        onSubmit={(data) => createPaymentsMutation.mutate(data)}
        isLoading={createPaymentsMutation.isPending}
      />
    </>
  );
}
