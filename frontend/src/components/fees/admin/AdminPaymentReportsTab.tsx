import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Download, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/adminApi";

interface AdminPaymentReportsTabProps {
  session: string;
}

const CLASSES = ['P.G.', 'L.K.G', 'U.K.G.', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

export function AdminPaymentReportsTab({ session }: AdminPaymentReportsTabProps) {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['admin-payment-records', startDate, endDate, selectedClass, selectedStatus, session],
    queryFn: () => adminApi.getPaymentRecordsByDate({
      startDate,
      endDate,
      class: selectedClass !== 'all' ? selectedClass : undefined,
      session,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
    }),
    enabled: !!startDate && !!endDate,
  });

  const payments = reportData?.data?.payments || [];
  const stats = reportData?.data?.stats;

  const handleExport = async () => {
    try {
      const response = await adminApi.exportPaymentRecords({
        startDate,
        endDate,
        class: selectedClass !== 'all' ? selectedClass : undefined,
        session,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully!');
    } catch (error) {
      toast.error('Failed to export report');
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
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Date-wise Payment Reports
          </CardTitle>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleExport}
            disabled={payments.length === 0 || isLoading}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="classFilter">Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger id="classFilter">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>
                    {cls}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="statusFilter">Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger id="statusFilter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
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
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Records</h3>
                    <p className="text-2xl font-bold">{stats.totalRecords}</p>
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
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Paid Count</h3>
                    <p className="text-2xl font-bold text-green-500">{stats.paidCount}</p>
                  </CardContent>
                </Card>
                <Card className="glass-card">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Pending Count</h3>
                    <p className="text-2xl font-bold text-red-500">{stats.unpaidCount}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payment Records Table */}
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Amount Due</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Mode</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No payment records found for the selected date range
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
                        <TableCell>
                          {payment.paymentDate
                            ? new Date(payment.paymentDate).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.student?.firstName} {payment.student?.lastName}
                        </TableCell>
                        <TableCell>{payment.student?.studentId}</TableCell>
                        <TableCell>{payment.student?.class || payment.class}</TableCell>
                        <TableCell>{payment.period}</TableCell>
                        <TableCell>₹{payment.amountDue?.toLocaleString()}</TableCell>
                        <TableCell className="text-green-500">₹{payment.amountPaid?.toLocaleString()}</TableCell>
                        <TableCell className="font-medium">
                          ₹{(payment.amountDue - payment.amountPaid).toLocaleString()}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>{payment.paymentMode || '-'}</TableCell>
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
  );
}
