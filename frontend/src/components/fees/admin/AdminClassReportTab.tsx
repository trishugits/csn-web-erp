import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Download, CheckCircle2, Clock, AlertCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/services/adminApi";
import { ManualPaymentDialog } from "@/components/fees/ManualPaymentDialog";

interface AdminClassReportTabProps {
  session: string;
}

const CLASSES = ['P.G.', 'L.K.G', 'U.K.G.', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export function AdminClassReportTab({ session }: AdminClassReportTabProps) {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showManualPayment, setShowManualPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const queryClient = useQueryClient();

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['admin-class-report', selectedClass, session, selectedPeriod, searchTerm],
    queryFn: () => {
      if (searchTerm) {
        return adminApi.searchClassReport({
          class: selectedClass,
          session,
          period: selectedPeriod !== 'all' ? selectedPeriod : undefined,
          search: searchTerm,
        });
      }
      return adminApi.getClassWiseReport({
        class: selectedClass,
        session,
        period: selectedPeriod !== 'all' ? selectedPeriod : undefined,
      });
    },
    enabled: !!selectedClass,
  });

  const markAsPaidMutation = useMutation({
    mutationFn: (data: any) => adminApi.markFeeAsPaid(data),
    onSuccess: () => {
      toast.success("Payment marked as paid successfully!");
      queryClient.invalidateQueries({ queryKey: ['admin-class-report'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-summary'] });
      setShowManualPayment(false);
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to mark payment");
    },
  });

  const payments = reportData?.data?.payments || [];
  const stats = reportData?.data?.stats;
  const periods = Array.from(new Set(payments.map((p: any) => p.period))).filter(Boolean);

  const handleExport = async () => {
    try {
      const response = await adminApi.exportPaymentRecords({
        class: selectedClass,
        session,
        status: undefined,
        search: searchTerm || undefined,
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fee-report-${selectedClass}-${session}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Paid</Badge>;
      case 'partial':
        return <Badge variant="secondary">Partial</Badge>;
      default:
        return <Badge variant="destructive">Pending</Badge>;
    }
  };

  return (
    <>
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Class-wise Fee Report</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-[150px]">
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
              {selectedClass && (
                <>
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
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={handleExport}
                    disabled={payments.length === 0}
                  >
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </>
              )}
            </div>
          </div>
          {selectedClass && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by student name, ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {!selectedClass ? (
            <div className="text-center py-12 text-muted-foreground">
              Please select a class to view the report
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Students</h3>
                      <p className="text-2xl font-bold">{stats.totalStudents}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Expected</h3>
                      <p className="text-2xl font-bold">₹{stats.totalExpected?.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Collected</h3>
                      <p className="text-2xl font-bold text-green-500">₹{stats.totalCollected?.toLocaleString()}</p>
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Collection Rate</h3>
                      <p className="text-2xl font-bold text-purple-500">{stats.collectionRate}</p>
                    </CardContent>
                  </Card>
                </div>
              )}


              {/* Students Table */}
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount Due</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No payment records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      payments.map((payment: any, index: number) => (
                        <motion.tr
                          key={payment._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-accent/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {payment.student?.firstName} {payment.student?.lastName}
                          </TableCell>
                          <TableCell>{payment.student?.studentId}</TableCell>
                          <TableCell>{payment.period}</TableCell>
                          <TableCell>₹{payment.amountDue?.toLocaleString()}</TableCell>
                          <TableCell className="text-green-500">₹{payment.amountPaid?.toLocaleString()}</TableCell>
                          <TableCell className="font-medium">
                            ₹{(payment.amountDue - payment.amountPaid).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(payment.status)}
                              {getStatusBadge(payment.status)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.paymentDate
                              ? new Date(payment.paymentDate).toLocaleDateString()
                              : '-'}
                          </TableCell>
                          <TableCell>
                            {payment.status !== 'paid' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowManualPayment(true);
                                }}
                              >
                                Mark as Paid
                              </Button>
                            )}
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Manual Payment Dialog */}
      <ManualPaymentDialog
        open={showManualPayment}
        onOpenChange={setShowManualPayment}
        payment={selectedPayment}
        onSubmit={(data) => markAsPaidMutation.mutate(data)}
        isLoading={markAsPaidMutation.isPending}
      />
    </>
  );
}
