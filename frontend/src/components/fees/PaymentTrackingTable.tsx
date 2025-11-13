import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface PaymentTrackingTableProps {
  payments: any[];
  onMarkAsPaid: (payment: any) => void;
  showAmounts?: boolean; // Admin sees amounts, Teacher doesn't
}

export function PaymentTrackingTable({ payments, onMarkAsPaid, showAmounts = false }: PaymentTrackingTableProps) {
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
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Student ID</TableHead>
            {showAmounts && (
              <>
                <TableHead>Amount Due</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Balance</TableHead>
              </>
            )}
            <TableHead>Status</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showAmounts ? 8 : 5} className="text-center py-8 text-muted-foreground">
                No payment records found
              </TableCell>
            </TableRow>
          ) : (
            payments.map((payment, index) => (
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
                {showAmounts && (
                  <>
                    <TableCell>₹{payment.amountDue?.toLocaleString()}</TableCell>
                    <TableCell className="text-green-500">₹{payment.amountPaid?.toLocaleString()}</TableCell>
                    <TableCell className="font-medium">
                      ₹{(payment.amountDue - payment.amountPaid).toLocaleString()}
                    </TableCell>
                  </>
                )}
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
                      onClick={() => onMarkAsPaid(payment)}
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
  );
}
