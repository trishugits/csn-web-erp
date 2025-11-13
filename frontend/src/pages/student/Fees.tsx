import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Download, History, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { studentApi } from "@/services/studentApi";

// Declare Razorpay on window
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function StudentFees() {
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "failed">("idle");
  const queryClient = useQueryClient();

  const { data: profileData } = useQuery({
    queryKey: ['student-profile'],
    queryFn: () => studentApi.getProfile(),
  });

  const { data: feesData, isLoading, error } = useQuery({
    queryKey: ['student-fees'],
    queryFn: () => studentApi.getMyFees(),
  });

  // Debug: Log API response
  console.log('Student Fees Data:', feesData);

  const createOrderMutation = useMutation({
    mutationFn: (paymentId: string) => studentApi.createOrder(paymentId),
    onSuccess: (response, paymentId) => {
      const { key, order, student } = response.data;
      initiateRazorpay(order, key, student, paymentId);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create order");
      setPaymentStatus("failed");
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: (data: any) => studentApi.verifyPayment(data),
    onSuccess: () => {
      setPaymentStatus("success");
      toast.success("Payment successful!");
      queryClient.invalidateQueries({ queryKey: ['student-fees'] });
      setTimeout(() => {
        setShowPaymentDialog(false);
        setPaymentStatus("idle");
      }, 2000);
    },
    onError: (error: any) => {
      setPaymentStatus("failed");
      toast.error(error.response?.data?.message || "Payment verification failed");
    },
  });

  const profile = profileData?.data?.profile;
  
  // Safely extract fees array - handle different API response structures
  const feesArray = Array.isArray(feesData?.data?.data)
  ? feesData.data.data
  : [];
  const fees = feesArray;

  const pendingFees = Array.isArray(fees) ? fees.filter((fee: any) => fee.status !== 'paid') : [];
  const paidFees = Array.isArray(fees) ? fees.filter((fee: any) => fee.status === 'paid') : [];

  const initiateRazorpay = (order: any, key: string, student: any, paymentId: string) => {
    const options = {
      key,
      amount: order.amount,
      currency: order.currency,
      name: "School Management System",
      description: `Fee Payment - ${selectedFee?.period}`,
      order_id: order.id,
      prefill: {
        name: student.name,
        email: student.email,
        contact: student.phone,
      },
      theme: {
        color: "#3399cc",
      },
      handler: function (response: any) {
        verifyPaymentMutation.mutate({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          paymentId,
        });
      },
      modal: {
        ondismiss: function () {
          setPaymentStatus("failed");
          toast.error("Payment cancelled");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handlePayment = async (fee: any) => {
    setSelectedFee(fee);
    setShowPaymentDialog(true);
    setPaymentStatus("processing");

    // Check if Razorpay script is loaded
    if (!window.Razorpay) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        createOrderMutation.mutate(fee._id);
      };
      script.onerror = () => {
        toast.error("Failed to load payment gateway");
        setPaymentStatus("failed");
      };
      document.body.appendChild(script);
    } else {
      createOrderMutation.mutate(fee._id);
    }
  };

  const downloadReceipt = (fee: any) => {
    toast.success(`Downloading receipt for ${fee.receiptNumber}`);
    // Implement actual receipt download logic here
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <CreditCard className="w-8 h-8" />
          Fees & Payments
        </h1>
        <p className="text-muted-foreground mt-1">Manage your fee payments and view transaction history</p>
      </motion.div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-destructive">Error loading fees. Please try again.</p>
        </div>
      ) : (
        <>
          {/* Pending Fees */}
          {pendingFees.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">Pending Fees</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingFees.map((fee: any, index: number) => (
                  <motion.div
                    key={fee._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="glass-panel hover:scale-[1.02] transition-transform">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">
                            {fee.period} - {fee.session}
                          </CardTitle>
                          <Badge variant={fee.status === 'unpaid' ? 'destructive' : 'secondary'}>
                            {fee.status === 'partial' ? 'Partially Paid' : 'Pending'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total Amount:</span>
                              <span className="font-medium">₹{fee.amountDue.toLocaleString()}</span>
                            </div>
                            {fee.amountPaid > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Paid:</span>
                                <span className="font-medium text-green-500">₹{fee.amountPaid.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Balance:</span>
                              <span className="font-bold">₹{(fee.amountDue - fee.amountPaid).toLocaleString()}</span>
                            </div>
                          </div>
                          {fee.dueDate && (
                            <div className="text-sm text-muted-foreground">
                              Due: {new Date(fee.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          <Button
                            onClick={() => handlePayment(fee)}
                            className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
                            disabled={fee.status === 'paid'}
                          >
                            Pay ₹{(fee.amountDue - fee.amountPaid).toLocaleString()}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Payment History */}
          {paidFees.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {paidFees.map((payment: any) => (
                      <div
                        key={payment._id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {payment.period} - {payment.session}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(payment.paymentDate).toLocaleDateString()} • {payment.receiptNumber || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-foreground">₹{payment.amountPaid.toLocaleString()}</span>
                          {payment.receiptNumber && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadReceipt(payment)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Receipt
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {fees.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">No fee records found</p>
            </div>
          )}
        </>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="glass-panel">
          <DialogHeader>
            <DialogTitle>Payment Processing</DialogTitle>
          </DialogHeader>
          <div className="py-8">
            {paymentStatus === "processing" && (
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Loader2 className="w-16 h-16 animate-spin text-primary" />
                <p className="text-muted-foreground">Processing your payment...</p>
              </motion.div>
            )}

            {paymentStatus === "success" && (
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <CheckCircle className="w-24 h-24 text-green-500" />
                <h3 className="text-2xl font-bold text-foreground">Payment Successful!</h3>
                <p className="text-muted-foreground">₹{selectedFee?.amountDue - selectedFee?.amountPaid} paid successfully</p>
                <Button onClick={() => setShowPaymentDialog(false)} className="mt-4">
                  Done
                </Button>
              </motion.div>
            )}

            {paymentStatus === "failed" && (
              <motion.div
                className="flex flex-col items-center gap-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
              >
                <XCircle className="w-24 h-24 text-destructive" />
                <h3 className="text-2xl font-bold text-foreground">Payment Failed</h3>
                <p className="text-muted-foreground">Please try again</p>
                <Button onClick={() => setShowPaymentDialog(false)} variant="outline" className="mt-4">
                  Close
                </Button>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
