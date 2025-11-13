import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Loader2, Users, CheckCircle2, Clock, AlertCircle, Edit, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teacherApi } from "@/services/teacherApi";
import { PaymentTrackingTable } from "@/components/fees/PaymentTrackingTable";
import { ManualPaymentDialog } from "@/components/fees/ManualPaymentDialog";
import { CreatePaymentDialog } from "@/components/fees/CreatePaymentDialog";

interface FeeStructureFormData {
  session: string;
  tuitionFee: number;
  transportFee: number;
  examFee: number;
  otherCharges: number;
}

const Fees = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreatePaymentDialogOpen, setIsCreatePaymentDialogOpen] = useState(false);
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);
  const [editingStructure, setEditingStructure] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");
  const [formData, setFormData] = useState<FeeStructureFormData>({
    session: new Date().getFullYear().toString(),
    tuitionFee: 0,
    transportFee: 0,
    examFee: 0,
    otherCharges: 0,
  });
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ['teacher-profile'],
    queryFn: () => teacherApi.getProfile(),
  });

  const { data: feeStructuresData, isLoading: structuresLoading } = useQuery({
    queryKey: ['teacher-fee-structures'],
    queryFn: () => teacherApi.getFeeStructure(),
  });

  const { data: studentsData } = useQuery({
    queryKey: ['teacher-students'],
    queryFn: () => teacherApi.getStudents({ limit: 100 }),
  });

  const { data: trackingData, isLoading: trackingLoading } = useQuery({
    queryKey: ['teacher-payment-tracking', selectedPeriod],
    queryFn: () => teacherApi.getPaymentTracking({
      period: selectedPeriod !== 'all' ? selectedPeriod : undefined,
    }),
  });

  const createStructureMutation = useMutation({
    mutationFn: (data: FeeStructureFormData) => {
      const profile = profileData?.data?.profile;
      return teacherApi.createFeeStructure({
        class: profile?.allotedClass || '',
        ...data,
      });
    },
    onSuccess: () => {
      toast.success("Fee structure created successfully!");
      queryClient.invalidateQueries({ queryKey: ['teacher-fee-structures'] });
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create fee structure");
    },
  });

  const updateStructureMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FeeStructureFormData> }) =>
      teacherApi.updateFeeStructure(id, data),
    onSuccess: () => {
      toast.success("Fee structure updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['teacher-fee-structures'] });
      setIsEditDialogOpen(false);
      setEditingStructure(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update fee structure");
    },
  });

  const deleteStructureMutation = useMutation({
    mutationFn: (id: string) => teacherApi.deleteFeeStructure(id),
    onSuccess: () => {
      toast.success("Fee structure deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ['teacher-fee-structures'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete fee structure");
    },
  });

  const createPaymentsMutation = useMutation({
    mutationFn: (data: any) => {
      if (data.type === 'all') {
        return teacherApi.createPaymentsForPeriod({
          class: selectedStructure.class,
          session: selectedStructure.session,
          period: data.period,
          dueDate: data.dueDate,
        });
      } else {
        return teacherApi.createPaymentForStudent({
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
      queryClient.invalidateQueries({ queryKey: ['teacher-payment-tracking'] });
      setIsCreatePaymentDialogOpen(false);
      setSelectedStructure(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create payment records");
    },
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (data: any) => teacherApi.markFeeAsPaid(data),
    onSuccess: () => {
      toast.success("Payment marked as paid successfully!");
      queryClient.invalidateQueries({ queryKey: ['teacher-payment-tracking'] });
      setShowManualPayment(false);
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to mark payment");
    },
  });

  const profile = profileData?.data?.profile;
  const feeStructures = feeStructuresData?.data?.feeStructures || [];
  const students = studentsData?.data?.docs || [];
  const payments = trackingData?.data?.payments || [];
  const stats = trackingData?.data?.stats;

  // Get unique periods for filter
  const periods = Array.from(new Set(payments.map((p: any) => p.period))).filter(Boolean);

  const resetForm = () => {
    setFormData({
      session: new Date().getFullYear().toString(),
      tuitionFee: 0,
      transportFee: 0,
      examFee: 0,
      otherCharges: 0,
    });
  };

  const handleEdit = (structure: any) => {
    setEditingStructure(structure);
    setFormData({
      session: structure.session,
      tuitionFee: structure.tuitionFee,
      transportFee: structure.transportFee,
      examFee: structure.examFee,
      otherCharges: structure.otherCharges,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (structure: any) => {
    if (confirm(`Are you sure you want to delete the fee structure for ${structure.session}?`)) {
      deleteStructureMutation.mutate(structure._id);
    }
  };

  const handleCreateStructure = (e: React.FormEvent) => {
    e.preventDefault();
    createStructureMutation.mutate(formData);
  };

  const handleUpdateStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStructure) {
      updateStructureMutation.mutate({
        id: editingStructure._id,
        data: formData,
      });
    }
  };

  const totalFee = formData.tuitionFee + formData.transportFee + formData.examFee + formData.otherCharges;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Fee Management</h1>
            <p className="text-muted-foreground mt-1">
              Manage fee structures for Class {profile?.allotedClass || '...'}
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Fee Structure
          </Button>
        </div>
      </motion.div>

      <Tabs defaultValue="structures" className="space-y-6">
        <TabsList>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="tracking">Payment Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="structures" className="space-y-6">
          {/* Summary Cards - NO FINANCIAL TOTALS FOR TEACHERS */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/80 to-green-600">
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Paid</h3>
                  <p className="text-2xl font-bold">{stats.paidCount || 0} students</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-destructive/80 to-destructive">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Pending</h3>
                  <p className="text-2xl font-bold">{stats.pendingCount || 0} students</p>
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/80 to-orange-600">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Partial</h3>
                  <p className="text-2xl font-bold">{stats.partialCount || 0} students</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Fee Structures Table */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Fee Structures</CardTitle>
            </CardHeader>
            <CardContent>
              {structuresLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : feeStructures.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-muted-foreground">No fee structures created yet</p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4">
                    Create Your First Fee Structure
                  </Button>
                </div>
              ) : (
                <div className="rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                          <TableCell className="font-medium">{structure.session}</TableCell>
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
                                disabled={deleteStructureMutation.isPending}
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
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payment Tracking</CardTitle>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Periods</SelectItem>
                    {periods.map((period: any) => (
                      <SelectItem key={period} value={period}>
                        {period}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {trackingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-primary" size={32} />
                </div>
              ) : (
                <PaymentTrackingTable
                  payments={payments}
                  onMarkAsPaid={(payment) => {
                    setSelectedPayment(payment);
                    setShowManualPayment(true);
                  }}
                  showAmounts={false} // Teachers don't see amounts
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Fee Structure Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Fee Structure</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateStructure} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="session">Academic Session *</Label>
              <Input
                id="session"
                value={formData.session}
                onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                placeholder="e.g., 2024"
                required
              />
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
              <Button type="submit" disabled={createStructureMutation.isPending}>
                {createStructureMutation.isPending ? (
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

      {/* Edit Fee Structure Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Fee Structure</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateStructure} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-session">Academic Session *</Label>
              <Input
                id="edit-session"
                value={formData.session}
                onChange={(e) => setFormData({ ...formData, session: e.target.value })}
                required
              />
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
              <Button type="submit" disabled={updateStructureMutation.isPending}>
                {updateStructureMutation.isPending ? (
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

      {/* Manual Payment Dialog */}
      <ManualPaymentDialog
        open={showManualPayment}
        onOpenChange={setShowManualPayment}
        payment={selectedPayment}
        onSubmit={(data) => markAsPaidMutation.mutate(data)}
        isLoading={markAsPaidMutation.isPending}
      />
    </div>
  );
};

export default Fees;
